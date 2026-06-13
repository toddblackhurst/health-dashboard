# Todd Health Sync

Minimal native iOS client for Apple Health daily summaries.

## Scope

This app is intentionally small for PR 2. It requests read-only HealthKit access, summarizes the selected day range on-device, and posts the `apple-health-daily` payload to the existing Netlify coach API.

It does not write HealthKit data, store permanent secrets in source code, replace Garmin/Oura/Rack hierarchy, or change the coach backend.

Phase 3 keeps that boundary. The coach backend may read previously synced Apple Health daily summaries for `sync-status`, `coach-today`, dashboard diagnostics, and brief context, but those rows are supporting evidence only. Apple Health summaries must not override Oura readiness, Garmin workout physiology, Garmin Nutrition, Rack/Motra completed history, medical flags, or subjective safety feedback.

Morning Coach automation v1 adds a one-tap iPhone flow on top of the same boundary. It syncs Apple Health for the last 7 days, checks `sync-status`, calls `coach-today`, and shows a concise daily call. Apple Health remains supporting evidence only.

iOS App Intents Readiness v1 expands the repo-side Shortcuts surface for Todd's voice/text Coach path. It adds typed Shortcut-safe outputs, stable error identifiers, read-only weekly review support, "Can I train?", direct Coach workout/nutrition/post-workout scaffolding, and draft-only debrief/note/BP capture paths. It does not install or configure Todd's iPhone, grant Health permissions, enter secrets, run personal automations, or submit draft-only intake/debrief/memory writes.

iPhone Coach Setup UX Readiness v1 adds local configuration guardrails before protected Coach requests run. The app now shows a Coach Setup state, lets Todd save or clear the local Keychain secret, and returns structured non-secret setup failures to Shortcuts/Siri when the API base URL or device secret is missing. It still does not enter, rotate, print, or verify the real secret without Todd present on the device.

iOS Secret Redaction and Shortcut Output Safety v1 adds a reusable output safety layer for Shortcut/App Intent text, visible app status, stored app readbacks, and user-facing errors. Coach Readiness Status and Automation Gate v1 adds a no-write readiness check that separates local app setup from Todd/device-bound Health, Siri, Action Button, Personal Automation, and protected read-only verification.

Daily Data Freshness UX v1 adds a local no-write freshness check for app and Shortcut output. It reports Apple Health/iOS sync freshness from local timestamps, public ping freshness when safely checked or mocked, protected read-only freshness as deferred until a Todd-entered device secret is used, and Garmin/Rack/Motra/nutrition/sleep/body/BP sources as manual/deferred unless the protected Coach status path is run. It does not call protected routes or write endpoints.

Workout Handoff Formatting v1 adds a stable `workout_handoff` section to safe Shortcut output when `Build Today's Workout` returns a structured workout plan. The handoff is designed for manual Rack/Motra and Garmin use: title, workout type, safety status, constraints, blocks, exercises, sets/reps/rest, equipment assumptions, Rack entry lines, Garmin manual-start note, and explicit `manual_handoff_only_no_write` status. It does not automate Garmin, Rack, Motra, World Gym, Apple Health workouts, browser sessions, or any third-party app.

Typed Shortcut Output Hardening v1 adds stable status fields to `CoachShortcutOutput`: `setup_status`, `readiness_status`, `protected_verification_status`, and `write_status`. These fields let Siri/Shortcuts-facing text distinguish missing setup, local configuration, device-bound protected verification, no-network deferment, no-write read-only results, draft-only outputs, write holds, and manual workout handoffs without exposing secrets or raw payloads.

No-Network Failure Matrix v1 hardens mock-only failure handling for Shortcut/App Intent output. Offline, timeout, DNS/host/connect errors, missing setup, invalid API base URL, missing local secret, non-2xx mocked responses, non-HTTP responses, and malformed JSON/decode failures map to stable `error_identifier` values with typed setup/readiness/protected-verification/write statuses, redacted summaries, and next actions. Missing or invalid setup blocks protected requests before networking; protected verification remains deferred until Todd-assisted device setup supplies credentials on device.

iOS Freshness Output Hardening v1 adds typed per-source freshness cards for the existing local freshness report. Each source exposes a stable source category, freshness status, readiness status, protected-verification status, write status, optional error identifier, and redacted title/detail strings suitable for Siri, Shortcuts, app display, and future entity/widget/notification reuse. This is model/helper/test/docs work only; it does not add a widget target, signing change, entitlement, protected route call, or production write.

Safe App Entity and Widget String Contract Plan v1 adds reusable safe-surface strings on top of existing outputs for future Shortcuts, Siri speech, app cards, App Entity titles/subtitles, widgets, and notifications. The strings are concise, redacted, and preserve no-write/manual-only/deferred status. This remains model/helper/test/docs work inside existing app and test targets; it does not add a widget, notification workflow, App Entity target, signing capability, entitlement, protected route call, production write, or physical-device setup.

Red Safety Intent Output Test Expansion v1 hardens the existing Shortcut/Siri-facing output paths so Red safety cannot surface as hard-training permission. Red Coach Today, Can I Train, Build Today's Workout, direct Coach action output, workout handoff text, and future safe-surface strings must suppress hard-training language, preserve `no_write` or manual-only boundaries, and keep credential-like strings redacted. This remains mock/simulator repo work only; protected verification, writes, and physical iPhone setup stay Todd-assisted.

## Local Use

For first real-phone verification, follow `PHYSICAL_DEVICE_TESTING.md` and keep the result staged until the live API and Supabase rows are read back.

1. Open `ToddHealthSync.xcodeproj` in Xcode.
2. Configure a development team and keep the HealthKit capability enabled.
3. Run on Todd's iPhone. Real Apple Health data is only available on device.
4. Enter the coach API base URL and coach API secret.
5. Tap `Save Connection`.
6. Tap `Check Setup` and confirm the app reports `Coach is configured locally`.
7. Tap `Connect Apple Health`.
8. Pick the number of days to summarize. The default is 7.
9. Tap `Check Daily Data Freshness` if present in the installed build.
10. Tap `Sync Now`.
11. Tap `Morning Coach` to run the one-tap daily flow.

The API base URL is stored in app settings. The API secret is stored in the iOS Keychain. Saving an empty secret clears the local Keychain entry. Shortcut/App Intent setup failures intentionally say what is missing without including the secret value or sending a production write.

The app posts to:

```text
/api/coach/apple-health-daily
```

Morning Coach also reads:

```text
/api/coach/sync-status
/api/coach/coach-today
/api/coach/weekly-review
```

The expanded Coach actions can call existing authenticated Coach endpoints when Todd runs the corresponding Shortcut after device setup:

```text
/api/coach/workout
/api/coach/nutrition-closeout
/api/coach/post-workout
```

These direct Coach actions can log coach messages server-side. The draft debrief, draft coach note, and draft blood pressure intents intentionally do not call production write endpoints.

`Build Today's Workout` may return a Shortcut-safe `workout_handoff` section. Treat it as a manual guide only: copy or follow the Rack/Motra entry lines by hand, start/save the matching Garmin workout manually, and keep completed strength history anchored in Rack/Motra after the session.

If the Coach API base URL or local secret is missing, protected intents return a structured `not_configured` result with stable error identifiers such as `notConfigured`, `missingAPIBase`, or `missingSecret`. They do not make the protected network request in that state.

Shortcut output should keep these stable lines available for Todd-assisted testing:

```text
setup_status: ...
readiness_status: ...
protected_verification_status: ...
write_status: ...
```

No-network failures are represented with the stable `noNetwork` error identifier and a deferred protected-verification status. Draft-only and workout handoff paths must continue to say that no production write or third-party automation occurred.

When Red safety is present, Shortcut/Siri-facing output should say to hold, modify, recover, or seek human review. It must not imply `green`, `approved`, `clear to train`, `go train`, `full send`, or any equivalent hard-training permission.

## Shortcuts

The full promoted versus implemented/unpromoted intent map lives in `../../docs/implementation/SHORTCUTS_PROMOTION_DISCOVERY_MATRIX.md`.

After the app is installed on Todd's iPhone, open `Shortcuts` and confirm these Todd Health Sync actions appear:

- `Morning Coach`
- `Sync Apple Health`
- `Check Coach Sync Status`
- `Check Daily Data Freshness`
- `Can I Train?`
- `Weekly Coach Review`
- `Build Today's Workout`
- `Nutrition Closeout`
- `Post-Workout Coach`
- `Draft Workout Debrief`
- `Open Coach Today`

Apple currently limits each app to 10 promoted App Shortcuts. `Check Coach Readiness`, `Check Daily Data Freshness`, `Draft Coach Note`, and `Draft Blood Pressure Intake` are implemented App Intents but are not promoted in the top Shortcuts list; use them from the app's available actions if present after install.

Recommended setup:

1. Create a Shortcut named `Morning Coach`.
2. Add the Todd Health Sync `Morning Coach` action.
3. Create a personal automation by time of day.
4. Choose the `Morning Coach` Shortcut.
5. Use `Run Immediately` if iOS offers it.
6. If iOS requires confirmation, use the automation notification as the fallback prompt.

Manual `Sync Now` remains available and should stay the fallback whenever Shortcut/background behavior is uncertain.

Physical iPhone verification on 2026-06-09 confirmed the core Morning Coach flow, all four Shortcuts actions, manual `Morning Coach` Shortcut creation, manual Shortcut run, and authenticated production readback. The existing Shortcuts Automation screen showed `At 10:00 AM, daily -> Morning Coach Sync`, but `Run Immediately` and new Personal Automation setup were not verified because the iOS 26 Shortcuts UI in Mirroring did not allow that setup path. Todd can confirm or adjust the automation later directly on the phone.

Background HealthKit delivery is not implemented in v1. It should remain best-effort only in a future phase and must never replace the manual button or Morning Coach Shortcut.

## Payload Notes

Daily summaries use `source_app = Apple Health` and `source_device = <device name>`. The app includes duplicate policy and provenance fields so these rows can complement, not overwrite, canonical Garmin, Oura, Rack/Motra, nutrition, recovery sleep, or strength-session data.

Phase 3 readback should use the existing `apple_health_sync_runs` and `apple_health_daily_summaries` tables. It does not require a new secret, migration, deployment instruction, HealthKit permission, or `HEALTH_DATABASE.json` change.
