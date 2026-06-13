import XCTest
@testable import ToddHealthSync

final class MockCoachURLSession: CoachURLSessioning {
    var lastRequest: URLRequest?
    var requestCount = 0
    var responseData: Data
    var statusCode: Int
    var thrownError: Error?
    var responseOverride: URLResponse?

    init(responseData: Data, statusCode: Int = 200, thrownError: Error? = nil, responseOverride: URLResponse? = nil) {
        self.responseData = responseData
        self.statusCode = statusCode
        self.thrownError = thrownError
        self.responseOverride = responseOverride
    }

    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        lastRequest = request
        requestCount += 1
        if let thrownError {
            throw thrownError
        }
        if let responseOverride {
            return (responseData, responseOverride)
        }
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
        XCTAssertEqual(output.setupStatus, .configuredLocally)
        XCTAssertEqual(output.readinessStatus, .attentionRequired)
        XCTAssertEqual(output.protectedVerificationStatus, .verifiedReadOnly)
        XCTAssertEqual(output.writeStatus, .noWrite)
        XCTAssertEqual(output.workoutType, .strength)
        XCTAssertTrue(output.requiresMedicalCaution)
        XCTAssertEqual(output.nextBestAction, "Log completed sets in Rack/Motra.")
        XCTAssertTrue(output.shortcutText.contains("setup_status: configured_locally"))
        XCTAssertTrue(output.shortcutText.contains("readiness_status: attention_required"))
        XCTAssertTrue(output.shortcutText.contains("protected_verification_status: verified_read_only"))
        XCTAssertTrue(output.shortcutText.contains("write_status: no_write"))
        XCTAssertTrue(output.shortcutText.contains("safety_status: yellow"))
        XCTAssertTrue(output.shortcutText.contains("primary_constraints:"))
        XCTAssertTrue(output.shortcutText.contains("Apple Health is supporting evidence only."))
    }

    func testCoachTodayRedSafetySuppressesHardTrainingSurfaceText() throws {
        let json = """
        {
          "date": "2026-06-13",
          "daily_call": "Red: medical caution today.",
          "todays_plan": {
            "primary_action": "Go train hard at World Gym",
            "recommendation": "Full send heavy strength",
            "time_cap_min": 60
          },
          "safety_guardrails": [
            "Red safety: blood pressure and pain require hold.",
            "Doctor guidance overrides device data."
          ],
          "what_to_track_today": [
            "Go train hard and log heavy sets."
          ]
        }
        """.data(using: .utf8)!

        let summary = try CoachTodaySummary.parse(data: json)
        let output = summary.shortcutOutput
        let text = output.shortcutText
        let surfaces = output.safeSurfaceStrings.contractText

        XCTAssertEqual(output.safetyStatus, .red)
        XCTAssertEqual(output.readinessStatus, .attentionRequired)
        XCTAssertEqual(output.writeStatus, .noWrite)
        XCTAssertEqual(output.workoutTitle, nil)
        XCTAssertEqual(output.workoutType, .none)
        XCTAssertTrue(output.requiresMedicalCaution)
        XCTAssertEqual(output.nextBestAction, CoachTodaySummary.redSafetyNextAction)
        XCTAssertTrue(text.contains("safety_status: red"))
        XCTAssertTrue(text.contains("next_best_action: \(CoachTodaySummary.redSafetyNextAction)"))
        assertNoHardTrainingPermission(in: text)
        assertNoHardTrainingPermission(in: surfaces)
        assertNoCredentialLeak(in: text)
        assertNoCredentialLeak(in: surfaces)
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
        XCTAssertEqual(review.shortcutOutput.readinessStatus, .staleOrMissing)
        XCTAssertEqual(review.shortcutOutput.writeStatus, .noWrite)
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
              "session_type": "strength",
              "environment": "World Gym Taichung",
              "floor_plan": "Floor 3 primer -> Floor 2 strength anchors",
              "target_minutes": 45,
              "time_range_min": [40, 55],
              "post_workout_debrief_prompt": "Send duration, RPE, best movement, worst movement, and pain score.",
              "guardrails": [
                "Keep pain below 4/10."
              ],
              "rack_entry_lines": [
                "Assisted Pull-Up | assisted pull-up machine | 3 x 4-6"
              ],
              "blocks": [
                {
                  "name": "Main strength",
                  "target": "Controlled upper pull work.",
                  "floor": "Floor 2",
                  "estimated_min": 18,
                  "status": "planned",
                  "exercises": [
                    {
                      "rack_motra_name": "Assisted Pull-Up",
                      "tracking_app": "Rack",
                      "equipment": "assisted pull-up machine",
                      "floor": "2F strength",
                      "note": "Pause cleanly at the top.",
                      "safety_modification": "Increase assistance if reps grind.",
                      "prescription": {
                        "sets": 3,
                        "reps": "4-6",
                        "load": "assistance that leaves clean reps",
                        "rest": "90 sec"
                      },
                      "rack_entry_line": "Assisted Pull-Up | assisted pull-up machine | 3 x 4-6"
                    }
                  ]
                }
              ]
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
        XCTAssertEqual(output.setupStatus, .configuredLocally)
        XCTAssertEqual(output.protectedVerificationStatus, .verifiedReadOnly)
        XCTAssertEqual(output.writeStatus, .manualHandoffOnly)
        XCTAssertEqual(response.workoutHandoff?.manualStatus, "manual_handoff_only_no_write")
        XCTAssertTrue(output.shortcutText.contains("workout_handoff:"))
        XCTAssertTrue(output.shortcutText.contains("write_status: manual_handoff_only_no_write"))
        XCTAssertTrue(output.shortcutText.contains("rack_garmin_status: manual_handoff_only"))
        XCTAssertTrue(output.shortcutText.contains("third_party_automation: none"))
        XCTAssertTrue(output.shortcutText.contains("Assisted Pull-Up"))
        XCTAssertTrue(output.shortcutText.contains("3 x 4-6"))
        XCTAssertTrue(output.shortcutText.contains("plan_details:"))
        XCTAssertTrue(output.shortcutText.contains("floor_plan: Floor 3 primer -> Floor 2 strength anchors"))
        XCTAssertTrue(output.shortcutText.contains("target_minutes: 45"))
        XCTAssertTrue(output.shortcutText.contains("time_range_min: 40-55"))
        XCTAssertTrue(output.shortcutText.contains("estimated_min: 18"))
        XCTAssertTrue(output.shortcutText.contains("tracking: Rack"))
        XCTAssertTrue(output.shortcutText.contains("assistance that leaves clean reps"))
        XCTAssertTrue(output.shortcutText.contains("modify: Increase assistance if reps grind."))
        XCTAssertTrue(output.shortcutText.contains("rack_manual_entry:"))
        XCTAssertTrue(output.shortcutText.contains("garmin_manual_entry: Start and save the matching Garmin workout manually"))
        XCTAssertTrue(output.shortcutText.contains("No third-party app entry was automated."))
        XCTAssertTrue(output.shortcutText.contains("No production write was sent."))
        XCTAssertTrue(response.conciseResult.contains("Apple Health is supporting evidence only."))
    }

    func testBuildWorkoutRedSafetySuppressesWorkoutHandoffAndHardTrainingPermission() throws {
        let json = """
        {
          "ok": true,
          "action": "workout",
          "reply": "Red safety hold.",
          "decision": {
            "top_line_call": "Red: do not train today.",
            "next_actions": [
              "Go train hard at World Gym."
            ],
            "risk_flags": [
              "Red safety: sharp pain and blood pressure caution.",
              "Doctor guidance overrides device data."
            ],
            "workout_plan": {
              "top_line": "Full send heavy strength",
              "session_type": "strength",
              "rack_entry_lines": [
                "Back Squat | barbell | 5 x 5 heavy"
              ],
              "blocks": [
                {
                  "name": "Heavy strength",
                  "exercises": [
                    {
                      "rack_motra_name": "Back Squat",
                      "equipment": "barbell",
                      "prescription": {
                        "sets": 5,
                        "reps": "5",
                        "load": "heavy"
                      },
                      "rack_entry_line": "Back Squat | barbell | 5 x 5 heavy"
                    }
                  ]
                }
              ]
            }
          }
        }
        """.data(using: .utf8)!

        let response = try CoachDirectActionResponseSummary.parse(data: json, fallbackAction: "workout")
        let output = response.shortcutOutput
        let text = output.shortcutText
        let surfaces = output.safeSurfaceStrings.contractText

        XCTAssertNil(response.workoutHandoff)
        XCTAssertEqual(output.safetyStatus, .red)
        XCTAssertEqual(output.writeStatus, .noWrite)
        XCTAssertEqual(output.workoutTitle, nil)
        XCTAssertEqual(output.workoutType, .none)
        XCTAssertTrue(output.requiresMedicalCaution)
        XCTAssertEqual(output.nextBestAction, CoachTodaySummary.redSafetyNextAction)
        XCTAssertFalse(text.contains("workout_handoff:"))
        XCTAssertFalse(text.contains("Back Squat"))
        XCTAssertFalse(text.contains("5 x 5 heavy"))
        assertNoHardTrainingPermission(in: text)
        assertNoHardTrainingPermission(in: surfaces)
        assertNoCredentialLeak(in: text)
        assertNoCredentialLeak(in: surfaces)
    }

    func testWorkoutHandoffRedactsCredentialLikeValuesAndStaysManualOnly() throws {
        let fakeToken = "fakeWorkoutToken123456789"
        let json = """
        {
          "ok": true,
          "action": "workout",
          "reply": "Use the controlled plan.",
          "decision": {
            "top_line_call": "Yellow token=\(fakeToken)",
            "next_actions": [
              "Open https://user:\(fakeToken)@coach.example.test"
            ],
            "risk_flags": [
              "x-coach-secret: \(fakeToken)"
            ],
            "workout_plan": {
              "top_line": "Strength secret=\(fakeToken)",
              "session_type": "strength",
              "blocks": [
                {
                  "name": "Main",
                  "exercises": [
                    {
                      "rack_motra_name": "Cable Row token=\(fakeToken)",
                      "equipment": "Cable station",
                      "sets": 3,
                      "reps": "10",
                      "rest": "60 sec",
                      "rack_entry_line": "Cable Row | token=\(fakeToken)"
                    }
                  ]
                }
              ]
            }
          }
        }
        """.data(using: .utf8)!

        let response = try CoachDirectActionResponseSummary.parse(data: json, fallbackAction: "workout")
        let text = response.shortcutOutput.shortcutText

        XCTAssertFalse(text.contains(fakeToken))
        XCTAssertTrue(text.contains("[redacted]"))
        XCTAssertTrue(text.contains("manual_status: manual_handoff_only_no_write"))
        XCTAssertTrue(text.contains("third_party_automation: none"))
        XCTAssertTrue(text.contains("No production write was sent."))
    }

    func testBuildWorkoutDoesNotCallNetworkWhenSetupIncomplete() async throws {
        let suiteName = "BuildWorkoutSetupGateTests-\(UUID().uuidString)"
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
            keychainStore: FakeCoachSecretStore(secret: ""),
            store: store
        )

        do {
            _ = try await workflow.buildTodaysWorkout(
                requestText: "Build today's workout.",
                requestedSessionType: "strength",
                scheduleOverride: false
            )
            XCTFail("Expected missing setup to stop before network")
        } catch {
            XCTAssertNil(session.lastRequest)
            let text = CoachShortcutOutput.failure(error: error).shortcutText
            XCTAssertTrue(text.contains("error_identifier: missingSecret"))
            XCTAssertFalse(text.localizedCaseInsensitiveContains("x-coach-secret: fake"))
        }
    }

    func testCanITrainRedSafetyCarriesTypedNoWriteOutput() async throws {
        let data = """
        {
          "date": "2026-06-13",
          "daily_call": "Red: hold training today.",
          "todays_plan": {
            "primary_action": "Go train hard at World Gym"
          },
          "safety_guardrails": [
            "Red safety: asthma symptoms and blood pressure need review."
          ],
          "what_to_track_today": [
            "Go train hard."
          ]
        }
        """.data(using: .utf8)!
        let suiteName = "CanITrainRedSafetyTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)
        store.apiBase = "https://coach.example.test"
        let session = MockCoachURLSession(responseData: data)
        let workflow = MorningCoachWorkflow(
            apiClient: CoachAPIClient(session: session),
            keychainStore: FakeCoachSecretStore(secret: "fake-local-secret"),
            store: store
        )

        let result = try await workflow.canITrain()
        let output = try XCTUnwrap(result.shortcutOutput)
        let request = try XCTUnwrap(session.lastRequest)
        let text = result.shortcutValue
        let surfaces = output.safeSurfaceStrings.contractText

        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.url?.path, "/api/coach/coach-today")
        XCTAssertEqual(output.actionStatus, "medical_caution")
        XCTAssertEqual(output.safetyStatus, .red)
        XCTAssertEqual(output.writeStatus, .noWrite)
        XCTAssertEqual(output.workoutTitle, nil)
        XCTAssertEqual(output.workoutType, .none)
        XCTAssertTrue(output.requiresMedicalCaution)
        XCTAssertEqual(output.nextBestAction, CoachTodaySummary.redSafetyNextAction)
        XCTAssertTrue(text.contains("status: medical_caution"))
        XCTAssertTrue(text.contains("training_class: medical_caution"))
        XCTAssertFalse(text.contains("fake-local-secret"))
        assertNoHardTrainingPermission(in: text)
        assertNoHardTrainingPermission(in: surfaces)
        assertNoCredentialLeak(in: text)
        assertNoCredentialLeak(in: surfaces)
    }

    func testDeferredDraftOutputMakesNoWriteBoundaryExplicit() throws {
        let output = CoachShortcutOutput.deferred(
            readinessSummary: "Draft blood pressure: 120/80.",
            nextBestAction: "Review and submit BP from an approved intake path.",
            errorMessage: "Blood pressure write is deferred."
        )

        XCTAssertEqual(output.actionStatus, "deferred_requires_review")
        XCTAssertEqual(output.errorIdentifier, .deferredWrite)
        XCTAssertEqual(output.setupStatus, .notApplicable)
        XCTAssertEqual(output.readinessStatus, .deferred)
        XCTAssertEqual(output.protectedVerificationStatus, .notRequired)
        XCTAssertEqual(output.writeStatus, .draftOnly)
        XCTAssertTrue(output.shortcutText.contains("No production write was sent."))
        XCTAssertTrue(output.shortcutText.contains("error_identifier: deferredWrite"))
        XCTAssertTrue(output.shortcutText.contains("write_status: draft_only_no_write"))
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
        XCTAssertFalse(redacted.localizedCaseInsensitiveContains("x-coach-secret"))
        XCTAssertFalse(redacted.localizedCaseInsensitiveContains("Authorization: Bearer"))
        XCTAssertFalse(redacted.localizedCaseInsensitiveContains("password="))
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
        XCTAssertEqual(output.setupStatus, .notChecked)
        XCTAssertEqual(output.writeStatus, .noWrite)
        XCTAssertFalse(text.contains(fakeSecret))
        XCTAssertFalse(text.contains(fakeBearer))
        XCTAssertTrue(text.contains("error_message: Coach API was unavailable or returned a non-success response; response body is not shown."))
        XCTAssertFalse(text.localizedCaseInsensitiveContains("x-coach-secret"))
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
        XCTAssertFalse(text.localizedCaseInsensitiveContains("x-coach-secret"))
        XCTAssertFalse(text.localizedCaseInsensitiveContains("password="))
        XCTAssertFalse(text.localizedCaseInsensitiveContains("api_key="))
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
            XCTAssertFalse(text.contains("fake-request-secret"))
            XCTAssertTrue(text.contains("error_identifier: unauthorized"))
            XCTAssertTrue(text.contains("Coach API returned unauthorized; no secret value is shown."))
            XCTAssertFalse(text.contains("response body is not shown"))
            XCTAssertFalse(text.localizedCaseInsensitiveContains("x-coach-secret"))
        }

        XCTAssertEqual(session.lastRequest?.url?.host, "coach.example.test")
    }

    func testCoachConnectionConfigurationReportsSetupStatesWithoutSecrets() {
        let missing = CoachConnectionConfiguration(apiBase: "", secret: "")
        XCTAssertEqual(missing.status.state, .notConfigured)
        XCTAssertEqual(missing.status.errorIdentifier, .notConfigured)
        XCTAssertEqual(missing.status.shortcutOutput.setupStatus, .needsSetup)
        XCTAssertEqual(missing.status.shortcutOutput.protectedVerificationStatus, .blockedMissingSetup)
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
        XCTAssertEqual(ready.status.shortcutOutput.setupStatus, .configuredLocally)
        XCTAssertEqual(ready.status.shortcutOutput.protectedVerificationStatus, .readyForManualReadOnly)
    }

    func testConfigurationErrorBuildsStableShortcutFailureOutput() {
        let status = CoachConnectionConfiguration(apiBase: "https://coach.example.test", secret: "").status
        let output = CoachShortcutOutput.failure(error: CoachConfigurationError(status: status))

        XCTAssertEqual(output.actionStatus, "not_configured")
        XCTAssertEqual(output.errorIdentifier, .missingSecret)
        XCTAssertEqual(output.setupStatus, .needsSetup)
        XCTAssertEqual(output.protectedVerificationStatus, .blockedMissingSetup)
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
        XCTAssertEqual(result.shortcutOutput?.setupStatus, .configuredLocally)
        XCTAssertEqual(result.shortcutOutput?.protectedVerificationStatus, .deferredUntilToddDevice)
        XCTAssertEqual(result.shortcutOutput?.writeStatus, .writeHeld)
    }

    func testProtectedShortcutStopsBeforeNetworkWhenSecretCleared() async throws {
        let suiteName = "ProtectedSetupGateTests-\(UUID().uuidString)"
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
            keychainStore: FakeCoachSecretStore(secret: "   "),
            store: store
        )

        do {
            _ = try await workflow.checkCoachSyncStatus()
            XCTFail("Expected missing local secret to block protected read-only request")
        } catch {
            XCTAssertNil(session.lastRequest)
            let output = CoachShortcutOutput.failure(error: error)
            XCTAssertEqual(output.errorIdentifier, .missingSecret)
            XCTAssertEqual(output.setupStatus, .needsSetup)
            XCTAssertEqual(output.protectedVerificationStatus, .blockedMissingSetup)
            XCTAssertTrue(output.shortcutText.contains("protected_verification_status: blocked_missing_setup"))
        }
    }

    func testProtectedShortcutStopsBeforeNetworkWhenBaseURLInvalid() async throws {
        let suiteName = "ProtectedInvalidBaseGateTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)
        store.apiBase = "not a url"
        let session = MockCoachURLSession(responseData: Data())
        let client = CoachAPIClient(session: session)
        let workflow = MorningCoachWorkflow(
            apiClient: client,
            keychainStore: FakeCoachSecretStore(secret: "fake-local-secret"),
            store: store
        )

        do {
            _ = try await workflow.weeklyReview(
                weekStart: "2026-06-08",
                weekEnd: "2026-06-14"
            )
            XCTFail("Expected invalid local API base URL to block protected request")
        } catch {
            XCTAssertNil(session.lastRequest)
            let output = CoachShortcutOutput.failure(error: error)
            XCTAssertEqual(output.errorIdentifier, .missingAPIBase)
            XCTAssertEqual(output.setupStatus, .needsSetup)
            XCTAssertEqual(output.protectedVerificationStatus, .blockedMissingSetup)
            XCTAssertFalse(output.shortcutText.contains("fake-local-secret"))
        }
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
        XCTAssertEqual(response.shortcutOutput.setupStatus, .configuredLocally)
        XCTAssertEqual(response.shortcutOutput.protectedVerificationStatus, .verifiedReadOnly)
        XCTAssertEqual(response.shortcutOutput.writeStatus, .noWrite)
    }

    func testNoNetworkFailureBuildsStableTypedShortcutOutput() async throws {
        let session = MockCoachURLSession(
            responseData: Data(),
            thrownError: URLError(.notConnectedToInternet)
        )
        let client = CoachAPIClient(session: session)

        do {
            _ = try await client.getSyncStatus(
                apiBase: "https://coach.example.test",
                apiSecret: "fake-request-secret"
            )
            XCTFail("Expected mocked network outage")
        } catch {
            let output = CoachShortcutOutput.failure(error: error)
            let text = output.shortcutText

            XCTAssertEqual(output.errorIdentifier, .noNetwork)
            XCTAssertEqual(output.setupStatus, .notChecked)
            XCTAssertEqual(output.readinessStatus, .deferred)
            XCTAssertEqual(output.protectedVerificationStatus, .deferredUntilToddDevice)
            XCTAssertEqual(output.writeStatus, .noWrite)
            XCTAssertTrue(text.contains("error_identifier: noNetwork"))
            XCTAssertTrue(text.contains("readiness_status: deferred"))
            XCTAssertTrue(text.contains("protected_verification_status: deferred_until_todd_device"))
            XCTAssertTrue(text.contains("Network unavailable, host unreachable, or request timed out."))
            XCTAssertFalse(text.contains("notConnectedToInternet"))
            XCTAssertFalse(text.contains("fake-request-secret"))
        }
    }

    func testNetworkFailureMatrixMapsURLErrorsToStableRedactedShortcutOutput() async throws {
        let cases: [(URLError.Code, String)] = [
            (.notConnectedToInternet, "offline"),
            (.timedOut, "timeout"),
            (.cannotFindHost, "dns"),
            (.cannotConnectToHost, "connect"),
            (.dnsLookupFailed, "dns_lookup")
        ]
        let fakeCredentialURL = "https://user:fakePassword123456@coach.example.test/api/coach?token=fakeToken123456789"

        for (code, label) in cases {
            let session = MockCoachURLSession(
                responseData: Data(),
                thrownError: URLError(code, userInfo: [
                    NSURLErrorFailingURLErrorKey: URL(string: fakeCredentialURL) as Any
                ])
            )
            let client = CoachAPIClient(session: session)

            do {
                _ = try await client.getCoachToday(
                    apiBase: "https://coach.example.test",
                    apiSecret: "fake-secret-\(label)"
                )
                XCTFail("Expected \(label) URL error")
            } catch {
                let output = CoachShortcutOutput.failure(error: error)
                let text = output.shortcutText

                XCTAssertEqual(output.errorIdentifier, .noNetwork)
                XCTAssertEqual(output.readinessStatus, .deferred)
                XCTAssertEqual(output.protectedVerificationStatus, .deferredUntilToddDevice)
                XCTAssertEqual(output.writeStatus, .noWrite)
                XCTAssertTrue(text.contains("error_identifier: noNetwork"))
                XCTAssertTrue(text.contains("next_best_action: Check connection, then retry a read-only Coach check; keep write actions held."))
                assertNoCredentialLeak(in: text)
                XCTAssertFalse(text.contains("fake-secret-\(label)"))
                XCTAssertFalse(text.contains("fakePassword123456"))
                XCTAssertFalse(text.contains("fakeToken123456789"))
                XCTAssertFalse(text.contains("URLError"))
                XCTAssertFalse(text.contains(code.rawValue.description))
            }
        }
    }

    func testResponseFailureMatrixMapsInvalidStatusAndMalformedBodiesToStableOutput() async throws {
        let credentialMessage = """
        {"error":"Invalid coach API secret. x-coach-secret: fake-secret-123456 Authorization: Bearer fakeBearerToken123456 sk-fakeKey123456789012 jwt aaaabbbbccccdddd.eeeeffffgggg.hhhhiiiijjjj"}
        """.data(using: .utf8)!
        let serverSession = MockCoachURLSession(responseData: credentialMessage, statusCode: 500)
        let serverClient = CoachAPIClient(session: serverSession)

        do {
            _ = try await serverClient.getSyncStatus(
                apiBase: "https://coach.example.test",
                apiSecret: "fake-local-secret"
            )
            XCTFail("Expected mocked non-2xx response")
        } catch {
            let output = CoachShortcutOutput.failure(error: error)
            let text = output.shortcutText

            XCTAssertEqual(output.errorIdentifier, .backendUnavailable)
            XCTAssertEqual(output.readinessStatus, .deferred)
            XCTAssertEqual(output.protectedVerificationStatus, .deferredUntilToddDevice)
            XCTAssertTrue(text.contains("error_identifier: backendUnavailable"))
            XCTAssertTrue(text.contains("response body is not shown"))
            assertNoCredentialLeak(in: text)
            XCTAssertFalse(text.contains("Invalid coach API secret"))
            XCTAssertFalse(text.contains("fake-local-secret"))
        }

        let unauthorizedSession = MockCoachURLSession(responseData: credentialMessage, statusCode: 401)
        let unauthorizedClient = CoachAPIClient(session: unauthorizedSession)

        do {
            _ = try await unauthorizedClient.getCoachToday(
                apiBase: "https://coach.example.test",
                apiSecret: "fake-local-secret"
            )
            XCTFail("Expected mocked 401 response")
        } catch {
            let output = CoachShortcutOutput.failure(error: error)
            let text = output.shortcutText

            XCTAssertEqual(output.errorIdentifier, .unauthorized)
            XCTAssertEqual(output.setupStatus, .configuredLocally)
            XCTAssertEqual(output.protectedVerificationStatus, .deferredUntilToddDevice)
            XCTAssertTrue(text.contains("error_identifier: unauthorized"))
            XCTAssertTrue(text.contains("Coach API returned unauthorized; no secret value is shown."))
            assertNoCredentialLeak(in: text)
        }

        let malformedSession = MockCoachURLSession(responseData: Data("not-json secret=fakeSecret123456".utf8))
        let malformedClient = CoachAPIClient(session: malformedSession)

        do {
            _ = try await malformedClient.getWeeklyReview(
                apiBase: "https://coach.example.test",
                apiSecret: "fake-local-secret",
                weekStart: "2026-06-08",
                weekEnd: "2026-06-14",
                timezone: "Asia/Taipei"
            )
            XCTFail("Expected malformed JSON response")
        } catch {
            let output = CoachShortcutOutput.failure(error: error)
            let text = output.shortcutText

            XCTAssertEqual(output.errorIdentifier, .malformedResponse)
            XCTAssertTrue(text.contains("error_identifier: malformedResponse"))
            XCTAssertTrue(text.contains("raw response is not shown"))
            assertNoCredentialLeak(in: text)
            XCTAssertFalse(text.contains("not-json"))
            XCTAssertFalse(text.contains("fakeSecret123456"))
        }

        let invalidResponse = URLResponse(
            url: URL(string: "https://coach.example.test/api/coach/ping")!,
            mimeType: "application/json",
            expectedContentLength: 0,
            textEncodingName: nil
        )
        let invalidShapeSession = MockCoachURLSession(
            responseData: Data("{\"ok\":true}".utf8),
            responseOverride: invalidResponse
        )
        let invalidShapeClient = CoachAPIClient(session: invalidShapeSession)

        do {
            _ = try await invalidShapeClient.getPublicPing(apiBase: "https://coach.example.test")
            XCTFail("Expected non-HTTP response shape")
        } catch {
            let output = CoachShortcutOutput.failure(error: error)
            XCTAssertEqual(output.errorIdentifier, .malformedResponse)
            XCTAssertTrue(output.shortcutText.contains("error_identifier: malformedResponse"))
            assertNoCredentialLeak(in: output.shortcutText)
        }
    }

    func testMissingConfigurationFailureMatrixBlocksNetworkAndReturnsTypedStatuses() async throws {
        let cases: [(name: String, apiBase: String, secret: String, expectedCode: CoachShortcutErrorCode)] = [
            ("missing_all", "", "", .notConfigured),
            ("missing_api_base", "", "fake-local-secret", .missingAPIBase),
            ("invalid_api_base", "not a url", "fake-local-secret", .missingAPIBase),
            ("missing_secret", "https://coach.example.test", " ", .missingSecret)
        ]

        for item in cases {
            let suiteName = "MissingConfigFailureMatrix-\(item.name)-\(UUID().uuidString)"
            let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
            defer {
                defaults.removePersistentDomain(forName: suiteName)
            }
            let store = MorningCoachStore(defaults: defaults)
            store.apiBase = item.apiBase
            let session = MockCoachURLSession(responseData: Data())
            let workflow = MorningCoachWorkflow(
                apiClient: CoachAPIClient(session: session),
                keychainStore: FakeCoachSecretStore(secret: item.secret),
                store: store
            )

            do {
                _ = try await workflow.checkCoachSyncStatus()
                XCTFail("Expected \(item.name) to stop before network")
            } catch {
                XCTAssertNil(session.lastRequest)
                XCTAssertEqual(session.requestCount, 0)
                let output = CoachShortcutOutput.failure(error: error)
                let text = output.shortcutText

                XCTAssertEqual(output.errorIdentifier, item.expectedCode)
                XCTAssertEqual(output.setupStatus, .needsSetup)
                XCTAssertEqual(output.readinessStatus, .attentionRequired)
                XCTAssertEqual(output.protectedVerificationStatus, .blockedMissingSetup)
                XCTAssertEqual(output.writeStatus, .noWrite)
                XCTAssertTrue(text.contains("setup_status: needs_setup"))
                XCTAssertTrue(text.contains("protected_verification_status: blocked_missing_setup"))
                XCTAssertTrue(text.contains("No production write was sent."))
                assertNoCredentialLeak(in: text)
                XCTAssertFalse(text.contains("fake-local-secret"))
            }
        }
    }

    func testDailyDataFreshnessReportShowsMissingSetupAndStableNextActions() throws {
        let suiteName = "DailyDataFreshnessMissingTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)
        store.apiBase = "https://coach.example.test"

        let setupStatus = CoachConnectionConfiguration(
            apiBase: store.apiBase,
            secret: ""
        ).status
        let report = DailyDataFreshnessReport.local(
            setupStatus: setupStatus,
            store: store,
            now: Date(timeIntervalSince1970: 1_800_000_000)
        )
        let text = report.shortcutText

        XCTAssertEqual(report.actionStatus, "attention_required")
        XCTAssertEqual(report.shortcutOutput.setupStatus, .needsSetup)
        XCTAssertEqual(report.shortcutOutput.readinessStatus, .attentionRequired)
        XCTAssertEqual(report.shortcutOutput.protectedVerificationStatus, .blockedMissingSetup)
        XCTAssertEqual(report.shortcutOutput.writeStatus, .writeHeld)
        XCTAssertTrue(text.contains("health_ios_sync: missing"))
        XCTAssertTrue(text.contains("protected_read_only_freshness: not_configured"))
        XCTAssertTrue(text.contains("healthkit_permission: permission_required"))
        XCTAssertTrue(text.contains("workout_source_freshness: manual_source_deferred"))
        XCTAssertTrue(text.contains("blood_pressure_intake: todd_action_required"))
        XCTAssertTrue(text.contains("draft_only_capture: no_write_draft_only"))
        XCTAssertTrue(text.contains("Enter Coach secret on device during Todd-assisted setup."))
        XCTAssertTrue(text.contains("Open Todd Health Sync and sync Health data."))
        XCTAssertTrue(text.contains("Continue without write actions"))
        XCTAssertTrue(text.contains("No production write was sent."))
        XCTAssertTrue(text.contains("No secret value is included."))
    }

    func testDailyDataFreshnessReportMarksRecentLocalDataFreshAndManualSourcesDeferred() throws {
        let suiteName = "DailyDataFreshnessFreshTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)
        store.apiBase = "https://coach.example.test"
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        store.recordAppleHealthSync(summary: "Wrote 7 of 7 Apple Health daily summaries.", at: now.addingTimeInterval(-2 * 3600))
        store.recordCoachReadback(summary: "Coach sync status 100%.", at: now.addingTimeInterval(-3 * 3600))

        let report = DailyDataFreshnessReport.local(
            setupStatus: CoachConnectionConfiguration(
                apiBase: store.apiBase,
                secret: "fake-local-secret"
            ).status,
            store: store,
            now: now,
            publicPing: .healthy(version: "coach-brain-v1")
        )
        let text = report.shortcutText

        XCTAssertEqual(report.shortcutOutput.setupStatus, .configuredLocally)
        XCTAssertEqual(report.shortcutOutput.protectedVerificationStatus, .verifiedReadOnly)
        XCTAssertEqual(report.shortcutOutput.writeStatus, .writeHeld)
        XCTAssertTrue(text.contains("health_ios_sync: fresh"))
        XCTAssertTrue(text.contains("coach_public_ping: fresh"))
        XCTAssertTrue(text.contains("protected_read_only_freshness: fresh"))
        XCTAssertTrue(text.contains("nutrition_source_freshness: manual_source_deferred"))
        XCTAssertTrue(text.contains("sleep_recovery_source_freshness: manual_source_deferred"))
        XCTAssertTrue(text.contains("body_metrics_source_freshness: manual_source_deferred"))
        XCTAssertTrue(text.contains("draft_only_capture: no_write_draft_only"))
        XCTAssertFalse(text.contains("fake-local-secret"))
    }

    func testDailyDataFreshnessSourcesExposeStableFutureSurfaceFields() throws {
        let suiteName = "DailyDataFreshnessSourceCardTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)
        store.apiBase = "https://coach.example.test"

        let report = DailyDataFreshnessReport.local(
            setupStatus: CoachConnectionConfiguration(
                apiBase: store.apiBase,
                secret: ""
            ).status,
            store: store,
            now: Date(timeIntervalSince1970: 1_800_000_000)
        )

        let health = try XCTUnwrap(report.sources.first { $0.id == "health_ios_sync" })
        XCTAssertEqual(health.category, .localDevice)
        XCTAssertEqual(health.readinessStatus, .staleOrMissing)
        XCTAssertEqual(health.protectedVerificationStatus, .notRequired)
        XCTAssertEqual(health.writeStatus, .writeHeld)
        XCTAssertEqual(health.errorIdentifier, .syncStale)
        XCTAssertEqual(health.surfaceTitle, "Health/iOS sync - missing")
        XCTAssertTrue(health.line.contains("source_category: local_device"))
        XCTAssertTrue(health.line.contains("freshness_status: missing"))
        XCTAssertTrue(health.line.contains("readiness_status: stale_or_missing"))
        XCTAssertTrue(health.line.contains("error_identifier: syncStale"))

        let protected = try XCTUnwrap(report.sources.first { $0.id == "protected_read_only_freshness" })
        XCTAssertEqual(protected.category, .coachProtectedReadOnly)
        XCTAssertEqual(protected.readinessStatus, .attentionRequired)
        XCTAssertEqual(protected.protectedVerificationStatus, .blockedMissingSetup)
        XCTAssertEqual(protected.writeStatus, .writeHeld)
        XCTAssertEqual(protected.errorIdentifier, .notConfigured)
        XCTAssertTrue(protected.line.contains("protected_verification_status: blocked_missing_setup"))

        let manual = try XCTUnwrap(report.sources.first { $0.id == "workout_source_freshness" })
        XCTAssertEqual(manual.category, .manualThirdParty)
        XCTAssertEqual(manual.readinessStatus, .deferred)
        XCTAssertEqual(manual.protectedVerificationStatus, .notRequired)
        XCTAssertEqual(manual.writeStatus, .manualHandoffOnly)
        XCTAssertNil(manual.errorIdentifier)
        XCTAssertTrue(manual.surfaceDetail.contains("not scraped"))
        XCTAssertTrue(manual.line.contains("write_status: manual_handoff_only_no_write"))

        let draft = try XCTUnwrap(report.sources.first { $0.id == "draft_only_capture" })
        XCTAssertEqual(draft.category, .draftCapture)
        XCTAssertEqual(draft.readinessStatus, .ready)
        XCTAssertEqual(draft.writeStatus, .draftOnly)
        XCTAssertTrue(draft.line.contains("title: Draft-only capture - draft only"))
        XCTAssertTrue(draft.line.contains("write_status: draft_only_no_write"))
    }

    func testDailyDataFreshnessWorkflowDoesNotCallNetworkWhenSetupIncomplete() throws {
        let suiteName = "DailyDataFreshnessWorkflowTests-\(UUID().uuidString)"
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
            keychainStore: FakeCoachSecretStore(secret: ""),
            store: store
        )

        let result = try workflow.checkDailyDataFreshness(
            now: Date(timeIntervalSince1970: 1_800_000_000)
        )
        let detail = result.detail

        XCTAssertNil(session.lastRequest)
        XCTAssertTrue(detail.contains("freshness_status: attention_required"))
        XCTAssertTrue(detail.contains("protected_read_only_freshness: not_configured"))
        XCTAssertTrue(detail.contains("draft_only_capture: no_write_draft_only"))
        XCTAssertTrue(detail.contains("No production write was sent."))
    }

    func testPublicPingFreshnessUsesInjectedMockSessionAndNoSecretHeader() async throws {
        let data = """
        {
          "ok": true,
          "action": "ping",
          "version": "coach-brain-v1"
        }
        """.data(using: .utf8)!
        let session = MockCoachURLSession(responseData: data)
        let client = CoachAPIClient(session: session)

        let ping = try await client.getPublicPing(apiBase: "https://coach.example.test/")
        let request = try XCTUnwrap(session.lastRequest)

        XCTAssertTrue(ping.ok)
        XCTAssertEqual(ping.action, "ping")
        XCTAssertEqual(ping.version, "coach-brain-v1")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.url?.path, "/api/coach/ping")
        XCTAssertNil(request.value(forHTTPHeaderField: "x-coach-secret"))
        XCTAssertNil(request.value(forHTTPHeaderField: "Authorization"))
    }

    func testDailyDataFreshnessRedactsSecretLikeText() throws {
        let report = DailyDataFreshnessReport(
            actionStatus: "attention_required secret=abc123456789012345",
            summary: "Bearer abcdefghijklmnop.abcdefgh.abcdefgh",
            sources: [
                DailyDataFreshnessSource(
                    id: "redaction_probe",
                    label: "Redaction probe secret=abc123456789012345",
                    category: .safetyIntake,
                    status: .toddActionRequired,
                    detail: "x-coach-secret: abc123456789012345",
                    nextAction: "Open https://user:password@example.test/path?token=abc123456789012345"
                )
            ]
        )
        let text = report.shortcutText
        let source = try XCTUnwrap(report.sources.first)

        XCTAssertFalse(text.contains("abc123456789012345"))
        XCTAssertFalse(text.contains("password@example.test"))
        XCTAssertFalse(text.contains("abcdefghijklmnop.abcdefgh.abcdefgh"))
        XCTAssertFalse(source.surfaceTitle.contains("abc123456789012345"))
        XCTAssertFalse(source.surfaceDetail.contains("abc123456789012345"))
        XCTAssertFalse(source.line.contains("password@example.test"))
        XCTAssertTrue(text.contains("[redacted]"))
    }

    func testShortcutOutputExposesRedactedFutureSafeStrings() {
        let fakeSecret = "fakeContractSecret123456789"
        let output = CoachShortcutOutput(
            actionStatus: "attention_required",
            setupStatus: .configuredLocally,
            readinessStatus: .attentionRequired,
            protectedVerificationStatus: .deferredUntilToddDevice,
            writeStatus: .writeHeld,
            safetyStatus: .yellow,
            readinessSummary: "Yellow with token=\(fakeSecret). Keep output bounded for Siri and widgets.",
            workoutTitle: "Coach status https://user:\(fakeSecret)@coach.example.test",
            workoutType: .modifiedStrength,
            primaryConstraints: ["Authorization: Bearer \(fakeSecret)"],
            coachMemoryContext: "x-coach-secret: \(fakeSecret)",
            workoutDebriefContext: "password=\(fakeSecret)",
            nextBestAction: "Retry read-only check; keep write actions held.",
            requiresMedicalCaution: true,
            sourceFreshness: "api_key=\(fakeSecret)",
            lastSync: "credential=\(fakeSecret)",
            errorIdentifier: .syncStale,
            errorMessage: "secret=\(fakeSecret)",
            workoutHandoff: "token=\(fakeSecret)"
        )

        let surfaces = output.safeSurfaceStrings
        let text = surfaces.contractText

        XCTAssertEqual(surfaces.appEntityTitle, surfaces.widgetTitle)
        XCTAssertEqual(surfaces.notificationTitle, surfaces.shortcutTitle)
        XCTAssertTrue(text.contains("app_entity_title:"))
        XCTAssertTrue(text.contains("widget_body: Retry read-only check; keep write actions held."))
        XCTAssertTrue(text.contains("notification_body:"))
        XCTAssertTrue(surfaces.widgetFooter.contains("protected_verification_status: deferred_until_todd_device"))
        XCTAssertTrue(surfaces.widgetFooter.contains("write_status: write_held"))
        XCTAssertTrue(surfaces.widgetFooter.contains("error_identifier: syncStale"))
        XCTAssertTrue(surfaces.allStrings.allSatisfy { $0.count <= 220 })
        XCTAssertFalse(text.contains(fakeSecret))
        assertNoCredentialLeak(in: text)
    }

    func testFailureSafeSurfaceStringsSummarizeRawErrorsWithoutLeakingBodies() {
        let fakeSecret = "fakeRawFailureSecret123456"
        let rawBody = String(
            repeating: "{\"error\":\"Invalid x-coach-secret: \(fakeSecret) Authorization: Bearer \(fakeSecret) token=\(fakeSecret)\"}",
            count: 8
        )

        let output = CoachShortcutOutput.failure(
            error: CoachAPIError.requestFailed(statusCode: 500, message: rawBody)
        )
        let surfaces = output.safeSurfaceStrings
        let text = surfaces.contractText

        XCTAssertEqual(output.errorIdentifier, .backendUnavailable)
        XCTAssertTrue(surfaces.shortcutDetail.contains("Coach request could not complete because the API was unavailable"))
        XCTAssertTrue(surfaces.widgetBody.contains("Retry a read-only Coach check later"))
        XCTAssertTrue(surfaces.notificationBody.contains("protected_verification_status: deferred_until_todd_device"))
        XCTAssertTrue(surfaces.notificationBody.contains("error_identifier: backendUnavailable"))
        XCTAssertFalse(text.contains(rawBody))
        XCTAssertFalse(text.contains("{\"error\""))
        XCTAssertFalse(text.contains(fakeSecret))
        assertNoCredentialLeak(in: text)
    }

    func testTypedRedSafetyOutputUsesHoldLanguageAndNoWriteStatuses() {
        let output = CoachShortcutOutput(
            actionStatus: "red_safety_hold",
            setupStatus: .configuredLocally,
            readinessStatus: .attentionRequired,
            protectedVerificationStatus: .verifiedReadOnly,
            writeStatus: .noWrite,
            safetyStatus: .red,
            readinessSummary: "Red: medical caution today.",
            workoutTitle: nil,
            workoutType: .none,
            primaryConstraints: [
                "Red safety: pain and blood pressure require hold.",
                "Doctor guidance overrides device data."
            ],
            coachMemoryContext: nil,
            workoutDebriefContext: nil,
            nextBestAction: CoachTodaySummary.redSafetyNextAction,
            requiresMedicalCaution: true,
            sourceFreshness: "Read-only source freshness only.",
            lastSync: "2026-06-13",
            errorIdentifier: nil,
            errorMessage: nil
        )
        let text = output.shortcutText
        let surfaces = output.safeSurfaceStrings
        let surfaceText = surfaces.contractText

        XCTAssertEqual(output.errorIdentifier, nil)
        XCTAssertEqual(output.setupStatus, .configuredLocally)
        XCTAssertEqual(output.readinessStatus, .attentionRequired)
        XCTAssertEqual(output.protectedVerificationStatus, .verifiedReadOnly)
        XCTAssertEqual(output.writeStatus, .noWrite)
        XCTAssertEqual(output.safetyStatus, .red)
        XCTAssertTrue(output.requiresMedicalCaution)
        XCTAssertTrue(text.contains("Do not start hard training"))
        XCTAssertTrue(text.contains("write_status: no_write"))
        XCTAssertTrue(surfaces.widgetBody.contains("Do not start hard training"))
        assertNoHardTrainingPermission(in: text)
        assertNoHardTrainingPermission(in: surfaceText)
        assertNoCredentialLeak(in: text)
        assertNoCredentialLeak(in: surfaceText)
    }

    func testDailyFreshnessSafeSurfaceStringsRetainDeferredAndNoWriteSemantics() throws {
        let suiteName = "DailyFreshnessFutureSurfaces-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)
        store.apiBase = "https://coach.example.test"
        let report = DailyDataFreshnessReport.local(
            setupStatus: CoachConnectionConfiguration(apiBase: store.apiBase, secret: "").status,
            store: store,
            now: Date(timeIntervalSince1970: 1_800_000_000)
        )

        let protected = try XCTUnwrap(report.sources.first { $0.id == "protected_read_only_freshness" })
        let manual = try XCTUnwrap(report.sources.first { $0.id == "workout_source_freshness" })
        let draft = try XCTUnwrap(report.sources.first { $0.id == "draft_only_capture" })
        let reportSurface = report.safeSurfaceStrings

        XCTAssertTrue(protected.safeSurfaceStrings.widgetFooter.contains("protected_verification_status: blocked_missing_setup"))
        XCTAssertTrue(manual.safeSurfaceStrings.widgetFooter.contains("write_status: manual_handoff_only_no_write"))
        XCTAssertTrue(manual.safeSurfaceStrings.widgetBody.contains("Review manual source/runbook"))
        XCTAssertTrue(draft.safeSurfaceStrings.widgetFooter.contains("write_status: draft_only_no_write"))
        XCTAssertTrue(draft.safeSurfaceStrings.widgetBody.contains("Continue without write actions"))
        XCTAssertTrue(reportSurface.widgetFooter.contains("write_status: write_held"))
        XCTAssertTrue(reportSurface.widgetFooter.contains("protected_verification_status: blocked_missing_setup"))
        assertNoCredentialLeak(in: protected.safeSurfaceStrings.contractText)
        assertNoCredentialLeak(in: manual.safeSurfaceStrings.contractText)
        assertNoCredentialLeak(in: draft.safeSurfaceStrings.contractText)
    }

    func testWorkflowFailureSafeSurfaceStringsStopBeforeProtectedNetworkWhenSetupIncomplete() async throws {
        let suiteName = "FutureSurfaceSetupGate-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }
        let store = MorningCoachStore(defaults: defaults)
        store.apiBase = "https://coach.example.test"
        let session = MockCoachURLSession(responseData: Data())
        let workflow = MorningCoachWorkflow(
            apiClient: CoachAPIClient(session: session),
            keychainStore: FakeCoachSecretStore(secret: ""),
            store: store
        )

        do {
            _ = try await workflow.buildTodaysWorkout(
                requestText: "Build today's workout.",
                requestedSessionType: "strength",
                scheduleOverride: false
            )
            XCTFail("Expected missing setup to stop before network")
        } catch {
            XCTAssertNil(session.lastRequest)
            XCTAssertEqual(session.requestCount, 0)
            let surfaces = CoachShortcutOutput.failure(error: error).safeSurfaceStrings
            XCTAssertTrue(surfaces.widgetFooter.contains("protected_verification_status: blocked_missing_setup"))
            XCTAssertTrue(surfaces.widgetFooter.contains("write_status: no_write"))
            XCTAssertTrue(surfaces.widgetFooter.contains("error_identifier: missingSecret"))
            XCTAssertTrue(surfaces.widgetBody.contains("Enter the Coach API secret"))
            assertNoCredentialLeak(in: surfaces.contractText)
        }
    }

    func testWorkoutHandoffSafeSurfaceStringsStayManualOnlyAndRedacted() throws {
        let fakeSecret = "fakeWorkoutSurfaceSecret123456"
        let json = """
        {
          "ok": true,
          "action": "workout",
          "reply": "Use the controlled plan.",
          "decision": {
            "top_line_call": "Yellow token=\(fakeSecret)",
            "next_actions": [
              "Manually enter Rack sets; no third-party automation. token=\(fakeSecret)"
            ],
            "risk_flags": [
              "No hard conditioning. x-coach-secret: \(fakeSecret)"
            ],
            "workout_plan": {
              "top_line": "Controlled strength token=\(fakeSecret)",
              "session_type": "strength",
              "blocks": [
                {
                  "name": "Main",
                  "exercises": [
                    {
                      "rack_motra_name": "Cable Row",
                      "equipment": "Cable station",
                      "sets": 3,
                      "reps": "10",
                      "rest": "60 sec"
                    }
                  ]
                }
              ]
            }
          }
        }
        """.data(using: .utf8)!

        let response = try CoachDirectActionResponseSummary.parse(data: json, fallbackAction: "workout")
        let handoff = try XCTUnwrap(response.workoutHandoff)
        let surfaces = handoff.safeSurfaceStrings
        let text = surfaces.contractText

        XCTAssertTrue(surfaces.shortcutSubtitle.contains("manual_handoff_only_no_write"))
        XCTAssertTrue(surfaces.widgetFooter.contains("third_party_automation: none"))
        XCTAssertTrue(surfaces.widgetFooter.contains("production_write: none"))
        XCTAssertTrue(surfaces.widgetBody.contains("Manually enter Rack sets"))
        XCTAssertFalse(text.contains(fakeSecret))
        assertNoCredentialLeak(in: text)
    }

    func testIntentDryRunProtectedWorkflowsStopBeforeNetworkWhenSetupMissing() async throws {
        let cases: [(name: String, action: (MorningCoachWorkflow) async throws -> MorningCoachActionResult)] = [
            ("sync_apple_health", { workflow in
                try await workflow.syncAppleHealth(days: 7, trigger: "shortcut")
            }),
            ("morning_coach", { workflow in
                try await workflow.runMorningCoach()
            }),
            ("check_sync_status", { workflow in
                try await workflow.checkCoachSyncStatus()
            }),
            ("coach_today", { workflow in
                try await workflow.openCoachToday()
            }),
            ("weekly_review", { workflow in
                try await workflow.weeklyReview(weekStart: "2026-06-08", weekEnd: "2026-06-14")
            }),
            ("can_i_train", { workflow in
                try await workflow.canITrain()
            }),
            ("build_workout", { workflow in
                try await workflow.buildTodaysWorkout(
                    requestText: "Build today's workout.",
                    requestedSessionType: "strength",
                    scheduleOverride: false
                )
            }),
            ("nutrition_closeout", { workflow in
                try await workflow.nutritionCloseout(note: "Run today's nutrition closeout.")
            }),
            ("post_workout", { workflow in
                try await workflow.postWorkoutCoach(note: "Prepare my post-workout debrief.")
            })
        ]

        for item in cases {
            let suiteName = "IntentDryRun-\(item.name)-\(UUID().uuidString)"
            let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
            defer {
                defaults.removePersistentDomain(forName: suiteName)
            }
            let store = MorningCoachStore(defaults: defaults)
            store.apiBase = "https://coach.example.test"
            let session = MockCoachURLSession(responseData: Data())
            let workflow = MorningCoachWorkflow(
                apiClient: CoachAPIClient(session: session),
                keychainStore: FakeCoachSecretStore(secret: " "),
                store: store
            )

            do {
                _ = try await item.action(workflow)
                XCTFail("Expected \(item.name) to stop before network when local secret is missing")
            } catch {
                XCTAssertNil(session.lastRequest, item.name)
                XCTAssertEqual(session.requestCount, 0, item.name)
                let output = CoachShortcutOutput.failure(error: error)
                let text = output.shortcutText

                XCTAssertEqual(output.errorIdentifier, .missingSecret, item.name)
                XCTAssertEqual(output.setupStatus, .needsSetup, item.name)
                XCTAssertEqual(output.readinessStatus, .attentionRequired, item.name)
                XCTAssertEqual(output.protectedVerificationStatus, .blockedMissingSetup, item.name)
                XCTAssertEqual(output.writeStatus, .noWrite, item.name)
                XCTAssertTrue(text.contains("setup_status: needs_setup"), item.name)
                XCTAssertTrue(text.contains("protected_verification_status: blocked_missing_setup"), item.name)
                XCTAssertTrue(text.contains("write_status: no_write"), item.name)
                XCTAssertTrue(text.contains("No production write was sent."), item.name)
                assertNoCredentialLeak(in: text)
                assertNoCredentialLeak(in: output.safeSurfaceStrings.contractText)
            }
        }
    }

    func testIntentDryRunDraftCaptureWorkflowsStayDraftOnlyAndRedacted() {
        let fakeSecret = "fakeDraftDryRunSecret123456"
        let workflow = MorningCoachWorkflow()
        let results = [
            workflow.draftWorkoutDebrief(note: "Workout went well. x-coach-secret: \(fakeSecret)"),
            workflow.draftCoachNote(note: "Remember token=\(fakeSecret)"),
            workflow.draftBloodPressureIntake(
                systolic: 120,
                diastolic: 80,
                note: "password=\(fakeSecret)"
            )
        ]

        for result in results {
            let output = result.shortcutOutput
            let text = result.shortcutValue

            XCTAssertEqual(output?.actionStatus, "deferred_requires_review")
            XCTAssertEqual(output?.setupStatus, .notApplicable)
            XCTAssertEqual(output?.readinessStatus, .deferred)
            XCTAssertEqual(output?.protectedVerificationStatus, .notRequired)
            XCTAssertEqual(output?.writeStatus, .draftOnly)
            XCTAssertEqual(output?.errorIdentifier, .deferredWrite)
            XCTAssertTrue(text.contains("No production write was sent."))
            XCTAssertTrue(text.contains("write_status: draft_only_no_write"))
            XCTAssertFalse(text.contains(fakeSecret))
            assertNoCredentialLeak(in: text)
            if let output {
                assertNoCredentialLeak(in: output.safeSurfaceStrings.contractText)
            }
        }
    }

    private func assertNoCredentialLeak(in text: String, file: StaticString = #filePath, line: UInt = #line) {
        let forbidden = [
            "x-coach-secret",
            "Authorization: Bearer",
            "api_key",
            "password=",
            "secret=",
            "token=",
            "sk-fake",
            "aaaabbbbccccdddd.eeeeffffgggg.hhhhiiiijjjj",
            "fakeBearerToken",
            "fake-secret",
            "fake-local-secret"
        ]
        for value in forbidden {
            XCTAssertFalse(
                text.localizedCaseInsensitiveContains(value),
                "Leaked forbidden value: \(value)",
                file: file,
                line: line
            )
        }
    }

    private func assertNoHardTrainingPermission(in text: String, file: StaticString = #filePath, line: UInt = #line) {
        let lowercased = text.lowercased()
        let forbidden = [
            "train hard",
            "go train",
            "approved",
            "green",
            "clear to train",
            "full send",
            "hard_training_allowed",
            "heavy strength"
        ]
        for value in forbidden {
            XCTAssertFalse(
                lowercased.contains(value),
                "Leaked hard-training permission: \(value)",
                file: file,
                line: line
            )
        }
    }
}
