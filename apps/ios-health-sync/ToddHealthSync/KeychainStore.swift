import Foundation
import Security

protocol CoachSecretStoring {
    func loadSecret() throws -> String
    func saveSecret(_ secret: String) throws
    func deleteSecret() throws
}

struct KeychainStore: CoachSecretStoring {
    private let service = "com.toddblackhurst.ToddHealthSync"
    private let account = "coach-api-secret"

    func loadSecret() throws -> String {
        var query = baseQuery()
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        if status == errSecItemNotFound {
            return ""
        }

        guard status == errSecSuccess else {
            throw KeychainError.unhandled(status)
        }

        guard let data = item as? Data, let secret = String(data: data, encoding: .utf8) else {
            throw KeychainError.invalidData
        }

        return secret
    }

    func saveSecret(_ secret: String) throws {
        try deleteSecret()

        var query = baseQuery()
        query[kSecValueData as String] = Data(secret.utf8)
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unhandled(status)
        }
    }

    func deleteSecret() throws {
        let status = SecItemDelete(baseQuery() as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unhandled(status)
        }
    }

    private func baseQuery() -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
    }
}

enum KeychainError: LocalizedError {
    case invalidData
    case unhandled(OSStatus)

    var errorDescription: String? {
        switch self {
        case .invalidData:
            "The stored coach API secret could not be read."
        case let .unhandled(status):
            "Keychain operation failed with status \(status)."
        }
    }
}

enum CoachSetupState: String, Equatable {
    case notConfigured
    case missingAPIBase
    case invalidAPIBase
    case missingSecret
    case configuredLocally
}

struct CoachSetupStatus: Equatable {
    let state: CoachSetupState
    let title: String
    let detail: String
    let nextAction: String
    let errorIdentifier: CoachShortcutErrorCode?

    var isReadyForProtectedRequests: Bool {
        state == .configuredLocally
    }

    var shortcutOutput: CoachShortcutOutput {
        CoachShortcutOutput(
            actionStatus: isReadyForProtectedRequests ? "configured_locally" : "not_configured",
            safetyStatus: .unknown,
            readinessSummary: detail,
            workoutTitle: nil,
            workoutType: .unknown,
            primaryConstraints: ["No production write was sent.", "No secret value is included in this result."],
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: nextAction,
            requiresMedicalCaution: false,
            sourceFreshness: nil,
            lastSync: nil,
            errorIdentifier: errorIdentifier,
            errorMessage: isReadyForProtectedRequests ? nil : title
        )
    }
}

struct CoachConnectionConfiguration: Equatable {
    let apiBase: String
    let hasSecret: Bool

    init(apiBase: String, secret: String) {
        self.apiBase = apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
        self.hasSecret = !secret.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var status: CoachSetupStatus {
        guard !apiBase.isEmpty else {
            return CoachSetupStatus(
                state: hasSecret ? .missingAPIBase : .notConfigured,
                title: hasSecret ? "Missing Coach API base URL" : "Coach is not configured",
                detail: hasSecret
                    ? "Coach needs an API base URL before protected requests can run."
                    : "Coach needs an API base URL and local secret before protected requests can run.",
                nextAction: "Open Todd Health Sync settings and enter the Coach API base URL and secret on device.",
                errorIdentifier: hasSecret ? .missingAPIBase : .notConfigured
            )
        }

        guard Self.isValidAPIBase(apiBase) else {
            return CoachSetupStatus(
                state: .invalidAPIBase,
                title: "Invalid Coach API base URL",
                detail: "Coach API base URL must be an http or https URL with a host.",
                nextAction: "Open Todd Health Sync settings and correct the Coach API base URL.",
                errorIdentifier: .missingAPIBase
            )
        }

        guard hasSecret else {
            return CoachSetupStatus(
                state: .missingSecret,
                title: "Missing Coach API secret",
                detail: "Coach API base URL is present, but the local device secret is missing.",
                nextAction: "Enter the Coach API secret on Todd's iPhone; do not paste it into chat or source code.",
                errorIdentifier: .missingSecret
            )
        }

        return CoachSetupStatus(
            state: .configuredLocally,
            title: "Coach is configured locally",
            detail: "Required local configuration is present. Protected route testing still needs Todd-assisted device verification.",
            nextAction: "Use a read-only Coach shortcut or in-app check when Todd is present for device verification.",
            errorIdentifier: nil
        )
    }

    private static func isValidAPIBase(_ value: String) -> Bool {
        guard
            let url = URL(string: value),
            let scheme = url.scheme?.lowercased(),
            ["http", "https"].contains(scheme),
            url.host?.isEmpty == false
        else {
            return false
        }
        return true
    }
}

struct CoachConfigurationError: LocalizedError {
    let status: CoachSetupStatus

    var errorDescription: String? {
        status.detail
    }
}

enum CoachReadinessCheckStatus: String, Codable, Equatable {
    case ready
    case needsSetup = "needs_setup"
    case deviceBound = "device_bound"
    case held
    case notChecked = "not_checked"
}

struct CoachReadinessCheck: Codable, Equatable, Identifiable {
    let id: String
    let label: String
    let status: CoachReadinessCheckStatus
    let detail: String
    let nextAction: String

    var line: String {
        "\(id): \(status.rawValue) - \(CoachSafeOutput.redact(detail))"
    }
}

enum CoachPublicPingReadiness: Equatable {
    case notChecked
    case healthy
    case failed
}

struct CoachReadinessReport: Codable, Equatable {
    let actionStatus: String
    let summary: String
    let checks: [CoachReadinessCheck]

    var displayText: String {
        shortcutText
    }

    var shortcutText: String {
        var lines = [
            "readiness_status: \(actionStatus)",
            "summary: \(CoachSafeOutput.redact(summary))",
            "checks:"
        ]
        lines.append(contentsOf: checks.map { "- \($0.line)" })
        lines.append("No production write was sent.")
        lines.append("No secret value is included.")
        return lines.joined(separator: "\n")
    }

    var shortcutOutput: CoachShortcutOutput {
        let blockers = checks.filter { $0.status == .needsSetup }
        let deviceBound = checks.filter { $0.status == .deviceBound }
        let held = checks.filter { $0.status == .held }
        let constraints = (blockers + deviceBound + held)
            .map { "\($0.label): \($0.detail)" }
        return CoachShortcutOutput(
            actionStatus: actionStatus,
            safetyStatus: .unknown,
            readinessSummary: summary,
            workoutTitle: nil,
            workoutType: .none,
            primaryConstraints: constraints,
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: blockers.first?.nextAction
                ?? deviceBound.first?.nextAction
                ?? "Use read-only Coach paths first; keep writes held until an approved write-readiness phase.",
            requiresMedicalCaution: false,
            sourceFreshness: "Apple Health remains supporting evidence only.",
            lastSync: nil,
            errorIdentifier: blockers.first?.status == .needsSetup ? .notConfigured : nil,
            errorMessage: nil
        )
    }

    static func local(
        setupStatus: CoachSetupStatus,
        publicPing: CoachPublicPingReadiness = .notChecked
    ) -> CoachReadinessReport {
        var checks: [CoachReadinessCheck] = []

        checks.append(
            CoachReadinessCheck(
                id: "local_app_configuration",
                label: "Local app configuration",
                status: setupStatus.isReadyForProtectedRequests ? .ready : .needsSetup,
                detail: setupStatus.detail,
                nextAction: setupStatus.nextAction
            )
        )

        checks.append(
            CoachReadinessCheck(
                id: "valid_api_base_url",
                label: "Valid API base URL",
                status: [.missingAPIBase, .invalidAPIBase, .notConfigured].contains(setupStatus.state) ? .needsSetup : .ready,
                detail: [.missingAPIBase, .invalidAPIBase, .notConfigured].contains(setupStatus.state)
                    ? "A valid http or https Coach API base URL is required before protected requests can run."
                    : "A valid Coach API base URL is present locally.",
                nextAction: "Use https://todd-personal-coach.netlify.app unless Todd explicitly changes the production target."
            )
        )

        checks.append(
            CoachReadinessCheck(
                id: "local_secret_presence",
                label: "Local secret presence",
                status: setupStatus.state == .configuredLocally ? .ready : .needsSetup,
                detail: setupStatus.state == .configuredLocally
                    ? "A local device secret is present; the value is not displayed."
                    : "Todd must enter the Coach secret directly on the physical iPhone.",
                nextAction: "Todd enters the secret on device. Codex and GPT Pro do not handle the value."
            )
        )

        checks.append(
            CoachReadinessCheck(
                id: "public_ping",
                label: "Public ping",
                status: publicPing.status,
                detail: publicPing.detail,
                nextAction: "Codex may verify the public ping outside the app; the local readiness check does not call production."
            )
        )

        checks.append(
            CoachReadinessCheck(
                id: "protected_read_only_routes",
                label: "Protected read-only routes",
                status: setupStatus.isReadyForProtectedRequests ? .deviceBound : .needsSetup,
                detail: setupStatus.isReadyForProtectedRequests
                    ? "Requires Todd-entered device secret and a manual read-only run such as Check Coach Sync Status."
                    : "Blocked until local API base URL and device secret are configured.",
                nextAction: "Run Check Coach Sync Status only after Todd has entered the secret on the physical iPhone."
            )
        )

        checks.append(contentsOf: [
            CoachReadinessCheck(
                id: "healthkit_permissions",
                label: "HealthKit permissions",
                status: .deviceBound,
                detail: "Health permissions must be granted by Todd on the physical iPhone.",
                nextAction: "Todd opens the app and grants requested Apple Health read permissions."
            ),
            CoachReadinessCheck(
                id: "app_intents_metadata",
                label: "App Intent readiness",
                status: .ready,
                detail: "App Intents are present in the app build and remain no-secret by design.",
                nextAction: "Verify shortcut visibility on the physical iPhone after install."
            ),
            CoachReadinessCheck(
                id: "siri_shortcuts",
                label: "Siri and Shortcuts",
                status: .deviceBound,
                detail: "Shortcut visibility and Siri phrasing must be verified on Todd's device.",
                nextAction: "Todd confirms Shortcuts and Siri behavior after manual read-only runs succeed."
            ),
            CoachReadinessCheck(
                id: "action_button",
                label: "Action Button",
                status: .deviceBound,
                detail: "Action Button assignment is a device setting and is not configured by Codex.",
                nextAction: "Todd assigns an approved Shortcut only after manual Shortcut behavior is stable."
            ),
            CoachReadinessCheck(
                id: "personal_automation",
                label: "Personal Automation",
                status: .deviceBound,
                detail: "Personal Automation and Run Immediately behavior must be verified on the real iOS Shortcuts screen.",
                nextAction: "Todd configures automation directly on device; manual Morning Coach remains fallback."
            ),
            CoachReadinessCheck(
                id: "direct_coach_action_write_hold",
                label: "Direct Coach action write hold",
                status: .held,
                detail: "Workout, nutrition, post-workout, memory, BP, and debrief write-capable flows remain held for a later write-readiness phase.",
                nextAction: "Use read-only checks first; do not live-test write behavior in this setup phase."
            ),
            CoachReadinessCheck(
                id: "draft_only_capture",
                label: "Draft-only capture",
                status: .ready,
                detail: "Draft debrief, coach note, and BP intake paths remain no-write and non-submitting.",
                nextAction: "Use draft outputs for review only until Todd approves a write-readiness phase."
            )
        ])

        let actionStatus = checks.contains { $0.status == .needsSetup }
            ? "setup_required"
            : "todd_device_verification_required"
        let summary = checks.contains { $0.status == .needsSetup }
            ? "Coach readiness needs local setup before protected read-only checks can run."
            : "Coach readiness is locally configured; remaining setup is Todd/device-bound and writes remain held."
        return CoachReadinessReport(
            actionStatus: actionStatus,
            summary: summary,
            checks: checks
        )
    }
}

private extension CoachPublicPingReadiness {
    var status: CoachReadinessCheckStatus {
        switch self {
        case .notChecked:
            .notChecked
        case .healthy:
            .ready
        case .failed:
            .needsSetup
        }
    }

    var detail: String {
        switch self {
        case .notChecked:
            "Public production ping was not called by this local readiness check."
        case .healthy:
            "Public production ping is healthy."
        case .failed:
            "Public production ping did not return the expected healthy response."
        }
    }
}
