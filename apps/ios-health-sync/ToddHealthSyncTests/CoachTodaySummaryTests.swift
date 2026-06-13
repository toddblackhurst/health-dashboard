import XCTest
@testable import ToddHealthSync

final class MockCoachURLSession: CoachURLSessioning {
    var lastRequest: URLRequest?
    var responseData: Data
    var statusCode: Int

    init(responseData: Data, statusCode: Int = 200) {
        self.responseData = responseData
        self.statusCode = statusCode
    }

    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        lastRequest = request
        let response = HTTPURLResponse(
            url: request.url!,
            statusCode: statusCode,
            httpVersion: nil,
            headerFields: nil
        )!
        return (responseData, response)
    }
}

final class CoachTodaySummaryTests: XCTestCase {
    func testStructuredCoachTodayResponseBuildsMorningCoachSummary() throws {
        let json = """
        {
          "date": "2026-06-09",
          "daily_call": {
            "color": "Yellow",
            "readiness_tier": "Yellow",
            "decision": "Keep strength conservative."
          },
          "why": [
            "Garmin recovery is current.",
            "Rack/Motra strength history is available."
          ],
          "todays_plan": {
            "type": "strength",
            "primary_action": "World Gym strength session",
            "recommendation": "Upper/lower strength",
            "time_cap_min": 45,
            "intensity": "moderate",
            "nutrition_focus": "hit protein"
          },
          "safety_guardrails": [
            "Pain >=4/10 means downshift."
          ],
          "what_to_track_today": [
            "Log the workout in Rack/Motra."
          ]
        }
        """.data(using: .utf8)!

        let summary = try CoachTodaySummary.parse(data: json)
        let result = summary.conciseResult(syncStatus: nil)

        XCTAssertTrue(result.contains("Yellow: Keep strength conservative."))
        XCTAssertTrue(result.contains("Today: World Gym strength session"))
        XCTAssertTrue(result.contains("Upper/lower strength"))
        XCTAssertTrue(result.contains("45 min cap"))
        XCTAssertTrue(result.contains("Warnings:"))
        XCTAssertTrue(result.contains("Next: Log the workout in Rack/Motra."))
        XCTAssertTrue(result.contains("Apple Health is supporting evidence only."))
    }

    func testCoachTodayBuildsStableShortcutOutput() throws {
        let json = """
        {
          "date": "2026-06-13",
          "daily_call": "Yellow: proceed conservatively.",
          "todays_plan": {
            "primary_action": "World Gym strength session",
            "time_cap_min": 45
          },
          "safety_guardrails": [
            "BP missing means stay conservative.",
            "Pain >=4/10 means downshift."
          ],
          "what_to_track_today": [
            "Log completed sets in Rack/Motra."
          ]
        }
        """.data(using: .utf8)!

        let summary = try CoachTodaySummary.parse(data: json)
        let output = summary.shortcutOutput

        XCTAssertEqual(output.safetyStatus, .yellow)
        XCTAssertEqual(output.workoutType, .strength)
        XCTAssertTrue(output.requiresMedicalCaution)
        XCTAssertEqual(output.nextBestAction, "Log completed sets in Rack/Motra.")
        XCTAssertTrue(output.shortcutText.contains("safety_status: yellow"))
        XCTAssertTrue(output.shortcutText.contains("primary_constraints:"))
        XCTAssertTrue(output.shortcutText.contains("Apple Health is supporting evidence only."))
    }

    func testWeeklyReviewResponseBuildsReadOnlyShortcutOutput() throws {
        let json = """
        {
          "ok": true,
          "action": "weekly-review",
          "status": "review_only",
          "week_start": "2026-06-08",
          "week_end": "2026-06-14",
          "review": {
            "overall_call": "Yellow — proceed conservatively.",
            "key_findings": [
              "Strength: one Rack/Motra-verified session.",
              "Nutrition: zero Garmin Nutrition days."
            ]
          },
          "recommendations": [
            { "summary": "Keep progression conservative." }
          ],
          "missing_or_stale_data_warnings": [
            "Blood pressure missing/stale."
          ],
          "not_applied_automatically": true
        }
        """.data(using: .utf8)!

        let review = try CoachWeeklyReviewSummary.parse(data: json)

        XCTAssertEqual(review.status, "review_only")
        XCTAssertEqual(review.shortcutOutput.safetyStatus, .yellow)
        XCTAssertEqual(review.shortcutOutput.errorIdentifier, nil)
        XCTAssertTrue(review.conciseResult.contains("not_applied_automatically: true"))
        XCTAssertTrue(review.shortcutOutput.shortcutText.contains("next_best_action: Keep progression conservative."))
    }

    func testDirectCoachActionResponseBuildsWorkoutShortcutOutput() throws {
        let json = """
        {
          "ok": true,
          "action": "workout",
          "reply": "Use the controlled strength plan.",
          "decision": {
            "top_line_call": "Yellow: controlled strength only.",
            "next_actions": [
              "Use World Gym floor-aware workout plan."
            ],
            "risk_flags": [
              "No hard conditioning."
            ],
            "workout_plan": {
              "top_line": "Controlled World Gym strength",
              "session_type": "strength"
            },
            "coach_memory_context": {
              "summary": "Use conservative density."
            },
            "workout_debrief_context": {
              "summary": "Recent pain means cap load."
            }
          }
        }
        """.data(using: .utf8)!

        let response = try CoachDirectActionResponseSummary.parse(data: json, fallbackAction: "workout")
        let output = response.shortcutOutput

        XCTAssertEqual(response.action, "workout")
        XCTAssertEqual(output.safetyStatus, .yellow)
        XCTAssertEqual(output.workoutTitle, "Controlled World Gym strength")
        XCTAssertEqual(output.workoutType, .strength)
        XCTAssertEqual(output.coachMemoryContext, "Use conservative density.")
        XCTAssertEqual(output.workoutDebriefContext, "Recent pain means cap load.")
        XCTAssertTrue(response.conciseResult.contains("Apple Health is supporting evidence only."))
    }

    func testDeferredDraftOutputMakesNoWriteBoundaryExplicit() throws {
        let output = CoachShortcutOutput.deferred(
            readinessSummary: "Draft blood pressure: 120/80.",
            nextBestAction: "Review and submit BP from an approved intake path.",
            errorMessage: "Blood pressure write is deferred."
        )

        XCTAssertEqual(output.actionStatus, "deferred_requires_review")
        XCTAssertEqual(output.errorIdentifier, .deferredWrite)
        XCTAssertTrue(output.shortcutText.contains("No production write was sent."))
        XCTAssertTrue(output.shortcutText.contains("error_identifier: deferredWrite"))
    }

    func testCoachAPIErrorMapsToStableShortcutErrorCode() {
        XCTAssertEqual(CoachAPIError.missingSecret.shortcutErrorCode, .missingSecret)
        XCTAssertEqual(CoachAPIError.invalidBaseURL.shortcutErrorCode, .missingAPIBase)
        XCTAssertEqual(
            CoachAPIError.requestFailed(statusCode: 401, message: "Invalid coach API secret.").shortcutErrorCode,
            .unauthorized
        )
        XCTAssertEqual(
            CoachAPIError.requestFailed(statusCode: 503, message: nil).shortcutErrorCode,
            .backendUnavailable
        )
    }

    func testWeeklyReviewClientUsesReadOnlyEndpointAndSecretHeader() async throws {
        let data = """
        {
          "ok": true,
          "action": "weekly-review",
          "status": "review_only",
          "week_start": "2026-06-08",
          "week_end": "2026-06-14",
          "review": {
            "overall_call": "Yellow"
          },
          "not_applied_automatically": true
        }
        """.data(using: .utf8)!
        let session = MockCoachURLSession(responseData: data)
        let client = CoachAPIClient(session: session)

        let review = try await client.getWeeklyReview(
            apiBase: "https://coach.example.test/",
            apiSecret: "test-secret",
            weekStart: "2026-06-08",
            weekEnd: "2026-06-14",
            timezone: "Asia/Taipei"
        )

        let request = try XCTUnwrap(session.lastRequest)
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "x-coach-secret"), "test-secret")
        XCTAssertEqual(request.url?.path, "/api/coach/weekly-review")
        let components = try XCTUnwrap(URLComponents(url: try XCTUnwrap(request.url), resolvingAgainstBaseURL: false))
        let query = Dictionary(uniqueKeysWithValues: (components.queryItems ?? []).map { ($0.name, $0.value ?? "") })
        XCTAssertEqual(query["week_start"], "2026-06-08")
        XCTAssertEqual(query["week_end"], "2026-06-14")
        XCTAssertEqual(query["timezone"], "Asia/Taipei")
        XCTAssertEqual(review.status, "review_only")
    }

    func testDirectCoachActionClientUsesMockedPostBoundary() async throws {
        let data = """
        {
          "ok": true,
          "action": "nutrition-closeout",
          "reply": "Closeout complete.",
          "decision": {
            "top_line_call": "Green: nutrition is on track.",
            "next_actions": ["Keep protein steady."]
          }
        }
        """.data(using: .utf8)!
        let session = MockCoachURLSession(responseData: data)
        let client = CoachAPIClient(session: session)

        let response = try await client.postDirectCoachAction(
            endpoint: .nutritionCloseout,
            request: DirectCoachActionRequest(
                text: "Run nutrition closeout.",
                summary: nil,
                intent: "nutrition_check",
                requestedSessionType: nil,
                scheduleOverride: nil,
                targetDate: nil,
                targetDay: nil,
                timezone: "Asia/Taipei",
                channel: "ios-app-intent-test",
                raw: ["source": "unit-test"]
            ),
            apiBase: "https://coach.example.test",
            apiSecret: "test-secret"
        )

        let request = try XCTUnwrap(session.lastRequest)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "x-coach-secret"), "test-secret")
        XCTAssertEqual(request.url?.path, "/api/coach/nutrition-closeout")
        let body = try XCTUnwrap(request.httpBody)
        let object = try JSONSerialization.jsonObject(with: body) as? [String: Any]
        XCTAssertEqual(object?["intent"] as? String, "nutrition_check")
        XCTAssertEqual(object?["channel"] as? String, "ios-app-intent-test")
        XCTAssertEqual(response.shortcutOutput.safetyStatus, .green)
    }
}
