import SwiftUI

@main
struct ToddHealthSyncApp: App {
    init() {
        DeviceCommandRunner.runFromLaunchArgumentsIfNeeded()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

enum DeviceCommand: String, Equatable {
    case dailyFreshness = "daily-freshness"
}

enum DeviceCommandRunner {
    static let commandFlag = "--coach-device-command"
    static let environmentKey = "COACH_DEVICE_COMMAND"
    static let statusKey = "coach_device_command_status"
    static let nameKey = "coach_device_command_name"
    static let updatedAtKey = "coach_device_command_updated_at"
    static let resultKey = "coach_device_command_result"
    static let blockedWriteCommands = Set([
        "all",
        "apple-health-sync",
        "morning-coach",
        "sync",
        "sync-apple-health"
    ])
    static let blockedProtectedCommands = Set([
        "build-today-workout",
        "can-i-train",
        "coach-today",
        "open-coach-today",
        "sync-status",
        "weekly-review"
    ])

    static func requestedCommandName(
        from arguments: [String],
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> String? {
        if let value = environment[environmentKey] {
            return normalized(value)
        }

        guard let flagIndex = arguments.firstIndex(of: commandFlag) else { return nil }
        let valueIndex = arguments.index(after: flagIndex)
        guard arguments.indices.contains(valueIndex) else { return nil }
        return normalized(arguments[valueIndex])
    }

    static func command(
        from arguments: [String],
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> DeviceCommand? {
        guard let commandName = requestedCommandName(from: arguments, environment: environment) else {
            return nil
        }
        return DeviceCommand(rawValue: commandName)
    }

    static func runFromLaunchArgumentsIfNeeded(
        arguments: [String] = ProcessInfo.processInfo.arguments,
        environment: [String: String] = ProcessInfo.processInfo.environment,
        defaults: UserDefaults = .standard
    ) {
        guard let commandName = requestedCommandName(from: arguments, environment: environment) else {
            return
        }
        run(commandName: commandName, defaults: defaults)
    }

    static func run(
        commandName: String,
        defaults: UserDefaults = .standard,
        runSafeCommand: (DeviceCommand) throws -> MorningCoachActionResult = { command in
            let workflow = MorningCoachWorkflow()
            switch command {
            case .dailyFreshness:
                return try workflow.checkDailyDataFreshness()
            }
        }
    ) {
        let normalizedName = normalized(commandName)

        if blockedWriteCommands.contains(normalizedName) {
            record(
                status: "blocked_write_command",
                commandName: normalizedName,
                result: "Device command blocked: production write-capable commands are not available through unattended launch arguments.",
                defaults: defaults
            )
            return
        }

        if blockedProtectedCommands.contains(normalizedName) {
            record(
                status: "blocked_protected_command",
                commandName: normalizedName,
                result: "Device command blocked: protected Coach readbacks remain Todd/device-bound and are not available through unattended launch arguments.",
                defaults: defaults
            )
            return
        }

        guard let command = DeviceCommand(rawValue: normalizedName) else {
            record(
                status: "unsupported_command",
                commandName: "unsupported",
                result: "Unsupported device command was ignored.",
                defaults: defaults
            )
            return
        }

        do {
            let result = try runSafeCommand(command)
            record(
                status: "completed_no_write",
                commandName: command.rawValue,
                result: result.shortcutValue,
                defaults: defaults
            )
        } catch {
            record(
                status: "failed_redacted",
                commandName: command.rawValue,
                result: CoachSafeOutput.errorMessage(error),
                defaults: defaults
            )
        }
    }

    private static func normalized(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    private static func record(status: String, commandName: String, result: String, defaults: UserDefaults) {
        defaults.set(CoachSafeOutput.redact(status), forKey: statusKey)
        defaults.set(CoachSafeOutput.redact(commandName), forKey: nameKey)
        defaults.set(Date().timeIntervalSince1970, forKey: updatedAtKey)
        defaults.set(CoachSafeOutput.redact(result), forKey: resultKey)
        defaults.synchronize()
    }
}
