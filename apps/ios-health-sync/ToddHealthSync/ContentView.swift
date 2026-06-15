import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = HealthSyncViewModel()
    @State private var setupCommand = ""
    @FocusState private var focusedSetupField: SetupField?

    var body: some View {
        NavigationStack {
            Form {
                Section("Coach Setup") {
                    Text("Command fallback build")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)

                    TextField("Coach API base URL", text: $viewModel.apiBase)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                        .submitLabel(.next)
                        .focused($focusedSetupField, equals: .apiBase)
                        .onSubmit {
                            focusedSetupField = .apiSecret
                        }

                    SecureField("Coach API secret", text: $viewModel.apiSecret)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .submitLabel(.done)
                        .focused($focusedSetupField, equals: .apiSecret)
                        .onSubmit {
                            focusedSetupField = nil
                            viewModel.saveConnection()
                        }

                    TextField("Type setup, readiness, sync, or all", text: $setupCommand)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                        .submitLabel(.done)
                        .focused($focusedSetupField, equals: .command)
                        .onSubmit {
                            handleSetupCommand()
                        }
                        .onChange(of: setupCommand) { _ in
                            handleSetupCommand()
                        }

                    Button("Save Connection") {
                        focusedSetupField = nil
                        viewModel.saveConnection()
                    }

                    Button("Check Setup") {
                        focusedSetupField = nil
                        viewModel.checkCoachSetup()
                    }

                    Button("Check Coach Readiness") {
                        focusedSetupField = nil
                        viewModel.checkCoachReadiness()
                    }

                    LabeledContent("State", value: viewModel.coachSetupTitle)
                    Text(viewModel.coachSetupDetail)
                        .foregroundStyle(.secondary)
                    Text(viewModel.coachReadinessText)
                        .foregroundStyle(.secondary)
                        .textSelection(.enabled)
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

                    Button("Check Daily Data Freshness") {
                        viewModel.checkDailyDataFreshness()
                    }
                    .disabled(viewModel.isWorking)

                    Text(viewModel.morningCoachText)
                        .textSelection(.enabled)
                    Text(viewModel.dailyDataFreshnessText)
                        .foregroundStyle(.secondary)
                        .textSelection(.enabled)
                }

                Section("Manual Source Drafts") {
                    ForEach(ManualSourceEvidenceLane.allCases) { lane in
                        VStack(alignment: .leading, spacing: 8) {
                            LabeledContent(lane.label, value: lane.sourceState)
                            Text(lane.prompt)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            TextEditor(text: manualDraftBinding(for: lane))
                                .frame(minHeight: 72)
                                .textInputAutocapitalization(.sentences)
                                .autocorrectionDisabled(false)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(.secondary.opacity(0.25))
                                )
                                .accessibilityLabel("\(lane.label) manual evidence draft")
                        }
                    }

                    Button("Build Evidence Packet") {
                        focusedSetupField = nil
                        viewModel.buildManualSourceEvidencePacket()
                    }

                    Button("Copy Evidence Packet") {
                        focusedSetupField = nil
                        viewModel.copyManualSourceEvidencePacket()
                    }

                    Text(viewModel.manualSourceEvidenceText)
                        .foregroundStyle(.secondary)
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
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Button("Done") {
                        focusedSetupField = nil
                    }
                    Spacer()
                    Button("Save") {
                        focusedSetupField = nil
                        viewModel.saveConnection()
                    }
                }
            }
        }
    }

    private enum SetupField {
        case apiBase
        case apiSecret
        case command
    }

    private func handleSetupCommand() {
        let command = setupCommand.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !command.isEmpty else { return }

        guard let request = SetupCommandRequest.parse(command) else { return }

        focusedSetupField = nil
        setupCommand = ""

        if request.runSetup {
            viewModel.saveConnection()
            viewModel.checkCoachSetup()
        }

        if request.runReadiness {
            viewModel.saveConnection()
            viewModel.checkCoachReadiness()
        }

        if request.runSync {
            Task {
                viewModel.saveConnection()
                await viewModel.checkCoachSyncStatus()
            }
        }
    }

    private func manualDraftBinding(for lane: ManualSourceEvidenceLane) -> Binding<String> {
        Binding(
            get: {
                viewModel.manualSourceDraftNotes[lane] ?? ""
            },
            set: { value in
                viewModel.updateManualSourceDraft(lane, note: value)
            }
        )
    }
}

struct SetupCommandRequest: Equatable {
    let runSetup: Bool
    let runReadiness: Bool
    let runSync: Bool

    static func parse(_ text: String) -> SetupCommandRequest? {
        let tokens = text
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .split { !$0.isLetter && !$0.isNumber }
            .map(String.init)
        guard !tokens.isEmpty else { return nil }

        let wantsAll = tokens.contains("all")
        let request = SetupCommandRequest(
            runSetup: wantsAll || tokens.contains("setup") || tokens.contains("save"),
            runReadiness: wantsAll || tokens.contains("readiness") || tokens.contains("ready"),
            runSync: wantsAll || tokens.contains("sync") || tokens.contains("status")
        )

        if request.runSetup || request.runReadiness || request.runSync {
            return request
        }

        return nil
    }
}

#Preview {
    ContentView()
}
