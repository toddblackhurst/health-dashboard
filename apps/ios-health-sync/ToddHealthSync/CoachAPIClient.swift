import Foundation

struct CoachAPIClient {
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

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw CoachAPIError.invalidResponse
        }

        let decoded = try JSONDecoder().decode(AppleHealthSyncResponse.self, from: data)
        guard (200..<300).contains(httpResponse.statusCode), decoded.ok else {
            throw CoachAPIError.server(statusCode: httpResponse.statusCode, response: decoded)
        }

        return decoded
    }

    private func appleHealthDailyURL(from apiBase: String) -> URL? {
        var trimmed = apiBase.trimmingCharacters(in: .whitespacesAndNewlines)
        while trimmed.hasSuffix("/") {
            trimmed.removeLast()
        }

        guard !trimmed.isEmpty else { return nil }
        return URL(string: "\(trimmed)/api/coach/apple-health-daily")
    }
}

enum CoachAPIError: LocalizedError {
    case invalidBaseURL
    case invalidResponse
    case missingSecret
    case server(statusCode: Int, response: AppleHealthSyncResponse)

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL:
            "Enter a valid coach API base URL."
        case .invalidResponse:
            "The coach API returned an unexpected response."
        case .missingSecret:
            "Enter the coach API secret before syncing."
        case let .server(statusCode, response):
            if let firstError = response.errors.first?.message, !firstError.isEmpty {
                "Coach API rejected the sync (\(statusCode)): \(firstError)"
            } else {
                "Coach API rejected the sync with HTTP \(statusCode)."
            }
        }
    }
}
