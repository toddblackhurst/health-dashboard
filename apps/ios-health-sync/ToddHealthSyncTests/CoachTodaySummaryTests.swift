import XCTest
@testable import ToddHealthSync

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
}
