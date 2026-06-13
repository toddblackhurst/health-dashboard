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

final class FakeCoachSecretStore: CoachSecretStoring {
    var secret: String

    init(secret: String = "") {
        self.secret = secret
    }

    func loadSecret() throws -> String {
        secret
    }

    func saveSecret(_ secret: String) throws {
        self.secret = secret
    }

    func deleteSecret() throws {
        secret = ""
    }
}

struct FakeSensitiveError: LocalizedError {
    let message: String

    var errorDescription: String? {
        message
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

    func testSafeOutputRedactsCredentialLikeValues() {
        let fakeSecret = "fake-coach-secret-12345"
        let fakeBearer = "fakeBearerTokenValue123456"
        let fakePassword = "fakePasswordValue123456"
        let fakeQueryToken = "fakeQueryTokenValue123456"
        let fakeURLPassword = "fake-url-password"
        let input = """
        x-coach-secret: \(fakeSecret)
        Authorization: Bearer \(fakeBearer)
        password=\(fakePassword)
        https://todd:\(fakeURLPassword)@coach.example.test/api/coach?coach_secret=\(fakeQueryToken)
        """

        let redacted = CoachSafeOutput.redact(input)

        XCTAssertFalse(redacted.contains(fakeSecret))
        XCTAssertFalse(redacted.contains(fakeBearer))
        XCTAssertFalse(redacted.contains(fakePassword))
        XCTAssertFalse(redacted.contains(fakeQueryToken))
        XCTAssertFalse(redacted.contains(fakeURLPassword))
        XCTAssertTrue(redacted.contains("[redacted]"))
    }

    func testShortcutFailureRedactsCredentialBearingError() {
        let fakeSecret = "fake-coach-secret-98765"
        let fakeBearer = "fakeBearerTokenValue987654"
        let error = FakeSensitiveError(
            message: "Request failed with x-coach-secret: \(fakeSecret) and Authorization: Bearer \(fakeBearer)"
        )

        let output = CoachShortcutOutput.failure(error: error)
        let text = output.shortcutText

        XCTAssertEqual(output.errorIdentifier, .backendUnavailable)
        XCTAssertFalse(text.contains(fakeSecret))
        XCTAssertFalse(text.contains(fakeBearer))
        XCTAssertTrue(text.contains("error_message: Request failed with x-coach-secret: [redacted]"))
    }

    func testShortcutTextRedactsSensitiveFields() {
        let fakeToken = "fakeTokenValue123456789"
        let output = CoachShortcutOutput(
            actionStatus: "failed token=\(fakeToken)",
            safetyStatus: .unknown,
            readinessSummary: "Do not expose api_key=\(fakeToken)",
            workoutTitle: "Secret-bearing title secret=\(fakeToken)",
            workoutType: .unknown,
            primaryConstraints: ["Authorization: Bearer \(fakeToken)"],
            coachMemoryContext: "x-coach-secret: \(fakeToken)",
            workoutDebriefContext: "password=\(fakeToken)",
            nextBestAction: "Open https://user:\(fakeToken)@coach.example.test",
            requiresMedicalCaution: false,
            sourceFreshness: "token=\(fakeToken)",
            lastSync: "credential=\(fakeToken)",
            errorIdentifier: .backendUnavailable,
            errorMessage: "secret=\(fakeToken)"
        )

        let text = output.shortcutText

        XCTAssertFalse(text.contains(fakeToken))
        XCTAssertTrue(text.contains("[redacted]"))
    }

    func testDraftOutputRedactsCredentialLikeNotesAndStaysNoWrite() {
        let fakeSecret = "fake-draft-secret-123456"
        let result = MorningCoachWorkflow().draftCoachNote(
            note: "Remember x-coach-secret: \(fakeSecret)"
        )

        XCTAssertFalse(result.shortcutValue.contains(fakeSecret))
        XCTAssertTrue(result.shortcutValue.contains("No production write was sent."))
        XCTAssertTrue(result.shortcutValue.contains("deferredWrite"))
    }

    func testActionResultRedactsDetailBeforeAppDisplay() {
        let fakeSecret = "fake-result-secret-123456"
        let result = MorningCoachActionResult(
            title: "Coach readback token=\(fakeSecret)",
            detail: "Raw result x-coach-secret: \(fakeSecret)"
        )

        XCTAssertFalse(result.title.contains(fakeSecret))
        XCTAssertFalse(result.detail.contains(fakeSecret))
        XCTAssertFalse(result.shortcutValue.contains(fakeSecret))
        XCTAssertTrue(result.detail.contains("[redacted]"))
    }

    func testMorningCoachStoreRedactsPersistedReadbacks() throws {
        let fakeSecret = "fake-store-secret-123456"
        let suiteName = "CoachStoreRedactionTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)

        store.recordCoachReadback(summary: "Server said secret=\(fakeSecret)")
        store.recordMorningCoach(result: "Morning result token=\(fakeSecret)")
        store.recordBackgroundHealthKit(status: "Background auth=\(fakeSecret)")

        XCTAssertFalse(store.lastCoachReadbackText.contains(fakeSecret))
        XCTAssertFalse(store.lastMorningCoachResult.contains(fakeSecret))
        XCTAssertFalse(store.lastBackgroundHealthKitText.contains(fakeSecret))
        XCTAssertTrue(store.lastCoachReadbackText.contains("[redacted]"))
        XCTAssertTrue(store.lastMorningCoachResult.contains("[redacted]"))
        XCTAssertTrue(store.lastBackgroundHealthKitText.contains("[redacted]"))
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

    func testMockedClientFailureRedactsServerCredentialMessage() async throws {
        let fakeSecret = "fake-server-secret-123456"
        let data = """
        {
          "error": "Invalid x-coach-secret: \(fakeSecret)"
        }
        """.data(using: .utf8)!
        let session = MockCoachURLSession(responseData: data, statusCode: 401)
        let client = CoachAPIClient(session: session)

        do {
            _ = try await client.getSyncStatus(
                apiBase: "https://coach.example.test",
                apiSecret: "fake-request-secret"
            )
            XCTFail("Expected request to fail")
        } catch {
            let text = CoachShortcutOutput.failure(error: error).shortcutText
            XCTAssertFalse(text.contains(fakeSecret))
            XCTAssertTrue(text.contains("error_identifier: unauthorized"))
            XCTAssertTrue(text.contains("x-coach-secret: [redacted]"))
        }

        XCTAssertEqual(session.lastRequest?.url?.host, "coach.example.test")
    }

    func testCoachConnectionConfigurationReportsSetupStatesWithoutSecrets() {
        let missing = CoachConnectionConfiguration(apiBase: "", secret: "")
        XCTAssertEqual(missing.status.state, .notConfigured)
        XCTAssertEqual(missing.status.errorIdentifier, .notConfigured)
        XCTAssertTrue(missing.status.shortcutOutput.shortcutText.contains("No secret value is included"))

        let missingBase = CoachConnectionConfiguration(apiBase: "", secret: "test-secret")
        XCTAssertEqual(missingBase.status.state, .missingAPIBase)
        XCTAssertEqual(missingBase.status.errorIdentifier, .missingAPIBase)

        let invalidBase = CoachConnectionConfiguration(apiBase: "not a url", secret: "test-secret")
        XCTAssertEqual(invalidBase.status.state, .invalidAPIBase)
        XCTAssertEqual(invalidBase.status.errorIdentifier, .missingAPIBase)

        let missingSecret = CoachConnectionConfiguration(apiBase: "https://coach.example.test", secret: "")
        XCTAssertEqual(missingSecret.status.state, .missingSecret)
        XCTAssertEqual(missingSecret.status.errorIdentifier, .missingSecret)

        let ready = CoachConnectionConfiguration(apiBase: "https://coach.example.test", secret: "test-secret")
        XCTAssertEqual(ready.status.state, .configuredLocally)
        XCTAssertNil(ready.status.errorIdentifier)
        XCTAssertTrue(ready.status.isReadyForProtectedRequests)
    }

    func testConfigurationErrorBuildsStableShortcutFailureOutput() {
        let status = CoachConnectionConfiguration(apiBase: "https://coach.example.test", secret: "").status
        let output = CoachShortcutOutput.failure(error: CoachConfigurationError(status: status))

        XCTAssertEqual(output.actionStatus, "not_configured")
        XCTAssertEqual(output.errorIdentifier, .missingSecret)
        XCTAssertTrue(output.shortcutText.contains("No production write was sent."))
        XCTAssertTrue(output.shortcutText.contains("No secret value is included"))
    }

    func testMorningCoachSetupCheckUsesFakeSecretStore() throws {
        let suiteName = "CoachTodaySummaryTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)
        store.apiBase = "https://coach.example.test"
        let workflow = MorningCoachWorkflow(
            keychainStore: FakeCoachSecretStore(secret: ""),
            store: store
        )

        let result = try workflow.checkSetup()

        XCTAssertEqual(result.shortcutOutput?.errorIdentifier, .missingSecret)
        XCTAssertTrue(result.shortcutValue.contains("status: not_configured"))
        XCTAssertTrue(result.shortcutValue.contains("Missing Coach API secret"))
    }

    func testReadinessReportShowsSetupRequiredWithoutSecrets() {
        let fakeSecret = "fake-readiness-secret-123456"
        let status = CoachConnectionConfiguration(
            apiBase: "",
            secret: fakeSecret
        ).status
        let report = CoachReadinessReport.local(setupStatus: status)
        let text = report.shortcutText

        XCTAssertEqual(report.actionStatus, "setup_required")
        XCTAssertTrue(text.contains("local_app_configuration: needs_setup"))
        XCTAssertTrue(text.contains("protected_read_only_routes: needs_setup"))
        XCTAssertTrue(text.contains("direct_coach_action_write_hold: held"))
        XCTAssertTrue(text.contains("draft_only_capture: ready"))
        XCTAssertFalse(text.contains(fakeSecret))
        XCTAssertTrue(text.contains("No production write was sent."))
        XCTAssertTrue(text.contains("No secret value is included."))
    }

    func testReadinessReportMarksDeviceBoundAfterLocalConfiguration() {
        let report = CoachReadinessReport.local(
            setupStatus: CoachConnectionConfiguration(
                apiBase: "https://coach.example.test",
                secret: "fake-local-secret"
            ).status,
            publicPing: .healthy
        )
        let text = report.shortcutText

        XCTAssertEqual(report.actionStatus, "todd_device_verification_required")
        XCTAssertTrue(text.contains("local_app_configuration: ready"))
        XCTAssertTrue(text.contains("public_ping: ready"))
        XCTAssertTrue(text.contains("protected_read_only_routes: device_bound"))
        XCTAssertTrue(text.contains("healthkit_permissions: device_bound"))
        XCTAssertTrue(text.contains("siri_shortcuts: device_bound"))
        XCTAssertTrue(text.contains("action_button: device_bound"))
        XCTAssertTrue(text.contains("personal_automation: device_bound"))
        XCTAssertTrue(text.contains("direct_coach_action_write_hold: held"))
    }

    func testReadinessWorkflowDoesNotCallNetworkAndKeepsNoWriteBoundary() throws {
        let suiteName = "CoachReadinessWorkflowTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)
        store.apiBase = "https://coach.example.test"
        let session = MockCoachURLSession(responseData: Data())
        let client = CoachAPIClient(session: session)
        let workflow = MorningCoachWorkflow(
            apiClient: client,
            keychainStore: FakeCoachSecretStore(secret: "fake-local-secret"),
            store: store
        )

        let result = try workflow.checkReadiness()
        let detail = result.detail

        XCTAssertNil(session.lastRequest)
        XCTAssertTrue(detail.contains("readiness_status: todd_device_verification_required"))
        XCTAssertTrue(detail.contains("No production write was sent."))
        XCTAssertTrue(detail.contains("direct_coach_action_write_hold: held"))
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
