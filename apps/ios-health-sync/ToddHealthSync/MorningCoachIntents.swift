import AppIntents
import Foundation

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
        let result = try await MorningCoachWorkflow().syncAppleHealth(days: days, trigger: "shortcut")
        return .result(value: result.shortcutValue)
    }
}

struct MorningCoachIntent: AppIntent {
    static var title: LocalizedStringResource = "Morning Coach"
    static var description = IntentDescription("Sync Apple Health, check coach source freshness, and return today's coaching call.")

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let result = try await MorningCoachWorkflow().runMorningCoach()
        return .result(value: result.shortcutValue)
    }
}

struct CheckCoachSyncStatusIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Coach Sync Status"
    static var description = IntentDescription("Check whether Todd's coach sources are fresh enough for today's call.")

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let result = try await MorningCoachWorkflow().checkCoachSyncStatus()
        return .result(value: result.shortcutValue)
    }
}

struct OpenCoachTodayIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Coach Today"
    static var description = IntentDescription("Open Todd Health Sync after refreshing today's coach readback.")
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        let result = try await MorningCoachWorkflow().openCoachToday()
        return .result(value: result.shortcutValue)
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
