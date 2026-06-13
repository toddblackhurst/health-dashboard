# Coach Device Setup Runbook

Last updated: 2026-06-13 Asia/Taipei.

Purpose: prepare Todd-assisted physical iPhone setup for the native Todd Health Sync app, Siri, Shortcuts, and later automation surfaces. This runbook is a repo-only planning artifact. It does not grant permissions, enter secrets, configure a device, call protected write actions, or change production settings.

## Current Verified Baseline

- Main commit after PR #55 App Intent Execution Evidence Packet v1: `4ced57bdd133a004e6d59c8b5ba17b94ee19e05c`.
- PR #27, `Add iPhone Coach setup readiness UX`, is merged.
- PR #28, `Add Coach device setup runbook`, is merged.
- PR #29, `Harden iOS shortcut secret redaction`, is merged.
- PR #30, `Add coach readiness automation gate`, is merged.
- PR #31, `Refresh current state after PR30 merge`, is merged.
- PR #32, `Add daily data freshness UX`, is merged.
- PR #33, `Refresh current state after PR32 merge`, is merged.
- PR #34, `Add workout handoff formatting`, is merged.
- PR #35, `Refresh state after PR34 merge`, is merged.
- PR #36, `Harden typed Shortcut outputs`, is merged.
- PR #37, `Refresh state after PR36 merge`, is merged.
- PR #38, `Add no-network failure matrix`, is merged.
- PR #39, `Refresh state after PR38 merge`, is merged.
- PR #40, `Harden iOS freshness output`, is merged.
- PR #41, `Refresh state after PR40 merge`, is merged.
- PR #42, `Add safe app entity and widget string contract plan`, is merged.
- PR #43, `Refresh state after PR42 merge`, is merged.
- PR #44, `Add repo-wide iPhone readiness audit`, is merged.
- PR #45, `Refresh device setup baseline after PR44`, is merged.
- PR #47, `Add shortcuts discovery matrix`, is merged.
- PR #48, `Refresh current state after PR47 merge`, is merged.
- PR #49, `Add read-only protected device checklist`, is merged.
- PR #50, `Refresh current state after PR49 merge`, is merged.
- PR #51, `Harden red safety shortcut output`, is merged.
- PR #52, `Refresh current state after PR51 merge`, is merged.
- PR #53, `Add App Intent execution dry-run matrix`, is merged.
- PR #55, `docs: add app intent evidence packet`, is merged.
- Automatic Netlify production deploy for commit `4ced57bdd133a004e6d59c8b5ba17b94ee19e05c` is ready.
- Production deploy id: `6a2d13f1e1d662000820aa50`.
- Public production ping is healthy:

```text
GET https://todd-personal-coach.netlify.app/api/coach/ping
{"ok":true,"action":"ping","version":"coach-brain-v1"}
```

- Protected read-only routes were not called in the PR #55 post-merge check because they require `x-coach-secret` or a real secret/account prompt.
- `HEALTH_DATABASE.json` remained unchanged.
- Current readiness audit reference: `docs/implementation/IPHONE_READINESS_AUDIT.md`.
- Current App Intent execution dry-run reference: `docs/implementation/APP_INTENT_EXECUTION_DRY_RUN_MATRIX.md`.
- Current Todd-safe evidence packet reference: `docs/implementation/APP_INTENT_EXECUTION_EVIDENCE_PACKET.md`.
- Current future write-readiness boundary reference: `docs/implementation/WRITE_READINESS_BOUNDARY_PLAN.md`.

## Hard Boundaries

- Todd enters the Coach secret directly on the physical iPhone. Codex and GPT Pro must not request, paste, print, store, rotate, or inspect it.
- Shortcut/App Intent output, app status text, and future Siri/widget/notification-facing strings must redact credential-like values. This is a safety net, not permission to paste secrets into chat or source code.
- Todd handles unlock, passcode, Face ID, device trust, Health permissions, Siri prompts, Shortcuts prompts, Action Button settings, Personal Automation settings, login, 2FA, payment, account-security, and device-permission screens.
- Codex must not manually deploy production, change Netlify settings, modify environment variables, run Supabase migrations, inspect production schema, call production write endpoints, or call GPT Action write endpoints during this setup.
- Apple Health remains supporting evidence only and cannot override Garmin, Rack/Motra, Garmin Nutrition, safety, or medical authority.

## Preconditions

Before Todd starts physical-device setup:

1. Confirm main is at or after `8200082c205dca8ab37d2395ac4892af88d8ecb2`.
2. Confirm `HEALTH_DATABASE.json` has no local diff.
3. Confirm the public ping endpoint returns the healthy payload above.
4. Confirm local iOS build readiness if app code has changed since PR #27:

```text
xcodebuild -project apps/ios-health-sync/ToddHealthSync.xcodeproj -scheme ToddHealthSync -destination 'platform=iOS Simulator,name=iPhone 17' build
xcodebuild -project apps/ios-health-sync/ToddHealthSync.xcodeproj -scheme ToddHealthSync -destination 'platform=iOS Simulator,name=iPhone 17' test
```

5. Keep the production API base URL available:

```text
https://todd-personal-coach.netlify.app
```

6. Keep the Coach secret available only to Todd for direct device entry.

## Todd-Assisted Physical iPhone Setup

These steps are device-bound and must happen with Todd present.

1. Install or run the native Todd Health Sync app on Todd's iPhone from Xcode.
2. If iOS asks for device trust, developer trust, passcode, Face ID, or account permissions, Todd handles it.
3. Open the app's Coach Setup section.
4. Enter the production API base URL.
5. Todd enters the Coach secret directly into the app. Do not paste or dictate the secret through chat.
6. Tap `Save Connection`.
7. Tap `Check Setup`.
8. Expected local setup state: `Coach is configured locally`.
9. Tap `Check Coach Readiness`.
10. Expected readiness shape: local setup is ready, protected read-only routes are Todd/device-bound, HealthKit/Siri/Shortcuts/Action Button/Personal Automation are Todd/device-bound, write-capable actions are held, and draft-only capture is no-write.
11. Tap `Check Daily Data Freshness` if present in the installed build.
12. Expected freshness shape: Apple Health/iOS sync freshness is local, public ping is either fresh or safely deferred, protected read-only freshness is not claimed until a read-only route is run, Garmin/Rack/Motra/nutrition/sleep/body sources remain manual/deferred unless returned by protected Coach status, BP/intake needs Todd action, and draft-only capture remains no-write.
13. Tap `Connect Apple Health`.
14. Todd reviews and grants the HealthKit read permissions needed for daily summaries.
15. Run a manual read-only path first:
    - `Check Coach Sync Status`, or
    - in-app `Morning Coach` if Apple Health sync is also intended.
16. Read back the result. It should include source freshness and no secret value.

Use `docs/implementation/APP_INTENT_EXECUTION_DRY_RUN_MATRIX.md` to confirm the intended dry-run behavior for each App Intent before the first real iPhone run. Use `docs/implementation/READ_ONLY_PROTECTED_DEVICE_VERIFICATION_CHECKLIST.md` for the first protected read-only device verification after Todd has entered the secret directly on the iPhone. Use `docs/implementation/APP_INTENT_EXECUTION_EVIDENCE_PACKET.md` to capture only Todd-safe, non-secret physical-device results afterward. That evidence packet defines allowed fields, do-not-paste items, failure categories, and stop/escalation conditions for app, Shortcuts, Siri, Action Button, Personal Automation, draft-only, and manual handoff evidence.

Use `docs/implementation/WRITE_READINESS_BOUNDARY_PLAN.md` only after protected read-only verification succeeds and Todd separately approves a write-readiness phase for one exact path.

Shortcut/App Intent typed output should include stable status lines such as `setup_status`, `readiness_status`, `protected_verification_status`, and `write_status`. For missing setup, protected requests must stop before network and show a blocked setup status. For draft-only or manual workout handoff paths, `write_status` should show the no-write or manual-only state.

## Siri, Shortcuts, Action Button, And Personal Automation

These steps are also Todd/device-bound.

Use `docs/implementation/SHORTCUTS_PROMOTION_DISCOVERY_MATRIX.md` for the full promoted versus implemented/unpromoted intent map and expected discovery surfaces. Use `docs/implementation/APP_INTENT_EXECUTION_DRY_RUN_MATRIX.md` for expected run behavior, setup gates, status lines, and mock-test coverage before Todd checks the same actions on device.

Recommended Shortcuts to confirm:

- `Morning Coach`
- `Sync Apple Health`
- `Check Coach Sync Status`
- `Check Daily Data Freshness` if present in the installed build
- `Can I Train?`
- `Weekly Coach Review`
- `Build Today's Workout`
- `Nutrition Closeout`
- `Post-Workout Coach`
- `Draft Workout Debrief`
- `Open Coach Today`

Implemented but not promoted in the top Shortcuts list because Apple caps promoted App Shortcuts at 10:

- `Check Coach Readiness`
- `Check Daily Data Freshness`
- `Draft Coach Note`
- `Draft Blood Pressure Intake`

Suggested setup order:

1. Confirm each Shortcut appears on the physical iPhone.
2. Run `Check Coach Sync Status` manually.
3. Run `Can I Train?` manually.
4. Run `Weekly Coach Review` manually as read-only.
5. Run `Build Today's Workout` manually only after read-only checks pass. If present, confirm `workout_handoff` says `manual_handoff_only_no_write`, includes Rack/Garmin manual notes, and contains no secret-like values.
6. Run `Morning Coach` manually.
7. Assign Siri phrases only after manual runs work.
8. Assign Action Button only after Siri/Shortcuts manual runs work.
9. Configure Personal Automation only after Action Button or manual Shortcut behavior is stable.
10. Treat `Run Immediately` as unverified until Todd confirms it on the real iOS Shortcuts screen.

For the first protected read-only manual run, use `docs/implementation/READ_ONLY_PROTECTED_DEVICE_VERIFICATION_CHECKLIST.md` before assigning Siri phrases, Action Button, or Personal Automation triggers.

No-network/failure matrix expectations for every manual Shortcut check:

- Offline, timeout, DNS/host/connect failures should show `error_identifier: noNetwork`, `readiness_status: deferred`, `protected_verification_status: deferred_until_todd_device`, `write_status: no_write`, and a connection/retry next action.
- Missing or invalid setup should show `setup_status: needs_setup`, `protected_verification_status: blocked_missing_setup`, and should not send a protected network request.
- Unauthorized/non-2xx/malformed response cases should show stable redacted failure text and no raw response body, URLSession debug string, header value, token, password/api key label, or secret-like value.
- Protected route verification remains Todd/device-bound until the device-saved secret is present in a separately scoped Todd-assisted setup phase.

## Write-Action Hold

Do not live-test production write paths during this runbook unless Todd gives a separate scoped instruction for a write-readiness phase.

The required approval, audit, duplicate-prevention, rollback, and live-write gates for that later phase are defined in `docs/implementation/WRITE_READINESS_BOUNDARY_PLAN.md`.

Hold live writes for:

- Coach Memory observation/correction/retirement.
- Workout debrief submission.
- Nutrition closeout write.
- Post-workout Coach write.
- Blood pressure/intake writes.
- Any plan-application or next-week adaptation write.

Draft-only flows may be run locally when they do not submit a production write endpoint.

## Recovery And Rollback

Bad API base URL:

- Symptom: setup reports invalid API base URL.
- Recovery: correct the base URL to `https://todd-personal-coach.netlify.app`, save, and check setup again.

Missing secret:

- Symptom: setup reports missing Coach API secret.
- Recovery: Todd enters the secret directly on device, saves, and checks setup again.

Wrong or rotated secret:

- Symptom: local setup reports configured, but protected read-only routes fail unauthorized.
- Recovery: Todd verifies the current secret in the appropriate account settings and re-enters it on device. Codex must not inspect or handle the value.

Blank secret saved:

- Expected behavior: blank secret clears the local Keychain entry and setup reports missing secret.
- Recovery: Todd re-enters the secret directly on device.

Health permission denied or stale:

- Symptom: Apple Health sync fails, returns no data, or source freshness remains stale.
- Recovery: Todd reviews iOS Health permissions for Todd Health Sync, grants needed reads, then reruns manual sync.

Shortcut missing:

- Symptom: expected action is not visible in Shortcuts.
- Recovery: confirm the installed app build is current, relaunch Shortcuts, reboot if needed, and reinstall from Xcode only with Todd present.

Automation not running unattended:

- Symptom: Shortcuts requires confirmation or does not run.
- Recovery: treat automation as best-effort and keep manual `Morning Coach` / `Sync Now` as fallback until the exact iOS behavior is verified.

## Dry-Run Validation Matrix

| Case | Setup | Expected Result | Boundary |
| --- | --- | --- | --- |
| App not configured | No API base URL and no secret | `not_configured` Shortcut output; no protected request | Repo/simulator safe with mocks |
| Missing API base URL | Secret placeholder exists in fake store, API base empty | `missingAPIBase` setup error; no protected request | Mock only |
| Invalid API base URL | API base is not an http/https URL | `missingAPIBase` stable error identifier; no protected request | Mock only |
| Missing secret | Valid API base, empty fake secret | `missingSecret` setup error; no protected request | Mock only |
| Blank secret save | Save empty secret in app settings | Local Keychain entry is cleared; setup reports missing secret | Device-bound for real Keychain |
| Configured locally | Valid API base and local secret present | App reports `Coach is configured locally`; protected route still needs Todd-assisted readback | Device-bound with Todd secret entry |
| Coach readiness check | Local readiness gate | Reports local setup, public ping status, protected read-only gate, Health/Siri/Action Button/Automation boundaries, write hold, and draft-only readiness without writing | Repo/simulator safe with mocks |
| Daily data freshness check | Local freshness gate | Reports local Apple Health sync freshness, public ping state if safely checked/mocked, protected-readiness deferment, manual source deferment, BP action need, and no-write draft-only status without protected networking | Repo/simulator safe with mocks |
| Workout handoff output | Mocked direct Coach workout response | Returns redacted `workout_handoff` with manual Rack/Garmin notes and `manual_handoff_only_no_write`; no third-party automation or production write | Repo/simulator safe with mocks |
| Typed Shortcut status fields | Setup/readiness/freshness/workout/failure outputs | Includes stable `setup_status`, `readiness_status`, `protected_verification_status`, and `write_status` lines without secrets | Repo/simulator safe with mocks |
| No network | Mocked offline client failure | Returns stable `noNetwork` error with protected verification deferred and no raw secret/config value | Repo/simulator safe with mocks |
| Draft workout debrief | Draft-only intent | Returns deferred/draft output; no production write | Repo/simulator safe |
| Draft coach note | Draft-only intent | Returns deferred/draft output; no production write | Repo/simulator safe |
| Draft BP intake | Draft-only intent | Returns deferred/draft output; no production write | Repo/simulator safe |
| Public ping | Production ping endpoint | Healthy public payload with no private data | Safe read-only |
| Protected read-only route | `sync-status`, `coach-today`, or `weekly-review` | Requires Todd-entered secret on device or saved GPT Action auth | Secret/device-bound |
| Direct Coach action intent | Workout/nutrition/post-workout action | Do not live-test write behavior in this runbook | Later approved write-readiness phase |
| Siri phrase | Manual voice invocation | Same deterministic result as Shortcut action | Device-bound |
| Action Button | Hardware trigger | Same deterministic result as assigned Shortcut | Device-bound |
| Personal Automation | Scheduled run | Works only if iOS allows the chosen automation without confirmation | Device-bound and best-effort |

## Readiness Gates

Ready for Todd-assisted physical setup when:

- Main is clean and production public ping is healthy.
- Native app build/test is green if app code changed.
- PR #27 setup UX is present in the installed app.
- Todd has time to handle device prompts and secret entry directly.
- The first live checks are read-only.

Not ready when:

- Main is dirty or deploy state is unknown.
- Production public ping fails.
- The required Coach secret is not available to Todd for direct entry.
- Todd cannot handle device permission prompts.
- The intended test requires a production write, Supabase change, Netlify settings change, or account/security prompt.
