import Foundation
import UIKit

struct MorningCoachActionResult {
    let title: String
    let detail: String
    let shortcutOutput: CoachShortcutOutput?

    var shortcutValue: String {
        if let shortcutOutput {
            return "\(title)\n\(shortcutOutput.shortcutText)"
        }
        return "\(title)\n\(detail)"
    }

    init(title: String, detail: String, shortcutOutput: CoachShortcutOutput? = nil) {
        self.title = CoachSafeOutput.redact(title)
        self.detail = CoachSafeOutput.redact(detail)
        self.shortcutOutput = shortcutOutput
    }
}

struct MorningCoachWorkflow {
    private let healthKitManager: HealthKitManager
    private let apiClient: CoachAPIClienting
    private let keychainStore: any CoachSecretStoring
    private let store: MorningCoachStore

    init(
        healthKitManager: HealthKitManager = HealthKitManager(),
        apiClient: CoachAPIClienting = CoachAPIClient(),
        keychainStore: any CoachSecretStoring = KeychainStore(),
        store: MorningCoachStore = MorningCoachStore()
    ) {
        self.healthKitManager = healthKitManager
        self.apiClient = apiClient
        self.keychainStore = keychainStore
        self.store = store
    }

    func checkSetup() throws -> MorningCoachActionResult {
        let status = try currentSetupStatus()
        return MorningCoachActionResult(
            title: status.title,
            detail: status.shortcutOutput.shortcutText,
            shortcutOutput: status.shortcutOutput
        )
    }

    func syncAppleHealth(days: Int = 7, trigger: String = "shortcut") async throws -> MorningCoachActionResult {
        let apiSecret = try savedSecret()
        try await healthKitManager.requestAuthorization()

        let dayCount = max(1, min(days, 31))
        let summaries = try await healthKitManager.dailySummaries(days: dayCount)
        let deviceName = await MainActor.run { UIDevice.current.name }
        let payload = AppleHealthDailyPayload(
            clientVersion: appVersion,
            deviceName: deviceName,
            timezone: TimeZone.current.identifier,
            daysRequested: dayCount,
            summaries: summaries,
            raw: [
                "sync_trigger": trigger,
                "summary_grain": "daily"
            ]
        )

        let response = try await apiClient.postAppleHealthDaily(
            payload: payload,
            apiBase: store.apiBase,
            apiSecret: apiSecret
        )
        let written = response.daysWritten ?? summaries.count
        let summary = "Wrote \(written) of \(summaries.count) Apple Health daily summaries."
        store.recordAppleHealthSync(summary: summary)
        return MorningCoachActionResult(title: "Apple Health sync complete", detail: summary)
    }

    func checkCoachSyncStatus() async throws -> MorningCoachActionResult {
        let status = try await apiClient.getSyncStatus(
            apiBase: store.apiBase,
            apiSecret: savedSecret()
        )
        store.recordCoachReadback(summary: status.conciseResult)
        return MorningCoachActionResult(
            title: "Coach sync status",
            detail: status.conciseResult,
            shortcutOutput: status.shortcutOutput
        )
    }

    func openCoachToday() async throws -> MorningCoachActionResult {
        let today = try await apiClient.getCoachToday(
            apiBase: store.apiBase,
            apiSecret: savedSecret()
        )
        let result = today.conciseResult(syncStatus: nil)
        store.recordCoachReadback(summary: result)
        store.recordMorningCoach(result: result)
        return MorningCoachActionResult(
            title: "Coach today",
            detail: result,
            shortcutOutput: today.shortcutOutput
        )
    }

    func weeklyReview(weekStart: String? = nil, weekEnd: String? = nil) async throws -> MorningCoachActionResult {
        let review = try await apiClient.getWeeklyReview(
            apiBase: store.apiBase,
            apiSecret: savedSecret(),
            weekStart: weekStart,
            weekEnd: weekEnd,
            timezone: TimeZone.current.identifier
        )
        store.recordCoachReadback(summary: review.conciseResult)
        return MorningCoachActionResult(
            title: "Weekly coach review",
            detail: review.conciseResult,
            shortcutOutput: review.shortcutOutput
        )
    }

    func canITrain() async throws -> MorningCoachActionResult {
        let today = try await apiClient.getCoachToday(
            apiBase: store.apiBase,
            apiSecret: savedSecret()
        )
        let output = today.shortcutOutput
        let trainingClass: String
        switch output.safetyStatus {
        case .red:
            trainingClass = "medical_caution"
        case .yellow:
            trainingClass = "controlled_moderated"
        case .green:
            trainingClass = "hard_training_allowed"
        case .unknown:
            trainingClass = output.requiresMedicalCaution ? "medical_caution" : "controlled_moderated"
        }
        let detail = [
            "training_class: \(trainingClass)",
            output.shortcutText
        ].joined(separator: "\n")
        store.recordCoachReadback(summary: detail)
        return MorningCoachActionResult(
            title: "Can I train?",
            detail: detail
        )
    }

    func buildTodaysWorkout(
        requestText: String,
        requestedSessionType: String?,
        scheduleOverride: Bool
    ) async throws -> MorningCoachActionResult {
        try await runDirectCoachAction(
            endpoint: .workout,
            request: DirectCoachActionRequest(
                text: requestText.isEmpty ? "Build today's workout for Siri or Shortcuts." : requestText,
                summary: nil,
                intent: CoachDirectActionEndpoint.workout.defaultIntent,
                requestedSessionType: requestedSessionType,
                scheduleOverride: scheduleOverride,
                targetDate: nil,
                targetDay: nil,
                timezone: TimeZone.current.identifier,
                channel: "ios-app-intent",
                raw: ["source": "ToddHealthSync AppIntent"]
            ),
            title: "Coach workout"
        )
    }

    func nutritionCloseout(note: String) async throws -> MorningCoachActionResult {
        try await runDirectCoachAction(
            endpoint: .nutritionCloseout,
            request: DirectCoachActionRequest(
                text: note.isEmpty ? "Run a nutrition closeout for today." : note,
                summary: note.isEmpty ? nil : note,
                intent: CoachDirectActionEndpoint.nutritionCloseout.defaultIntent,
                requestedSessionType: nil,
                scheduleOverride: nil,
                targetDate: nil,
                targetDay: nil,
                timezone: TimeZone.current.identifier,
                channel: "ios-app-intent",
                raw: ["source": "ToddHealthSync AppIntent"]
            ),
            title: "Nutrition closeout"
        )
    }

    func postWorkoutCoach(note: String) async throws -> MorningCoachActionResult {
        try await runDirectCoachAction(
            endpoint: .postWorkout,
            request: DirectCoachActionRequest(
                text: note.isEmpty ? "Prepare a post-workout coach debrief prompt." : note,
                summary: note.isEmpty ? nil : note,
                intent: CoachDirectActionEndpoint.postWorkout.defaultIntent,
                requestedSessionType: nil,
                scheduleOverride: nil,
                targetDate: nil,
                targetDay: nil,
                timezone: TimeZone.current.identifier,
                channel: "ios-app-intent",
                raw: ["source": "ToddHealthSync AppIntent"]
            ),
            title: "Post-workout coach"
        )
    }

    func draftWorkoutDebrief(note: String) -> MorningCoachActionResult {
        let output = CoachShortcutOutput.deferred(
            readinessSummary: note.isEmpty ? "Workout debrief capture is ready to draft but not submit." : note,
            nextBestAction: "Open the app or GPT Coach to review and submit the structured debrief.",
            errorMessage: "Structured workout debrief submission is deferred until Todd confirms the device workflow."
        )
        return MorningCoachActionResult(
            title: "Workout debrief draft",
            detail: output.shortcutText,
            shortcutOutput: output
        )
    }

    func draftCoachNote(note: String) -> MorningCoachActionResult {
        let output = CoachShortcutOutput.deferred(
            readinessSummary: note.isEmpty ? "Coach note capture needs text before review." : note,
            nextBestAction: "Review this note before saving it as Coach Memory or intake.",
            errorMessage: "Fast Coach note saving is deferred so memory and intake writes stay explicit and reviewable."
        )
        return MorningCoachActionResult(
            title: "Coach note draft",
            detail: output.shortcutText,
            shortcutOutput: output
        )
    }

    func draftBloodPressureIntake(systolic: Int?, diastolic: Int?, note: String) -> MorningCoachActionResult {
        let bpText: String
        if let systolic, let diastolic {
            bpText = "Draft blood pressure: \(systolic)/\(diastolic). \(note)"
        } else {
            bpText = note.isEmpty ? "Blood pressure intake needs systolic and diastolic values." : note
        }
        let output = CoachShortcutOutput.deferred(
            readinessSummary: bpText.trimmingCharacters(in: .whitespacesAndNewlines),
            nextBestAction: "Review and submit BP from an approved intake path; do not treat this draft as saved.",
            errorMessage: "Blood pressure write is deferred until Todd confirms the device/account setup."
        )
        return MorningCoachActionResult(
            title: "Blood pressure intake draft",
            detail: output.shortcutText,
            shortcutOutput: output
        )
    }

    func runMorningCoach() async throws -> MorningCoachActionResult {
        do {
            let syncResult = try await syncAppleHealth(days: 7, trigger: "morning_coach")
            let syncStatus = try await apiClient.getSyncStatus(
                apiBase: store.apiBase,
                apiSecret: savedSecret()
            )
            store.recordCoachReadback(summary: syncStatus.conciseResult)

            let today = try await apiClient.getCoachToday(
                apiBase: store.apiBase,
                apiSecret: savedSecret()
            )
            let result = [
                today.shortcutOutput.shortcutText,
                "",
                syncResult.detail
            ].joined(separator: "\n")
            store.recordMorningCoach(result: result)
            return MorningCoachActionResult(
                title: "Morning Coach complete",
                detail: result,
                shortcutOutput: today.shortcutOutput
            )
        } catch {
            store.recordMorningCoachError(CoachSafeOutput.errorMessage(error))
            throw error
        }
    }

    private func runDirectCoachAction(
        endpoint: CoachDirectActionEndpoint,
        request: DirectCoachActionRequest,
        title: String
    ) async throws -> MorningCoachActionResult {
        let response = try await apiClient.postDirectCoachAction(
            endpoint: endpoint,
            request: request,
            apiBase: store.apiBase,
            apiSecret: savedSecret()
        )
        store.recordCoachReadback(summary: response.conciseResult)
        return MorningCoachActionResult(
            title: title,
            detail: response.conciseResult,
            shortcutOutput: response.shortcutOutput
        )
    }

    private func savedSecret() throws -> String {
        let secret = try keychainStore.loadSecret().trimmingCharacters(in: .whitespacesAndNewlines)
        let status = CoachConnectionConfiguration(apiBase: store.apiBase, secret: secret).status
        guard status.isReadyForProtectedRequests else {
            throw CoachConfigurationError(status: status)
        }
        return secret
    }

    private func currentSetupStatus() throws -> CoachSetupStatus {
        let secret = try keychainStore.loadSecret()
        return CoachConnectionConfiguration(apiBase: store.apiBase, secret: secret).status
    }

    private var appVersion: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(version) (\(build))"
    }
}
