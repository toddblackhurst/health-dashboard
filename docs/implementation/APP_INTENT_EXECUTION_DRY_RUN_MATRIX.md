# App Intent Execution Dry-Run Matrix

Last updated: 2026-06-13 Asia/Taipei.

Purpose: define the repo-side dry-run contract for the existing Todd Health Sync App Intents before Todd-assisted physical iPhone/Siri/Shortcuts verification. This is mock/simulator planning and test evidence only. It does not add, remove, promote, reorder, or rename App Intents or App Shortcuts, and it does not authorize protected production route calls, production writes, secret handling, Health permission prompts, Siri setup, Action Button setup, Personal Automation setup, widgets, notifications, signing changes, entitlements, capabilities, or physical-device setup.

## Current Verified Baseline

- Main is at `21c3341b6cc0af29efc341e5242c952bbec150d7` after PR #52.
- PR #52 refreshed durable state after PR #51 and is merged/deployed.
- Automatic Netlify production deploy `6a2d09aaf3a2e90007fd492c` is ready for commit `21c3341b6cc0af29efc341e5242c952bbec150d7`.
- Public production ping is healthy: `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Protected routes were skipped because they require `x-coach-secret` or a real secret/account prompt.
- `HEALTH_DATABASE.json` remains unchanged.

## AppIntentsTesting Status

No AppIntentsTesting harness is currently present in the repo, and this pass should not add a new signing, entitlement, device, or account-dependent harness. The safe local proof path is workflow/model/client XCTest coverage using injected mock URL sessions, fake secret stores, and local `UserDefaults` suites. If a future Xcode/iOS toolchain exposes a stable AppIntentsTesting path that runs without signing changes, device prompts, secrets, account actions, or protected routes, add it as a separate bounded PR.

## Global Dry-Run Contract

- Missing or blank local secret must stop protected paths before the injected mock session is used.
- Missing or invalid API base URL must stop protected paths before network.
- Local-only readiness and freshness paths must not call protected routes.
- Draft-only capture paths must return `write_status: draft_only_no_write` and must not submit data.
- Workout handoffs must remain `manual_handoff_only_no_write`, with no Garmin, Rack, Motra, World Gym, Apple Health workout, browser, or third-party automation.
- Red safety must never surface as green, approved, clear-to-train, go-train, full-send, or hard-training permission.
- Shortcut/Siri-facing output must redact credential-like values and must not show raw headers, response bodies, URLs with secrets, Keychain values, or config secrets.
- Apple Health remains supporting evidence only and cannot override Garmin, Rack/Motra, Garmin Nutrition, medical/safety, or current subjective flags.

## Intent Execution Matrix

| Intent | Promoted | Purpose | Entry point | Required local setup | Pre-network gate | Use class | Expected status shape | Safe summary fields | Current mock/simulator coverage | Physical iPhone still required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SyncAppleHealthIntent` | yes | Sync Apple Health daily summaries to Coach API. | `MorningCoachWorkflow.syncAppleHealth(days:trigger:)` | API base, Todd-entered device secret, Health permission. | Missing setup stops before HealthKit authorization and before network. | authenticated Apple Health data sync | Success currently returns plain sync detail; setup failure returns typed `missingSecret`/`missingAPIBase`, `blocked_missing_setup`, `no_write`. | written-day count or safe setup failure; no secret values. | `testIntentDryRunProtectedWorkflowsStopBeforeNetworkWhenSetupMissing`; Apple Health payload tests in Node suite. | Yes: Health permission grant, real Health data availability, and device Keychain setup. |
| `MorningCoachIntent` | yes | Sync Apple Health, check source freshness, then return Coach Today. | `MorningCoachWorkflow.runMorningCoach()` | API base, Todd-entered device secret, Health permission for full sync. | Missing setup stops before sync/read network. | authenticated Apple Health sync plus protected read-only Coach readback | Final Coach Today output should expose `setup_status`, `readiness_status`, `protected_verification_status`, `write_status`, safety, freshness, and no-write where returned by Coach Today. | daily call, warnings, source freshness, no-write, redacted sync detail. | `testIntentDryRunProtectedWorkflowsStopBeforeNetworkWhenSetupMissing`; Coach Today shortcut-output tests. | Yes: Health permissions, Siri/Shortcuts execution, real device readback. |
| `CanITrainIntent` | yes | Return safety/readiness class for training. | `MorningCoachWorkflow.canITrain()` | API base and Todd-entered device secret. | Missing setup stops before protected read. | protected read-only | `setup_status: configured_locally` after successful read, `protected_verification_status: verified_read_only`, `write_status: no_write`; Red becomes `medical_caution`. | training class, safety status, next action, no workout permission on Red. | `testCanITrainRedSafetyCarriesTypedNoWriteOutput`; `testIntentDryRunProtectedWorkflowsStopBeforeNetworkWhenSetupMissing`. | Yes: physical Shortcut/Siri readback with Todd-entered secret. |
| `CheckCoachSyncStatusIntent` | yes | Check required source freshness and readiness. | `MorningCoachWorkflow.checkCoachSyncStatus()` | API base and Todd-entered device secret. | Missing setup stops before protected read. | protected read-only | `verified_read_only` and `no_write` on successful read; blocked setup on missing config. | completion percentage, missing/stale sources, Apple Health warning if present. | `testProtectedShortcutStopsBeforeNetworkWhenSecretCleared`; sync-status parser/API tests. | Yes: protected read-only device verification. |
| `CheckDailyDataFreshnessIntent` | no | Show local freshness, setup, and manual/deferred source state. | `MorningCoachWorkflow.checkDailyDataFreshness()` | No protected setup for local report; API base/secret improve setup row only. | No protected network expected. | app-local no-write freshness | Missing setup: `needs_setup`, `attention_required`, `blocked_missing_setup`, `write_held`; recent local data can show fresh/deferred rows. | per-source freshness rows, one next action, draft/no-write state. | `testDailyDataFreshnessWorkflowDoesNotCallNetworkWhenSetupIncomplete`; freshness report tests. | Yes: real local timestamps and iPhone UI readback. |
| `CoachReadinessCheckIntent` | no | Report local setup readiness and device-bound gates. | `MorningCoachWorkflow.checkReadiness()` | No protected setup required for local report. | No protected network expected. | app-local readiness gate | `configured_locally` or `needs_setup`; protected/device items deferred; `write_status: write_held`. | setup readiness, public ping state if available, protected/device/write holds. | `testReadinessWorkflowDoesNotCallNetworkAndKeepsNoWriteBoundary`; readiness report tests. | Yes: physical setup, Health, Siri/Shortcuts, Action Button, Personal Automation state. |
| `WeeklyCoachReviewIntent` | yes | Build a read-only weekly review. | `MorningCoachWorkflow.weeklyReview(weekStart:weekEnd:)` | API base and Todd-entered device secret. | Missing setup stops before protected read. | protected read-only | `write_status: no_write`, review-only result, conservative status when data stale. | week range, overall call, key warnings, not-applied confirmation. | `testWeeklyReviewResponseBuildsReadOnlyShortcutOutput`; `testWeeklyReviewClientUsesReadOnlyEndpointAndSecretHeader`; dry-run setup gate test. | Yes: protected read-only device verification. |
| `BuildTodayWorkoutIntent` | yes | Ask Coach for today's workout while preserving safety gates. | `MorningCoachWorkflow.buildTodaysWorkout(...)` | API base and Todd-entered device secret. | Missing setup stops before protected action. | protected Coach action with manual handoff | Yellow/Green plan can return `manual_handoff_only_no_write`; Red returns `no_write` and suppresses handoff. | workout title/type when safe, constraints, Rack/Garmin manual handoff, no third-party automation. | workout handoff tests; Red safety tests; `testBuildWorkoutDoesNotCallNetworkWhenSetupIncomplete`; dry-run setup gate test. | Yes: physical Shortcut/Siri readback and manual Rack/Garmin usage. |
| `NutritionCloseoutIntent` | yes | Ask Coach to evaluate nutrition. | `MorningCoachWorkflow.nutritionCloseout(note:)` | API base and Todd-entered device secret. | Missing setup stops before protected action. | protected Coach action, no separate write-readiness approval | Successful mocked direct action returns no-write shortcut output unless a future write-readiness phase changes contract. | nutrition call, next action, source quality, no write/held wording. | `testDirectCoachActionClientUsesMockedPostBoundary`; dry-run setup gate test. | Yes: protected device run; Garmin Nutrition quality still source-bound. |
| `PostWorkoutCoachIntent` | yes | Ask Coach for post-workout debrief prompt or next-session adjustment. | `MorningCoachWorkflow.postWorkoutCoach(note:)` | API base and Todd-entered device secret. | Missing setup stops before protected action. | protected Coach action, no separate write-readiness approval | Expected no-write/readback prompt unless a separately approved write phase exists. | debrief prompt, next-session constraint, write-held/no-write text. | dry-run setup gate test; direct action parser tests cover shared response path. | Yes: protected device run after workout context exists. |
| `DraftWorkoutDebriefIntent` | yes | Draft workout debrief text for review. | `MorningCoachWorkflow.draftWorkoutDebrief(note:)` | None for local draft. | No network expected. | draft-only local capture | `setup_status: not_applicable`, `readiness_status: deferred`, `protected_verification_status: not_required`, `write_status: draft_only_no_write`. | draft text, review-before-submit next action, no secret-like values. | `testIntentDryRunDraftCaptureWorkflowsStayDraftOnlyAndRedacted`; deferred output tests. | Yes only for physical Shortcut UI behavior; no protected route needed. |
| `DraftCoachNoteIntent` | no | Draft coach note for review. | `MorningCoachWorkflow.draftCoachNote(note:)` | None for local draft. | No network expected. | draft-only local capture | same draft-only status shape as above. | redacted note summary, review-before-save wording. | `testIntentDryRunDraftCaptureWorkflowsStayDraftOnlyAndRedacted`; existing draft redaction test. | Yes only for physical Shortcut UI behavior. |
| `DraftBloodPressureIntakeIntent` | no | Draft BP intake for review. | `MorningCoachWorkflow.draftBloodPressureIntake(systolic:diastolic:note:)` | None for local draft. | No network expected. | draft-only local capture | same draft-only status shape as above. | systolic/diastolic draft status, review-before-submit wording. | `testIntentDryRunDraftCaptureWorkflowsStayDraftOnlyAndRedacted`; deferred output tests. | Yes only for physical Shortcut UI behavior. |
| `OpenCoachTodayIntent` | yes | Open the app after refreshing Coach Today. | `MorningCoachWorkflow.openCoachToday()` plus `openAppWhenRun = true`. | API base and Todd-entered device secret. | Missing setup stops before protected read. | protected read-only plus app open | Coach Today typed output on success; blocked setup on missing config. | app opened, Coach Today status lines, no-write, redacted readback. | dry-run setup gate test; Coach Today parser/output tests. | Yes: app-open behavior and Shortcut/Siri UI require physical device. |

## Current Coverage Map

- Protected setup gates: `testIntentDryRunProtectedWorkflowsStopBeforeNetworkWhenSetupMissing`, `testProtectedShortcutStopsBeforeNetworkWhenSecretCleared`, `testProtectedShortcutStopsBeforeNetworkWhenBaseURLInvalid`, and `testMissingConfigurationFailureMatrixBlocksNetworkAndReturnsTypedStatuses`.
- Local readiness/freshness no-network behavior: `testReadinessWorkflowDoesNotCallNetworkAndKeepsNoWriteBoundary`, `testDailyDataFreshnessWorkflowDoesNotCallNetworkWhenSetupIncomplete`, and Daily Data Freshness report tests.
- Red safety behavior: `testCoachTodayRedSafetySuppressesHardTrainingSurfaceText`, `testBuildWorkoutRedSafetySuppressesWorkoutHandoffAndHardTrainingPermission`, `testCanITrainRedSafetyCarriesTypedNoWriteOutput`, and `testTypedRedSafetyOutputUsesHoldLanguageAndNoWriteStatuses`.
- Draft-only write hold: `testIntentDryRunDraftCaptureWorkflowsStayDraftOnlyAndRedacted`, `testDeferredDraftOutputMakesNoWriteBoundaryExplicit`, and draft redaction tests.
- Manual handoff boundary: workout handoff tests, including `testWorkoutHandoffSafeSurfaceStringsStayManualOnlyAndRedacted`.
- Redaction: safe output, shortcut failure, store redaction, direct response failure, and future-safe surface tests.

## Todd-Safe Evidence

Todd may read back these fields without exposing secrets:

- action name
- `setup_status`
- `readiness_status`
- `protected_verification_status`
- `write_status`
- `safety_status`
- stable non-secret `error_identifier`
- top-line Green/Yellow/Red-style call
- missing/stale source labels
- public/non-secret timestamps or freshness labels
- redacted next action
- confirmation that no write action was called, or that a draft/manual handoff stayed no-write

Todd must not paste Coach secrets, Authorization/Bearer headers, `x-coach-secret` values, screenshots showing secrets, raw protected response bodies, Keychain/config/env/dashboard secret screens, account/device/security prompt contents, or URLs containing credential-like query values.

## Remaining Gaps

Safe Codex work:

- Add AppIntentsTesting coverage only if the local toolchain can run it without signing changes, device prompts, secrets, account actions, protected routes, or physical-device dependencies.
- Continue expanding workflow/model tests if a future intent path adds new statuses or safe-surface fields.
- Keep this matrix aligned when intent output contracts change.

Todd/device/account boundary work:

- Install/run the app on Todd's physical iPhone.
- Enter the Coach secret directly on the device.
- Grant Health permissions.
- Verify real Shortcuts/Siri discovery and execution.
- Verify Action Button and Personal Automation behavior.
- Verify widgets/notifications only after a separately scoped implementation adds those surfaces.
- Run protected read-only checks only from Todd's device after Todd-entered setup.
- Keep write-capable submissions blocked until a separately approved write-readiness phase.
