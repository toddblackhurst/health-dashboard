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
            dailyCall: root.stringValue("daily_call"),
            why: root.stringArray("why"),
            todaysPlan: root.stringArray("todays_plan"),
            safetyGuardrails: root.stringArray("safety_guardrails"),
            whatToTrackToday: root.stringArray("what_to_track_today")
        )
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
}
