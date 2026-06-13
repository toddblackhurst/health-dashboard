import Foundation

struct MorningCoachStore {
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var apiBase: String {
        get {
            defaults.string(forKey: UserDefaultsKeys.apiBase)
                ?? "https://todd-personal-coach.netlify.app"
        }
        nonmutating set {
            defaults.set(newValue, forKey: UserDefaultsKeys.apiBase)
        }
    }

    var lastAppleHealthSyncText: String {
        defaults.string(forKey: UserDefaultsKeys.lastAppleHealthSyncText) ?? "No sync yet."
    }

    var lastAppleHealthSyncAt: Date? {
        date(forKey: UserDefaultsKeys.lastAppleHealthSyncAt)
    }

    var lastCoachReadbackText: String {
        defaults.string(forKey: UserDefaultsKeys.lastCoachReadbackText) ?? "No coach readback yet."
    }

    var lastCoachReadbackAt: Date? {
        date(forKey: UserDefaultsKeys.lastCoachReadbackAt)
    }

    var lastMorningCoachResult: String {
        defaults.string(forKey: UserDefaultsKeys.lastMorningCoachResult) ?? "Morning Coach has not run yet."
    }

    var lastMorningCoachAt: Date? {
        date(forKey: UserDefaultsKeys.lastMorningCoachAt)
    }

    var lastBackgroundHealthKitText: String {
        defaults.string(forKey: UserDefaultsKeys.lastBackgroundHealthKitText) ?? "Background HealthKit sync is not enabled."
    }

    var lastBackgroundHealthKitAttemptAt: Date? {
        date(forKey: UserDefaultsKeys.lastBackgroundHealthKitAttemptAt)
    }

    func recordAppleHealthSync(summary: String, at date: Date = Date()) {
        defaults.set(date.timeIntervalSince1970, forKey: UserDefaultsKeys.lastAppleHealthSyncAt)
        defaults.set(
            "Last Apple Health sync: \(Self.format(date))\n\(CoachSafeOutput.redact(summary))",
            forKey: UserDefaultsKeys.lastAppleHealthSyncText
        )
    }

    func recordCoachReadback(summary: String, at date: Date = Date()) {
        defaults.set(date.timeIntervalSince1970, forKey: UserDefaultsKeys.lastCoachReadbackAt)
        defaults.set(
            "Last coach readback: \(Self.format(date))\n\(CoachSafeOutput.redact(summary))",
            forKey: UserDefaultsKeys.lastCoachReadbackText
        )
    }

    func recordMorningCoach(result: String, at date: Date = Date()) {
        defaults.set(date.timeIntervalSince1970, forKey: UserDefaultsKeys.lastMorningCoachAt)
        defaults.set(CoachSafeOutput.redact(result), forKey: UserDefaultsKeys.lastMorningCoachResult)
    }

    func recordMorningCoachError(_ message: String, at date: Date = Date()) {
        defaults.set(date.timeIntervalSince1970, forKey: UserDefaultsKeys.lastMorningCoachAttemptAt)
        defaults.set(CoachSafeOutput.redact(message), forKey: UserDefaultsKeys.lastMorningCoachError)
    }

    func recordBackgroundHealthKit(status: String, at date: Date = Date()) {
        defaults.set(date.timeIntervalSince1970, forKey: UserDefaultsKeys.lastBackgroundHealthKitAttemptAt)
        defaults.set(
            "Last background HealthKit attempt: \(Self.format(date))\n\(CoachSafeOutput.redact(status))",
            forKey: UserDefaultsKeys.lastBackgroundHealthKitText
        )
    }

    private static func format(_ date: Date) -> String {
        statusDateFormatter.string(from: date)
    }

    private func date(forKey key: String) -> Date? {
        let value = defaults.double(forKey: key)
        guard value > 0 else { return nil }
        return Date(timeIntervalSince1970: value)
    }

    private static let statusDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
}

enum UserDefaultsKeys {
    static let apiBase = "coach_api_base"
    static let lastAppleHealthSyncAt = "last_successful_apple_health_sync_at"
    static let lastAppleHealthSyncText = "last_successful_apple_health_sync_text"
    static let lastCoachReadbackAt = "last_successful_coach_today_readback_at"
    static let lastCoachReadbackText = "last_successful_coach_today_readback_text"
    static let lastMorningCoachAttemptAt = "last_morning_coach_attempt_at"
    static let lastMorningCoachAt = "last_morning_coach_at"
    static let lastMorningCoachResult = "last_morning_coach_result_summary"
    static let lastMorningCoachError = "last_morning_coach_error"
    static let lastBackgroundHealthKitAttemptAt = "last_background_healthkit_attempt_at"
    static let lastBackgroundHealthKitText = "last_background_healthkit_result"
}
