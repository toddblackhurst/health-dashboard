import AppIntents
import Foundation

enum CoachWorkoutRequestKind: String, AppEnum {
    case workout
    case strength
    case goalSupport = "goal_support"
    case recovery

    static var typeDisplayName: LocalizedStringResource { "Workout request" }
    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Workout request"

    static var caseDisplayRepresentations: [Self: DisplayRepresentation] {
        [
            .workout: "Workout",
            .strength: "Strength",
            .goalSupport: "Walk, Zone 2, or mobility",
            .recovery: "Recovery"
        ]
    }
}

private func coachIntentShortcutValue(
    _ action: () async throws -> MorningCoachActionResult
) async -> String {
    do {
        let result = try await action()
        return result.shortcutValue
    } catch {
        return CoachShortcutOutput.failure(error: error).shortcutText
    }
}

struct SyncAppleHealthIntent: AppIntent {
    static var title: LocalizedStringResource = "Sync Apple Health"
    static var description = IntentDescription("Sync Apple Health daily summaries to Todd's private coach.")

    @Parameter(title: "Days")
    var days: Int

    init() {
        self.days = 7
    }

    init(days: Int) {
        self.days = days
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let value = await coachIntentShortcutValue {
            try await MorningCoachWorkflow().syncAppleHealth(days: days, trigger: "shortcut")
        }
        return .result(value: value)
    }
}

struct MorningCoachIntent: AppIntent {
    static var title: LocalizedStringResource = "Morning Coach"
    static var description = IntentDescription("Sync Apple Health, check coach source freshness, and return today's coaching call.")

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let value = await coachIntentShortcutValue {
            try await MorningCoachWorkflow().runMorningCoach()
        }
        return .result(value: value)
    }
}

struct CanITrainIntent: AppIntent {
    static var title: LocalizedStringResource = "Can I Train?"
    static var description = IntentDescription("Check today's safety and readiness class without changing coach data.")

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let value = await coachIntentShortcutValue {
            try await MorningCoachWorkflow().canITrain()
        }
        return .result(value: value)
    }
}

struct CheckCoachSyncStatusIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Coach Sync Status"
    static var description = IntentDescription("Check whether Todd's coach sources are fresh enough for today's call.")

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let value = await coachIntentShortcutValue {
            try await MorningCoachWorkflow().checkCoachSyncStatus()
        }
        return .result(value: value)
    }
}

struct CheckDailyDataFreshnessIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Daily Data Freshness"
    static var description = IntentDescription("Check local data freshness, protected-route boundaries, and next best Todd/device action without writing coach data.")

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        do {
            let result = try MorningCoachWorkflow().checkDailyDataFreshness()
            return .result(value: result.shortcutValue)
        } catch {
            return .result(value: CoachShortcutOutput.failure(error: error).shortcutText)
        }
    }
}

struct CoachReadinessCheckIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Coach Readiness"
    static var description = IntentDescription("Return local Coach setup readiness and Todd/device-bound setup gates without writing coach data.")

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        do {
            let result = try MorningCoachWorkflow().checkReadiness()
            return .result(value: result.shortcutValue)
        } catch {
            return .result(value: CoachShortcutOutput.failure(error: error).shortcutText)
        }
    }
}

struct WeeklyCoachReviewIntent: AppIntent {
    static var title: LocalizedStringResource = "Weekly Coach Review"
    static var description = IntentDescription("Build a read-only weekly review. It does not apply plan or memory changes.")

    @Parameter(title: "Week Start")
    var weekStart: String?

    @Parameter(title: "Week End")
    var weekEnd: String?

    init() {
        self.weekStart = nil
        self.weekEnd = nil
    }

    init(weekStart: String? = nil, weekEnd: String? = nil) {
        self.weekStart = weekStart
        self.weekEnd = weekEnd
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let value = await coachIntentShortcutValue {
            try await MorningCoachWorkflow().weeklyReview(
                weekStart: weekStart,
                weekEnd: weekEnd
            )
        }
        return .result(value: value)
    }
}

struct BuildTodayWorkoutIntent: AppIntent {
    static var title: LocalizedStringResource = "Build Today's Workout"
    static var description = IntentDescription("Ask Coach for today's workout while preserving safety gates and source hierarchy.")

    @Parameter(title: "Request")
    var request: String

    @Parameter(title: "Workout Type")
    var workoutType: CoachWorkoutRequestKind

    @Parameter(title: "Schedule Override")
    var scheduleOverride: Bool

    init() {
        self.request = "Build today's workout."
        self.workoutType = .workout
        self.scheduleOverride = false
    }

    init(request: String, workoutType: CoachWorkoutRequestKind = .workout, scheduleOverride: Bool = false) {
        self.request = request
        self.workoutType = workoutType
        self.scheduleOverride = scheduleOverride
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let value = await coachIntentShortcutValue {
            try await MorningCoachWorkflow().buildTodaysWorkout(
                requestText: request,
                requestedSessionType: workoutType.rawValue,
                scheduleOverride: scheduleOverride
            )
        }
        return .result(value: value)
    }
}

struct NutritionCloseoutIntent: AppIntent {
    static var title: LocalizedStringResource = "Nutrition Closeout"
    static var description = IntentDescription("Ask Coach to evaluate today's nutrition using the configured nutrition hierarchy.")

    @Parameter(title: "Note")
    var note: String

    init() {
        self.note = "Run today's nutrition closeout."
    }

    init(note: String) {
        self.note = note
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let value = await coachIntentShortcutValue {
            try await MorningCoachWorkflow().nutritionCloseout(note: note)
        }
        return .result(value: value)
    }
}

struct PostWorkoutCoachIntent: AppIntent {
    static var title: LocalizedStringResource = "Post-Workout Coach"
    static var description = IntentDescription("Ask Coach for a post-workout debrief prompt or next-session adjustment.")

    @Parameter(title: "Note")
    var note: String

    init() {
        self.note = "Prepare my post-workout debrief."
    }

    init(note: String) {
        self.note = note
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let value = await coachIntentShortcutValue {
            try await MorningCoachWorkflow().postWorkoutCoach(note: note)
        }
        return .result(value: value)
    }
}

struct DraftWorkoutDebriefIntent: AppIntent {
    static var title: LocalizedStringResource = "Draft Workout Debrief"
    static var description = IntentDescription("Draft a workout debrief for review. This does not submit or save it.")

    @Parameter(title: "Debrief Note")
    var note: String

    init() {
        self.note = ""
    }

    init(note: String) {
        self.note = note
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let result = MorningCoachWorkflow().draftWorkoutDebrief(note: note)
        return .result(value: result.shortcutValue)
    }
}

struct DraftCoachNoteIntent: AppIntent {
    static var title: LocalizedStringResource = "Draft Coach Note"
    static var description = IntentDescription("Capture a coach note for review. This does not save memory or intake data.")

    @Parameter(title: "Note")
    var note: String

    init() {
        self.note = ""
    }

    init(note: String) {
        self.note = note
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let result = MorningCoachWorkflow().draftCoachNote(note: note)
        return .result(value: result.shortcutValue)
    }
}

struct DraftBloodPressureIntakeIntent: AppIntent {
    static var title: LocalizedStringResource = "Draft Blood Pressure Intake"
    static var description = IntentDescription("Draft a blood pressure reading for review. This does not submit or save it.")

    @Parameter(title: "Systolic")
    var systolic: Int?

    @Parameter(title: "Diastolic")
    var diastolic: Int?

    @Parameter(title: "Note")
    var note: String

    init() {
        self.systolic = nil
        self.diastolic = nil
        self.note = ""
    }

    init(systolic: Int? = nil, diastolic: Int? = nil, note: String = "") {
        self.systolic = systolic
        self.diastolic = diastolic
        self.note = note
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let result = MorningCoachWorkflow().draftBloodPressureIntake(
            systolic: systolic,
            diastolic: diastolic,
            note: note
        )
        return .result(value: result.shortcutValue)
    }
}

struct OpenCoachTodayIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Coach Today"
    static var description = IntentDescription("Open Todd Health Sync after refreshing today's coach readback.")
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let value = await coachIntentShortcutValue {
            try await MorningCoachWorkflow().openCoachToday()
        }
        return .result(value: value)
    }
}

struct ToddHealthSyncShortcutsProvider: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: MorningCoachIntent(),
            phrases: [
                "Morning Coach in \(.applicationName)",
                "Run Morning Coach in \(.applicationName)"
            ],
            shortTitle: "Morning Coach",
            systemImageName: "sun.max"
        )
        AppShortcut(
            intent: SyncAppleHealthIntent(),
            phrases: [
                "Sync Apple Health in \(.applicationName)",
                "Update Apple Health in \(.applicationName)"
            ],
            shortTitle: "Sync Health",
            systemImageName: "heart.text.square"
        )
        AppShortcut(
            intent: CheckCoachSyncStatusIntent(),
            phrases: [
                "Check Coach Sync Status in \(.applicationName)",
                "Check Coach Sources in \(.applicationName)"
            ],
            shortTitle: "Sync Status",
            systemImageName: "checklist"
        )
        AppShortcut(
            intent: CanITrainIntent(),
            phrases: [
                "Can I Train in \(.applicationName)",
                "Check Training Readiness in \(.applicationName)"
            ],
            shortTitle: "Can I Train",
            systemImageName: "figure.run"
        )
        AppShortcut(
            intent: WeeklyCoachReviewIntent(),
            phrases: [
                "Weekly Coach Review in \(.applicationName)",
                "Review My Coach Week in \(.applicationName)"
            ],
            shortTitle: "Weekly Review",
            systemImageName: "calendar.badge.clock"
        )
        AppShortcut(
            intent: BuildTodayWorkoutIntent(),
            phrases: [
                "Build Today's Workout in \(.applicationName)",
                "Ask Coach For My Workout in \(.applicationName)"
            ],
            shortTitle: "Build Workout",
            systemImageName: "dumbbell"
        )
        AppShortcut(
            intent: NutritionCloseoutIntent(),
            phrases: [
                "Nutrition Closeout in \(.applicationName)",
                "Check Today's Nutrition in \(.applicationName)"
            ],
            shortTitle: "Nutrition",
            systemImageName: "fork.knife"
        )
        AppShortcut(
            intent: PostWorkoutCoachIntent(),
            phrases: [
                "Post-Workout Coach in \(.applicationName)",
                "Review My Workout With \(.applicationName)"
            ],
            shortTitle: "Post Workout",
            systemImageName: "figure.cooldown"
        )
        AppShortcut(
            intent: DraftWorkoutDebriefIntent(),
            phrases: [
                "Draft Workout Debrief in \(.applicationName)",
                "Capture Workout Debrief in \(.applicationName)"
            ],
            shortTitle: "Debrief Draft",
            systemImageName: "square.and.pencil"
        )
        AppShortcut(
            intent: OpenCoachTodayIntent(),
            phrases: [
                "Open Coach Today in \(.applicationName)",
                "Show Coach Today in \(.applicationName)"
            ],
            shortTitle: "Coach Today",
            systemImageName: "figure.strengthtraining.traditional"
        )
    }
}
