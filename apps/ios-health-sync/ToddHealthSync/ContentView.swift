import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = HealthSyncViewModel()

    var body: some View {
        NavigationStack {
            Form {
                Section("Connection") {
                    TextField("Coach API base URL", text: $viewModel.apiBase)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)

                    SecureField("Coach API secret", text: $viewModel.apiSecret)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    Button("Save Connection") {
                        viewModel.saveSecret()
                    }
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

                Section("Status") {
                    if viewModel.isWorking {
                        ProgressView()
                    }
                    Text(viewModel.statusText)
                    Text(viewModel.lastSyncText)
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
