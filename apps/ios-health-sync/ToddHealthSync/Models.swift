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

enum ManualSourceEvidenceLane: String, CaseIterable, Codable, Equatable, Identifiable {
    case garminSleepRecovery = "garmin_sleep_recovery"
    case bloodPressure = "blood_pressure"
    case garminNutrition = "garmin_nutrition"
    case bodyComposition = "body_composition_weight"
    case rackMotraSession = "rack_motra_strength_session"
    case rackMotraExerciseDetail = "rack_motra_exercise_detail"
    case ouraFallback = "oura_fallback_sleep_recovery"
    case appleHealthSupporting = "apple_health_supporting_note"
    case doctorSafetyNote = "doctor_safety_note"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .garminSleepRecovery:
            return "Garmin sleep/recovery"
        case .bloodPressure:
            return "Blood pressure"
        case .garminNutrition:
            return "Garmin Nutrition"
        case .bodyComposition:
            return "Body composition / weight"
        case .rackMotraSession:
            return "Rack/Motra strength session"
        case .rackMotraExerciseDetail:
            return "Rack/Motra exercise detail"
        case .ouraFallback:
            return "Oura fallback sleep/recovery"
        case .appleHealthSupporting:
            return "Apple Health supporting note"
        case .doctorSafetyNote:
            return "Doctor / safety note"
        }
    }

    var sourceRole: String {
        switch self {
        case .garminSleepRecovery:
            return "primary_readiness_when_fresh"
        case .bloodPressure, .doctorSafetyNote:
            return "safety"
        case .garminNutrition:
            return "nutrition_authority"
        case .bodyComposition:
            return "trend_evidence"
        case .rackMotraSession:
            return "strength_log_authority"
        case .rackMotraExerciseDetail:
            return "set_rep_load_authority"
        case .ouraFallback:
            return "fallback"
        case .appleHealthSupporting:
            return "supporting"
        }
    }

    var sourceState: String {
        switch self {
        case .bloodPressure, .doctorSafetyNote:
            return "write_held"
        case .ouraFallback:
            return "fallback_only"
        case .appleHealthSupporting:
            return "supporting_only"
        case .garminSleepRecovery, .garminNutrition, .bodyComposition, .rackMotraSession, .rackMotraExerciseDetail:
            return "manual_provider_bound"
        }
    }

    var writeStatus: CoachShortcutWriteStatus {
        .draftOnly
    }

    var prompt: String {
        switch self {
        case .garminSleepRecovery:
            return "Readiness score, sleep time, HRV/RHR, recovery time, Body Battery, and any wear-quality caveat."
        case .bloodPressure:
            return "Recent reading, time taken, symptoms, medication/context, and whether it is unusual."
        case .garminNutrition:
            return "Calories, protein, carbs, fat, hydration, and whether the day is complete or partial."
        case .bodyComposition:
            return "Weight/body trend only; avoid overreacting to a one-day BIA swing."
        case .rackMotraSession:
            return "Completed session name/date, whether it was fully logged, and any skipped work."
        case .rackMotraExerciseDetail:
            return "Key sets/reps/loads/RPE/pain notes that Coach should consider for progression."
        case .ouraFallback:
            return "Oura readiness/sleep notes only if Garmin is stale, missing, or unreliable."
        case .appleHealthSupporting:
            return "Steps, active energy, exercise minutes, or sleep/workout cross-check; supporting only."
        case .doctorSafetyNote:
            return "Doctor guidance, pain, asthma, migraine, symptoms, or other safety caveat."
        }
    }

    var nextAction: String {
        switch self {
        case .bloodPressure, .doctorSafetyNote:
            return "Use as safety context only; do not treat this draft as training approval."
        case .ouraFallback:
            return "Use only when Garmin sleep/recovery is stale, missing, or unreliable."
        case .appleHealthSupporting:
            return "Use as supporting context only; do not override Garmin, Rack/Motra, nutrition, or safety."
        default:
            return "Use as manually reported evidence only; do not treat as provider-integrated data."
        }
    }
}

struct ManualSourceEvidenceDraft: Codable, Equatable, Identifiable {
    let lane: ManualSourceEvidenceLane
    var note: String
    var lastEditedAt: Date?

    var id: String { lane.id }

    var hasNote: Bool {
        !note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var packetLine: String {
        let edited = lastEditedAt.map { "last_edited: \(ManualSourceEvidencePacket.format($0)) | " } ?? ""
        let safeNote = hasNote ? CoachSafeOutput.redact(note) : "not_reported"
        return [
            "\(lane.id):",
            "label: \(lane.label)",
            "source_role: \(lane.sourceRole)",
            "source_state: \(lane.sourceState)",
            "write_status: \(lane.writeStatus.rawValue)",
            edited + "reported_evidence_only: \(safeNote)",
            "next_action: \(lane.nextAction)"
        ].joined(separator: " | ")
    }
}

struct ManualSourceEvidencePacket: Codable, Equatable {
    let generatedAt: Date
    let drafts: [ManualSourceEvidenceDraft]

    var includedDrafts: [ManualSourceEvidenceDraft] {
        drafts.filter(\.hasNote)
    }

    var requiresTrainingHold: Bool {
        includedDrafts.contains { draft in
            guard [.bloodPressure, .doctorSafetyNote].contains(draft.lane) else { return false }
            let text = draft.note.lowercased()
            return text.contains("chest pain")
                || text.contains("shortness of breath at rest")
                || text.contains("faint")
                || text.contains("dizzy")
                || text.contains("doctor said stop")
                || text.contains("do not train")
                || text.contains("180/")
                || text.contains("/120")
        }
    }

    var displayText: String {
        var lines = [
            "MANUAL_SOURCE_EVIDENCE_PACKET_DRAFT",
            "generated_at: \(Self.format(generatedAt))",
            "status: draft_only_not_saved",
            "write_status: \(CoachShortcutWriteStatus.draftOnly.rawValue)",
            "protected_route_status: not_called",
            "backend_write_status: no_write",
            "summary: Manually reported evidence only. Not submitted to Coach backend. Not provider-integrated data.",
            "source_confidence: Use this to reduce uncertainty, not to upgrade stale primary data into verified fresh data.",
            "safety_note: BP and doctor/symptom drafts are safety inputs, not training permission."
        ]
        if requiresTrainingHold {
            lines.append("safety_bias: hold hard training and seek human medical guidance when symptoms, BP, or doctor guidance are high-risk or unclear.")
        }
        lines.append("sources:")
        let rows = includedDrafts.isEmpty
            ? [ManualSourceEvidenceDraft(lane: .doctorSafetyNote, note: "No manual source evidence entered.", lastEditedAt: nil)]
            : includedDrafts
        lines.append(contentsOf: rows.map { "- \($0.packetLine)" })
        lines.append("No production write was sent.")
        lines.append("No secret value is included.")
        return CoachSafeOutput.redact(lines.joined(separator: "\n"))
    }

    static func build(from notes: [ManualSourceEvidenceLane: String], generatedAt: Date = Date()) -> ManualSourceEvidencePacket {
        ManualSourceEvidencePacket(
            generatedAt: generatedAt,
            drafts: ManualSourceEvidenceLane.allCases.map { lane in
                let note = notes[lane]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                return ManualSourceEvidenceDraft(
                    lane: lane,
                    note: note,
                    lastEditedAt: note.isEmpty ? nil : generatedAt
                )
            }
        )
    }

    static func format(_ date: Date) -> String {
        formatter.string(from: date)
    }

    private static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd HH:mm zzz"
        return formatter
    }()
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
            let sourceState = check.sourceState.map { " Source state: \($0.replacingOccurrences(of: "_", with: " "))." } ?? ""
            let freshness = check.freshnessStatus.map { " Freshness: \($0.replacingOccurrences(of: "_", with: " "))." } ?? ""
            let nextAction = check.nextAction.map { " Next: \($0)" } ?? ""
            return "\(label) is \(check.statusText).\(latest)\(sourceState)\(freshness)\(warning)\(nextAction)"
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
    let sourceState: String?
    let freshnessStatus: String?
    let authorityRole: String?
    let confidenceEffect: String?
    let nextAction: String?

    init(dictionary: [String: Any]) {
        self.id = dictionary.stringValue("id") ?? "unknown"
        self.label = dictionary.stringValue("label") ?? id
        self.status = dictionary.stringValue("status") ?? "unknown"
        self.latestDate = dictionary.stringValue("latest_date")
        self.warning = dictionary.stringValue("warning")
        self.sourceState = dictionary.stringValue("source_state")
        self.freshnessStatus = dictionary.stringValue("freshness_status")
        self.authorityRole = dictionary.stringValue("authority_role")
        self.confidenceEffect = dictionary.stringValue("confidence_effect")
        self.nextAction = dictionary.stringValue("next_action")
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
            "source_state: \(sourceState)",
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

    var sourceState: String {
        switch status {
        case .fresh where id == "protected_read_only_freshness":
            return "verified_read_only"
        case .fresh where id == "health_ios_sync":
            return "supporting_only"
        case .fresh:
            return "fresh"
        case .stale:
            return "stale"
        case .missing:
            return "missing"
        case .notConfigured:
            return "permission_required"
        case .permissionRequired:
            return "permission_required"
        case .toddActionRequired:
            return "write_held"
        case .protectedVerificationDeferred:
            return "protected_verification_deferred"
        case .manualSourceDeferred:
            return id == "sleep_recovery_source_freshness" ? "fallback_only_or_manual_provider_bound" : "manual_provider_bound"
        case .noWriteDraftOnly:
            return "draft_only"
        }
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

enum CoachDataRefreshGroup: String, Codable, CaseIterable, Equatable {
    case fresh
    case fallback
    case needsTodd = "needs_todd"
}

private struct CoachDataRefreshPolicy {
    let registryKey: String
    let label: String
    let authorityRole: String
    let freshnessWindow: String
    let fallbackRules: [String]
    let acquisitionMethod: String
    let allowedOperationClass: String
}

struct CoachDataRefreshSource: Codable, Equatable, Identifiable {
    let registryKey: String
    let label: String
    let group: CoachDataRefreshGroup
    let status: DailyDataFreshnessStatus
    let authorityRole: String
    let freshnessWindow: String
    let fallbackRules: [String]
    let acquisitionMethod: String
    let allowedOperationClass: String
    let packetId: String?
    let packetType: String?
    let source: String?
    let observedWindow: String
    let generatedAt: Date
    let sourceQuality: String?
    let authorityLane: String
    let sourceState: String
    let freshnessStatus: String
    let protectedVerificationStatus: CoachShortcutProtectedVerificationStatus
    let writeStatus: CoachShortcutWriteStatus
    let protectedRouteStatus: String
    let localOnly: Bool
    let noSecretValues: Bool
    let noWritePerformed: Bool
    let detail: String
    let nextAction: String

    var id: String { registryKey }

    var line: String {
        var parts = [
            "registry_key: \(registryKey)",
            "label: \(CoachSafeOutput.redact(label))",
            "grouping_bucket: \(group.rawValue)",
            "status: \(status.rawValue)",
            "authority_role: \(authorityRole)",
            "freshness_window: \(CoachSafeOutput.redact(freshnessWindow))",
            "fallback_rules: \(CoachSafeOutput.redact(fallbackRules.joined(separator: " || ")))",
            "acquisition_method: \(CoachSafeOutput.redact(acquisitionMethod))",
            "allowed_operation_class: \(allowedOperationClass)",
            "authority_lane: \(authorityLane)",
            "source_state: \(sourceState)",
            "freshness_status: \(freshnessStatus)",
            "protected_verification_status: \(protectedVerificationStatus.rawValue)",
            "write_status: \(writeStatus.rawValue)",
            "protected_route_status: \(protectedRouteStatus)",
            "local_only: \(localOnly)",
            "no_secret_values: \(noSecretValues)",
            "no_write_performed: \(noWritePerformed)",
            "observed_window: \(CoachSafeOutput.redact(observedWindow))"
        ]
        if let packetId, !packetId.isEmpty {
            parts.append("packet_id: \(packetId)")
        }
        if let packetType, !packetType.isEmpty {
            parts.append("packet_type: \(packetType)")
        }
        if let source, !source.isEmpty {
            parts.append("source: \(CoachSafeOutput.redact(source))")
        }
        if let sourceQuality, !sourceQuality.isEmpty {
            parts.append("source_quality: \(sourceQuality)")
        }
        parts.append("generated_at: \(ManualSourceEvidencePacket.format(generatedAt))")
        parts.append("detail: \(CoachSafeOutput.redact(detail))")
        parts.append("next_action: \(CoachSafeOutput.redact(nextAction))")
        return parts.joined(separator: " | ")
    }
}

struct CoachDataRefreshSnapshot: Codable, Equatable {
    let actionStatus: String
    let summary: String
    let generatedAt: Date
    let writeStatus: CoachShortcutWriteStatus
    let protectedVerificationStatus: CoachShortcutProtectedVerificationStatus
    let protectedRouteStatus: String
    let sourceRegistryVersion: String
    let coachEvidencePacketVersion: String
    let sources: [CoachDataRefreshSource]

    var sourceGroups: [CoachDataRefreshGroup: [CoachDataRefreshSource]] {
        var groups: [CoachDataRefreshGroup: [CoachDataRefreshSource]] = [:]
        for group in CoachDataRefreshGroup.allCases {
            groups[group] = []
        }
        for source in sources {
            groups[source.group, default: []].append(source)
        }
        return groups
    }

    var shortcutText: String {
        var lines = [
            "COACH_DATA_REFRESH_SNAPSHOT_LOCAL",
            "generated_at: \(ManualSourceEvidencePacket.format(generatedAt))",
            "status: \(CoachSafeOutput.redact(actionStatus))",
            "summary: \(CoachSafeOutput.redact(summary))",
            "write_status: \(writeStatus.rawValue)",
            "protected_verification_status: \(protectedVerificationStatus.rawValue)",
            "protected_route_status: \(protectedRouteStatus)",
            "source_registry_version: \(sourceRegistryVersion)",
            "coach_evidence_packet_version: \(coachEvidencePacketVersion)",
            "source_groups:"
        ]

        for group in CoachDataRefreshGroup.allCases {
            let labels = sourceGroups[group, default: []]
                .map(\.label)
                .joined(separator: "; ")
            lines.append("- \(group.rawValue): \(CoachSafeOutput.redact(labels.isEmpty ? "none" : labels))")
        }

        lines.append("sources:")
        lines.append(contentsOf: sources.map { "- \($0.line)" })
        lines.append("No production write was sent.")
        lines.append("No protected route was called by this local refresh.")
        lines.append("No secret value is included.")
        return lines.joined(separator: "\n")
    }

    var shortcutOutput: CoachShortcutOutput {
        let needsToddSources = sourceGroups[.needsTodd, default: []]
        let fallbackSources = sourceGroups[.fallback, default: []]
        let freshSources = sourceGroups[.fresh, default: []]
        let sourceFreshness = [
            "Fresh: \(Self.joinedLabels(freshSources))",
            "Fallback: \(Self.joinedLabels(fallbackSources))",
            "Needs Todd: \(Self.joinedLabels(needsToddSources))"
        ].joined(separator: " | ")

        let firstConstraint = needsToddSources.prefix(6).map { "\($0.label): \($0.detail)" }
        let nextAction = needsToddSources.first?.nextAction
            ?? fallbackSources.first?.nextAction
            ?? "Use this local refresh as a no-write snapshot only; protected/provider checks remain separate."

        return CoachShortcutOutput(
            actionStatus: actionStatus,
            setupStatus: protectedVerificationStatus == .blockedMissingSetup ? .needsSetup : .configuredLocally,
            readinessStatus: needsToddSources.isEmpty ? .ready : .attentionRequired,
            protectedVerificationStatus: protectedVerificationStatus,
            writeStatus: .noWrite,
            safetyStatus: .unknown,
            readinessSummary: summary,
            workoutTitle: nil,
            workoutType: .none,
            primaryConstraints: firstConstraint,
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: nextAction,
            requiresMedicalCaution: needsToddSources.contains(where: { $0.registryKey == "blood_pressure" })
                || fallbackSources.contains(where: { $0.registryKey == "blood_pressure" }),
            sourceFreshness: sourceFreshness,
            lastSync: freshSources.first(where: { $0.registryKey == "apple_health" })?.detail,
            errorIdentifier: protectedVerificationStatus == .blockedMissingSetup ? .notConfigured : nil,
            errorMessage: nil
        )
    }

    static func local(
        setupStatus: CoachSetupStatus,
        store: MorningCoachStore,
        manualSourceNotes: [ManualSourceEvidenceLane: String] = [:],
        now: Date = Date()
    ) -> CoachDataRefreshSnapshot {
        let manualPacket = ManualSourceEvidencePacket.build(from: manualSourceNotes, generatedAt: now)
        let notes = Dictionary(uniqueKeysWithValues: manualSourceNotes.map { key, value in
            (key, value.trimmingCharacters(in: .whitespacesAndNewlines))
        })
        let hasNote: (ManualSourceEvidenceLane) -> Bool = { lane in
            !(notes[lane] ?? "").isEmpty
        }

        let protectedHours = store.lastCoachReadbackAt.map { max(0, Int(now.timeIntervalSince($0) / 3600)) }
        let protectedStatus: CoachShortcutProtectedVerificationStatus
        let protectedSourceStatus: DailyDataFreshnessStatus
        let protectedDetail: String
        let protectedNextAction: String
        let protectedSourceState: String
        if !setupStatus.isReadyForProtectedRequests {
            protectedStatus = .blockedMissingSetup
            protectedSourceStatus = .notConfigured
            protectedDetail = "Protected read-only verification still needs Todd-entered device setup."
            protectedNextAction = "Enter the Coach secret on device during Todd-assisted setup before expecting protected read-only verification."
            protectedSourceState = "permission_required"
        } else if let protectedHours, protectedHours <= 36 {
            protectedStatus = .verifiedReadOnly
            protectedSourceStatus = .fresh
            protectedDetail = "A prior protected read-only Coach readback was verified \(protectedHours) hours ago."
            protectedNextAction = "Use this as read-only evidence only; this local refresh did not call a protected route."
            protectedSourceState = "verified_read_only"
        } else {
            protectedStatus = .deferredUntilToddDevice
            protectedSourceStatus = .protectedVerificationDeferred
            protectedDetail = "Protected read-only freshness was not re-verified by this local refresh."
            protectedNextAction = "Run a separate protected read-only Coach check when Todd is present if fresh provider verification is needed."
            protectedSourceState = "protected_verification_deferred"
        }

        let appleSyncAt = store.lastAppleHealthSyncAt
        let appleHours = appleSyncAt.map { max(0, Int(now.timeIntervalSince($0) / 3600)) }
        let appleStatus: DailyDataFreshnessStatus
        let appleGroup: CoachDataRefreshGroup
        let appleDetail: String
        let appleObservedWindow: String
        if let appleSyncAt, let appleHours {
            appleStatus = appleHours <= 36 ? .fresh : .stale
            appleGroup = appleHours <= 36 ? .fresh : .needsTodd
            appleDetail = "Last Apple Health sync was \(appleHours) hours ago."
            appleObservedWindow = observedWindowText(from: appleSyncAt, now: now)
        } else {
            appleStatus = .missing
            appleGroup = .needsTodd
            appleDetail = "No Apple Health daily sync has completed on this device."
            appleObservedWindow = "not_captured_locally"
        }

        let priorReadOnlyContext: String
        switch protectedStatus {
        case .verifiedReadOnly:
            priorReadOnlyContext = "A prior read-only Coach check exists, but this local refresh did not re-query provider freshness."
        case .blockedMissingSetup:
            priorReadOnlyContext = "Protected read-only verification is blocked until Todd finishes local device setup."
        case .deferredUntilToddDevice, .readyForManualReadOnly, .notRequired:
            priorReadOnlyContext = "This local refresh did not call protected routes or provider apps."
        }

        let bodyHasNote = hasNote(.bodyComposition)
        let ouraHasNote = hasNote(.ouraFallback)
        let anyManualPacket = !manualPacket.includedDrafts.isEmpty

        let protectedSource = source(
            policy: policy(for: "protected_read_only"),
            group: protectedSourceStatus == .fresh ? .fresh : .needsTodd,
            status: protectedSourceStatus,
            packetType: nil,
            source: protectedStatus == .verifiedReadOnly ? "Protected read-only Coach verification" : nil,
            observedWindow: observedWindowText(from: store.lastCoachReadbackAt, now: now),
            sourceQuality: protectedStatus == .verifiedReadOnly ? "verified_read_only" : nil,
            authorityLane: "protected_read_only",
            sourceState: protectedSourceState,
            protectedVerificationStatus: protectedStatus,
            detail: protectedDetail,
            nextAction: protectedNextAction,
            generatedAt: now
        )

        let sources = [
            protectedSource,
            source(
                policy: policy(for: "apple_health"),
                group: appleGroup,
                status: appleStatus,
                packetType: appleStatus == .fresh ? "apple_health_daily_summary" : nil,
                source: appleStatus == .fresh ? "Apple Health / HealthKit daily summary" : nil,
                observedWindow: appleObservedWindow,
                sourceQuality: appleStatus == .fresh ? "device_sync" : nil,
                authorityLane: "apple_health_supporting",
                sourceState: "supporting_only",
                protectedVerificationStatus: .notRequired,
                detail: appleDetail,
                nextAction: appleStatus == .fresh
                    ? "Use as supporting context only; it does not raise primary readiness confidence."
                    : "Refresh Apple Health on device when Todd is present; keep it supporting-only.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "garmin_sleep_recovery"),
                group: .needsTodd,
                status: hasNote(.garminSleepRecovery) ? .noWriteDraftOnly : .manualSourceDeferred,
                packetType: hasNote(.garminSleepRecovery) ? "garmin_manual_freshness" : nil,
                source: hasNote(.garminSleepRecovery) ? "Garmin manual freshness report" : nil,
                observedWindow: hasNote(.garminSleepRecovery) ? "manual_draft_at: \(ManualSourceEvidencePacket.format(now))" : "not_captured_locally",
                sourceQuality: hasNote(.garminSleepRecovery) ? "reported_manual" : nil,
                authorityLane: "garmin_primary_readiness",
                sourceState: "manual_provider_bound",
                protectedVerificationStatus: protectedStatus,
                detail: "Garmin remains the primary readiness authority. \(priorReadOnlyContext)",
                nextAction: "Review Garmin sleep/recovery or provide a manual source evidence packet; use Oura only as fallback.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "garmin_activities"),
                group: .needsTodd,
                status: .manualSourceDeferred,
                packetType: nil,
                source: nil,
                observedWindow: "not_captured_locally",
                sourceQuality: nil,
                authorityLane: "garmin_activity_physiology",
                sourceState: "manual_provider_bound",
                protectedVerificationStatus: protectedStatus,
                detail: "Garmin activity summary can corroborate physiology, but this local refresh did not re-verify it. Garmin still does not override Rack detail.",
                nextAction: "Review Garmin activity summary when available; do not replace Rack/Motra detail with Apple Health or memory.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "garmin_nutrition"),
                group: .needsTodd,
                status: hasNote(.garminNutrition) ? .noWriteDraftOnly : .manualSourceDeferred,
                packetType: hasNote(.garminNutrition) ? "garmin_nutrition_manual" : nil,
                source: hasNote(.garminNutrition) ? "Garmin Nutrition manual report" : nil,
                observedWindow: hasNote(.garminNutrition) ? "manual_draft_at: \(ManualSourceEvidencePacket.format(now))" : "not_captured_locally",
                sourceQuality: hasNote(.garminNutrition) ? "reported_manual" : nil,
                authorityLane: "garmin_nutrition_authority",
                sourceState: "manual_provider_bound",
                protectedVerificationStatus: protectedStatus,
                detail: "Garmin Nutrition remains the nutrition authority when usable. This local refresh did not fetch provider totals.",
                nextAction: "Review Garmin Nutrition or provide manual calories/protein/hydration summary; do not use Apple Health calories as Garmin Nutrition.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "rack_strength_session"),
                group: .needsTodd,
                status: hasNote(.rackMotraSession) ? .noWriteDraftOnly : .manualSourceDeferred,
                packetType: hasNote(.rackMotraSession) ? "rack_strength_manual" : nil,
                source: hasNote(.rackMotraSession) ? "Rack/Motra manual strength report" : nil,
                observedWindow: hasNote(.rackMotraSession) ? "manual_draft_at: \(ManualSourceEvidencePacket.format(now))" : "not_captured_locally",
                sourceQuality: hasNote(.rackMotraSession) ? "reported_manual" : nil,
                authorityLane: "rack_strength_session",
                sourceState: "manual_provider_bound",
                protectedVerificationStatus: protectedStatus,
                detail: "Rack/Motra remains the completed strength-session authority. This local refresh did not inspect provider session history.",
                nextAction: "Review Rack/Motra after training or provide a reported manual session summary; do not count Apple Health workouts as strength history.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "rack_strength_detail"),
                group: .needsTodd,
                status: hasNote(.rackMotraExerciseDetail) ? .noWriteDraftOnly : .manualSourceDeferred,
                packetType: hasNote(.rackMotraExerciseDetail) ? "rack_strength_manual" : nil,
                source: hasNote(.rackMotraExerciseDetail) ? "Rack/Motra manual strength report" : nil,
                observedWindow: hasNote(.rackMotraExerciseDetail) ? "manual_draft_at: \(ManualSourceEvidencePacket.format(now))" : "not_captured_locally",
                sourceQuality: hasNote(.rackMotraExerciseDetail) ? "reported_manual" : nil,
                authorityLane: "rack_strength_detail",
                sourceState: "manual_provider_bound",
                protectedVerificationStatus: protectedStatus,
                detail: "Rack/Motra set, rep, and load detail stays the authority. Garmin strength activity can corroborate effort but does not override Rack detail by default.",
                nextAction: "Review Rack/Motra exercise detail or provide reported sets/reps/load; do not infer loads from memory.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "oura_fallback"),
                group: ouraHasNote ? .fallback : .needsTodd,
                status: ouraHasNote ? .noWriteDraftOnly : .manualSourceDeferred,
                packetType: ouraHasNote ? "manual_source_evidence_packet" : nil,
                source: ouraHasNote ? "Manual Oura fallback note" : nil,
                observedWindow: ouraHasNote ? "manual_draft_at: \(ManualSourceEvidencePacket.format(now))" : "not_captured_locally",
                sourceQuality: ouraHasNote ? "reported_manual" : nil,
                authorityLane: "oura_fallback",
                sourceState: "fallback_only",
                protectedVerificationStatus: .notRequired,
                detail: ouraHasNote
                    ? "Oura can make coaching usable as fallback without marking Garmin fresh. This note stays fallback-only."
                    : "Oura is reserved for fallback only when Garmin is stale, missing, or unreliable.",
                nextAction: ouraHasNote
                    ? "Label Oura as fallback because Garmin is stale, missing, or unreliable."
                    : "Use Oura only as fallback if Todd reports it because Garmin is stale, missing, or unreliable.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "oura_advisor_manual_insight"),
                group: ouraHasNote ? .fallback : .needsTodd,
                status: ouraHasNote ? .noWriteDraftOnly : .manualSourceDeferred,
                packetType: ouraHasNote ? "oura_advisor_manual_insight" : nil,
                source: ouraHasNote ? "Oura Advisor manual insight" : nil,
                observedWindow: ouraHasNote ? "manual_draft_at: \(ManualSourceEvidencePacket.format(now))" : "not_captured_locally",
                sourceQuality: ouraHasNote ? "reported_manual" : nil,
                authorityLane: "oura_manual_insight",
                sourceState: "fallback_only",
                protectedVerificationStatus: .notRequired,
                detail: ouraHasNote
                    ? "Reported Oura insight is available as fallback context only."
                    : "No current Oura Advisor/manual insight was captured by this local refresh.",
                nextAction: ouraHasNote
                    ? "Use reported Oura insight as fallback context only."
                    : "Ask Todd for a current Oura Advisor/manual insight only if Garmin remains stale or unreliable.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "blood_pressure"),
                group: .needsTodd,
                status: .toddActionRequired,
                packetType: hasNote(.bloodPressure) || hasNote(.doctorSafetyNote) ? "bp_manual" : nil,
                source: hasNote(.bloodPressure) || hasNote(.doctorSafetyNote) ? "Blood pressure manual report" : nil,
                observedWindow: hasNote(.bloodPressure) || hasNote(.doctorSafetyNote) ? "manual_draft_at: \(ManualSourceEvidencePacket.format(now))" : "not_captured_locally",
                sourceQuality: hasNote(.bloodPressure) || hasNote(.doctorSafetyNote) ? "reported_manual" : nil,
                authorityLane: "blood_pressure_safety",
                sourceState: "write_held",
                protectedVerificationStatus: .notRequired,
                detail: hasNote(.bloodPressure) || hasNote(.doctorSafetyNote)
                    ? "Local BP/safety notes were drafted, but BP remains safety-sensitive and conservative until Todd reviews a current reading."
                    : "No current BP reading was captured locally; keep the coaching posture conservative.",
                nextAction: "Todd should report a current BP reading or use the draft-only BP intake path; no write is implied.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "body_composition"),
                group: bodyHasNote ? .fallback : .needsTodd,
                status: bodyHasNote ? .noWriteDraftOnly : .manualSourceDeferred,
                packetType: bodyHasNote ? "body_composition_manual" : nil,
                source: bodyHasNote ? "Body composition manual report" : nil,
                observedWindow: bodyHasNote ? "manual_draft_at: \(ManualSourceEvidencePacket.format(now))" : "not_captured_locally",
                sourceQuality: bodyHasNote ? "reported_manual" : nil,
                authorityLane: "body_trend_evidence",
                sourceState: "manual_provider_bound",
                protectedVerificationStatus: .notRequired,
                detail: bodyHasNote
                    ? "A local body-trend note was drafted. It can inform context, but it remains trend-only evidence."
                    : "Body composition remains optional trend evidence and was not updated by this local refresh.",
                nextAction: bodyHasNote
                    ? "Use only as trend context; do not overreact to one reading."
                    : "Update weight/body trend manually when useful; keep it optional and trend-only.",
                generatedAt: now
            ),
            source(
                policy: policy(for: "manual_evidence_packet"),
                group: anyManualPacket ? .fallback : .needsTodd,
                status: anyManualPacket ? .noWriteDraftOnly : .manualSourceDeferred,
                packetType: anyManualPacket ? "manual_source_evidence_packet" : nil,
                source: anyManualPacket ? "Manual source evidence packet" : nil,
                observedWindow: anyManualPacket ? "manual_draft_at: \(ManualSourceEvidencePacket.format(now))" : "not_captured_locally",
                sourceQuality: anyManualPacket ? "reported_manual" : nil,
                authorityLane: "manual_bridge",
                sourceState: "draft_only",
                protectedVerificationStatus: .notRequired,
                detail: anyManualPacket
                    ? "A local manual evidence packet is available to bridge stale/provider-bound lanes without marking them fresh."
                    : "No local manual evidence packet has been drafted in this app session.",
                nextAction: "Use the manual evidence packet to bridge stale or provider-bound lanes without implying provider freshness or a production write.",
                generatedAt: now
            )
        ]

        let freshCount = sources.filter { $0.group == .fresh }.count
        let fallbackCount = sources.filter { $0.group == .fallback }.count
        let needsToddCount = sources.filter { $0.group == .needsTodd }.count
        let actionStatus = needsToddCount > 0 ? "local_refresh_needs_todd" : "local_refresh_ready"
        let summary = "Local no-write refresh grouped \(freshCount) fresh, \(fallbackCount) fallback, and \(needsToddCount) needs-Todd lanes."

        return CoachDataRefreshSnapshot(
            actionStatus: actionStatus,
            summary: summary,
            generatedAt: now,
            writeStatus: .noWrite,
            protectedVerificationStatus: protectedStatus,
            protectedRouteStatus: "not_called",
            sourceRegistryVersion: "source-registry-v1",
            coachEvidencePacketVersion: "coach-evidence-packet-v1",
            sources: sources
        )
    }

    private static func joinedLabels(_ sources: [CoachDataRefreshSource]) -> String {
        let value = sources.map(\.label).joined(separator: ", ")
        return value.isEmpty ? "none" : value
    }

    private static func observedWindowText(from date: Date?, now: Date) -> String {
        guard let date else {
            return "not_captured_locally"
        }
        return "\(ManualSourceEvidencePacket.format(date)) -> \(ManualSourceEvidencePacket.format(now))"
    }

    private static func source(
        policy: CoachDataRefreshPolicy,
        group: CoachDataRefreshGroup,
        status: DailyDataFreshnessStatus,
        packetType: String?,
        source: String?,
        observedWindow: String,
        sourceQuality: String?,
        authorityLane: String,
        sourceState: String,
        protectedVerificationStatus: CoachShortcutProtectedVerificationStatus,
        detail: String,
        nextAction: String,
        generatedAt: Date
    ) -> CoachDataRefreshSource {
        CoachDataRefreshSource(
            registryKey: policy.registryKey,
            label: policy.label,
            group: group,
            status: status,
            authorityRole: policy.authorityRole,
            freshnessWindow: policy.freshnessWindow,
            fallbackRules: policy.fallbackRules,
            acquisitionMethod: policy.acquisitionMethod,
            allowedOperationClass: policy.allowedOperationClass,
            packetId: packetType.map { compactPacketID(for: policy.registryKey, packetType: $0, generatedAt: generatedAt) },
            packetType: packetType,
            source: source,
            observedWindow: observedWindow,
            generatedAt: generatedAt,
            sourceQuality: sourceQuality,
            authorityLane: authorityLane,
            sourceState: sourceState,
            freshnessStatus: status.rawValue,
            protectedVerificationStatus: protectedVerificationStatus,
            writeStatus: .noWrite,
            protectedRouteStatus: "not_called",
            localOnly: true,
            noSecretValues: true,
            noWritePerformed: true,
            detail: detail,
            nextAction: nextAction
        )
    }

    private static func compactPacketID(for registryKey: String, packetType: String, generatedAt: Date) -> String {
        let stamp = Int(generatedAt.timeIntervalSince1970)
        return "\(registryKey)-\(packetType)"
            .lowercased()
            .replacingOccurrences(of: "_", with: "-")
            .replacingOccurrences(of: "[^a-z0-9-]", with: "-", options: .regularExpression)
            .replacingOccurrences(of: "-+", with: "-", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
            + "-\(stamp)"
    }

    private static func policy(for registryKey: String) -> CoachDataRefreshPolicy {
        policies[registryKey] ?? CoachDataRefreshPolicy(
            registryKey: registryKey,
            label: registryKey,
            authorityRole: "supporting_evidence",
            freshnessWindow: "Local refresh policy was not mapped for this lane.",
            fallbackRules: ["Use local no-write evidence only."],
            acquisitionMethod: "Local app refresh only.",
            allowedOperationClass: "read_only_no_write"
        )
    }

    private static let policies: [String: CoachDataRefreshPolicy] = [
        "protected_read_only": CoachDataRefreshPolicy(
            registryKey: "protected_read_only",
            label: "Protected read-only Coach verification",
            authorityRole: "verified_read_only",
            freshnessWindow: "Fresh when a protected read-only source check succeeds without performing a write.",
            fallbackRules: [
                "Protected read-only verification proves read access only.",
                "It does not prove write readiness or authorize production writes."
            ],
            acquisitionMethod: "Protected read-only coach route with Todd-entered secret on an approved device.",
            allowedOperationClass: "read_only_no_write"
        ),
        "garmin_sleep_recovery": CoachDataRefreshPolicy(
            registryKey: "garmin_sleep_recovery",
            label: "Garmin sleep/recovery",
            authorityRole: "primary_readiness",
            freshnessWindow: "Fresh when same-day or previous-night Garmin sleep/recovery is available and wear is reliable.",
            fallbackRules: [
                "If Garmin is stale, missing, or unreliable, Oura may inform sleep/recovery as fallback only.",
                "Apple Health remains supporting evidence only and does not make Garmin fresh."
            ],
            acquisitionMethod: "Garmin Connect / Fenix 8 read-only review, or a no-write manual evidence packet when Garmin is unavailable.",
            allowedOperationClass: "read_only_or_manual_no_write"
        ),
        "garmin_activities": CoachDataRefreshPolicy(
            registryKey: "garmin_activities",
            label: "Garmin activities",
            authorityRole: "workout_physiology_primary",
            freshnessWindow: "Fresh when same-day Garmin activity summary and workout physiology are available after training.",
            fallbackRules: [
                "Garmin activities corroborate workout completion, physiology, and recovery cost.",
                "Garmin strength activity does not override Rack/Motra set, rep, load, or exercise-detail authority by default."
            ],
            acquisitionMethod: "Garmin Connect / Fenix 8 read-only activity review.",
            allowedOperationClass: "read_only_no_write"
        ),
        "garmin_nutrition": CoachDataRefreshPolicy(
            registryKey: "garmin_nutrition",
            label: "Garmin Nutrition",
            authorityRole: "nutrition_authority",
            freshnessWindow: "Fresh when today's Garmin Nutrition totals are available and usable for the active day.",
            fallbackRules: [
                "If Garmin Nutrition is stale or missing, use a manual calories, protein, carbs, fat, and hydration summary.",
                "Apple Health calories do not substitute for Garmin Nutrition authority."
            ],
            acquisitionMethod: "Garmin Connect+ Nutrition read-only totals, or a no-write manual nutrition closeout summary.",
            allowedOperationClass: "read_only_or_manual_no_write"
        ),
        "rack_strength_session": CoachDataRefreshPolicy(
            registryKey: "rack_strength_session",
            label: "Rack/Motra strength session",
            authorityRole: "strength_log_authority",
            freshnessWindow: "Fresh when today's completed Rack/Motra strength session exists on a planned strength day.",
            fallbackRules: [
                "If a planned strength session is missing, ask for a reported manual session summary.",
                "Do not count Apple Health workouts as completed strength history."
            ],
            acquisitionMethod: "Rack/Motra completed-session review, or a reported manual session summary.",
            allowedOperationClass: "read_only_or_manual_no_write"
        ),
        "rack_strength_detail": CoachDataRefreshPolicy(
            registryKey: "rack_strength_detail",
            label: "Rack/Motra strength exercise detail",
            authorityRole: "set_rep_load_authority",
            freshnessWindow: "Fresh when today's Rack/Motra session includes exercise, set, rep, and load detail on a planned strength day.",
            fallbackRules: [
                "If Rack/Motra detail is stale or missing, use reported manual sets, reps, and load as a bridge only.",
                "Garmin strength activity can corroborate effort and physiology but does not override Rack/Motra detail by default."
            ],
            acquisitionMethod: "Rack/Motra exercise-detail review, or reported manual set, rep, and load notes.",
            allowedOperationClass: "read_only_or_manual_no_write"
        ),
        "oura_fallback": CoachDataRefreshPolicy(
            registryKey: "oura_fallback",
            label: "Oura fallback sleep/recovery",
            authorityRole: "fallback_recovery",
            freshnessWindow: "Fresh when same-day or previous-night Oura sleep/recovery is available and Garmin primary readiness is stale, missing, or unreliable.",
            fallbackRules: [
                "Oura can make coaching usable as fallback without making Garmin fresh.",
                "Fresh reliable Garmin always stays the primary readiness authority."
            ],
            acquisitionMethod: "Oura read-only review when Garmin primary readiness is stale, missing, or unreliable.",
            allowedOperationClass: "read_only_no_write"
        ),
        "oura_advisor_manual_insight": CoachDataRefreshPolicy(
            registryKey: "oura_advisor_manual_insight",
            label: "Oura Advisor/manual insight",
            authorityRole: "manual_fallback_insight",
            freshnessWindow: "Fresh only when Todd provides current Oura Advisor or manual insight as reported evidence.",
            fallbackRules: [
                "Reported Oura insight may inform context but does not override fresh Garmin or medical/safety flags.",
                "Treat Advisor text as reported evidence, not direct provider authority."
            ],
            acquisitionMethod: "Todd-reported Oura Advisor text or manual insight captured without provider automation.",
            allowedOperationClass: "read_only_or_manual_no_write"
        ),
        "apple_health": CoachDataRefreshPolicy(
            registryKey: "apple_health",
            label: "Apple Health daily summary",
            authorityRole: "supporting_evidence",
            freshnessWindow: "Fresh when today's Apple Health daily summary is available.",
            fallbackRules: [
                "Apple Health can be fresh while Garmin/Rack authority freshness remains stale.",
                "Apple Health remains supporting evidence only and does not raise primary readiness or strength-log authority."
            ],
            acquisitionMethod: "Apple Health / HealthKit daily summary read-only sync.",
            allowedOperationClass: "read_only_no_write"
        ),
        "blood_pressure": CoachDataRefreshPolicy(
            registryKey: "blood_pressure",
            label: "Blood pressure",
            authorityRole: "safety_override",
            freshnessWindow: "Fresh when today's BP reading is available for the current coaching day.",
            fallbackRules: [
                "If BP is stale or missing, keep the coaching posture conservative.",
                "Manual BP intake remains no-write until a separate write-readiness task is approved."
            ],
            acquisitionMethod: "Todd-reported BP reading or a draft-only intake path; no provider automation.",
            allowedOperationClass: "draft_only_no_write"
        ),
        "body_composition": CoachDataRefreshPolicy(
            registryKey: "body_composition",
            label: "Body composition",
            authorityRole: "trend_evidence",
            freshnessWindow: "Fresh when the most recent body-composition trend point is within the last 14 days.",
            fallbackRules: [
                "Body composition is optional trend evidence and should not drive urgent coaching changes.",
                "Manual updates are acceptable when useful, but trend-only rules remain conservative."
            ],
            acquisitionMethod: "Read-only trend review or manual trend update.",
            allowedOperationClass: "read_only_or_manual_no_write"
        ),
        "manual_evidence_packet": CoachDataRefreshPolicy(
            registryKey: "manual_evidence_packet",
            label: "Manual evidence packet",
            authorityRole: "manual_bridge",
            freshnessWindow: "Current only when Todd composes or reports same-day manual evidence for stale or provider-bound lanes.",
            fallbackRules: [
                "Manual evidence can bridge stale Garmin, BP, nutrition, body, or Rack gaps without marking those primary sources fresh.",
                "Manual evidence stays no-write and does not become provider authority by default."
            ],
            acquisitionMethod: "Local no-write draft packet or Todd-reported manual evidence relay.",
            allowedOperationClass: "draft_only_no_write"
        )
    ]
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
