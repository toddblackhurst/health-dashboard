# iOS 27 Siri, Shortcuts, and Personal Coach Strategy

Last updated: 2026-06-13.

Purpose: this is the authoritative iOS 27 integration strategy for Todd's Personal Coach. It folds iOS 27 Siri AI, Shortcuts, App Intents, App Schemas, App Entities, Spotlight, View Annotations, and AppIntentsTesting into the roadmap without authorizing unrelated iOS implementation work.

Current implementation status: iOS App Intents Readiness v1 expands the repo-side Shortcuts bridge, PR #27 iPhone Coach Setup UX Readiness v1 adds local setup guardrails before protected requests run, Daily Data Freshness UX v1 is merged as repo-side local no-write source freshness output, Workout Handoff Formatting v1 is merged as manual Rack/Garmin handoff output, and Typed Shortcut Output Hardening v1 is merged/deployed as stable status-field hardening. No-Network Failure Matrix v1 is the current mock-only hardening pass for offline, timeout, invalid response, missing setup, and deferred protected-route failures. `docs/implementation/DEVICE_SETUP_RUNBOOK.md` is the active Todd-assisted setup runbook. iOS 27-specific App Schemas, Spotlight, View Annotations, widgets, Live Activities, physical-device Siri readback, Action Button assignment, Personal Automation setup, Health permission prompts, and credential entry remain future Todd-assisted work.

## 1. Source-Grounded iOS 27 Read

Official Apple sources reviewed:

- Apple Developer, "What's New - iOS": `https://developer.apple.com/ios/whats-new/`
- Apple Developer, iOS and iPadOS 27 beta release notes: `https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-27-release-notes`
- Apple Developer, Xcode 27 beta release notes: `https://developer.apple.com/documentation/xcode-release-notes/xcode-27-release-notes`
- WWDC26, "Build intelligent Siri experiences with App Schemas": `https://developer.apple.com/videos/play/wwdc2026/240/`
- WWDC26, "Validate your App Intents adoption with AppIntentsTesting": `https://developer.apple.com/videos/play/wwdc2026/295/`
- WWDC26 iOS guide: `https://developer.apple.com/wwdc26/guides/ios/`
- WWDC26 Apple Intelligence guide: `https://developer.apple.com/wwdc26/guides/apple-intelligence/`
- WWDC26 Platforms State of the Union: `https://developer.apple.com/videos/play/wwdc2026/102/`
- Apple Newsroom, "WWDC26: Apple unveils next generation of Apple Intelligence, Siri AI, powerful parental controls, and an expansive set of software improvements": `https://www.apple.com/newsroom/2026/06/apple-unveils-next-generation-of-apple-intelligence-siri-ai-and-more/`
- Apple Newsroom, "Apple accelerates app development with new intelligence frameworks and advanced tools": `https://www.apple.com/newsroom/2026/06/apple-aids-app-development-with-new-intelligence-frameworks-and-advanced-tools/`

Key Apple findings:

- App Intents are the developer foundation for Siri AI and Apple Intelligence integration in iOS 27.
- App Entities describe app concepts so the system can resolve them across Siri, Shortcuts, Spotlight, widgets, and other system experiences.
- App Schemas let Siri understand supported entity and intent domains without relying only on fixed phrases.
- Entity schemas can contribute app content to the Spotlight semantic index with attribution back to the app.
- View Annotations can map visible SwiftUI views to entities so Siri can understand references like "this workout" or "this warning."
- AppIntentsTesting can validate App Intents, entity queries, Spotlight indexing, and View Annotations through real system pathways without requiring UI automation for basic intent behavior.
- Siri AI availability is beta and region/language/device gated. Apple says features are subject to change and may not be available in all regions or languages. Do not assume Todd's exact side-button/Siri experience until device testing confirms it.

## 2. Coach Safety And Source Hierarchy

iOS 27 does not change the Coach authority model.

- Medical/safety flags override all device data, memory, Siri output, Shortcut output, widgets, and notifications.
- Red safety cannot become hard training.
- Garmin Fenix 8 / Garmin Connect remains the primary integrated training, recovery, workout physiology, HR, zones, Body Battery, training load, and recovery-time source when fresh and reliably worn.
- Rack/Motra remains the authority for completed strength sets, reps, load, exercise names, and performance history.
- Garmin Connect+ Nutrition remains the nutrition authority when daily totals are complete.
- Oura remains secondary/fallback sleep and recovery when Garmin is stale, missing, or unreliable.
- Apple Health remains supporting evidence and a data bus only. It must not override readiness, workout authority, safety, Garmin physiology, or Rack/Motra history.
- Soundcore Sleep A30 remains sleep aid/noise/snore masking only, not recovery authority.

Siri AI and Shortcuts may improve access, speed, and context. They must not become safety authority.

## 3. Current App Intent Baseline

Existing `apps/ios-health-sync/ToddHealthSync/MorningCoachIntents.swift` exposes ten promoted App Shortcuts through `ToddHealthSyncShortcutsProvider`, which is the current Apple per-app limit:

- `SyncAppleHealthIntent`
- `MorningCoachIntent`
- `CheckCoachSyncStatusIntent`
- `CanITrainIntent`
- `WeeklyCoachReviewIntent`
- `BuildTodayWorkoutIntent`
- `NutritionCloseoutIntent`
- `PostWorkoutCoachIntent`
- `DraftWorkoutDebriefIntent`
- `OpenCoachTodayIntent`

`CheckCoachReadinessIntent`, `CheckDailyDataFreshnessIntent`, `DraftCoachNoteIntent`, and `DraftBloodPressureIntakeIntent` are implemented App Intents but are not promoted in the top App Shortcuts list because Apple currently caps promoted App Shortcuts at 10 per app.

Current behavior:

- Intents return stable text values generated from typed `CoachShortcutOutput` fields where the repo has structured response models.
- `MorningCoachIntent` syncs Apple Health, checks source freshness, fetches `coach-today`, and returns a concise readout.
- `SyncAppleHealthIntent` accepts a numeric `days` parameter and clamps the workflow to a safe day range.
- `CanITrainIntent` calls `coach-today` and maps the current safety/readiness result to a conservative training class.
- `WeeklyCoachReviewIntent` calls read-only `weekly-review` and returns `review_only` output without applying plan or memory changes.
- `BuildTodayWorkoutIntent`, `NutritionCloseoutIntent`, and `PostWorkoutCoachIntent` call existing direct Coach action endpoints after Todd has configured the iPhone app secret; these endpoints can log coach messages, but were not called live in this repo pass.
- `DraftWorkoutDebriefIntent`, `DraftCoachNoteIntent`, and `DraftBloodPressureIntakeIntent` return draft/deferred outputs and do not submit production write endpoints.
- `CheckDailyDataFreshnessIntent` returns local freshness output without protected networking: Apple Health sync state from local timestamps, public ping state only when safely checked/mocked, protected-readiness deferment, manual/deferred third-party source rows, BP action need, and draft-only no-write status.
- API base is stored in app settings and the API secret is read from Keychain.
- The native app now exposes Coach Setup status in the settings form. `Save Connection` stores the API base URL and saves or clears the Keychain secret. `Check Setup` verifies local configuration state without sending a protected production request.
- Protected App Intents validate local API base URL and Keychain secret before network calls. Missing or invalid setup returns a structured `not_configured` Shortcut output with stable setup error identifiers and no secret value.
- Requests authenticate through `x-coach-secret`; the secret is never an intent parameter and must stay out of Shortcut outputs, Siri dialog, widgets, notifications, Spotlight, logs, screenshots, and docs.

Workout Debrief Capture v1 adds a backend candidate for a future confirmed App Intent or Shortcut phrase such as "Record my workout debrief." iOS App Intents Readiness v1 adds draft-only debrief capture, but it does not submit the structured debrief endpoint until a future confirmed device workflow is implemented and verified.

## 4. Siri AI And App Intents Direction

Recommended posture:

- Keep App Intents as the core integration layer.
- Add App Entities for coach concepts that Siri and Shortcuts need to resolve or reference.
- Adopt App Schemas only where Apple provides a domain that honestly matches Coach behavior. Do not force a medical, workout, or coaching action into an unrelated schema.
- Use natural-language action support through Siri AI where available, but keep deterministic app/API behavior underneath.
- Require confirmation for meaningful side effects, especially memory mutation, debrief submission, nutrition closeout, and pain/safety issue recording.
- Keep all safety decisions deterministic in the backend or local deterministic client logic. Siri can phrase a result, but it cannot relax a safety result.

Important design constraint: App Schemas improve Siri understanding, but they do not remove the need for clear parameters, predictable results, explicit confirmation for side effects, and deterministic safety gates.

## 5. Shortcuts Improvements For iOS 27

Improve existing App Intents before adding many new ones.

Recommended upgrades:

- Replace plain string-only results with structured result models where Swift/App Intents support it.
- Keep a concise spoken/readable summary for Siri and Shortcuts.
- Add stable output fields that user-created Shortcuts can consume.
- Use clearer parameter titles and defaults, especially for sync day count.
- Return predictable, redacted, non-secret error messages. Missing API base URL, invalid API base URL, and missing local secret should remain distinct Shortcut-readable states so Todd can fix setup on device without exposing credentials.
- For a future workout debrief intent, return `safety_outcome`, `debrief_summary`, `next_recommendation_constraints`, and `requires_follow_up` without exposing raw payloads or secrets.
- Avoid `Duration` and `LPLinkMetadata` in Coach App Intents for now because of the iOS and iPadOS 27 beta Shortcuts known issue involving those types and "Describe a Shortcut."
- Avoid App enum value-dependent AppShortcut phrases for critical coach actions because the Xcode 27 beta release notes identify a Siri known issue with AppShortcut phrases that include App enum values.
- Do not let Shortcuts "Use Model" output determine medical, safety, or workout intensity decisions.

Shortcuts "Use Model" guidance:

- User-created "Use Model" automations may summarize a Coach response, format a note, or route a reminder.
- They must not determine `safety_status`, override Red/Yellow/Green, write Coach Memory, change a workout recommendation, or infer a medical conclusion.
- Any model-generated text that writes to Coach state must go through an explicit user review/confirm step and an authenticated deterministic endpoint.

## 6. Coach App Entities Evaluation

Candidate App Entities:

| Entity | Recommendation | Rationale |
| --- | --- | --- |
| `CoachTodaySnapshot` | Yes, high priority | Central daily entity for Siri, Spotlight, widgets, and "open today" navigation. Keep indexed fields non-sensitive. |
| `CoachReadiness` | Yes, high priority | Useful for "Can I train?" and status readouts. Index only safe summary labels, not private medical detail. |
| `WorkoutRecommendation` | Yes, high priority | Enables "this workout" references, current workout navigation, Live Activity, and safe summary output. |
| `CoachMemoryObservation` | Yes, gated | Useful for review/correction/retirement, but index only non-sensitive titles/summaries after privacy approval. |
| `WorkoutDebrief` | Yes, after backend | Depends on Workout Debrief Capture. Keep sensitive pain/medical fields private unless approved. |
| `PainSafetyFlag` | Limited, private by default | Important for deterministic safety, but do not index or surface broadly. Use for explicit record/review flows only. |
| `NutritionCloseout` | Yes, limited | Useful as a daily closeout entity. Avoid exposing detailed food logs or sensitive notes in Spotlight. |
| `SyncStatus` | Yes, high priority | Useful and low risk if it exposes source freshness, last sync, and configuration state without secrets. |
| `EquipmentConstraint` | Yes, low sensitivity | Useful for travel/gym constraints and workout building. Can be searchable if not medically sensitive. |
| `SchedulePreference` | Yes, low sensitivity | Useful for planning and reminders. Can be searchable if not tied to sensitive personal detail. |

Initial entity set for the future iOS 27 readiness PR:

1. `CoachTodaySnapshot`
2. `CoachReadiness`
3. `WorkoutRecommendation`
4. `SyncStatus`

Defer memory, debrief, pain, and nutrition entities until the backend contracts are final and privacy review is complete.

## 7. Spotlight And Semantic Indexing

Searchable local Coach content should be useful but privacy-conservative.

Candidate Spotlight content:

- Latest coach summary.
- Current safe workout recommendation.
- Recent debrief titles and non-sensitive summaries.
- Active Coach Memory observations with non-sensitive titles, only after Todd explicitly approves indexing memory.
- Preferences and equipment constraints.
- Sync status and last sync freshness.

Do not index:

- `x-coach-secret`, API base with credentials, tokens, cookies, headers, service-role keys, or raw API payloads.
- Detailed medical/safety flags unless the privacy tradeoff is explicitly documented and approved.
- Raw sleep, HRV, HR, BP, medication, symptom, nutrition, or workout logs.
- Retired/superseded Coach Memory observations unless a review screen needs local non-indexed access.

Recommended Spotlight shape:

- Use summary/title fields such as "Today's Coach Snapshot", "Controlled strength session", or "Recovery only today."
- Use attribution back to Todd Health Sync.
- Store enough local entity data for navigation and readback, not enough to leak private health details into search.
- Add tests for indexed entity count, indexed field allowlist, and retired-memory exclusion.

## 8. View Annotations And Onscreen Awareness

Use View Annotations for convenience and navigation, not safety override.

Good onscreen references:

- "this workout"
- "this exercise"
- "this safety warning"
- "this memory observation"
- "this nutrition closeout"
- "this sync status"

Design principles:

- Annotate views with stable App Entities and safe identifiers.
- Avoid annotating raw secret-bearing configuration screens.
- Annotate sensitive safety detail only if Siri's access path returns a privacy-safe summary.
- Let Siri open, explain, summarize, or start a confirmed action from the current screen.
- Never let onscreen awareness bypass Red safety, current medical flags, or explicit confirmation requirements.

## 9. AppIntentsTesting Strategy

Use AppIntentsTesting for future iOS 27-specific readiness PRs when the local toolchain supports it. iOS App Intents Readiness v1 uses simulator build/test and App Intents metadata extraction as the current repo-side verification.

Test classes to add:

- Intent execution tests for `MorningCoachIntent`, `SyncAppleHealthIntent`, `CheckCoachSyncStatusIntent`, and `OpenCoachTodayIntent`.
- Entity query tests for `CoachTodaySnapshot`, `CoachReadiness`, `WorkoutRecommendation`, and `SyncStatus`.
- Shortcut/Siri pathway tests through real App Intents infrastructure.
- Auth failure tests for missing API base, missing secret, bad secret/unauthorized, no network, and backend unavailable.
- Local setup tests for the native Coach Setup status model, including clear-on-empty-secret behavior and protected-intent preflight failure before network requests.
- Secret-redaction tests proving the secret is never in results, thrown error descriptions, logs, entity display strings, Spotlight fields, widget fields, or notification text.
- Red safety tests proving Red results never become hard training through Siri/Shortcuts.
- Retired memory exclusion tests once memory entities are added.
- Spotlight indexing tests for field allowlists.
- View Annotation tests for allowed onscreen references and sensitive-screen exclusions.

Testing boundaries:

- Basic App Intent behavior should not require UI automation if AppIntentsTesting is available.
- Manual device testing still matters for Siri phrasing, Shortcuts UI, Personal Automation behavior, Action Button behavior, and region/device-specific availability.
- If iOS 27 beta behavior differs between simulator and Todd's iPhone, Todd's physical iPhone readback wins.
- Physical-device setup, Siri phrase checks, Action Button assignment, and Personal Automation validation should follow `docs/implementation/DEVICE_SETUP_RUNBOOK.md`.

## 10. Action Button, Side Button, And Hardware Integrations

Research status: valuable, but availability must be confirmed on Todd's actual device and region.

Do not assume side-button conversational app support, Siri AI behavior, or Action Button behavior until Apple docs and physical device testing confirm it for Todd's installed beta, device, language, and region.

Possible daily Coach actions:

- Start Morning Coach.
- Sync Apple Health.
- Ask "Can I train?"
- Record workout debrief.
- Record pain/safety issue.
- Run nutrition closeout.
- Open current workout.

Recommended gate:

- Start with Shortcuts-visible App Intents.
- Test manual Shortcuts execution.
- Then test Action Button or hardware trigger assignment if available.
- Then test Siri voice execution.
- Then test unattended/automation behavior only for read-only or low-risk actions.

Side effects requiring confirmation:

- Recording memory.
- Recording debriefs.
- Recording pain/safety issues.
- Closing nutrition day.
- Starting a workout Live Activity that implies a selected training plan.

## 11. Notifications, Widgets, Live Activities, Focus, Watch, CarPlay, AirPods

Opportunity set:

- Morning readiness widget: show safety color, concise readiness, last sync freshness, and next best action.
- Lock Screen / StandBy coach snapshot: show today's status without sensitive details.
- Live Activity for current workout: show current session title, next block, timer/rest cues, and safety constraints.
- Post-workout debrief notification: prompt an explicit debrief, not an inferred debrief.
- Watch quick debrief prompts: useful after backend debrief capture exists; keep inputs simple and confirmable.
- AirPods/Siri hands-free checks: useful for "Can I train?", "What is next?", "Record pain issue", and "End workout"; safety output must be short and conservative.
- CarPlay-safe coach readout: only if non-distracting and read-only. Avoid workout building, debrief capture, nutrition entry, or complex safety review while driving.
- Focus-aware reminders: silence or change timing during sleep, worship, meetings, pastoral care, or travel; do not nag when recovery flags say downshift.

Implementation posture:

- Widgets and Live Activities can consume structured Coach outputs.
- Notifications can prompt explicit action but should not write memory or safety state by themselves.
- Watch and AirPods are access surfaces, not new authorities.
- CarPlay should be read-only unless Todd separately approves a narrow safe interaction.

## 12. HealthKit / Apple Health

iOS 27 HealthKit release notes identify support for tracking menopausal state and bleeding after menopause. This does not appear directly relevant to Todd's current Coach roadmap.

Keep the Apple Health track focused on already relevant supporting-evidence categories:

- Workout-level intake, if available through existing HealthKit workout APIs and after backend design.
- Symptoms, if Todd explicitly wants symptom capture and privacy review approves the storage/display path.
- Sleep.
- HRV and resting HR.
- Medication/safety context, only if explicitly approved and never as a replacement for doctor guidance.

No source hierarchy change:

- Apple Health may collect or transport data.
- Garmin remains primary for integrated training/recovery/workout physiology when fresh and reliably worn.
- Rack/Motra remains the completed strength authority.
- Oura remains secondary/fallback sleep and recovery.
- Medical/safety flags override all of the above.

## 13. Known iOS 27 Beta Caveats

Known issues to design around:

- iOS and iPadOS 27 beta Shortcuts known issue: if an App Intent uses `Duration` or `LPLinkMetadata`, creating a shortcut with that intent and then editing it with "Describe a Shortcut" can be affected. Mitigation: avoid `Duration` and `LPLinkMetadata` in Coach App Intents unless necessary.
- Xcode 27 beta App Intents known issue: Siri may generate unexpected responses when triggering an AppShortcut phrase with an App enum value. Mitigation: avoid enum-value-dependent AppShortcut phrases for critical coach actions.
- Siri AI is beta, device/language/region gated, and subject to change. Mitigation: keep fallback Shortcuts phrases, structured parameters, and deterministic backend behavior.
- Side-button, Action Button, and hardware trigger behavior must be tested on Todd's physical iPhone before being treated as available.

Coach-specific mitigations:

- Prefer simple phrase variants.
- Prefer structured parameters over phrase-embedded enum values.
- Keep critical safety actions confirmable and deterministic.
- Keep read-only status actions available even when advanced Siri AI behavior is unavailable.
- Keep the app UI and manual Shortcuts as fallbacks.

## 14. Privacy And Security Rules

The app may store API base and secret locally as already tested, with the secret in Keychain.

Never expose `x-coach-secret` or `COACH_API_SECRET` in:

- UI labels or text fields after save.
- Siri dialog.
- Shortcut input/output.
- App Intent parameters.
- App Entity display values.
- Widgets.
- Notifications.
- Spotlight.
- Logs.
- Screenshots.
- Test fixtures that could be confused with a real secret.
- Documentation.

Siri, Shortcuts, widgets, and Apple Intelligence output can trigger Coach actions only through authenticated app/API paths.

Mutation rules:

- No memory mutation without explicit user action.
- No safety mutation without explicit user action.
- No debrief submission without explicit user action.
- No nutrition closeout without explicit user action.
- No probabilistic output can decide medical caution or hard training eligibility.

## 15. Future iOS 27 Siri/Shortcuts Readiness PR Design

Initial repo-side implementation is in iOS App Intents Readiness v1. Physical iPhone installation, Siri voice readback, Action Button assignment, Personal Automation setup, Health permission prompts, credential entry, and confirmed production write flows remain deferred to Todd-assisted device work.

Target capabilities:

### 15.1 Morning Coach

Action: "Morning Coach"

Behavior:

- Sync if needed.
- Fetch `coach-today`.
- Return concise readout.
- Include Red/Yellow/Green safety status.
- Never hide medical/safety cautions.
- Include source freshness and last sync timestamp.

Structured outputs:

- `safety_status`
- `readiness_summary`
- `workout_title`
- `workout_type`
- `primary_constraints`
- `coach_memory_context`
- `next_best_action`
- `requires_medical_caution`
- `source_freshness`
- `last_sync`

### 15.2 Can I Train?

Action: "Can I train?"

Behavior:

- Fetch current safety/readiness through `coach-today`.
- Return one allowed training class:
  - `hard_training_allowed`
  - `controlled_moderated`
  - `recovery_only`
  - `medical_caution`
- Red safety always blocks hard training.
- Yellow/moderated status should return specific constraints, not vague encouragement.

### 15.3 Build Today's Workout

Action: "Build today's workout"

Behavior:

- Call `buildTodayWorkout`.
- Return safe workout summary.
- When the backend response includes a structured workout plan, render a stable redacted `workout_handoff` for manual use.
- Include safety constraints.
- Include manual Rack/Motra entry lines, Garmin manual-start guidance, equipment assumptions, and one next action when available.
- Mark Rack/Garmin handoff as `manual_handoff_only_no_write`.
- Generic request should not refuse on non-strength days.
- Explicit strength request on non-strength day returns controlled modified strength when non-Red.
- Red safety returns recovery/medical caution, not hard training.
- Do not automate Garmin, Rack, Motra, World Gym, Apple Health workouts, browser sessions, or other third-party app entry from this intent.

### 15.4 Record Workout Debrief

Action: "Record workout debrief"

Status:

- Backend endpoint exists as `recordWorkoutDebrief`. iOS App Intents Readiness v1 adds a draft-only debrief intent that does not submit. Confirmed structured submission remains deferred until a bounded device workflow adds explicit confirmation, structured outputs, tests, and physical-device verification.

Design:

- Capture perceived exertion, pain, session completion, substitutions, equipment conflicts, and notes.
- Confirm before submit.
- Return structured confirmation.
- Do not infer completed strength sets. Rack/Motra remains authority.

### 15.5 Record Coach Observation

Action: "Record coach observation"

Status:

- Backend Coach Memory endpoints exist and are deployed. iOS App Intents Readiness v1 adds draft-only note capture that does not save memory. Confirmed memory submission remains deferred until a bounded task adds explicit review/confirmation, safe displays, tests, and device verification.

Rules:

- Observation must be explicit.
- Observation must be reviewable, correctable, and retireable.
- Do not infer hidden truth from arbitrary text.
- Do not store secrets.
- Do not let memory override current safety, Garmin, Rack/Motra, or doctor guidance.

### 15.6 Nutrition Closeout

Action: "Nutrition closeout"

Behavior:

- Use existing backend action.
- Return useful structured result.
- Do not expose detailed food logs in Siri/Shortcuts unless Todd explicitly approves.
- Keep Garmin Connect+ Nutrition as authority when daily totals are complete.

### 15.7 Open Current Workout

Action: "Open current workout"

Behavior:

- Opens app to current safe session.
- Should work after Siri answers a training question or builds a workout.
- If Red safety is active, open the safety/recovery plan, not a hard workout.

## 16. Standard Structured Shortcut Outputs

Recommended output fields for Coach Intents:

- `setup_status`: `not_checked`, `needs_setup`, `configured_locally`, `device_bound`, or `not_applicable`
- `readiness_status`: `ready`, `attention_required`, `stale_or_missing`, `deferred`, or `unknown`
- `protected_verification_status`: `not_required`, `blocked_missing_setup`, `deferred_until_todd_device`, `ready_for_manual_read_only`, or `verified_read_only`
- `write_status`: `no_write`, `write_held`, `draft_only_no_write`, or `manual_handoff_only_no_write`
- `safety_status`: `red`, `yellow`, `green`, or `unknown`
- `readiness_summary`: concise human readout
- `workout_title`: current session title or empty when no workout applies
- `workout_type`: `strength`, `modified_strength`, `zone2`, `recovery`, `mobility`, `none`, or `unknown`
- `primary_constraints`: array of short constraints
- `coach_memory_context`: short summary only, no raw memory dump
- `workout_debrief_context`: short summary and constraints only, no raw debrief payload dump
- `workout_handoff`: redacted manual-only workout handoff for Rack/Garmin use when a structured plan is present
- `next_best_action`: one clear next action
- `requires_medical_caution`: boolean
- `source_freshness`: concise source freshness summary
- `last_sync`: ISO timestamp when known

iOS App Intents Readiness v1 implements the core fields in `CoachShortcutOutput` and renders them as stable text lines for Shortcuts/Siri until a richer typed Shortcut result is adopted. Typed Shortcut Output Hardening v1 adds the setup, readiness, protected-verification, and write/manual status lines so Shortcuts can branch without scraping prose.

No-Network Failure Matrix v1 keeps failure output branchable and safe under degraded conditions. Shortcut-facing failures should provide a stable error identifier, setup/readiness/protected-verification/write statuses, a redacted summary, one next action, and no raw network/debug/body/header/credential text for offline, timeout, DNS/host/connect, invalid setup, missing secret, non-2xx, invalid response, malformed JSON, and deferred protected-route cases.

## 17. Standard App Intent Error Outputs

Recommended error cases:

- `notConfigured`
- `missingAPIBase`
- `missingSecret`
- `unauthorized`
- `syncStale`
- `noNetwork`
- `redSafety`
- `backendUnavailable`
- `malformedResponse`

Rules:

- Do not expose secrets in any error.
- Do not include header values, tokens, URLs with credentials, raw payloads, or stack traces in user-visible errors.
- Use stable error identifiers for tests and Shortcuts branching.
- Pair identifiers with short safe descriptions.

## 18. Proposed Implementation Sequence

Recommended sequence:

1. Review Workout Debrief Capture v1. Push/open PR only after Todd approval.
2. Merge/deploy Workout Debrief Capture only after Todd approval, and apply its Supabase migration only after separate explicit approval.
3. iOS 27 Siri/Shortcuts Readiness PR.
4. Apple Health workout-level intake.
5. Rack/Motra import/debrief support.
6. Weekly Review Engine.
7. Garmin official integration track if approved.

Alternate sequence if Todd wants iOS work pulled forward:

1. Finish local Workout Debrief review and handoff.
2. iOS 27 Siri/Shortcuts Readiness PR, documentation-only.
3. Workout Debrief migration/deploy approval if the backend branch has merged.
4. iOS 27 Siri/Shortcuts Implementation PR.

Do not mix the large iOS implementation into the current Workout Debrief branch unless Todd explicitly approves a stacked branch.

## 19. Review Checklist For Future PR

iOS/Siri/App Intents accuracy:

- Claims grounded in official Apple sources.
- Beta caveats documented.
- No overclaiming about unavailable or region-gated features.
- Device testing required before side-button or Action Button claims.

Coach safety/source hierarchy:

- Siri/Shortcuts cannot override Red safety.
- Medical/safety flags override memory and device data.
- Apple Health remains supporting evidence only.
- Garmin/Rack/Oura hierarchy remains intact.

Secrets/privacy:

- No secrets in docs, code, examples, widgets, Siri output, Shortcut output, logs, screenshots, or test fixtures.
- `x-coach-secret` rules remain intact.
- Spotlight indexing excludes secrets and sensitive medical details by default.

## 20. Implementation Boundary

This document is an architecture/research deliverable. It does not authorize:

- Push/open PR.
- Merge.
- Deploy.
- Migration creation or application.
- Secret-sensitive operations.
- Large iOS 27 feature implementation.
- `HEALTH_DATABASE.json` changes.
