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

enum CoachShortcutSetupStatus: String, Codable, Equatable {
    case notChecked = "not_checked"
    case needsSetup = "needs_setup"
    case configuredLocally = "configured_locally"
    case deviceBound = "device_bound"
    case notApplicable = "not_applicable"
}

enum CoachShortcutReadinessStatus: String, Codable, Equatable {
    case ready
    case attentionRequired = "attention_required"
    case staleOrMissing = "stale_or_missing"
    case deferred
    case unknown
}

enum CoachShortcutProtectedVerificationStatus: String, Codable, Equatable {
    case notRequired = "not_required"
    case blockedMissingSetup = "blocked_missing_setup"
    case deferredUntilToddDevice = "deferred_until_todd_device"
    case readyForManualReadOnly = "ready_for_manual_read_only"
    case verifiedReadOnly = "verified_read_only"
}

enum CoachShortcutWriteStatus: String, Codable, Equatable {
    case noWrite = "no_write"
    case writeHeld = "write_held"
    case draftOnly = "draft_only_no_write"
    case manualHandoffOnly = "manual_handoff_only_no_write"
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
            template: "credential: [redacted]",
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

    static func surfaceText(_ value: String?, fallback: String, maxCharacters: Int = 160) -> String {
        let raw = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let redactedValue = redact(raw)
        let compact = redactedValue
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let nonEmpty = compact.isEmpty ? fallback : compact
        guard nonEmpty.count > maxCharacters else {
            return nonEmpty
        }
        let prefixLength = max(1, maxCharacters - 3)
        let index = nonEmpty.index(nonEmpty.startIndex, offsetBy: prefixLength)
        return "\(nonEmpty[..<index].trimmingCharacters(in: .whitespacesAndNewlines))..."
    }

    static func labelText(_ value: String) -> String {
        surfaceText(
            value.replacingOccurrences(of: "_", with: " "),
            fallback: "Coach status",
            maxCharacters: 64
        )
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

struct CoachFutureSafeStrings: Codable, Equatable {
    let shortcutTitle: String
    let shortcutSubtitle: String
    let shortcutDetail: String
    let siriSummary: String
    let appCardTitle: String
    let appCardDetail: String
    let appEntityTitle: String
    let appEntitySubtitle: String
    let widgetTitle: String
    let widgetBody: String
    let widgetFooter: String
    let notificationTitle: String
    let notificationBody: String

    init(
        title: String?,
        subtitle: String?,
        detail: String?,
        body: String?,
        footer: String?
    ) {
        let safeTitle = CoachSafeOutput.surfaceText(title, fallback: "Coach", maxCharacters: 56)
        let safeSubtitle = CoachSafeOutput.surfaceText(subtitle, fallback: "Coach status", maxCharacters: 80)
        let safeDetail = CoachSafeOutput.surfaceText(detail, fallback: "Open Coach for details.", maxCharacters: 140)
        let safeBody = CoachSafeOutput.surfaceText(body, fallback: safeDetail, maxCharacters: 180)
        let safeFooter = CoachSafeOutput.surfaceText(footer, fallback: "No production write was sent.", maxCharacters: 120)

        self.shortcutTitle = safeTitle
        self.shortcutSubtitle = safeSubtitle
        self.shortcutDetail = safeDetail
        self.siriSummary = CoachSafeOutput.surfaceText(
            "\(safeTitle). \(safeDetail). \(safeFooter)",
            fallback: safeTitle,
            maxCharacters: 220
        )
        self.appCardTitle = safeTitle
        self.appCardDetail = CoachSafeOutput.surfaceText(
            "\(safeSubtitle) \(safeDetail) \(safeFooter)",
            fallback: safeDetail,
            maxCharacters: 220
        )
        self.appEntityTitle = safeTitle
        self.appEntitySubtitle = safeSubtitle
        self.widgetTitle = safeTitle
        self.widgetBody = safeBody
        self.widgetFooter = safeFooter
        self.notificationTitle = safeTitle
        self.notificationBody = CoachSafeOutput.surfaceText(
            "\(safeFooter) \(safeBody)",
            fallback: safeDetail,
            maxCharacters: 180
        )
    }

    var allStrings: [String] {
        [
            shortcutTitle,
            shortcutSubtitle,
            shortcutDetail,
            siriSummary,
            appCardTitle,
            appCardDetail,
            appEntityTitle,
            appEntitySubtitle,
            widgetTitle,
            widgetBody,
            widgetFooter,
            notificationTitle,
            notificationBody
        ]
    }

    var contractText: String {
        [
            "shortcut_title: \(shortcutTitle)",
            "shortcut_subtitle: \(shortcutSubtitle)",
            "shortcut_detail: \(shortcutDetail)",
            "siri_summary: \(siriSummary)",
            "app_entity_title: \(appEntityTitle)",
            "app_entity_subtitle: \(appEntitySubtitle)",
            "widget_title: \(widgetTitle)",
            "widget_body: \(widgetBody)",
            "widget_footer: \(widgetFooter)",
            "notification_title: \(notificationTitle)",
            "notification_body: \(notificationBody)"
        ].joined(separator: "\n")
    }
}

struct CoachShortcutOutput: Codable, Equatable {
    let actionStatus: String
    let setupStatus: CoachShortcutSetupStatus?
    let readinessStatus: CoachShortcutReadinessStatus?
    let protectedVerificationStatus: CoachShortcutProtectedVerificationStatus?
    let writeStatus: CoachShortcutWriteStatus?
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
    let workoutHandoff: String?

    enum CodingKeys: String, CodingKey {
        case actionStatus = "action_status"
        case setupStatus = "setup_status"
        case readinessStatus = "readiness_status"
        case protectedVerificationStatus = "protected_verification_status"
        case writeStatus = "write_status"
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
        case workoutHandoff = "workout_handoff"
    }

    init(
        actionStatus: String,
        setupStatus: CoachShortcutSetupStatus? = .notChecked,
        readinessStatus: CoachShortcutReadinessStatus? = .unknown,
        protectedVerificationStatus: CoachShortcutProtectedVerificationStatus? = .notRequired,
        writeStatus: CoachShortcutWriteStatus? = .noWrite,
        safetyStatus: CoachShortcutSafetyStatus,
        readinessSummary: String,
        workoutTitle: String?,
        workoutType: CoachShortcutWorkoutType,
        primaryConstraints: [String],
        coachMemoryContext: String?,
        workoutDebriefContext: String?,
        nextBestAction: String?,
        requiresMedicalCaution: Bool,
        sourceFreshness: String?,
        lastSync: String?,
        errorIdentifier: CoachShortcutErrorCode?,
        errorMessage: String?,
        workoutHandoff: String? = nil
    ) {
        self.actionStatus = CoachSafeOutput.redact(actionStatus)
        self.setupStatus = setupStatus
        self.readinessStatus = readinessStatus
        self.protectedVerificationStatus = protectedVerificationStatus
        self.writeStatus = writeStatus
        self.safetyStatus = safetyStatus
        self.readinessSummary = CoachSafeOutput.redact(readinessSummary)
        self.workoutTitle = workoutTitle.map(CoachSafeOutput.redact)
        self.workoutType = workoutType
        self.primaryConstraints = primaryConstraints.map(CoachSafeOutput.redact)
        self.coachMemoryContext = coachMemoryContext.map(CoachSafeOutput.redact)
        self.workoutDebriefContext = workoutDebriefContext.map(CoachSafeOutput.redact)
        self.nextBestAction = nextBestAction.map(CoachSafeOutput.redact)
        self.requiresMedicalCaution = requiresMedicalCaution
        self.sourceFreshness = sourceFreshness.map(CoachSafeOutput.redact)
        self.lastSync = lastSync.map(CoachSafeOutput.redact)
        self.errorIdentifier = errorIdentifier
        self.errorMessage = errorMessage.map(CoachSafeOutput.redact)
        self.workoutHandoff = workoutHandoff.map(CoachSafeOutput.redact)
    }

    var shortcutText: String {
        var lines: [String] = [
            "status: \(CoachSafeOutput.redact(actionStatus))",
            "setup_status: \(setupStatus?.rawValue ?? CoachShortcutSetupStatus.notChecked.rawValue)",
            "readiness_status: \(readinessStatus?.rawValue ?? CoachShortcutReadinessStatus.unknown.rawValue)",
            "protected_verification_status: \(protectedVerificationStatus?.rawValue ?? CoachShortcutProtectedVerificationStatus.notRequired.rawValue)",
            "write_status: \(writeStatus?.rawValue ?? CoachShortcutWriteStatus.noWrite.rawValue)",
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
        if let workoutHandoff, !workoutHandoff.isEmpty {
            lines.append("workout_handoff:")
            lines.append(CoachSafeOutput.redact(workoutHandoff))
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

    var safeSurfaceStrings: CoachFutureSafeStrings {
        let readiness = readinessStatus?.rawValue ?? CoachShortcutReadinessStatus.unknown.rawValue
        let protected = protectedVerificationStatus?.rawValue ?? CoachShortcutProtectedVerificationStatus.notRequired.rawValue
        let write = writeStatus?.rawValue ?? CoachShortcutWriteStatus.noWrite.rawValue
        let error = errorIdentifier.map { "error_identifier: \($0.rawValue) | " } ?? ""
        let firstBody = nextBestAction
            ?? primaryConstraints.first
            ?? errorMessage
            ?? sourceFreshness
            ?? "Apple Health is supporting evidence only."
        return CoachFutureSafeStrings(
            title: workoutTitle ?? "Coach \(CoachSafeOutput.labelText(actionStatus))",
            subtitle: "readiness_status: \(readiness) | write_status: \(write)",
            detail: readinessSummary,
            body: firstBody,
            footer: "\(error)protected_verification_status: \(protected) | write_status: \(write)"
        )
    }

    static func deferred(
        readinessSummary: String,
        nextBestAction: String,
        errorMessage: String
    ) -> CoachShortcutOutput {
        CoachShortcutOutput(
            actionStatus: "deferred_requires_review",
            setupStatus: .notApplicable,
            readinessStatus: .deferred,
            protectedVerificationStatus: .notRequired,
            writeStatus: .draftOnly,
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
        let errorIdentifier = Self.errorIdentifier(for: error)
        let failure = failureDescriptor(for: errorIdentifier)
        return CoachShortcutOutput(
            actionStatus: "failed",
            setupStatus: failure.setupStatus,
            readinessStatus: failure.readinessStatus,
            protectedVerificationStatus: failure.protectedVerificationStatus,
            writeStatus: .noWrite,
            safetyStatus: .unknown,
            readinessSummary: failure.readinessSummary,
            workoutTitle: nil,
            workoutType: .unknown,
            primaryConstraints: ["No secret or raw payload is included in this result."],
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: failure.nextBestAction,
            requiresMedicalCaution: false,
            sourceFreshness: nil,
            lastSync: nil,
            errorIdentifier: apiError?.shortcutErrorCode ?? errorIdentifier,
            errorMessage: failure.errorMessage
        )
    }

    private static func errorIdentifier(for error: Error) -> CoachShortcutErrorCode {
        if let apiError = error as? CoachAPIError {
            return apiError.shortcutErrorCode
        }
        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain {
            switch URLError.Code(rawValue: nsError.code) {
            case .notConnectedToInternet, .networkConnectionLost, .cannotFindHost, .cannotConnectToHost, .dnsLookupFailed, .timedOut:
                return .noNetwork
            default:
                return .backendUnavailable
            }
        }
        return .backendUnavailable
    }

    private static func failureDescriptor(for code: CoachShortcutErrorCode) -> (
        setupStatus: CoachShortcutSetupStatus,
        readinessStatus: CoachShortcutReadinessStatus,
        protectedVerificationStatus: CoachShortcutProtectedVerificationStatus,
        readinessSummary: String,
        nextBestAction: String,
        errorMessage: String
    ) {
        switch code {
        case .notConfigured:
            return (
                .needsSetup,
                .attentionRequired,
                .blockedMissingSetup,
                "Coach request could not start because local setup is incomplete.",
                "Open Todd Health Sync settings and enter the API base URL and secret on device.",
                "Local Coach setup is incomplete; no network request is required."
            )
        case .missingAPIBase:
            return (
                .needsSetup,
                .attentionRequired,
                .blockedMissingSetup,
                "Coach request could not start because the API base URL is missing or invalid.",
                "Open Todd Health Sync settings and correct the Coach API base URL.",
                "Coach API base URL is missing or invalid."
            )
        case .missingSecret:
            return (
                .needsSetup,
                .attentionRequired,
                .blockedMissingSetup,
                "Coach request could not start because the local device secret is missing.",
                "Enter the Coach API secret directly on Todd's iPhone during Todd-assisted setup.",
                "Local Coach secret is missing; no protected request was sent."
            )
        case .unauthorized:
            return (
                .configuredLocally,
                .attentionRequired,
                .deferredUntilToddDevice,
                "Coach rejected the protected request authorization.",
                "Recheck the device-saved Coach secret with Todd present; do not paste it into chat.",
                "Coach API returned unauthorized; no secret value is shown."
            )
        case .syncStale:
            return (
                .configuredLocally,
                .staleOrMissing,
                .deferredUntilToddDevice,
                "Coach source data is stale or missing.",
                "Run read-only source freshness checks before relying on Coach output.",
                "Coach source freshness needs attention."
            )
        case .noNetwork:
            return (
                .notChecked,
                .deferred,
                .deferredUntilToddDevice,
                "Coach request could not complete because network access is unavailable or timed out.",
                "Check connection, then retry a read-only Coach check; keep write actions held.",
                "Network unavailable, host unreachable, or request timed out."
            )
        case .redSafety:
            return (
                .notApplicable,
                .attentionRequired,
                .notRequired,
                "Coach safety is Red or medical caution is required.",
                "Do not start hard training; follow medical/safety guidance first.",
                "Safety override is active."
            )
        case .backendUnavailable:
            return (
                .notChecked,
                .deferred,
                .deferredUntilToddDevice,
                "Coach request could not complete because the API was unavailable or returned an error.",
                "Retry a read-only Coach check later; keep write actions held.",
                "Coach API was unavailable or returned a non-success response; response body is not shown."
            )
        case .malformedResponse:
            return (
                .notChecked,
                .deferred,
                .deferredUntilToddDevice,
                "Coach request returned a response the app could not safely read.",
                "Retry a read-only Coach check later; keep write actions held.",
                "Coach API response was invalid or malformed; raw response is not shown."
            )
        case .deferredWrite:
            return (
                .notApplicable,
                .deferred,
                .notRequired,
                "Coach write-capable action is deferred for review.",
                "Review and confirm inside an approved path before submitting.",
                "Write-capable action was not submitted."
            )
        }
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
            setupStatus: .configuredLocally,
            readinessStatus: warnings.isEmpty ? .ready : .staleOrMissing,
            protectedVerificationStatus: .verifiedReadOnly,
            writeStatus: .noWrite,
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

enum DailyDataSourceCategory: String, Codable, Equatable {
    case localDevice = "local_device"
    case coachPublic = "coach_public"
    case coachProtectedReadOnly = "coach_protected_read_only"
    case devicePermission = "device_permission"
    case manualThirdParty = "manual_third_party"
    case safetyIntake = "safety_intake"
    case draftCapture = "draft_capture"
}

struct DailyDataFreshnessSource: Codable, Equatable, Identifiable {
    let id: String
    let label: String
    let category: DailyDataSourceCategory
    let status: DailyDataFreshnessStatus
    let detail: String
    let nextAction: String

    var line: String {
        var parts = [
            "\(id): \(status.rawValue)",
            "source_category: \(category.rawValue)",
            "freshness_status: \(status.rawValue)",
            "readiness_status: \(readinessStatus.rawValue)",
            "protected_verification_status: \(protectedVerificationStatus.rawValue)",
            "write_status: \(writeStatus.rawValue)",
            "title: \(surfaceTitle)",
            "detail: \(surfaceDetail)",
            "next_action: \(CoachSafeOutput.redact(nextAction))"
        ]
        if let errorIdentifier {
            parts.append("error_identifier: \(errorIdentifier.rawValue)")
        }
        return parts.joined(separator: " | ")
    }

    var surfaceTitle: String {
        CoachSafeOutput.redact("\(label) - \(status.displayLabel)")
    }

    var surfaceDetail: String {
        CoachSafeOutput.redact(detail)
    }

    var readinessStatus: CoachShortcutReadinessStatus {
        switch status {
        case .fresh, .noWriteDraftOnly:
            return .ready
        case .stale, .missing:
            return .staleOrMissing
        case .notConfigured, .permissionRequired, .toddActionRequired:
            return .attentionRequired
        case .protectedVerificationDeferred, .manualSourceDeferred:
            return .deferred
        }
    }

    var protectedVerificationStatus: CoachShortcutProtectedVerificationStatus {
        switch (category, status) {
        case (.coachProtectedReadOnly, .fresh):
            return .verifiedReadOnly
        case (.coachProtectedReadOnly, .notConfigured):
            return .blockedMissingSetup
        case (.coachProtectedReadOnly, _), (_, .protectedVerificationDeferred):
            return .deferredUntilToddDevice
        default:
            return .notRequired
        }
    }

    var writeStatus: CoachShortcutWriteStatus {
        switch status {
        case .noWriteDraftOnly:
            return .draftOnly
        case .manualSourceDeferred:
            return .manualHandoffOnly
        case .fresh:
            return .noWrite
        case .stale, .missing, .notConfigured, .permissionRequired, .toddActionRequired, .protectedVerificationDeferred:
            return .writeHeld
        }
    }

    var errorIdentifier: CoachShortcutErrorCode? {
        switch status {
        case .notConfigured:
            return .notConfigured
        case .stale, .missing:
            return .syncStale
        case .permissionRequired, .toddActionRequired, .protectedVerificationDeferred, .manualSourceDeferred, .noWriteDraftOnly, .fresh:
            return nil
        }
    }

    var safeSurfaceStrings: CoachFutureSafeStrings {
        let error = errorIdentifier.map { " | error_identifier: \($0.rawValue)" } ?? ""
        return CoachFutureSafeStrings(
            title: surfaceTitle,
            subtitle: "source_category: \(category.rawValue) | freshness_status: \(status.rawValue)",
            detail: surfaceDetail,
            body: nextAction,
            footer: "readiness_status: \(readinessStatus.rawValue) | protected_verification_status: \(protectedVerificationStatus.rawValue) | write_status: \(writeStatus.rawValue)\(error)"
        )
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
            setupStatus: sources.contains { $0.status == .notConfigured } ? .needsSetup : .configuredLocally,
            readinessStatus: actionStatus == "attention_required" ? .attentionRequired : .ready,
            protectedVerificationStatus: Self.protectedVerificationStatus(from: sources),
            writeStatus: .writeHeld,
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

    var safeSurfaceStrings: CoachFutureSafeStrings {
        let body = sources.first { !$0.status.isUsableNow }?.nextAction
            ?? "Continue with read-only Coach checks; write-capable paths remain held."
        return CoachFutureSafeStrings(
            title: "Daily data freshness",
            subtitle: "freshness_status: \(actionStatus)",
            detail: summary,
            body: body,
            footer: "write_status: \(shortcutOutput.writeStatus?.rawValue ?? CoachShortcutWriteStatus.writeHeld.rawValue) | protected_verification_status: \(shortcutOutput.protectedVerificationStatus?.rawValue ?? CoachShortcutProtectedVerificationStatus.deferredUntilToddDevice.rawValue)"
        )
    }

    private static func protectedVerificationStatus(from sources: [DailyDataFreshnessSource]) -> CoachShortcutProtectedVerificationStatus {
        if sources.contains(where: { $0.id == "protected_read_only_freshness" && $0.status == .fresh }) {
            return .verifiedReadOnly
        }
        if sources.contains(where: { $0.id == "protected_read_only_freshness" && $0.status == .notConfigured }) {
            return .blockedMissingSetup
        }
        return .deferredUntilToddDevice
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
                category: .devicePermission,
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
                category: .safetyIntake,
                status: .toddActionRequired,
                detail: "BP freshness needs a recent Todd-reviewed reading; draft BP intake is no-write.",
                nextAction: "Review or enter BP through an approved intake path."
            )
        )
        sources.append(
            DailyDataFreshnessSource(
                id: "draft_only_capture",
                label: "Draft-only capture",
                category: .draftCapture,
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
                category: .localDevice,
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
            category: .localDevice,
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
                category: .coachPublic,
                status: .protectedVerificationDeferred,
                detail: "Public ping was not called by this local freshness check.",
                nextAction: "Retry public ping from a safe diagnostic when needed."
            )
        case let .healthy(version):
            return DailyDataFreshnessSource(
                id: "coach_public_ping",
                label: "Coach API public ping",
                category: .coachPublic,
                status: .fresh,
                detail: "Public ping is healthy\(version.map { " on \($0)" } ?? "").",
                nextAction: "Continue with read-only checks."
            )
        case .failed:
            return DailyDataFreshnessSource(
                id: "coach_public_ping",
                label: "Coach API public ping",
                category: .coachPublic,
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
                category: .coachProtectedReadOnly,
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
                    category: .coachProtectedReadOnly,
                    status: .fresh,
                    detail: "Last protected read-only Coach readback was \(hours) hours ago.",
                    nextAction: "Continue with read-only Coach checks."
                )
            }
        }

        return DailyDataFreshnessSource(
            id: "protected_read_only_freshness",
            label: "Protected read-only freshness",
            category: .coachProtectedReadOnly,
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
                category: .manualThirdParty,
                status: .manualSourceDeferred,
                detail: "Rack/Motra and Garmin workout freshness are not scraped by the app.",
                nextAction: "Review manual source/runbook or run protected read-only Coach sync status."
            ),
            DailyDataFreshnessSource(
                id: "nutrition_source_freshness",
                label: "Nutrition source",
                category: .manualThirdParty,
                status: .manualSourceDeferred,
                detail: "Garmin Nutrition freshness needs protected Coach read-only check or manual review.",
                nextAction: "Review manual source/runbook."
            ),
            DailyDataFreshnessSource(
                id: "sleep_recovery_source_freshness",
                label: "Sleep/recovery source",
                category: .manualThirdParty,
                status: .manualSourceDeferred,
                detail: "Garmin sleep/recovery is primary; Oura remains fallback only when Garmin is stale or unreliable.",
                nextAction: "Review manual source/runbook."
            ),
            DailyDataFreshnessSource(
                id: "body_metrics_source_freshness",
                label: "Body metrics/weight",
                category: .manualThirdParty,
                status: .manualSourceDeferred,
                detail: "Body-composition and weight trends are evidence only and should not be overreacted to.",
                nextAction: "Review manual source/runbook."
            )
        ]
    }
}

private extension DailyDataFreshnessStatus {
    var displayLabel: String {
        switch self {
        case .fresh:
            return "fresh"
        case .stale:
            return "stale"
        case .missing:
            return "missing"
        case .notConfigured:
            return "setup needed"
        case .permissionRequired:
            return "permission required"
        case .toddActionRequired:
            return "Todd action required"
        case .protectedVerificationDeferred:
            return "protected verification deferred"
        case .manualSourceDeferred:
            return "manual source deferred"
        case .noWriteDraftOnly:
            return "draft only"
        }
    }

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
        lines.append(readoutHeadline)

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

    private var readoutHeadline: String {
        if let dailyCall {
            return dailyCall
        }
        if let plan = todaysPlan.first {
            return "Coach today readback is available. Plan: \(plan)"
        }
        if !why.isEmpty || !safetyGuardrails.isEmpty || !whatToTrackToday.isEmpty {
            return "Coach today readback is available; review the source notes and next action below."
        }
        return "Coach today returned without a daily call."
    }

    var shortcutOutput: CoachShortcutOutput {
        let constraints = Array(safetyGuardrails.prefix(6))
        let safetyStatus = Self.safetyStatus(from: readoutHeadline, constraints: constraints)
        let isRedSafety = safetyStatus == .red
        return CoachShortcutOutput(
            actionStatus: "ok",
            setupStatus: .configuredLocally,
            readinessStatus: constraints.isEmpty ? .ready : .attentionRequired,
            protectedVerificationStatus: .verifiedReadOnly,
            writeStatus: .noWrite,
            safetyStatus: safetyStatus,
            readinessSummary: readoutHeadline,
            workoutTitle: isRedSafety ? nil : todaysPlan.first,
            workoutType: isRedSafety ? .none : Self.workoutType(from: todaysPlan.first),
            primaryConstraints: constraints,
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: isRedSafety
                ? Self.redSafetyNextAction
                : whatToTrackToday.first,
            requiresMedicalCaution: isRedSafety || constraints.contains { Self.medicalCautionText($0) },
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
            dailyCall: Self.dailyCall(from: root),
            why: root.stringArray("why"),
            todaysPlan: root.todayPlanLines("todays_plan"),
            safetyGuardrails: root.stringArray("safety_guardrails"),
            whatToTrackToday: root.stringArray("what_to_track_today")
        )
    }

    private static func dailyCall(from root: [String: Any]) -> String? {
        if let value = root.dailyCallValue("daily_call")
            ?? root.stringValue("call")
            ?? root.stringValue("top_line_call") {
            return value
        }

        for key in ["daily_summary", "brief", "coaching_brief"] {
            if let nested = root[key] as? [String: Any],
               let value = nested.dailyCallValue("daily_call")
                ?? nested.stringValue("call")
                ?? nested.stringValue("top_line_call") {
                return value
            }
        }

        return nil
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

    static var redSafetyNextAction: String {
        "Do not start hard training; follow medical/safety guidance first."
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
            setupStatus: .configuredLocally,
            readinessStatus: missingOrStaleDataWarnings.isEmpty ? .ready : .staleOrMissing,
            protectedVerificationStatus: .verifiedReadOnly,
            writeStatus: .noWrite,
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

struct CoachWorkoutHandoff: Codable, Equatable {
    let title: String?
    let workoutType: CoachShortcutWorkoutType
    let safetyStatus: CoachShortcutSafetyStatus
    let readinessSummary: String?
    let constraints: [String]
    let planDetails: [String]
    let blocks: [CoachWorkoutHandoffBlock]
    let rackEntryLines: [String]
    let equipmentAssumptions: [String]
    let nextBestAction: String
    let manualStatus: String

    var shortcutText: String {
        var lines: [String] = [
            "manual_status: \(manualStatus)",
            "rack_garmin_status: manual_handoff_only",
            "third_party_automation: none"
        ]
        if let title, !title.isEmpty {
            lines.append("workout_title: \(CoachSafeOutput.redact(title))")
        }
        lines.append("workout_type: \(workoutType.rawValue)")
        lines.append("safety_status: \(safetyStatus.rawValue)")
        if let readinessSummary, !readinessSummary.isEmpty {
            lines.append("readiness_summary: \(CoachSafeOutput.redact(readinessSummary))")
        }
        if !constraints.isEmpty {
            lines.append("constraints:")
            lines.append(contentsOf: constraints.prefix(5).map { "- \(CoachSafeOutput.redact($0))" })
        }
        if !planDetails.isEmpty {
            lines.append("plan_details:")
            lines.append(contentsOf: planDetails.prefix(8).map { "- \(CoachSafeOutput.redact($0))" })
        }
        if !blocks.isEmpty {
            lines.append("manual_workout_blocks:")
            lines.append(contentsOf: blocks.prefix(5).flatMap { $0.lines })
        }
        if !rackEntryLines.isEmpty {
            lines.append("rack_manual_entry:")
            lines.append(contentsOf: rackEntryLines.prefix(8).map { "- \(CoachSafeOutput.redact($0))" })
        }
        if !equipmentAssumptions.isEmpty {
            lines.append("equipment_assumptions:")
            lines.append(contentsOf: equipmentAssumptions.prefix(6).map { "- \(CoachSafeOutput.redact($0))" })
        }
        lines.append("garmin_manual_entry: Start and save the matching Garmin workout manually; Garmin remains physiology/training-load context.")
        lines.append("next_best_action: \(CoachSafeOutput.redact(nextBestAction))")
        lines.append("No third-party app entry was automated.")
        lines.append("No production write was sent.")
        return lines.joined(separator: "\n")
    }

    var safeSurfaceStrings: CoachFutureSafeStrings {
        CoachFutureSafeStrings(
            title: title ?? "Workout handoff",
            subtitle: "manual_status: \(manualStatus) | write_status: \(CoachShortcutWriteStatus.manualHandoffOnly.rawValue)",
            detail: readinessSummary ?? "Manual workout handoff is ready for review.",
            body: nextBestAction,
            footer: "third_party_automation: none | production_write: none"
        )
    }

    static func build(
        workoutPlan: [String: Any]?,
        topLineCall: String?,
        nextActions: [String],
        riskFlags: [String]
    ) -> CoachWorkoutHandoff? {
        guard let workoutPlan else { return nil }

        let title = workoutPlan.stringValue("top_line")
            ?? workoutPlan.stringValue("session_type")
            ?? workoutPlan.stringValue("name")
            ?? workoutPlan.stringValue("title")
        let workoutType = CoachTodaySummary.workoutType(from: title ?? workoutPlan.stringValue("session_type"))
        let safetyStatus = CoachDirectActionResponseSummary.safetyStatus(
            from: topLineCall ?? title ?? "Workout handoff",
            riskFlags: riskFlags + workoutPlan.stringArray("guardrails")
        )
        guard safetyStatus != .red else {
            return nil
        }
        let blocks = workoutPlan.dictionaryArray("blocks").map(CoachWorkoutHandoffBlock.init(dictionary:))
        let planDetails = Self.planDetails(from: workoutPlan)
        let rackEntryLines = workoutPlan.stringArray("rack_entry_lines")
        let equipmentAssumptions = Array(
            Set(
                blocks
                    .flatMap(\.exercises)
                    .compactMap(\.equipment)
                    .filter { !$0.isEmpty }
            )
        ).sorted()
        let nextBestAction = nextActions.first
            ?? workoutPlan.stringArray("what_to_track").first
            ?? "Review this handoff, then manually enter completed sets in Rack/Motra and start the matching Garmin workout."

        return CoachWorkoutHandoff(
            title: title,
            workoutType: workoutType,
            safetyStatus: safetyStatus,
            readinessSummary: topLineCall,
            constraints: riskFlags + workoutPlan.stringArray("guardrails"),
            planDetails: planDetails,
            blocks: blocks,
            rackEntryLines: rackEntryLines,
            equipmentAssumptions: equipmentAssumptions,
            nextBestAction: nextBestAction,
            manualStatus: "manual_handoff_only_no_write"
        )
    }

    private static func planDetails(from workoutPlan: [String: Any]) -> [String] {
        [
            workoutPlan.stringValue("environment").map { "environment: \($0)" },
            workoutPlan.stringValue("floor_plan").map { "floor_plan: \($0)" },
            workoutPlan.stringValue("target_minutes").map { "target_minutes: \($0)" },
            workoutPlan.numberArrayText("time_range_min").map { "time_range_min: \($0)" },
            workoutPlan.stringValue("intensity").map { "intensity: \($0)" },
            workoutPlan.stringValue("post_workout_debrief_prompt").map { "post_workout_debrief_prompt: \($0)" }
        ].compactMap { $0 }
    }
}

struct CoachWorkoutHandoffBlock: Codable, Equatable {
    let name: String
    let target: String?
    let floor: String?
    let status: String?
    let estimatedMinutes: String?
    let exercises: [CoachWorkoutHandoffExercise]

    var lines: [String] {
        let detailText = [
            target,
            floor.map { "floor: \($0)" },
            status.map { "status: \($0)" },
            estimatedMinutes.map { "estimated_min: \($0)" }
        ]
            .compactMap { $0 }
            .map(CoachSafeOutput.redact)
            .joined(separator: " | ")
        let suffix = detailText.isEmpty ? "" : ": \(detailText)"
        var blockLines = ["- \(CoachSafeOutput.redact(name))\(suffix)"]
        blockLines.append(contentsOf: exercises.prefix(6).map { "  - \($0.line)" })
        return blockLines
    }

    init(dictionary: [String: Any]) {
        self.name = dictionary.stringValue("label")
            ?? dictionary.stringValue("name")
            ?? dictionary.stringValue("id")
            ?? "Workout block"
        self.target = dictionary.stringValue("target")
            ?? dictionary.stringValue("description")
            ?? dictionary.stringValue("duration")
        self.floor = dictionary.stringValue("floor")
        self.status = dictionary.stringValue("status")
        self.estimatedMinutes = dictionary.stringValue("estimated_min")
        self.exercises = dictionary.dictionaryArray("exercises").map(CoachWorkoutHandoffExercise.init(dictionary:))
    }
}

struct CoachWorkoutHandoffExercise: Codable, Equatable {
    let name: String
    let prescription: String?
    let equipment: String?
    let floor: String?
    let trackingApp: String?
    let note: String?
    let safetyModification: String?
    let rackEntryLine: String?

    var line: String {
        [
            CoachSafeOutput.redact(name),
            prescription.map(CoachSafeOutput.redact),
            trackingApp.map { "tracking: \(CoachSafeOutput.redact($0))" },
            equipment.map { "equipment: \(CoachSafeOutput.redact($0))" },
            floor.map { "floor: \(CoachSafeOutput.redact($0))" },
            note.map { "note: \(CoachSafeOutput.redact($0))" },
            safetyModification.map { "modify: \(CoachSafeOutput.redact($0))" },
            rackEntryLine.map { "Rack: \(CoachSafeOutput.redact($0))" }
        ]
            .compactMap { $0 }
            .joined(separator: " | ")
    }

    init(dictionary: [String: Any]) {
        self.name = dictionary.stringValue("rack_motra_name")
            ?? dictionary.stringValue("app_entry_name")
            ?? dictionary.stringValue("rack_name")
            ?? dictionary.stringValue("motra_name")
            ?? dictionary.stringValue("name")
            ?? "Exercise"
        self.prescription = dictionary.stringValue("prescription_text")
            ?? Self.prescriptionText(from: dictionary)
        self.equipment = dictionary.stringValue("equipment")
        self.floor = dictionary.stringValue("floor")
        self.trackingApp = dictionary.stringValue("tracking_app")
        self.note = dictionary.stringValue("note")
        self.safetyModification = dictionary.stringValue("safety_modification")
        self.rackEntryLine = dictionary.stringValue("rack_entry_line")
    }

    private static func prescriptionText(from dictionary: [String: Any]) -> String? {
        let prescription = dictionary["prescription"] as? [String: Any]
        let sets = dictionary.stringValue("sets") ?? prescription?.stringValue("sets")
        let reps = dictionary.stringValue("reps") ?? prescription?.stringValue("reps")
        let load = dictionary.stringValue("load") ?? prescription?.stringValue("load")
        let rest = dictionary.stringValue("rest") ?? prescription?.stringValue("rest")
        let duration = dictionary.stringValue("duration") ?? dictionary.stringValue("duration_min") ?? prescription?.stringValue("duration")
        let rpe = dictionary.stringValue("rpe") ?? dictionary.stringValue("RPE") ?? prescription?.stringValue("rpe")
        let intensity = dictionary.stringValue("intensity") ?? prescription?.stringValue("intensity")

        var pieces: [String] = []
        if let sets, let reps {
            pieces.append("\(sets) x \(reps)")
        } else if let reps {
            pieces.append(reps)
        }
        if let load {
            pieces.append(load)
        }
        if let rest {
            pieces.append("rest \(rest)")
        }
        if let duration {
            pieces.append("duration \(duration)")
        }
        if let rpe {
            pieces.append("RPE \(rpe)")
        }
        if let intensity {
            pieces.append("intensity \(intensity)")
        }
        return pieces.isEmpty ? nil : pieces.joined(separator: "; ")
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
    let workoutHandoff: CoachWorkoutHandoff?

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
        if let workoutHandoff {
            lines.append("workout_handoff:")
            lines.append(workoutHandoff.shortcutText)
        }
        lines.append("Apple Health is supporting evidence only.")
        return lines.joined(separator: "\n")
    }

    var shortcutOutput: CoachShortcutOutput {
        let safetyStatus = Self.safetyStatus(from: topLineCall ?? reply, riskFlags: riskFlags)
        let isRedSafety = safetyStatus == .red
        return CoachShortcutOutput(
            actionStatus: "ok",
            setupStatus: .configuredLocally,
            readinessStatus: riskFlags.isEmpty ? .ready : .attentionRequired,
            protectedVerificationStatus: .verifiedReadOnly,
            writeStatus: workoutHandoff == nil ? .noWrite : .manualHandoffOnly,
            safetyStatus: safetyStatus,
            readinessSummary: topLineCall ?? reply,
            workoutTitle: isRedSafety ? nil : workoutTitle,
            workoutType: isRedSafety ? .none : workoutType,
            primaryConstraints: riskFlags,
            coachMemoryContext: coachMemorySummary,
            workoutDebriefContext: workoutDebriefSummary,
            nextBestAction: isRedSafety
                ? CoachTodaySummary.redSafetyNextAction
                : nextActions.first,
            requiresMedicalCaution: isRedSafety || riskFlags.contains { CoachTodaySummary.medicalCautionText($0) },
            sourceFreshness: nil,
            lastSync: nil,
            errorIdentifier: nil,
            errorMessage: nil,
            workoutHandoff: workoutHandoff?.shortcutText
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
            workoutDebriefSummary: debrief?.stringValue("summary") ?? debrief?.stringArray("safety_warnings").first,
            workoutHandoff: CoachWorkoutHandoff.build(
                workoutPlan: workoutPlan,
                topLineCall: decision.stringValue("top_line_call"),
                nextActions: decision.stringArray("next_actions"),
                riskFlags: decision.stringArray("risk_flags")
                    + (dailySummary?.stringArray("safety_guardrails") ?? [])
            )
        )
    }

    static func safetyStatus(from text: String, riskFlags: [String]) -> CoachShortcutSafetyStatus {
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

    func dictionaryArray(_ key: String) -> [[String: Any]] {
        if let array = self[key] as? [[String: Any]] {
            return array
        }
        if let array = self[key] as? [Any] {
            return array.compactMap { $0 as? [String: Any] }
        }
        return []
    }

    func numberArrayText(_ key: String) -> String? {
        if let array = self[key] as? [NSNumber], !array.isEmpty {
            return array.map { $0.stringValue }.joined(separator: "-")
        }
        if let array = self[key] as? [Any], !array.isEmpty {
            let values = array.compactMap { item -> String? in
                if let number = item as? NSNumber {
                    return number.stringValue
                }
                if let string = item as? String, !string.isEmpty {
                    return string
                }
                return nil
            }
            return values.isEmpty ? nil : values.joined(separator: "-")
        }
        return nil
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
