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
