# Shortcuts Promotion And Discovery Matrix

Last updated: 2026-06-13 Asia/Taipei.

Purpose: document the current repo-side App Intents and App Shortcuts discovery expectations for Todd Health Sync. This is a docs-only verification aid for a later Todd-assisted physical iPhone setup. It does not add, remove, promote, reorder, or rename App Intents or App Shortcuts.

For execution behavior, setup gates, expected status fields, safe evidence, and mock-test coverage, use `docs/implementation/APP_INTENT_EXECUTION_DRY_RUN_MATRIX.md`. This file answers "where should the action appear?"; the dry-run matrix answers "what should happen when it runs?"

## Current Verified Baseline

- Main is at `541b5b9c8687921c499f66c76d32b782c6499a54`.
- PR #53, App Intent Execution Dry-Run Matrix v1, is merged and deployed after PR #52.
- Automatic Netlify production deploy `6a2d0e2e81eea70008c10bf6` is ready for commit `541b5b9c8687921c499f66c76d32b782c6499a54`.
- Public production ping is healthy: `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Protected routes were skipped because they require `x-coach-secret` or a real secret/account prompt.
- `HEALTH_DATABASE.json` remains unchanged.

## Discovery Rules

- Apple currently caps the promoted App Shortcuts list at 10 per app, so not every implemented App Intent is promoted in the top Shortcuts list.
- Promoted shortcuts should be checked first in the Shortcuts app after the latest app build is installed on Todd's physical iPhone.
- Unpromoted intents may still appear as available Todd Health Sync actions inside Shortcuts after install, but they should not be treated as missing only because they are absent from the top promoted list.
- Siri phrases, Action Button assignment, and Personal Automation behavior are physical-device checks. Codex must not claim those are verified until Todd performs or reads back the real iPhone state.
- Missing or invalid local setup must stop protected requests before network and show safe setup/protected-verification/write status lines.

## Intent Matrix

| Implemented intent | User-facing action | Promoted App Shortcut | Expected discovery surface | Use class | Setup before use | Health permission | Device secret | Safe evidence Todd can report |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MorningCoachIntent` | Morning Coach | promoted | Shortcuts app, Siri phrase/search, Action Button candidate, Personal Automation candidate, app manual fallback | protected read-only plus Apple Health sync | API base, Todd-entered device secret, Health permissions for full sync | yes for Apple Health sync | yes | `setup_status`, `readiness_status`, `protected_verification_status`, `write_status`, source freshness, no secret values |
| `SyncAppleHealthIntent` | Sync Apple Health | promoted | Shortcuts app, Siri phrase/search, Personal Automation candidate, app manual fallback | HealthKit sync to coach API | API base and Health permissions; protected Coach source readback is separate | yes | may be needed for authenticated sync path | sync result, `write_status`, redacted error identifier if failed |
| `CheckCoachSyncStatusIntent` | Check Coach Sync Status | promoted | Shortcuts app, Siri phrase/search, Action Button candidate, app manual fallback | protected read-only | API base and Todd-entered device secret | no direct Health grant, but freshness may depend on prior sync | yes | freshness summary, missing/stale source lines, `protected_verification_status` |
| `CanITrainIntent` | Can I Train? | promoted | Shortcuts app, Siri phrase/search, Action Button candidate, app manual fallback | protected read-only safety/readiness check | API base and Todd-entered device secret | no direct Health grant, but better after sync | yes | Green/Yellow/Red-style call, safety status, next action, no write |
| `WeeklyCoachReviewIntent` | Weekly Coach Review | promoted | Shortcuts app, Siri phrase/search, app manual fallback | protected read-only weekly review | API base and Todd-entered device secret | no direct Health grant, but data quality depends on sources | yes | weekly call, source warnings, `write_status: no_write` or equivalent |
| `BuildTodayWorkoutIntent` | Build Today's Workout | promoted | Shortcuts app, Siri phrase/search, app manual fallback | protected read-only workout planning with manual handoff | API base and Todd-entered device secret | no direct Health grant, but readiness data may depend on source freshness | yes | workout summary, safety constraints, `workout_handoff`, `manual_handoff_only_no_write` |
| `NutritionCloseoutIntent` | Nutrition Closeout | promoted | Shortcuts app, Siri phrase/search, app manual fallback | protected coach action; write-capable backend remains held unless separately scoped | API base and Todd-entered device secret | no | yes | conservative nutrition summary or write-held status; no secret values |
| `PostWorkoutCoachIntent` | Post-Workout Coach | promoted | Shortcuts app, Siri phrase/search, app manual fallback | protected coach action; write-capable behavior remains held unless separately scoped | API base and Todd-entered device secret | no | yes | debrief prompt or next-session constraints with write-held/no-write status |
| `DraftWorkoutDebriefIntent` | Draft Workout Debrief | promoted | Shortcuts app, Siri phrase/search, app manual fallback | draft-only local capture | no protected setup required for draft text; do not submit automatically | no | no | `write_status: draft_only` or no-write draft text |
| `OpenCoachTodayIntent` | Open Coach Today | promoted | Shortcuts app, Siri phrase/search, app manual fallback, opens app when run | protected read-only plus app open | API base and Todd-entered device secret for readback | no direct Health grant, but better after sync | yes | app opens, redacted Coach Today text, status lines |
| `CoachReadinessCheckIntent` | Check Coach Readiness | unpromoted | available app action if present, app setup screen fallback | local readiness gate | no protected setup required for local readiness; device-bound items remain deferred | not granted by Codex | no for local check | local setup state, protected verification deferred/blocked, write hold |
| `CheckDailyDataFreshnessIntent` | Check Daily Data Freshness | unpromoted | available app action if present, app manual fallback | local no-write freshness report | no protected setup required for local report; protected freshness deferred until device secret exists | useful for Apple Health freshness | no for local report | per-source freshness rows, `protected_verification_status`, `write_status` |
| `DraftCoachNoteIntent` | Draft Coach Note | unpromoted | available app action if present, app manual fallback | draft-only local capture | no protected setup required for draft text; do not save memory automatically | no | no | `write_status: draft_only`, note summary with no secret-like values |
| `DraftBloodPressureIntakeIntent` | Draft Blood Pressure Intake | unpromoted | available app action if present, app manual fallback | draft-only local capture | no protected setup required for draft text; do not submit intake automatically | no | no | systolic/diastolic draft status, `write_status: draft_only`, no write confirmation |

## Todd-Assisted Verification Sequence

1. Install or run the latest app build on Todd's physical iPhone with Todd present.
2. Open Todd Health Sync and confirm the API base URL is set to `https://todd-personal-coach.netlify.app`.
3. Todd enters the Coach secret directly on the device. Codex and GPT Pro must not see, request, paste, dictate, or store it.
4. Tap `Save Connection`, then `Check Setup`; safe evidence is setup status text such as `Coach is configured locally`.
5. Grant Apple Health permissions only through Todd's physical-device prompts.
6. Run app-side checks first: `Check Setup`, `Check Coach Readiness`, and `Check Daily Data Freshness` if present.
7. Open Shortcuts and confirm the promoted actions listed in the matrix appear for Todd Health Sync.
8. Search available Todd Health Sync actions for unpromoted intents; absence from the top promoted list is expected.
9. Run read-only checks manually before Siri or automation: `Check Coach Sync Status`, `Can I Train?`, `Weekly Coach Review`, then `Morning Coach`.
10. Run `Build Today's Workout` only after read-only checks are safe; confirm any `workout_handoff` is manual-only and no-write.
11. Assign Siri phrases only after manual Shortcuts work.
12. Treat Action Button and Personal Automation as candidates until Todd verifies them on the real iPhone.
13. Capture only non-secret evidence: status lines, redacted summaries, readiness/freshness labels, and no-write/manual-only/draft-only markers.

For the first protected read-only device run after Todd-entered secret setup, use `docs/implementation/READ_ONLY_PROTECTED_DEVICE_VERIFICATION_CHECKLIST.md` for action order, safe evidence fields, stop conditions, and rollback steps.

## Troubleshooting

- Shortcut not visible: confirm the installed app build is current, reopen Shortcuts, search Todd Health Sync actions, relaunch the app, then reboot/reinstall only with Todd present.
- Unpromoted intent not appearing as an App Shortcut: this may be expected because only 10 App Shortcuts are promoted; search the app's available actions instead.
- Missing secret: protected checks should report setup needed or protected verification blocked/deferred; Todd re-enters the secret directly on device.
- Invalid API base URL: correct it to `https://todd-personal-coach.netlify.app`, save, and rerun setup checks.
- Health permission required: Todd reviews Health permissions for Todd Health Sync and reruns local sync/freshness checks.
- Protected verification deferred: this is expected until the device-saved secret is present and Todd runs the check on the physical iPhone.
- First protected read-only verification uncertain: return to `docs/implementation/READ_ONLY_PROTECTED_DEVICE_VERIFICATION_CHECKLIST.md` and run only one manual read-only action before any Siri, Action Button, Personal Automation, or write-readiness path.
- No network: expect stable no-network/deferred status, a redacted summary, and no protected write.
- Stale data: use freshness/source warning lines; do not let Apple Health override Garmin, Rack/Motra, Garmin Nutrition, safety, or medical hierarchy.
- No-write/manual-handoff-only status: expected for workout handoff and draft-only capture paths unless a later write-readiness phase is explicitly scoped.
- App Shortcut promotion cap: keep the top promoted list at 10 unless a future code PR explicitly changes the promoted set and verifies App Intents metadata extraction.

## Hard Boundaries

- No real secret handling by Codex or GPT Pro.
- No physical iPhone setup, Health permission grants, Siri setup, Shortcuts setup, Action Button setup, Personal Automation setup, widget/notification setup, login, 2FA, payment, account, or device-permission actions by Codex.
- No protected production route calls, production writes, GPT Action writes, Supabase production actions, Netlify/env changes, third-party app automation, or real workout/activity/note creation.
- No app code, App Intent, App Shortcut, signing, entitlement, capability, widget, notification, App Entity, OpenAPI, backend, test, migration, env, or `HEALTH_DATABASE.json` changes in this docs-only pass.
