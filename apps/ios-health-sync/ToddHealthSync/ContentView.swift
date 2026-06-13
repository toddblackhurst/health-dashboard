import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = HealthSyncViewModel()

    var body: some View {
        NavigationStack {
            Form {
                Section("Coach Setup") {
                    TextField("Coach API base URL", text: $viewModel.apiBase)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)

                    SecureField("Coach API secret", text: $viewModel.apiSecret)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    Button("Save Connection") {
                        viewModel.saveConnection()
                    }

                    Button("Check Setup") {
                        viewModel.checkCoachSetup()
                    }

                    LabeledContent("State", value: viewModel.coachSetupTitle)
                    Text(viewModel.coachSetupDetail)
                        .foregroundStyle(.secondary)
                }

                Section("Apple Health") {
                    Stepper("Days to sync: \(viewModel.selectedDays)", value: $viewModel.selectedDays, in: 1...31)

                    Button("Connect Apple Health") {
                        Task {
                            await viewModel.connectAppleHealth()
                        }
                    }
                    .disabled(viewModel.isWorking)

                    Button("Sync Now") {
                        Task {
                            await viewModel.syncNow()
                        }
                    }
                    .disabled(viewModel.isWorking)
                }

                Section("Morning Coach") {
                    Button("Morning Coach") {
                        Task {
                            await viewModel.runMorningCoach()
                        }
                    }
                    .disabled(viewModel.isWorking)

                    Button("Check Coach Sync Status") {
                        Task {
                            await viewModel.checkCoachSyncStatus()
                        }
                    }
                    .disabled(viewModel.isWorking)

                    Text(viewModel.morningCoachText)
                        .textSelection(.enabled)
                }

                Section("Status") {
                    if viewModel.isWorking {
                        ProgressView()
                    }
                    Text(viewModel.statusText)
                    Text(viewModel.lastSyncText)
                        .foregroundStyle(.secondary)
                    Text(viewModel.lastCoachReadbackText)
                        .foregroundStyle(.secondary)
                    Text(viewModel.backgroundHealthKitText)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Health Sync")
        }
    }
}

#Preview {
    ContentView()
}
