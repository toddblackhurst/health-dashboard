import Foundation
import HealthKit
import UIKit

final class HealthKitManager {
    private let healthStore = HKHealthStore()
    private let calendar: Calendar
    private let dateFormatter: DateFormatter
    private let deviceName: String

    init(
        calendar: Calendar = .current,
        deviceName: String = UIDevice.current.name
    ) {
        var calendar = calendar
        calendar.timeZone = .current
        self.calendar = calendar
        self.deviceName = deviceName

        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.timeZone = calendar.timeZone
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        self.dateFormatter = formatter
    }

    var healthDataAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    func requestAuthorization() async throws {
        guard healthDataAvailable else {
            throw HealthKitSyncError.healthDataUnavailable
        }

        try await healthStore.requestAuthorization(toShare: [], read: readTypes())
    }

    func dailySummaries(days: Int) async throws -> [AppleHealthDailySummary] {
        guard healthDataAvailable else {
            throw HealthKitSyncError.healthDataUnavailable
        }

        let dayCount = max(1, min(days, 31))
        let todayStart = calendar.startOfDay(for: Date())
        let start = calendar.date(byAdding: .day, value: -(dayCount - 1), to: todayStart) ?? todayStart
        let end = calendar.date(byAdding: .day, value: 1, to: todayStart) ?? Date()
        var working = makeEmptySummaries(start: start, days: dayCount)

        try await applyCumulativeQuantity(
            .stepCount,
            unit: .count(),
            start: start,
            end: end,
            to: &working,
            keyPath: \.steps
        )
        try await applyCumulativeQuantity(
            .distanceWalkingRunning,
            unit: .mile(),
            start: start,
            end: end,
            to: &working,
            keyPath: \.distanceMi
        )
        try await applyCumulativeQuantity(
            .flightsClimbed,
            unit: .count(),
            start: start,
            end: end,
            to: &working,
            keyPath: \.flightsClimbed
        )
        try await applyCumulativeQuantity(
            .activeEnergyBurned,
            unit: .kilocalorie(),
            start: start,
            end: end,
            to: &working,
            keyPath: \.activeEnergyKcal
        )
        try await applyCumulativeQuantity(
            .basalEnergyBurned,
            unit: .kilocalorie(),
            start: start,
            end: end,
            to: &working,
            keyPath: \.basalEnergyKcal
        )
        try await applyCumulativeQuantity(
            .appleExerciseTime,
            unit: .minute(),
            start: start,
            end: end,
            to: &working,
            keyPath: \.exerciseMinutes
        )
        try await applyCumulativeQuantity(
            .appleStandTime,
            unit: .minute(),
            start: start,
            end: end,
            to: &working,
            keyPath: \.standMinutes
        )
        try await applyAverageQuantity(
            .restingHeartRate,
            unit: heartRateUnit,
            start: start,
            end: end,
            to: &working,
            keyPath: \.restingHrBpm
        )
        try await applyHeartRate(start: start, end: end, to: &working)
        try await applyHRV(start: start, end: end, to: &working)
        try await applySleep(start: start, end: end, to: &working)
        try await applyWorkouts(start: start, end: end, to: &working)

        return working
            .sorted { $0.summaryDate < $1.summaryDate }
            .map { $0.encoded(deviceName: deviceName) }
    }

    private var heartRateUnit: HKUnit {
        HKUnit.count().unitDivided(by: .minute())
    }

    private var hrvUnit: HKUnit {
        HKUnit.secondUnit(with: .milli)
    }

    private func readTypes() -> Set<HKObjectType> {
        var types: Set<HKObjectType> = [
            HKObjectType.workoutType()
        ]

        [
            HKQuantityTypeIdentifier.stepCount,
            .distanceWalkingRunning,
            .flightsClimbed,
            .activeEnergyBurned,
            .basalEnergyBurned,
            .appleExerciseTime,
            .appleStandTime,
            .restingHeartRate,
            .heartRate,
            .heartRateVariabilitySDNN
        ].compactMap(HKObjectType.quantityType(forIdentifier:)).forEach { types.insert($0) }

        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleep)
        }

        return types
    }

    private func makeEmptySummaries(start: Date, days: Int) -> [DailySummaryDraft] {
        (0..<days).compactMap { offset in
            guard let date = calendar.date(byAdding: .day, value: offset, to: start) else { return nil }
            return DailySummaryDraft(summaryDate: dateFormatter.string(from: date), date: date)
        }
    }

    private func dayKey(for date: Date) -> String {
        dateFormatter.string(from: calendar.startOfDay(for: date))
    }

    private func queryPredicate(start: Date, end: Date) -> NSPredicate {
        HKQuery.predicateForSamples(withStart: start, end: end, options: [.strictStartDate])
    }

    private func applyCumulativeQuantity(
        _ identifier: HKQuantityTypeIdentifier,
        unit: HKUnit,
        start: Date,
        end: Date,
        to drafts: inout [DailySummaryDraft],
        keyPath: WritableKeyPath<DailySummaryDraft, Double?>
    ) async throws {
        guard let quantityType = HKObjectType.quantityType(forIdentifier: identifier) else { return }
        let values = try await quantityStatistics(
            quantityType: quantityType,
            unit: unit,
            options: [.cumulativeSum],
            start: start,
            end: end
        ) { statistics in
            statistics.sumQuantity()?.doubleValue(for: unit)
        }
        merge(values, into: &drafts, keyPath: keyPath)
    }

    private func applyAverageQuantity(
        _ identifier: HKQuantityTypeIdentifier,
        unit: HKUnit,
        start: Date,
        end: Date,
        to drafts: inout [DailySummaryDraft],
        keyPath: WritableKeyPath<DailySummaryDraft, Double?>
    ) async throws {
        guard let quantityType = HKObjectType.quantityType(forIdentifier: identifier) else { return }
        let values = try await quantityStatistics(
            quantityType: quantityType,
            unit: unit,
            options: [.discreteAverage],
            start: start,
            end: end
        ) { statistics in
            statistics.averageQuantity()?.doubleValue(for: unit)
        }
        merge(values, into: &drafts, keyPath: keyPath)
    }

    private func applyHeartRate(
        start: Date,
        end: Date,
        to drafts: inout [DailySummaryDraft]
    ) async throws {
        guard let quantityType = HKObjectType.quantityType(forIdentifier: .heartRate) else { return }
        let values = try await heartRateStatistics(quantityType: quantityType, start: start, end: end)
        for index in drafts.indices {
            guard let stats = values[drafts[index].summaryDate] else { continue }
            drafts[index].avgHrBpm = stats.average
            drafts[index].minHrBpm = stats.minimum
            drafts[index].maxHrBpm = stats.maximum
        }
    }

    private func applyHRV(
        start: Date,
        end: Date,
        to drafts: inout [DailySummaryDraft]
    ) async throws {
        guard let quantityType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else { return }
        let values = try await quantitySamples(quantityType: quantityType, unit: hrvUnit, start: start, end: end)
        let grouped = Dictionary(grouping: values, by: { $0.day })

        for index in drafts.indices {
            let samples = grouped[drafts[index].summaryDate] ?? []
            guard !samples.isEmpty else { continue }
            drafts[index].hrvSdnnMs = samples.map(\.value).reduce(0, +) / Double(samples.count)
            drafts[index].hrvSampleCount = samples.count
        }
    }

    private func applySleep(
        start: Date,
        end: Date,
        to drafts: inout [DailySummaryDraft]
    ) async throws {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return }
        let samples = try await categorySamples(type: sleepType, start: start, end: end)
        var asleepMinutes: [String: Double] = [:]
        var inBedMinutes: [String: Double] = [:]

        for sample in samples {
            guard let value = HKCategoryValueSleepAnalysis(rawValue: sample.value) else { continue }
            let intervals = splitByDay(start: max(sample.startDate, start), end: min(sample.endDate, end))
            for (day, minutes) in intervals {
                if value == .inBed {
                    inBedMinutes[day, default: 0] += minutes
                }
                if value.isAsleep {
                    asleepMinutes[day, default: 0] += minutes
                }
            }
        }

        for index in drafts.indices {
            drafts[index].sleepMinutes = asleepMinutes[drafts[index].summaryDate]
            drafts[index].sleepInBedMinutes = inBedMinutes[drafts[index].summaryDate]
        }
    }

    private func applyWorkouts(
        start: Date,
        end: Date,
        to drafts: inout [DailySummaryDraft]
    ) async throws {
        let workouts = try await workoutSamples(start: start, end: end)
        var totals: [String: (all: Int, strength: Int, cardio: Int)] = [:]

        for workout in workouts {
            let key = dayKey(for: workout.startDate)
            var item = totals[key, default: (0, 0, 0)]
            item.all += 1
            if workout.workoutActivityType.isStrengthLike {
                item.strength += 1
            }
            if workout.workoutActivityType.isCardioLike {
                item.cardio += 1
            }
            totals[key] = item
        }

        for index in drafts.indices {
            guard let item = totals[drafts[index].summaryDate] else { continue }
            drafts[index].workoutCount = item.all
            drafts[index].strengthWorkoutCount = item.strength
            drafts[index].cardioWorkoutCount = item.cardio
        }
    }

    private func quantityStatistics(
        quantityType: HKQuantityType,
        unit: HKUnit,
        options: HKStatisticsOptions,
        start: Date,
        end: Date,
        extract: @escaping (HKStatistics) -> Double?
    ) async throws -> [String: Double] {
        try await withCheckedThrowingContinuation { continuation in
            var interval = DateComponents()
            interval.day = 1

            let query = HKStatisticsCollectionQuery(
                quantityType: quantityType,
                quantitySamplePredicate: queryPredicate(start: start, end: end),
                options: options,
                anchorDate: start,
                intervalComponents: interval
            )

            query.initialResultsHandler = { [dateFormatter] _, collection, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                var values: [String: Double] = [:]
                collection?.enumerateStatistics(from: start, to: end) { statistics, _ in
                    if let value = extract(statistics) {
                        values[dateFormatter.string(from: statistics.startDate)] = value
                    }
                }
                continuation.resume(returning: values)
            }

            healthStore.execute(query)
        }
    }

    private func heartRateStatistics(
        quantityType: HKQuantityType,
        start: Date,
        end: Date
    ) async throws -> [String: HeartRateStats] {
        try await withCheckedThrowingContinuation { continuation in
            var interval = DateComponents()
            interval.day = 1

            let query = HKStatisticsCollectionQuery(
                quantityType: quantityType,
                quantitySamplePredicate: queryPredicate(start: start, end: end),
                options: [.discreteAverage, .discreteMin, .discreteMax],
                anchorDate: start,
                intervalComponents: interval
            )

            query.initialResultsHandler = { [dateFormatter, heartRateUnit] _, collection, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                var values: [String: HeartRateStats] = [:]
                collection?.enumerateStatistics(from: start, to: end) { statistics, _ in
                    let average = statistics.averageQuantity()?.doubleValue(for: heartRateUnit)
                    let minimum = statistics.minimumQuantity()?.doubleValue(for: heartRateUnit)
                    let maximum = statistics.maximumQuantity()?.doubleValue(for: heartRateUnit)
                    if average != nil || minimum != nil || maximum != nil {
                        values[dateFormatter.string(from: statistics.startDate)] = HeartRateStats(
                            average: average,
                            minimum: minimum,
                            maximum: maximum
                        )
                    }
                }
                continuation.resume(returning: values)
            }

            healthStore.execute(query)
        }
    }

    private func quantitySamples(
        quantityType: HKQuantityType,
        unit: HKUnit,
        start: Date,
        end: Date
    ) async throws -> [(day: String, value: Double)] {
        let samples = try await sampleQuery(sampleType: quantityType, start: start, end: end)
            .compactMap { $0 as? HKQuantitySample }
        return samples.map { sample in
            (day: dayKey(for: sample.startDate), value: sample.quantity.doubleValue(for: unit))
        }
    }

    private func categorySamples(
        type: HKCategoryType,
        start: Date,
        end: Date
    ) async throws -> [HKCategorySample] {
        try await sampleQuery(sampleType: type, start: start, end: end)
            .compactMap { $0 as? HKCategorySample }
    }

    private func workoutSamples(start: Date, end: Date) async throws -> [HKWorkout] {
        try await sampleQuery(sampleType: HKObjectType.workoutType(), start: start, end: end)
            .compactMap { $0 as? HKWorkout }
    }

    private func sampleQuery(sampleType: HKSampleType, start: Date, end: Date) async throws -> [HKSample] {
        try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: sampleType,
                predicate: queryPredicate(start: start, end: end),
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: samples ?? [])
            }

            healthStore.execute(query)
        }
    }

    private func splitByDay(start: Date, end: Date) -> [(String, Double)] {
        guard end > start else { return [] }
        var results: [(String, Double)] = []
        var cursor = start

        while cursor < end {
            let dayStart = calendar.startOfDay(for: cursor)
            let nextDay = calendar.date(byAdding: .day, value: 1, to: dayStart) ?? end
            let segmentEnd = min(nextDay, end)
            let minutes = segmentEnd.timeIntervalSince(cursor) / 60
            results.append((dateFormatter.string(from: dayStart), minutes))
            cursor = segmentEnd
        }

        return results
    }

    private func merge(
        _ values: [String: Double],
        into drafts: inout [DailySummaryDraft],
        keyPath: WritableKeyPath<DailySummaryDraft, Double?>
    ) {
        for index in drafts.indices {
            drafts[index][keyPath: keyPath] = values[drafts[index].summaryDate]
        }
    }
}

private struct DailySummaryDraft {
    let summaryDate: String
    let date: Date
    var steps: Double?
    var distanceMi: Double?
    var flightsClimbed: Double?
    var activeEnergyKcal: Double?
    var basalEnergyKcal: Double?
    var exerciseMinutes: Double?
    var standMinutes: Double?
    var restingHrBpm: Double?
    var avgHrBpm: Double?
    var minHrBpm: Double?
    var maxHrBpm: Double?
    var hrvSdnnMs: Double?
    var hrvSampleCount: Int?
    var sleepMinutes: Double?
    var sleepInBedMinutes: Double?
    var workoutCount: Int?
    var strengthWorkoutCount: Int?
    var cardioWorkoutCount: Int?

    func encoded(deviceName: String) -> AppleHealthDailySummary {
        AppleHealthDailySummary(
            summaryDate: summaryDate,
            sourceApp: "Apple Health",
            sourceDevice: deviceName,
            steps: steps?.roundedValue(),
            distanceMi: distanceMi?.roundedValue(places: 3),
            flightsClimbed: flightsClimbed?.roundedValue(),
            activeEnergyKcal: activeEnergyKcal?.roundedValue(),
            basalEnergyKcal: basalEnergyKcal?.roundedValue(),
            exerciseMinutes: exerciseMinutes?.roundedValue(),
            standMinutes: standMinutes?.roundedValue(),
            restingHrBpm: restingHrBpm?.roundedValue(places: 1),
            avgHrBpm: avgHrBpm?.roundedValue(places: 1),
            minHrBpm: minHrBpm?.roundedValue(places: 1),
            maxHrBpm: maxHrBpm?.roundedValue(places: 1),
            hrvSdnnMs: hrvSdnnMs?.roundedValue(places: 1),
            hrvSampleCount: hrvSampleCount,
            sleepMinutes: sleepMinutes?.roundedValue(),
            sleepInBedMinutes: sleepInBedMinutes?.roundedValue(),
            workoutCount: workoutCount,
            strengthWorkoutCount: strengthWorkoutCount,
            cardioWorkoutCount: cardioWorkoutCount,
            duplicatePolicyFlags: [
                "apple_health_role": "cross_check",
                "garmin_mirror_possible": "true"
            ],
            metricQuality: [
                "summary_grain": "daily",
                "hrv": hrvSampleCount == nil ? "missing" : "direct_sdnn_samples"
            ],
            provenance: [
                "steps": "HKQuantityTypeIdentifierStepCount",
                "distance_mi": "HKQuantityTypeIdentifierDistanceWalkingRunning",
                "heart_rate": "HKQuantityTypeIdentifierHeartRate",
                "workouts": "HKWorkout"
            ],
            rawSummary: [
                "source_contract": "apple-health-daily-summary-v1"
            ]
        )
    }
}

private struct HeartRateStats {
    let average: Double?
    let minimum: Double?
    let maximum: Double?
}

enum HealthKitSyncError: LocalizedError {
    case healthDataUnavailable

    var errorDescription: String? {
        switch self {
        case .healthDataUnavailable:
            "Health data is not available on this device."
        }
    }
}

private extension HKCategoryValueSleepAnalysis {
    var isAsleep: Bool {
        switch self {
        case .asleep,
             .asleepCore,
             .asleepDeep,
             .asleepREM,
             .asleepUnspecified:
            true
        default:
            false
        }
    }
}

private extension HKWorkoutActivityType {
    var isStrengthLike: Bool {
        switch self {
        case .traditionalStrengthTraining,
             .functionalStrengthTraining,
             .highIntensityIntervalTraining:
            true
        default:
            false
        }
    }

    var isCardioLike: Bool {
        switch self {
        case .running,
             .walking,
             .cycling,
             .swimming,
             .elliptical,
             .rowing,
             .stairClimbing,
             .hiking:
            true
        default:
            false
        }
    }
}

private extension Double {
    func roundedValue(places: Int = 0) -> Double {
        let factor = pow(10, Double(places))
        return (self * factor).rounded() / factor
    }
}
