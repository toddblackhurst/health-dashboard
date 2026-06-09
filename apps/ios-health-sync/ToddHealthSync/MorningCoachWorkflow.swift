import Foundation
import UIKit

struct MorningCoachActionResult {
    let title: String
    let detail: String

    var shortcutValue: String {
        "\(title)\n\(detail)"
    }
}

struct MorningCoachWorkflow {
    private let healthKitManager: HealthKitManager
    private let apiClient: CoachAPIClient
    private let keychainStore: KeychainStore
    private let store: MorningCoachStore

    init(
        healthKitManager: HealthKitManager = HealthKitManager(),
        apiClient: CoachAPIClient = CoachAPIClient(),
        keychainStore: KeychainStore = KeychainStore(),
        store: MorningCoachStore = MorningCoachStore()
    ) {
        self.healthKitManager = healthKitManager
        self.apiClient = apiClient
        self.keychainStore = keychainStore
        self.store = store
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
        return MorningCoachActionResult(title: "Coach sync status", detail: status.conciseResult)
    }

    func openCoachToday() async throws -> MorningCoachActionResult {
        let today = try await apiClient.getCoachToday(
            apiBase: store.apiBase,
            apiSecret: savedSecret()
        )
        let result = today.conciseResult(syncStatus: nil)
        store.recordCoachReadback(summary: result)
        store.recordMorningCoach(result: result)
        return MorningCoachActionResult(title: "Coach today", detail: result)
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
                today.conciseResult(syncStatus: syncStatus),
                "",
                syncResult.detail
            ].joined(separator: "\n")
            store.recordMorningCoach(result: result)
            return MorningCoachActionResult(title: "Morning Coach complete", detail: result)
        } catch {
            store.recordMorningCoachError(error.localizedDescription)
            throw error
        }
    }

    private func savedSecret() throws -> String {
        let secret = try keychainStore.loadSecret().trimmingCharacters(in: .whitespacesAndNewlines)
        guard !secret.isEmpty else {
            throw CoachAPIError.missingSecret
        }
        return secret
    }

    private var appVersion: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(version) (\(build))"
    }
}
