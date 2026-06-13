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
