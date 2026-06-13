import Foundation

protocol CoachURLSessioning {
    func data(for request: URLRequest) async throws -> (Data, URLResponse)
}

extension URLSession: CoachURLSessioning {}

protocol CoachAPIClienting {
    func postAppleHealthDaily(
        payload: AppleHealthDailyPayload,
        apiBase: String,
        apiSecret: String
    ) async throws -> AppleHealthSyncResponse

    func getSyncStatus(
        apiBase: String,
        apiSecret: String
    ) async throws -> CoachSyncStatusSummary

    func getCoachToday(
        apiBase: String,
        apiSecret: String
    ) async throws -> CoachTodaySummary

    func getWeeklyReview(
        apiBase: String,
        apiSecret: String,
        weekStart: String?,
        weekEnd: String?,
        timezone: String
    ) async throws -> CoachWeeklyReviewSummary

    func postDirectCoachAction(
        endpoint: CoachDirectActionEndpoint,
        request: DirectCoachActionRequest,
        apiBase: String,
        apiSecret: String
    ) async throws -> CoachDirectActionResponseSummary
}

struct CoachAPIClient: CoachAPIClienting {
    private let session: CoachURLSessioning

    init(session: CoachURLSessioning = URLSession.shared) {
        self.session = session
    }

    func postAppleHealthDaily(
        payload: AppleHealthDailyPayload,
        apiBase: String,
        apiSecret: String
    ) async throws -> AppleHealthSyncResponse {
        guard !apiSecret.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw CoachAPIError.missingSecret
        }

        guard let url = appleHealthDailyURL(from: apiBase) else {
            throw CoachAPIError.invalidBaseURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiSecret, forHTTPHeaderField: "x-coach-secret")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw CoachAPIError.invalidResponse
        }

        let decoder = JSONDecoder()
        if !(200..<300).contains(httpResponse.statusCode) {
            let decoded = try? decoder.decode(AppleHealthSyncResponse.self, from: data)
            throw CoachAPIError.requestFailed(
                statusCode: httpResponse.statusCode,
                message: Self.responseMessage(from: data) ?? decoded?.errors.first?.message
            )
        }

        let decoded = try decoder.decode(AppleHealthSyncResponse.self, from: data)
        guard decoded.ok else {
            throw CoachAPIError.server(statusCode: httpResponse.statusCode, response: decoded)
        }

        return decoded
    }

    func getSyncStatus(
        apiBase: String,
        apiSecret: String
    ) async throws -> CoachSyncStatusSummary {
        let data = try await authorizedGET(
            apiBase: apiBase,
            apiSecret: apiSecret,
            path: "/api/coach/sync-status"
        )
        return try CoachSyncStatusSummary.parse(data: data)
    }

    func getCoachToday(
        apiBase: String,
        apiSecret: String
    ) async throws -> CoachTodaySummary {
        let data = try await authorizedGET(
            apiBase: apiBase,
            apiSecret: apiSecret,
            path: "/api/coach/coach-today"
        )
        return try CoachTodaySummary.parse(data: data)
    }

    func getWeeklyReview(
        apiBase: String,
        apiSecret: String,
        weekStart: String? = nil,
        weekEnd: String? = nil,
        timezone: String = "Asia/Taipei"
    ) async throws -> CoachWeeklyReviewSummary {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "timezone", value: timezone)
        ]
        if let weekStart, !weekStart.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            queryItems.append(URLQueryItem(name: "week_start", value: weekStart))
        }
        if let weekEnd, !weekEnd.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            queryItems.append(URLQueryItem(name: "week_end", value: weekEnd))
        }

        let data = try await authorizedGET(
            apiBase: apiBase,
            apiSecret: apiSecret,
            path: "/api/coach/weekly-review",
            queryItems: queryItems
        )
        return try CoachWeeklyReviewSummary.parse(data: data)
    }

    func postDirectCoachAction(
        endpoint: CoachDirectActionEndpoint,
        request: DirectCoachActionRequest,
        apiBase: String,
        apiSecret: String
    ) async throws -> CoachDirectActionResponseSummary {
        let data = try await authorizedPOST(
            payload: request,
            apiBase: apiBase,
            apiSecret: apiSecret,
            path: endpoint.path
        )
        return try CoachDirectActionResponseSummary.parse(data: data, fallbackAction: endpoint.rawValue)
    }

    private func appleHealthDailyURL(from apiBase: String) -> URL? {
        coachURL(from: apiBase, path: "/api/coach/apple-health-daily")
    }

    private func coachURL(from apiBase: String, path: String) -> URL? {
        var trimmed = apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
        while trimmed.hasSuffix("/") {
            trimmed.removeLast()
        }

        guard !trimmed.isEmpty else { return nil }
        return URL(string: "\(trimmed)\(path)")
    }

    private func authorizedGET(
        apiBase: String,
        apiSecret: String,
        path: String,
        queryItems: [URLQueryItem] = []
    ) async throws -> Data {
        guard !apiSecret.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw CoachAPIError.missingSecret
        }

        guard let url = coachURL(from: apiBase, path: path) else {
            throw CoachAPIError.invalidBaseURL
        }

        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        components?.queryItems = queryItems.isEmpty ? nil : queryItems
        guard let finalURL = components?.url else {
            throw CoachAPIError.invalidBaseURL
        }

        var request = URLRequest(url: finalURL)
        request.httpMethod = "GET"
        request.setValue(apiSecret, forHTTPHeaderField: "x-coach-secret")

        return try await sendAuthorizedRequest(request)
    }

    private func authorizedPOST<Payload: Encodable>(
        payload: Payload,
        apiBase: String,
        apiSecret: String,
        path: String
    ) async throws -> Data {
        guard !apiSecret.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw CoachAPIError.missingSecret
        }

        guard let url = coachURL(from: apiBase, path: path) else {
            throw CoachAPIError.invalidBaseURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiSecret, forHTTPHeaderField: "x-coach-secret")
        request.httpBody = try JSONEncoder().encode(payload)

        return try await sendAuthorizedRequest(request)
    }

    private func sendAuthorizedRequest(_ request: URLRequest) async throws -> Data {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw CoachAPIError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw CoachAPIError.requestFailed(
                statusCode: httpResponse.statusCode,
                message: Self.responseMessage(from: data)
            )
        }

        return data
    }

    private static func responseMessage(from data: Data) -> String? {
        guard
            let object = try? JSONSerialization.jsonObject(with: data),
            let dictionary = object as? [String: Any]
        else {
            return nil
        }

        return dictionary["error"] as? String
            ?? dictionary["message"] as? String
    }
}

enum CoachAPIError: LocalizedError {
    case invalidBaseURL
    case invalidResponse
    case missingSecret
    case requestFailed(statusCode: Int, message: String?)
    case server(statusCode: Int, response: AppleHealthSyncResponse)

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL:
            "Enter a valid coach API base URL."
        case .invalidResponse:
            "The coach API returned an unexpected response."
        case .missingSecret:
            "Enter the coach API secret before syncing."
        case let .requestFailed(statusCode, message):
            if let message, !message.isEmpty {
                "Coach API request failed (\(statusCode)): \(message)"
            } else {
                "Coach API request failed with HTTP \(statusCode)."
            }
        case let .server(statusCode, response):
            if let firstError = response.errors.first?.message, !firstError.isEmpty {
                "Coach API rejected the sync (\(statusCode)): \(firstError)"
            } else {
                "Coach API rejected the sync with HTTP \(statusCode)."
            }
        }
    }

    var shortcutErrorCode: CoachShortcutErrorCode {
        switch self {
        case .invalidBaseURL:
            .missingAPIBase
        case .invalidResponse:
            .malformedResponse
        case .missingSecret:
            .missingSecret
        case let .requestFailed(statusCode, _):
            statusCode == 401 ? .unauthorized : .backendUnavailable
        case .server:
            .backendUnavailable
        }
    }
}
