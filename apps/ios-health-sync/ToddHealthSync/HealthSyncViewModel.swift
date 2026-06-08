import Foundation
import UIKit

@MainActor
final class HealthSyncViewModel: ObservableObject {
    @Published var apiBase: String {
        didSet {
            UserDefaults.standard.set(apiBase, forKey: UserDefaultsKeys.apiBase)
        }
    }
    @Published var apiSecret: String = ""
    @Published var selectedDays = 7
    @Published var isWorking = false
    @Published var statusText = "Ready to connect Apple Health."
    @Published var lastSyncText = "No sync yet."

    private let healthKitManager: HealthKitManager
    private let apiClient: CoachAPIClient
    private let keychainStore: KeychainStore

    init(
        healthKitManager: HealthKitManager = HealthKitManager(),
        apiClient: CoachAPIClient = CoachAPIClient(),
        keychainStore: KeychainStore = KeychainStore()
    ) {
        self.healthKitManager = healthKitManager
        self.apiClient = apiClient
        self.keychainStore = keychainStore
        self.apiBase = UserDefaults.standard.string(forKey: UserDefaultsKeys.apiBase)
            ?? "https://todd-personal-coach.netlify.app"
        self.apiSecret = (try? keychainStore.loadSecret()) ?? ""
    }

    func saveSecret() {
        do {
            try keychainStore.saveSecret(apiSecret.trimmingCharacters(in: .whitespacesAndNewlines))
            statusText = "Connection saved."
        } catch {
            statusText = error.localizedDescription
        }
    }

    func connectAppleHealth() async {
        guard !isWorking else { return }
        isWorking = true
        statusText = "Requesting Apple Health access..."
        defer { isWorking = false }

        do {
            try await healthKitManager.requestAuthorization()
            statusText = "Apple Health access is connected."
        } catch {
            statusText = error.localizedDescription
        }
    }

    func syncNow() async {
        guard !isWorking else { return }
        isWorking = true
        statusText = "Preparing daily summaries..."
        defer { isWorking = false }

        do {
            try keychainStore.saveSecret(apiSecret.trimmingCharacters(in: .whitespacesAndNewlines))
            let summaries = try await healthKitManager.dailySummaries(days: selectedDays)
            statusText = "Uploading \(summaries.count) day summaries..."

            let payload = AppleHealthDailyPayload(
                clientVersion: appVersion,
                deviceName: UIDevice.current.name,
                timezone: TimeZone.current.identifier,
                daysRequested: selectedDays,
                summaries: summaries,
                raw: [
                    "sync_trigger": "manual",
                    "summary_grain": "daily"
                ]
            )

            let response = try await apiClient.postAppleHealthDaily(
                payload: payload,
                apiBase: apiBase,
                apiSecret: apiSecret
            )

            let written = response.daysWritten ?? summaries.count
            statusText = "Sync succeeded. Wrote \(written) of \(summaries.count) days."
            lastSyncText = "Last sync: \(Self.statusDateFormatter.string(from: Date()))"
        } catch {
            statusText = error.localizedDescription
        }
    }

    private var appVersion: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(version) (\(build))"
    }

    private static let statusDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
}

private enum UserDefaultsKeys {
    static let apiBase = "coach_api_base"
}
