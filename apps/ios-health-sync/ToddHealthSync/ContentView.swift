import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = HealthSyncViewModel()
    @State private var setupCommand = ""
    @State private var showManualEvidence = false
    @State private var showAdvancedDiagnostics = false
    @FocusState private var focusedSetupField: SetupField?

    var body: some View {
        NavigationStack {
            Form {
                coachHomeSection

                if showManualEvidence || showAdvancedDiagnostics {
                    manualSourceDraftsSection
                }

                if showAdvancedDiagnostics {
                    coachSetupSection
                    appleHealthSection
                    morningCoachSection
                    statusSection
                }
            }
            .navigationTitle("Coach Home")
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

    private var coachHomeSection: some View {
        Section("Start Here") {
            VStack(alignment: .leading, spacing: 10) {
                Text(viewModel.coachHomeHeadline)
                    .font(.headline)
                Text(viewModel.coachHomeNextStepText)
                    .foregroundStyle(.secondary)
                Text(viewModel.coachHomeManualEvidenceText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(viewModel.coachHomeBoundaryText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Coach home summary")

            Button {
                focusedSetupField = nil
                viewModel.checkCoachReadiness()
            } label: {
                Label("Check Readiness", systemImage: "checkmark.shield")
            }
            .disabled(viewModel.isWorking)

            Button {
                focusedSetupField = nil
                showManualEvidence = true
            } label: {
                Label("Add Manual Evidence", systemImage: "square.and.pencil")
            }

            Button {
                focusedSetupField = nil
                showManualEvidence = true
                viewModel.buildManualSourceEvidencePacket()
            } label: {
                Label("Build Evidence Packet", systemImage: "doc.text")
            }

            Button {
                focusedSetupField = nil
                showAdvancedDiagnostics.toggle()
            } label: {
                Label(showAdvancedDiagnostics ? "Hide Advanced / Diagnostics" : "Advanced / Diagnostics", systemImage: "slider.horizontal.3")
            }

            if viewModel.isWorking {
                ProgressView()
            }
            Text(viewModel.statusText)
                .foregroundStyle(.secondary)
        }
    }

    private var coachSetupSection: some View {
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
                .onChange(of: setupCommand) { _, _ in
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
    }

    private var appleHealthSection: some View {
        Section("Apple Health Sync") {
            Text("This can write Apple Health daily summaries to Coach. Use only when you intentionally want a sync.")
                .font(.caption)
                .foregroundStyle(.secondary)

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
    }

    private var morningCoachSection: some View {
        Section("Read-Only Coach Checks") {
            Text("These checks are for diagnostics and do not run automatically when the app opens.")
                .font(.caption)
                .foregroundStyle(.secondary)

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

            Button("Refresh Coach Data") {
                viewModel.refreshCoachData()
            }
            .disabled(viewModel.isWorking)

            Text(viewModel.morningCoachText)
                .textSelection(.enabled)
            Text(viewModel.dailyDataFreshnessText)
                .foregroundStyle(.secondary)
                .textSelection(.enabled)
        }
    }

    private var manualSourceDraftsSection: some View {
        Section("Manual Source Drafts") {
            VStack(alignment: .leading, spacing: 8) {
                Text("Local draft evidence only. Nothing is submitted to Coach until Todd chooses a separate write path.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(viewModel.manualSourceSafetySummaryText)
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)
                    .textSelection(.enabled)
                LabeledContent("Draft lanes", value: viewModel.manualSourceDraftProgressText)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Manual source draft safety summary")

            Button("Build Evidence Packet") {
                focusedSetupField = nil
                viewModel.buildManualSourceEvidencePacket()
            }
            .accessibilityLabel("Build manual source evidence packet")

            Button("Copy Evidence Packet") {
                focusedSetupField = nil
                viewModel.copyManualSourceEvidencePacket()
            }
            .accessibilityLabel("Copy manual source evidence packet")

            ForEach(ManualSourceEvidenceLane.allCases) { lane in
                VStack(alignment: .leading, spacing: 8) {
                    LabeledContent(lane.label, value: lane.sourceState)
                    LabeledContent("Draft", value: manualDraftStatus(for: lane))
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
    }

    private var statusSection: some View {
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

    private func manualDraftStatus(for lane: ManualSourceEvidenceLane) -> String {
        let note = viewModel.manualSourceDraftNotes[lane] ?? ""
        return note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "empty" : "has draft"
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
