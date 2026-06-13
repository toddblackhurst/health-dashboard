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
    @Published var coachSetupTitle = "Coach setup not checked."
    @Published var coachSetupDetail = "Open Coach Setup and check local configuration before running shortcuts."
    @Published var lastSyncText = "No sync yet."
    @Published var lastCoachReadbackText = "No coach readback yet."
    @Published var morningCoachText = "Morning Coach has not run yet."
    @Published var backgroundHealthKitText = "Background HealthKit sync is not enabled."

    private let healthKitManager: HealthKitManager
    private let keychainStore: any CoachSecretStoring
    private let store: MorningCoachStore
    private let workflow: MorningCoachWorkflow

    init(
        healthKitManager: HealthKitManager = HealthKitManager(),
        apiClient: CoachAPIClient = CoachAPIClient(),
        keychainStore: any CoachSecretStoring = KeychainStore(),
        store: MorningCoachStore = MorningCoachStore()
    ) {
        self.healthKitManager = healthKitManager
        self.keychainStore = keychainStore
        self.store = store
        self.workflow = MorningCoachWorkflow(
            healthKitManager: healthKitManager,
            apiClient: apiClient,
            keychainStore: keychainStore,
            store: store
        )
        self.apiBase = store.apiBase
        self.apiSecret = (try? keychainStore.loadSecret()) ?? ""
        refreshCoachSetupStatus()
        refreshStoredStatus()
    }

    func saveConnection() {
        do {
            store.apiBase = apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedSecret = apiSecret.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmedSecret.isEmpty {
                try keychainStore.deleteSecret()
            } else {
                try keychainStore.saveSecret(trimmedSecret)
            }
            refreshCoachSetupStatus()
            statusText = "Coach connection saved."
        } catch {
            statusText = error.localizedDescription
        }
    }

    func checkCoachSetup() {
        store.apiBase = apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
        refreshCoachSetupStatus()
        statusText = coachSetupTitle
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
            try persistConnectionForWork()
            let result = try await workflow.syncAppleHealth(days: selectedDays, trigger: "manual")
            statusText = result.detail
            refreshStoredStatus()
        } catch {
            statusText = error.localizedDescription
        }
    }

    func runMorningCoach() async {
        guard !isWorking else { return }
        isWorking = true
        statusText = "Running Morning Coach..."
        defer { isWorking = false }

        do {
            try persistConnectionForWork()
            let result = try await workflow.runMorningCoach()
            statusText = result.title
            morningCoachText = result.detail
            refreshStoredStatus()
        } catch {
            statusText = error.localizedDescription
            refreshStoredStatus()
        }
    }

    func checkCoachSyncStatus() async {
        guard !isWorking else { return }
        isWorking = true
        statusText = "Checking coach sync status..."
        defer { isWorking = false }

        do {
            try persistConnectionForWork()
            let result = try await workflow.checkCoachSyncStatus()
            statusText = result.title
            lastCoachReadbackText = result.detail
            refreshStoredStatus()
        } catch {
            statusText = error.localizedDescription
            refreshStoredStatus()
        }
    }

    private func persistConnectionForWork() throws {
        store.apiBase = apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedSecret = apiSecret.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedSecret.isEmpty {
            try keychainStore.saveSecret(trimmedSecret)
        }
        refreshCoachSetupStatus()
    }

    private func refreshStoredStatus() {
        lastSyncText = store.lastAppleHealthSyncText
        lastCoachReadbackText = store.lastCoachReadbackText
        morningCoachText = store.lastMorningCoachResult
        backgroundHealthKitText = store.lastBackgroundHealthKitText
    }

    private func refreshCoachSetupStatus() {
        let storedSecret = (try? keychainStore.loadSecret()) ?? ""
        let candidateSecret = apiSecret.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? storedSecret
            : apiSecret
        let setupStatus = CoachConnectionConfiguration(apiBase: apiBase, secret: candidateSecret).status
        coachSetupTitle = setupStatus.title
        coachSetupDetail = setupStatus.detail
    }
}
