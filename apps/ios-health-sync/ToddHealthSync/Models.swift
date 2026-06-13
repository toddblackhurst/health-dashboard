import Foundation

struct AppleHealthDailyPayload: Encodable {
    let clientVersion: String
    let deviceName: String
    let timezone: String
    let daysRequested: Int
    let summaries: [AppleHealthDailySummary]
    let raw: [String: String]

    enum CodingKeys: String, CodingKey {
        case clientVersion = "client_version"
        case deviceName = "device_name"
        case timezone
        case daysRequested = "days_requested"
        case summaries
        case raw
    }
}

struct AppleHealthDailySummary: Encodable, Identifiable {
    var id: String { summaryDate }

    let summaryDate: String
    let sourceApp: String
    let sourceDevice: String
    let steps: Double?
    let distanceMi: Double?
    let flightsClimbed: Double?
    let activeEnergyKcal: Double?
    let basalEnergyKcal: Double?
    let exerciseMinutes: Double?
    let standMinutes: Double?
    let restingHrBpm: Double?
    let avgHrBpm: Double?
    let minHrBpm: Double?
    let maxHrBpm: Double?
    let hrvSdnnMs: Double?
    let hrvSampleCount: Int?
    let sleepMinutes: Double?
    let sleepInBedMinutes: Double?
    let workoutCount: Int?
    let strengthWorkoutCount: Int?
    let cardioWorkoutCount: Int?
    let duplicatePolicyFlags: [String: String]
    let metricQuality: [String: String]
    let provenance: [String: String]
    let rawSummary: [String: String]

    enum CodingKeys: String, CodingKey {
        case summaryDate = "summary_date"
        case sourceApp = "source_app"
        case sourceDevice = "source_device"
        case steps
        case distanceMi = "distance_mi"
        case flightsClimbed = "flights_climbed"
        case activeEnergyKcal = "active_energy_kcal"
        case basalEnergyKcal = "basal_energy_kcal"
        case exerciseMinutes = "exercise_minutes"
        case standMinutes = "stand_minutes"
        case restingHrBpm = "resting_hr_bpm"
        case avgHrBpm = "avg_hr_bpm"
        case minHrBpm = "min_hr_bpm"
        case maxHrBpm = "max_hr_bpm"
        case hrvSdnnMs = "hrv_sdnn_ms"
        case hrvSampleCount = "hrv_sample_count"
        case sleepMinutes = "sleep_minutes"
        case sleepInBedMinutes = "sleep_in_bed_minutes"
        case workoutCount = "workout_count"
        case strengthWorkoutCount = "strength_workout_count"
        case cardioWorkoutCount = "cardio_workout_count"
        case duplicatePolicyFlags = "duplicate_policy_flags"
        case metricQuality = "metric_quality"
        case provenance
        case rawSummary = "raw_summary"
    }
}

struct AppleHealthSyncResponse: Decodable {
    let ok: Bool
    let syncRunId: String?
    let daysRequested: Int?
    let daysWritten: Int?
    let errors: [AppleHealthSyncError]

    enum CodingKeys: String, CodingKey {
        case ok
        case syncRunId = "sync_run_id"
        case daysRequested = "days_requested"
        case daysWritten = "days_written"
        case errors
    }
}

struct AppleHealthSyncError: Decodable {
    let message: String?
}

enum CoachShortcutErrorCode: String, Codable, Equatable {
    case notConfigured
    case missingAPIBase
    case missingSecret
    case unauthorized
    case syncStale
    case noNetwork
    case redSafety
    case backendUnavailable
    case malformedResponse
    case deferredWrite
}

enum CoachShortcutSafetyStatus: String, Codable, Equatable {
    case red
    case yellow
    case green
    case unknown
}

enum CoachShortcutWorkoutType: String, Codable, Equatable {
    case strength
    case modifiedStrength = "modified_strength"
    case zone2
    case recovery
    case mobility
    case none
    case unknown
}

struct CoachSafeOutput {
    private static let redacted = "[redacted]"

    static func redact(_ value: String) -> String {
        var output = value

        output = replacing(
            output,
            pattern: #"([a-zA-Z][a-zA-Z0-9+.\-]*://)([^/\s@]+@)"#,
            template: "$1[redacted]@"
        )
        output = replacing(
            output,
            pattern: #"([?&][^=\s&#]*(?:secret|token|api[_-]?key|password|auth|credential|key)[^=\s&#]*=)[^&#\s]+"#,
            template: "$1[redacted]",
            options: [.caseInsensitive]
        )
        output = replacing(
            output,
            pattern: #"\b(authorization)\b\s*[:=]\s*Bearer\s+[A-Za-z0-9._~+/\-]+=*"#,
            template: "$1: Bearer [redacted]",
            options: [.caseInsensitive]
        )
        output = replacing(
            output,
            pattern: #"\b(x-coach-secret|authorization|auth|api[_ -]?key|password|secret|token|credential)\b\s*[:=]\s*[^,\s;]+"#,
            template: "$1: [redacted]",
            options: [.caseInsensitive]
        )
        output = replacing(
            output,
            pattern: #"\bBearer\s+[A-Za-z0-9._~+/\-]+=*"#,
            template: "Bearer [redacted]",
            options: [.caseInsensitive]
        )
        output = replacing(
            output,
            pattern: #"\bsk-[A-Za-z0-9_\-]{12,}\b"#,
            template: redacted,
            options: [.caseInsensitive]
        )
        output = replacing(
            output,
            pattern: #"\b[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"#,
            template: redacted
        )

        return output
    }

    static func errorMessage(_ error: Error) -> String {
        redact(error.localizedDescription)
    }

    private static func replacing(
        _ value: String,
        pattern: String,
        template: String,
        options: NSRegularExpression.Options = []
    ) -> String {
        guard let expression = try? NSRegularExpression(pattern: pattern, options: options) else {
            return value
        }
        let range = NSRange(value.startIndex..<value.endIndex, in: value)
        return expression.stringByReplacingMatches(
            in: value,
            options: [],
            range: range,
            withTemplate: template
        )
    }
}

struct CoachShortcutOutput: Codable, Equatable {
    let actionStatus: String
    let safetyStatus: CoachShortcutSafetyStatus
    let readinessSummary: String
    let workoutTitle: String?
    let workoutType: CoachShortcutWorkoutType
    let primaryConstraints: [String]
    let coachMemoryContext: String?
    let workoutDebriefContext: String?
    let nextBestAction: String?
    let requiresMedicalCaution: Bool
    let sourceFreshness: String?
    let lastSync: String?
    let errorIdentifier: CoachShortcutErrorCode?
    let errorMessage: String?

    enum CodingKeys: String, CodingKey {
        case actionStatus = "action_status"
        case safetyStatus = "safety_status"
        case readinessSummary = "readiness_summary"
        case workoutTitle = "workout_title"
        case workoutType = "workout_type"
        case primaryConstraints = "primary_constraints"
        case coachMemoryContext = "coach_memory_context"
        case workoutDebriefContext = "workout_debrief_context"
        case nextBestAction = "next_best_action"
        case requiresMedicalCaution = "requires_medical_caution"
        case sourceFreshness = "source_freshness"
        case lastSync = "last_sync"
        case errorIdentifier = "error_identifier"
        case errorMessage = "error_message"
    }

    var shortcutText: String {
        var lines: [String] = [
            "status: \(CoachSafeOutput.redact(actionStatus))",
            "safety_status: \(safetyStatus.rawValue)",
            "readiness_summary: \(CoachSafeOutput.redact(readinessSummary))"
        ]
        if let workoutTitle, !workoutTitle.isEmpty {
            lines.append("workout_title: \(CoachSafeOutput.redact(workoutTitle))")
        }
        lines.append("workout_type: \(workoutType.rawValue)")
        if !primaryConstraints.isEmpty {
            lines.append("primary_constraints:")
            lines.append(contentsOf: primaryConstraints.prefix(6).map { "- \(CoachSafeOutput.redact($0))" })
        }
        if let coachMemoryContext, !coachMemoryContext.isEmpty {
            lines.append("coach_memory_context: \(CoachSafeOutput.redact(coachMemoryContext))")
        }
        if let workoutDebriefContext, !workoutDebriefContext.isEmpty {
            lines.append("workout_debrief_context: \(CoachSafeOutput.redact(workoutDebriefContext))")
        }
        if let nextBestAction, !nextBestAction.isEmpty {
            lines.append("next_best_action: \(CoachSafeOutput.redact(nextBestAction))")
        }
        lines.append("requires_medical_caution: \(requiresMedicalCaution)")
        if let sourceFreshness, !sourceFreshness.isEmpty {
            lines.append("source_freshness: \(CoachSafeOutput.redact(sourceFreshness))")
        }
        if let lastSync, !lastSync.isEmpty {
            lines.append("last_sync: \(CoachSafeOutput.redact(lastSync))")
        }
        if let errorIdentifier {
            lines.append("error_identifier: \(errorIdentifier.rawValue)")
        }
        if let errorMessage, !errorMessage.isEmpty {
            lines.append("error_message: \(CoachSafeOutput.redact(errorMessage))")
        }
        lines.append("Apple Health is supporting evidence only.")
        return lines.joined(separator: "\n")
    }

    static func deferred(
        readinessSummary: String,
        nextBestAction: String,
        errorMessage: String
    ) -> CoachShortcutOutput {
        CoachShortcutOutput(
            actionStatus: "deferred_requires_review",
            safetyStatus: .unknown,
            readinessSummary: readinessSummary,
            workoutTitle: nil,
            workoutType: .unknown,
            primaryConstraints: [
                "No production write was sent.",
                "Review and confirm inside the app or a Todd-approved setup path before submitting."
            ],
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: nextBestAction,
            requiresMedicalCaution: false,
            sourceFreshness: nil,
            lastSync: nil,
            errorIdentifier: .deferredWrite,
            errorMessage: errorMessage
        )
    }

    static func failure(error: Error) -> CoachShortcutOutput {
        if let configurationError = error as? CoachConfigurationError {
            return configurationError.status.shortcutOutput
        }

        let apiError = error as? CoachAPIError
        return CoachShortcutOutput(
            actionStatus: "failed",
            safetyStatus: .unknown,
            readinessSummary: "Coach request could not complete.",
            workoutTitle: nil,
            workoutType: .unknown,
            primaryConstraints: ["No secret or raw payload is included in this result."],
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: "Open Todd Health Sync and check configuration, network, and source freshness.",
            requiresMedicalCaution: false,
            sourceFreshness: nil,
            lastSync: nil,
            errorIdentifier: apiError?.shortcutErrorCode ?? .backendUnavailable,
            errorMessage: CoachSafeOutput.errorMessage(error)
        )
    }
}

enum CoachDirectActionEndpoint: String, Codable, Equatable {
    case brief
    case workout
    case nutritionCloseout = "nutrition-closeout"
    case postWorkout = "post-workout"

    var path: String {
        "/api/coach/\(rawValue)"
    }

    var defaultIntent: String {
        switch self {
        case .brief:
            "brief"
        case .workout:
            "build_workout"
        case .nutritionCloseout:
            "nutrition_check"
        case .postWorkout:
            "post_workout"
        }
    }
}

struct DirectCoachActionRequest: Encodable, Equatable {
    let text: String
    let summary: String?
    let intent: String
    let requestedSessionType: String?
    let scheduleOverride: Bool?
    let targetDate: String?
    let targetDay: String?
    let timezone: String
    let channel: String
    let raw: [String: String]

    enum CodingKeys: String, CodingKey {
        case text
        case summary
        case intent
        case requestedSessionType = "requested_session_type"
        case scheduleOverride = "schedule_override"
        case targetDate = "target_date"
        case targetDay = "target_day"
        case timezone
        case channel
        case raw
    }
}

struct CoachSyncStatusSummary {
    let date: String?
    let scorePct: Int?
    let checks: [CoachSyncCheckSummary]
    let appleHealthStatus: String?

    var conciseResult: String {
        var lines: [String] = []
        let score = scorePct.map { " \($0)%" } ?? ""
        lines.append("Coach sync status\(score): \(date ?? "today")")

        let warnings = warningLines
        if warnings.isEmpty {
            lines.append("Warnings: no stale or missing required source found in sync-status.")
        } else {
            lines.append("Warnings:")
            lines.append(contentsOf: warnings.prefix(6).map { "- \($0)" })
        }

        lines.append("Apple Health remains supporting evidence only.")
        return lines.joined(separator: "\n")
    }

    var shortcutOutput: CoachShortcutOutput {
        let warnings = warningLines
        return CoachShortcutOutput(
            actionStatus: warnings.isEmpty ? "ok" : "attention_required",
            safetyStatus: .unknown,
            readinessSummary: "Coach source freshness\(scorePct.map { " \($0)%" } ?? "") for \(date ?? "today").",
            workoutTitle: nil,
            workoutType: .none,
            primaryConstraints: warnings.isEmpty ? [] : Array(warnings.prefix(6)),
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: warnings.first ?? "Sources look usable for a read-only coach check.",
            requiresMedicalCaution: warnings.contains { $0.localizedCaseInsensitiveContains("blood pressure") || $0.localizedCaseInsensitiveContains("medical") },
            sourceFreshness: warnings.isEmpty ? "No stale or missing required source found in sync-status." : warnings.prefix(3).joined(separator: " | "),
            lastSync: appleHealthStatus,
            errorIdentifier: nil,
            errorMessage: nil
        )
    }

    var warningLines: [String] {
        checks.compactMap { check in
            guard !["current", "not_expected"].contains(check.status) else { return nil }
            let label = check.warningLabel
            let latest = check.latestDate.map { " Latest: \($0)." } ?? ""
            let warning = check.warning.map { " \($0)" } ?? ""
            return "\(label) is \(check.statusText).\(latest)\(warning)"
        }
    }

    static func parse(data: Data) throws -> CoachSyncStatusSummary {
        let object = try JSONSerialization.jsonObject(with: data)
        guard let root = object as? [String: Any] else {
            throw CoachAPIError.invalidResponse
        }

        let checks = (root["checks"] as? [[String: Any]] ?? [])
            .map(CoachSyncCheckSummary.init(dictionary:))

        let appleHealth = root["apple_health"] as? [String: Any]
        return CoachSyncStatusSummary(
            date: root.stringValue("date"),
            scorePct: root.intValue("score_pct"),
            checks: checks,
            appleHealthStatus: appleHealth?.stringValue("status")
        )
    }
}

struct CoachSyncCheckSummary {
    let id: String
    let label: String
    let status: String
    let latestDate: String?
    let warning: String?

    init(dictionary: [String: Any]) {
        self.id = dictionary.stringValue("id") ?? "unknown"
        self.label = dictionary.stringValue("label") ?? id
        self.status = dictionary.stringValue("status") ?? "unknown"
        self.latestDate = dictionary.stringValue("latest_date")
        self.warning = dictionary.stringValue("warning")
    }

    var statusText: String {
        status.replacingOccurrences(of: "_", with: " ")
    }

    var warningLabel: String {
        switch id {
        case "sleep_recovery":
            "Garmin sleep/recovery"
        case "nutrition":
            "Garmin Nutrition"
        case "blood_pressure":
            "Blood pressure"
        case "apple_health_daily_summary":
            "Apple Health daily summary"
        case "strength_session", "strength_exercises":
            "Rack/Motra \(label)"
        default:
            label
        }
    }
}

enum DailyDataFreshnessStatus: String, Codable, Equatable {
    case fresh
    case stale
    case missing
    case notConfigured = "not_configured"
    case permissionRequired = "permission_required"
    case toddActionRequired = "todd_action_required"
    case protectedVerificationDeferred = "protected_verification_deferred"
    case manualSourceDeferred = "manual_source_deferred"
    case noWriteDraftOnly = "no_write_draft_only"
}

struct DailyDataFreshnessSource: Codable, Equatable, Identifiable {
    let id: String
    let label: String
    let status: DailyDataFreshnessStatus
    let detail: String
    let nextAction: String

    var line: String {
        "\(id): \(status.rawValue) - \(CoachSafeOutput.redact(detail)) Next: \(CoachSafeOutput.redact(nextAction))"
    }
}

enum CoachPublicPingFreshness: Equatable {
    case notChecked
    case healthy(version: String?)
    case failed
}

struct CoachPublicPingSummary: Equatable {
    let ok: Bool
    let action: String?
    let version: String?

    static func parse(data: Data) throws -> CoachPublicPingSummary {
        let object = try JSONSerialization.jsonObject(with: data)
        guard let root = object as? [String: Any] else {
            throw CoachAPIError.invalidResponse
        }

        return CoachPublicPingSummary(
            ok: root.boolValue("ok") ?? false,
            action: root.stringValue("action"),
            version: root.stringValue("version")
        )
    }
}

struct DailyDataFreshnessReport: Codable, Equatable {
    let actionStatus: String
    let summary: String
    let sources: [DailyDataFreshnessSource]

    var displayText: String {
        shortcutText
    }

    var shortcutText: String {
        var lines = [
            "freshness_status: \(CoachSafeOutput.redact(actionStatus))",
            "summary: \(CoachSafeOutput.redact(summary))",
            "sources:"
        ]
        lines.append(contentsOf: sources.map { "- \($0.line)" })
        lines.append("No production write was sent.")
        lines.append("No secret value is included.")
        return lines.joined(separator: "\n")
    }

    var shortcutOutput: CoachShortcutOutput {
        let constraints = sources
            .filter { !$0.status.isUsableNow }
            .map { "\($0.label): \($0.detail) Next: \($0.nextAction)" }
        return CoachShortcutOutput(
            actionStatus: actionStatus,
            safetyStatus: .unknown,
            readinessSummary: summary,
            workoutTitle: nil,
            workoutType: .none,
            primaryConstraints: Array(constraints.prefix(6)),
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: sources.first { !$0.status.isUsableNow }?.nextAction
                ?? "Continue with read-only Coach checks; keep write actions held until Todd approves write readiness.",
            requiresMedicalCaution: sources.contains { $0.id == "blood_pressure_intake" && !$0.status.isUsableNow },
            sourceFreshness: sources.prefix(4).map { "\($0.label): \($0.status.rawValue)" }.joined(separator: " | "),
            lastSync: sources.first { $0.id == "health_ios_sync" }?.detail,
            errorIdentifier: sources.contains { $0.status == .notConfigured } ? .notConfigured : nil,
            errorMessage: nil
        )
    }

    static func local(
        setupStatus: CoachSetupStatus,
        store: MorningCoachStore,
        now: Date = Date(),
        publicPing: CoachPublicPingFreshness = .notChecked
    ) -> DailyDataFreshnessReport {
        var sources: [DailyDataFreshnessSource] = []

        sources.append(localHealthSource(lastSyncAt: store.lastAppleHealthSyncAt, now: now))
        sources.append(publicPingSource(publicPing))
        sources.append(protectedReadOnlySource(setupStatus: setupStatus, lastReadbackAt: store.lastCoachReadbackAt, now: now))
        sources.append(
            DailyDataFreshnessSource(
                id: "healthkit_permission",
                label: "Health permissions",
                status: .permissionRequired,
                detail: "Health permissions can only be confirmed on Todd's physical iPhone.",
                nextAction: "Grant Health permissions on device."
            )
        )
        sources.append(contentsOf: manualSourceRows())
        sources.append(
            DailyDataFreshnessSource(
                id: "blood_pressure_intake",
                label: "Blood pressure/intake",
                status: .toddActionRequired,
                detail: "BP freshness needs a recent Todd-reviewed reading; draft BP intake is no-write.",
                nextAction: "Review or enter BP through an approved intake path."
            )
        )
        sources.append(
            DailyDataFreshnessSource(
                id: "draft_only_capture",
                label: "Draft-only capture",
                status: .noWriteDraftOnly,
                detail: "Workout debrief, coach note, and BP draft paths do not submit or save data.",
                nextAction: "Continue without write actions until write readiness is approved."
            )
        )

        let actionStatus = sources.contains { $0.status.needsToddOrSetup }
            ? "attention_required"
            : "read_only_ready"
        let summary = actionStatus == "attention_required"
            ? "Daily freshness has safe next actions, but some sources need Todd/device setup or manual review."
            : "Daily freshness is usable for read-only Coach checks; write-capable paths remain held."
        return DailyDataFreshnessReport(
            actionStatus: actionStatus,
            summary: summary,
            sources: sources
        )
    }

    private static func localHealthSource(lastSyncAt: Date?, now: Date) -> DailyDataFreshnessSource {
        guard let lastSyncAt else {
            return DailyDataFreshnessSource(
                id: "health_ios_sync",
                label: "Health/iOS sync",
                status: .missing,
                detail: "No Apple Health daily sync has completed on this device.",
                nextAction: "Open Todd Health Sync and sync Health data."
            )
        }

        let hours = max(0, Int(now.timeIntervalSince(lastSyncAt) / 3600))
        let status: DailyDataFreshnessStatus = hours <= 36 ? .fresh : .stale
        let action = status == .fresh
            ? "Continue; Apple Health remains supporting evidence only."
            : "Open Todd Health Sync and sync Health data."
        return DailyDataFreshnessSource(
            id: "health_ios_sync",
            label: "Health/iOS sync",
            status: status,
            detail: "Last Apple Health sync was \(hours) hours ago.",
            nextAction: action
        )
    }

    private static func publicPingSource(_ publicPing: CoachPublicPingFreshness) -> DailyDataFreshnessSource {
        switch publicPing {
        case .notChecked:
            return DailyDataFreshnessSource(
                id: "coach_public_ping",
                label: "Coach API public ping",
                status: .protectedVerificationDeferred,
                detail: "Public ping was not called by this local freshness check.",
                nextAction: "Retry public ping from a safe diagnostic when needed."
            )
        case let .healthy(version):
            return DailyDataFreshnessSource(
                id: "coach_public_ping",
                label: "Coach API public ping",
                status: .fresh,
                detail: "Public ping is healthy\(version.map { " on \($0)" } ?? "").",
                nextAction: "Continue with read-only checks."
            )
        case .failed:
            return DailyDataFreshnessSource(
                id: "coach_public_ping",
                label: "Coach API public ping",
                status: .stale,
                detail: "Public ping did not return the expected healthy response.",
                nextAction: "Retry public ping."
            )
        }
    }

    private static func protectedReadOnlySource(
        setupStatus: CoachSetupStatus,
        lastReadbackAt: Date?,
        now: Date
    ) -> DailyDataFreshnessSource {
        guard setupStatus.isReadyForProtectedRequests else {
            return DailyDataFreshnessSource(
                id: "protected_read_only_freshness",
                label: "Protected read-only freshness",
                status: .notConfigured,
                detail: "Requires Todd-entered device secret before live source freshness can be checked.",
                nextAction: "Enter Coach secret on device during Todd-assisted setup."
            )
        }

        if let lastReadbackAt {
            let hours = max(0, Int(now.timeIntervalSince(lastReadbackAt) / 3600))
            if hours <= 36 {
                return DailyDataFreshnessSource(
                    id: "protected_read_only_freshness",
                    label: "Protected read-only freshness",
                    status: .fresh,
                    detail: "Last protected read-only Coach readback was \(hours) hours ago.",
                    nextAction: "Continue with read-only Coach checks."
                )
            }
        }

        return DailyDataFreshnessSource(
            id: "protected_read_only_freshness",
            label: "Protected read-only freshness",
            status: .protectedVerificationDeferred,
            detail: "Protected source freshness has not been verified by this local check.",
            nextAction: "Run Check Coach Sync Status after Todd-entered setup is saved."
        )
    }

    private static func manualSourceRows() -> [DailyDataFreshnessSource] {
        [
            DailyDataFreshnessSource(
                id: "workout_source_freshness",
                label: "Workout sources",
                status: .manualSourceDeferred,
                detail: "Rack/Motra and Garmin workout freshness are not scraped by the app.",
                nextAction: "Review manual source/runbook or run protected read-only Coach sync status."
            ),
            DailyDataFreshnessSource(
                id: "nutrition_source_freshness",
                label: "Nutrition source",
                status: .manualSourceDeferred,
                detail: "Garmin Nutrition freshness needs protected Coach read-only check or manual review.",
                nextAction: "Review manual source/runbook."
            ),
            DailyDataFreshnessSource(
                id: "sleep_recovery_source_freshness",
                label: "Sleep/recovery source",
                status: .manualSourceDeferred,
                detail: "Garmin sleep/recovery is primary; Oura remains fallback only when Garmin is stale or unreliable.",
                nextAction: "Review manual source/runbook."
            ),
            DailyDataFreshnessSource(
                id: "body_metrics_source_freshness",
                label: "Body metrics/weight",
                status: .manualSourceDeferred,
                detail: "Body-composition and weight trends are evidence only and should not be overreacted to.",
                nextAction: "Review manual source/runbook."
            )
        ]
    }
}

private extension DailyDataFreshnessStatus {
    var isUsableNow: Bool {
        switch self {
        case .fresh, .noWriteDraftOnly:
            true
        case .stale, .missing, .notConfigured, .permissionRequired, .toddActionRequired, .protectedVerificationDeferred, .manualSourceDeferred:
            false
        }
    }

    var needsToddOrSetup: Bool {
        switch self {
        case .missing, .notConfigured, .permissionRequired, .toddActionRequired:
            true
        case .fresh, .stale, .protectedVerificationDeferred, .manualSourceDeferred, .noWriteDraftOnly:
            false
        }
    }
}

struct CoachTodaySummary {
    let date: String?
    let dailyCall: String?
    let why: [String]
    let todaysPlan: [String]
    let safetyGuardrails: [String]
    let whatToTrackToday: [String]

    func conciseResult(syncStatus: CoachSyncStatusSummary?) -> String {
        var lines: [String] = []
        lines.append("Morning Coach: \(date ?? "today")")
        lines.append(dailyCall ?? "Coach today returned without a daily call.")

        let whyLines = why.prefix(3)
        if !whyLines.isEmpty {
            lines.append("Why:")
            lines.append(contentsOf: whyLines.map { "- \($0)" })
        }

        if let plan = todaysPlan.first {
            lines.append("Today: \(plan)")
        }

        let warnings = warningLines(syncStatus: syncStatus)
        if warnings.isEmpty {
            lines.append("Warnings: no stale or missing required source found in sync-status.")
        } else {
            lines.append("Warnings:")
            lines.append(contentsOf: warnings.prefix(4).map { "- \($0)" })
        }

        if let nextAction = whatToTrackToday.first {
            lines.append("Next: \(nextAction)")
        }
        lines.append("Apple Health is supporting evidence only.")
        return lines.joined(separator: "\n")
    }

    var shortcutOutput: CoachShortcutOutput {
        let constraints = Array(safetyGuardrails.prefix(6))
        return CoachShortcutOutput(
            actionStatus: "ok",
            safetyStatus: Self.safetyStatus(from: dailyCall, constraints: constraints),
            readinessSummary: dailyCall ?? "Coach today returned without a daily call.",
            workoutTitle: todaysPlan.first,
            workoutType: Self.workoutType(from: todaysPlan.first),
            primaryConstraints: constraints,
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: whatToTrackToday.first,
            requiresMedicalCaution: constraints.contains { Self.medicalCautionText($0) },
            sourceFreshness: "Use sync-status for detailed source freshness.",
            lastSync: date,
            errorIdentifier: nil,
            errorMessage: nil
        )
    }

    private func warningLines(syncStatus: CoachSyncStatusSummary?) -> [String] {
        var warnings = syncStatus?.warningLines ?? []
        let safety = safetyGuardrails.filter {
            $0.localizedCaseInsensitiveContains("pain")
                || $0.localizedCaseInsensitiveContains("BP")
                || $0.localizedCaseInsensitiveContains("medical")
                || $0.localizedCaseInsensitiveContains("asthma")
                || $0.localizedCaseInsensitiveContains("migraine")
        }
        warnings.append(contentsOf: safety.prefix(2))
        return Array(warnings.prefix(6))
    }

    static func parse(data: Data) throws -> CoachTodaySummary {
        let object = try JSONSerialization.jsonObject(with: data)
        guard let root = object as? [String: Any] else {
            throw CoachAPIError.invalidResponse
        }

        return CoachTodaySummary(
            date: root.stringValue("date"),
            dailyCall: root.dailyCallValue("daily_call"),
            why: root.stringArray("why"),
            todaysPlan: root.todayPlanLines("todays_plan"),
            safetyGuardrails: root.stringArray("safety_guardrails"),
            whatToTrackToday: root.stringArray("what_to_track_today")
        )
    }

    private static func safetyStatus(from dailyCall: String?, constraints: [String]) -> CoachShortcutSafetyStatus {
        let joined = ([dailyCall ?? ""] + constraints).joined(separator: " ")
        if joined.localizedCaseInsensitiveContains("red") { return .red }
        if joined.localizedCaseInsensitiveContains("yellow") { return .yellow }
        if joined.localizedCaseInsensitiveContains("green") { return .green }
        return .unknown
    }

    static func workoutType(from plan: String?) -> CoachShortcutWorkoutType {
        guard let plan else { return .unknown }
        if plan.localizedCaseInsensitiveContains("modified") && plan.localizedCaseInsensitiveContains("strength") {
            return .modifiedStrength
        }
        if plan.localizedCaseInsensitiveContains("strength") || plan.localizedCaseInsensitiveContains("gym") {
            return .strength
        }
        if plan.localizedCaseInsensitiveContains("zone 2") || plan.localizedCaseInsensitiveContains("zone2") {
            return .zone2
        }
        if plan.localizedCaseInsensitiveContains("mobility") {
            return .mobility
        }
        if plan.localizedCaseInsensitiveContains("recovery") || plan.localizedCaseInsensitiveContains("rest") {
            return .recovery
        }
        return .unknown
    }

    static func medicalCautionText(_ text: String) -> Bool {
        text.localizedCaseInsensitiveContains("BP")
            || text.localizedCaseInsensitiveContains("blood pressure")
            || text.localizedCaseInsensitiveContains("medical")
            || text.localizedCaseInsensitiveContains("doctor")
            || text.localizedCaseInsensitiveContains("migraine")
            || text.localizedCaseInsensitiveContains("asthma")
            || text.localizedCaseInsensitiveContains("pain")
    }
}

struct CoachWeeklyReviewSummary {
    let weekStart: String?
    let weekEnd: String?
    let status: String?
    let overallCall: String?
    let findings: [String]
    let recommendations: [String]
    let missingOrStaleDataWarnings: [String]
    let notAppliedAutomatically: Bool

    var conciseResult: String {
        var lines: [String] = []
        lines.append("Weekly coach review: \(weekStart ?? "week") to \(weekEnd ?? "current")")
        lines.append("status: \(status ?? "review_only")")
        if let overallCall {
            lines.append("overall_call: \(overallCall)")
        }
        if !findings.isEmpty {
            lines.append("key_findings:")
            lines.append(contentsOf: findings.prefix(5).map { "- \($0)" })
        }
        if !recommendations.isEmpty {
            lines.append("recommendations:")
            lines.append(contentsOf: recommendations.prefix(5).map { "- \($0)" })
        }
        if !missingOrStaleDataWarnings.isEmpty {
            lines.append("missing_or_stale_data:")
            lines.append(contentsOf: missingOrStaleDataWarnings.prefix(5).map { "- \($0)" })
        }
        lines.append("not_applied_automatically: \(notAppliedAutomatically)")
        return lines.joined(separator: "\n")
    }

    var shortcutOutput: CoachShortcutOutput {
        CoachShortcutOutput(
            actionStatus: status ?? "review_only",
            safetyStatus: overallCall.flatMap { call in
                if call.localizedCaseInsensitiveContains("red") { return .red }
                if call.localizedCaseInsensitiveContains("yellow") { return .yellow }
                if call.localizedCaseInsensitiveContains("green") { return .green }
                return .unknown
            } ?? .unknown,
            readinessSummary: overallCall ?? "Weekly review returned without an overall call.",
            workoutTitle: nil,
            workoutType: .unknown,
            primaryConstraints: missingOrStaleDataWarnings,
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: recommendations.first,
            requiresMedicalCaution: missingOrStaleDataWarnings.contains { $0.localizedCaseInsensitiveContains("blood pressure") || $0.localizedCaseInsensitiveContains("doctor") },
            sourceFreshness: missingOrStaleDataWarnings.first,
            lastSync: weekEnd,
            errorIdentifier: nil,
            errorMessage: nil
        )
    }

    static func parse(data: Data) throws -> CoachWeeklyReviewSummary {
        let object = try JSONSerialization.jsonObject(with: data)
        guard let root = object as? [String: Any] else {
            throw CoachAPIError.invalidResponse
        }

        let review = root["review"] as? [String: Any] ?? [:]
        let recommendations = (root["recommendations"] as? [[String: Any]] ?? [])
            .compactMap { item in
                item.stringValue("summary")
                    ?? item.stringValue("recommendation")
                    ?? item.stringValue("text")
                    ?? item.stringValue("title")
            }

        return CoachWeeklyReviewSummary(
            weekStart: root.stringValue("week_start"),
            weekEnd: root.stringValue("week_end"),
            status: root.stringValue("status"),
            overallCall: review.stringValue("overall_call")
                ?? review.stringValue("overall_status")
                ?? root.stringValue("overall_call"),
            findings: review.stringArray("key_findings")
                + review.stringArray("findings"),
            recommendations: recommendations,
            missingOrStaleDataWarnings: root.stringArray("missing_or_stale_data_warnings"),
            notAppliedAutomatically: root.boolValue("not_applied_automatically") ?? true
        )
    }
}

struct CoachDirectActionResponseSummary {
    let action: String
    let reply: String
    let topLineCall: String?
    let nextActions: [String]
    let riskFlags: [String]
    let workoutTitle: String?
    let workoutType: CoachShortcutWorkoutType
    let coachMemorySummary: String?
    let workoutDebriefSummary: String?

    var conciseResult: String {
        var lines: [String] = ["Coach \(action):"]
        lines.append(topLineCall ?? reply)
        if !nextActions.isEmpty {
            lines.append("next_actions:")
            lines.append(contentsOf: nextActions.prefix(5).map { "- \($0)" })
        }
        if !riskFlags.isEmpty {
            lines.append("risk_flags:")
            lines.append(contentsOf: riskFlags.prefix(5).map { "- \($0)" })
        }
        if let workoutTitle {
            lines.append("workout_title: \(workoutTitle)")
        }
        lines.append("Apple Health is supporting evidence only.")
        return lines.joined(separator: "\n")
    }

    var shortcutOutput: CoachShortcutOutput {
        CoachShortcutOutput(
            actionStatus: "ok",
            safetyStatus: Self.safetyStatus(from: topLineCall ?? reply, riskFlags: riskFlags),
            readinessSummary: topLineCall ?? reply,
            workoutTitle: workoutTitle,
            workoutType: workoutType,
            primaryConstraints: riskFlags,
            coachMemoryContext: coachMemorySummary,
            workoutDebriefContext: workoutDebriefSummary,
            nextBestAction: nextActions.first,
            requiresMedicalCaution: riskFlags.contains { CoachTodaySummary.medicalCautionText($0) },
            sourceFreshness: nil,
            lastSync: nil,
            errorIdentifier: nil,
            errorMessage: nil
        )
    }

    static func parse(data: Data, fallbackAction: String) throws -> CoachDirectActionResponseSummary {
        let object = try JSONSerialization.jsonObject(with: data)
        guard let root = object as? [String: Any] else {
            throw CoachAPIError.invalidResponse
        }

        let decision = root["decision"] as? [String: Any] ?? root
        let workoutPlan = decision["workout_plan"] as? [String: Any]
        let dailySummary = decision["daily_summary"] as? [String: Any]
        let todaysPlan = dailySummary?["todays_plan"] as? [String: Any]
        let memory = decision["coach_memory_context"] as? [String: Any]
        let debrief = decision["workout_debrief_context"] as? [String: Any]

        let workoutTitle = workoutPlan?.stringValue("top_line")
            ?? workoutPlan?.stringValue("session_type")
            ?? todaysPlan?.stringValue("primary_action")
            ?? todaysPlan?.stringValue("recommendation")

        return CoachDirectActionResponseSummary(
            action: root.stringValue("action") ?? fallbackAction,
            reply: root.stringValue("reply") ?? decision.stringValue("reply") ?? "Coach action completed.",
            topLineCall: decision.stringValue("top_line_call"),
            nextActions: decision.stringArray("next_actions"),
            riskFlags: decision.stringArray("risk_flags")
                + (dailySummary?.stringArray("safety_guardrails") ?? []),
            workoutTitle: workoutTitle,
            workoutType: CoachTodaySummary.workoutType(from: workoutTitle),
            coachMemorySummary: memory?.stringValue("summary") ?? memory?.stringArray("memory_warnings").first,
            workoutDebriefSummary: debrief?.stringValue("summary") ?? debrief?.stringArray("safety_warnings").first
        )
    }

    private static func safetyStatus(from text: String, riskFlags: [String]) -> CoachShortcutSafetyStatus {
        let joined = ([text] + riskFlags).joined(separator: " ")
        if joined.localizedCaseInsensitiveContains("red") { return .red }
        if joined.localizedCaseInsensitiveContains("yellow") { return .yellow }
        if joined.localizedCaseInsensitiveContains("green") { return .green }
        return .unknown
    }
}

private extension Dictionary where Key == String, Value == Any {
    func stringValue(_ key: String) -> String? {
        guard let value = self[key] else { return nil }
        if let string = value as? String {
            return string.isEmpty ? nil : string
        }
        if let number = value as? NSNumber {
            return number.stringValue
        }
        return nil
    }

    func intValue(_ key: String) -> Int? {
        if let int = self[key] as? Int {
            return int
        }
        if let number = self[key] as? NSNumber {
            return number.intValue
        }
        if let string = self[key] as? String {
            return Int(string)
        }
        return nil
    }

    func boolValue(_ key: String) -> Bool? {
        if let bool = self[key] as? Bool {
            return bool
        }
        if let number = self[key] as? NSNumber {
            return number.boolValue
        }
        if let string = self[key] as? String {
            switch string.lowercased() {
            case "true", "1", "yes":
                return true
            case "false", "0", "no":
                return false
            default:
                return nil
            }
        }
        return nil
    }

    func stringArray(_ key: String) -> [String] {
        if let array = self[key] as? [String] {
            return array
        }
        if let array = self[key] as? [Any] {
            return array.compactMap { item in
                if let string = item as? String {
                    return string
                }
                if let dictionary = item as? [String: Any] {
                    return dictionary.stringValue("text")
                        ?? dictionary.stringValue("label")
                        ?? dictionary.stringValue("call")
                }
                return nil
            }
        }
        if let string = self[key] as? String, !string.isEmpty {
            return [string]
        }
        return []
    }

    func dailyCallValue(_ key: String) -> String? {
        if let string = stringValue(key) {
            return string
        }
        guard let dictionary = self[key] as? [String: Any] else {
            return nil
        }

        let decision = dictionary.stringValue("decision")
        let tier = dictionary.stringValue("readiness_tier") ?? dictionary.stringValue("color")
        switch (tier, decision) {
        case let (tier?, decision?) where !decision.localizedCaseInsensitiveContains(tier):
            return "\(tier): \(decision)"
        case let (_, decision?):
            return decision
        case let (tier?, nil):
            return tier
        default:
            return nil
        }
    }

    func todayPlanLines(_ key: String) -> [String] {
        let array = stringArray(key)
        if !array.isEmpty {
            return array
        }
        guard let dictionary = self[key] as? [String: Any] else {
            return []
        }

        let primary = dictionary.stringValue("primary_action")
            ?? dictionary.stringValue("recommendation")
            ?? dictionary.stringValue("type")
        guard let primary else {
            return []
        }

        var details: [String] = []
        if let recommendation = dictionary.stringValue("recommendation"),
           recommendation != primary {
            details.append(recommendation)
        }
        if let intensity = dictionary.stringValue("intensity") {
            details.append("intensity: \(intensity)")
        }
        if let minutes = dictionary.intValue("time_cap_min") {
            details.append("\(minutes) min cap")
        }
        if let nutrition = dictionary.stringValue("nutrition_focus") {
            details.append("nutrition: \(nutrition)")
        }

        if details.isEmpty {
            return [primary]
        }
        return ["\(primary) (\(details.joined(separator: "; ")))"]
    }
}
