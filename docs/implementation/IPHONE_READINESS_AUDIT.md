# iPhone Readiness Audit

Last updated: 2026-06-13 Asia/Taipei.

Purpose: capture the repo-only readiness state for Todd's iPhone/Siri/Shortcuts/Health Coach path and separate safe Codex work from Todd/device/account/admin boundaries. This audit does not approve feature implementation, protected route calls, production writes, Supabase actions, signing/capability changes, or physical-device setup.

## Verified Baseline

- Main is at `caf80b0e0e5bf61002aabbc2069e386444603e62`.
- PR #49, Read-Only Protected Device Verification Checklist v1, is merged after PR #48.
- Automatic Netlify production deploy `6a2d01780605460008c9fb8a` is ready for commit `caf80b0e0e5bf61002aabbc2069e386444603e62`.
- Public ping is healthy: `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Protected routes were skipped because they require `x-coach-secret` or a real secret/account prompt.
- `HEALTH_DATABASE.json` remains unchanged.

## Repo-Side Implemented

- iOS Coach setup UX: the app stores the API base in settings, stores the Coach secret in Keychain, clears the Keychain entry when an empty secret is saved, and reports local setup state before protected requests run.
- App Intents and Shortcuts: implemented intents include sync, Morning Coach, sync status, readiness, daily freshness, Can I Train, weekly review, workout, nutrition closeout, post-workout Coach, draft debrief, draft note, draft BP intake, and Open Coach Today. The promoted App Shortcuts list is capped at 10; `CoachReadinessCheckIntent`, `CheckDailyDataFreshnessIntent`, `DraftCoachNoteIntent`, and `DraftBloodPressureIntakeIntent` are implemented but not all promoted.
- Typed output contracts: `CoachShortcutOutput` exposes setup, readiness, protected verification, write status, safety status, source freshness, workout handoff, and next action fields.
- Redaction and safe display: `CoachSafeOutput` and `CoachFutureSafeStrings` provide redacted, length-bounded, future-safe text for Shortcuts, Siri speech, app cards, App Entity labels, widgets, and notifications.
- Readiness gate: the local readiness model separates local setup, public ping, protected read-only readiness, HealthKit, Siri/Shortcuts, Action Button, Personal Automation, write holds, and draft-only readiness.
- Daily freshness report: Apple Health/iOS sync freshness is local; public ping can be safely checked or mocked; protected freshness is deferred; Garmin/Rack/Motra/nutrition/sleep/body/BP rows remain manual or device-bound.
- Workout handoff formatting: workout output can include redacted `workout_handoff` text for manual Rack/Motra and Garmin use, with explicit `manual_handoff_only_no_write` semantics.
- No-network/failure matrix: offline, timeout, DNS/host/connect, missing setup, invalid API base, missing secret, non-2xx, invalid response, malformed JSON, and deferred protected-route cases map to stable redacted Shortcut output.
- Backend/OpenAPI boundaries: public ping is unauthenticated and data-free; protected read routes require `x-coach-secret`; write-capable actions remain authenticated and should not be live-tested without a separate write-readiness phase.

## Not Physically Verified

- Physical iPhone install/run of the latest app build.
- HealthKit permission grants on Todd's actual iPhone.
- Todd-entered Coach secret in the physical-device Keychain/config.
- Protected read-only route verification from the physical device using Todd-entered credentials.
- Siri phrase behavior and region/device/language availability.
- Shortcuts visibility and run behavior on the physical device.
- Action Button assignment.
- Personal Automation `Run Immediately` behavior.
- Real daily sync cadence and background HealthKit reliability.
- Real Rack/Garmin/manual handoff usage after a generated workout.

## Remaining Readiness Risks

- Simulator-only verification cannot prove Siri, Shortcuts UI, Action Button, Personal Automation, Health permissions, or device Keychain behavior.
- Protected read-only verification is pending Todd-entered device credentials.
- Write-capable paths are intentionally held; draft-only outputs must stay no-write until a separate write-readiness phase.
- Third-party integrations for Garmin, Rack/Motra, Oura, World Gym, and nutrition remain manual/deferred unless a safe official integration is separately scoped.
- Supabase `coach_observations` schema/cache uncertainty remains documented as a production/admin boundary, not proof that a migration or schema-cache action should be run.
- The App Shortcuts 10-promotion cap forces prioritization; implemented but unpromoted intents may require manual discovery in Shortcuts.
- Source freshness UX still depends on what the device can safely verify without protected credentials.
- `docs/implementation/DEVICE_SETUP_RUNBOOK.md` baseline was refreshed after PR #44; its device-bound setup steps and hard boundaries remain the active procedure.

## Safe Codex Repo-Only Backlog

### Completed: Device Setup Runbook Baseline Refresh

Result: PR #45 updated `docs/implementation/DEVICE_SETUP_RUNBOOK.md` so its baseline references main `221f18f8a00f8660a88229310eeea9a4aec00a09`, production deploy `6a2cf94cb9b036000940039d`, public ping health, protected-route skip status, and unchanged `HEALTH_DATABASE.json` while preserving the existing Todd-assisted steps.

Files likely involved: `docs/implementation/DEVICE_SETUP_RUNBOOK.md`, possibly `COACH_CURRENT_STATE.md`.

Acceptance criteria: the runbook baseline matches current production, public ping remains data-free, protected routes remain skipped, and the Todd/device/account boundaries are unchanged.

Expected verification: `node --test tests/*.test.mjs`, `git diff --check`, `git diff -- HEALTH_DATABASE.json`.

Boundaries preserved: docs-only; no device setup, no protected routes, no secret handling, no deploy settings.

### Completed: Shortcuts Promotion And Discovery Matrix

Result: PR #47 added `docs/implementation/SHORTCUTS_PROMOTION_DISCOVERY_MATRIX.md` to document which App Intents are promoted, implemented but unpromoted, and best accessed from the Shortcuts app after install.

Working document: `docs/implementation/SHORTCUTS_PROMOTION_DISCOVERY_MATRIX.md`.

Files likely involved: `docs/implementation/DEVICE_SETUP_RUNBOOK.md`, `apps/ios-health-sync/README.md`, `MOBILE_CODEX_COACH_SETUP.md`.

Acceptance criteria: Todd can see the exact expected promoted list, unpromoted list, and what to do if an implemented action is not visible.

Expected verification: docs-only tests above.

Boundaries: no App Shortcuts list change unless separately scoped as code/tests/docs; no physical-device verification claim.

### 3. Read-Only Protected Device Verification Checklist

Current working document: `docs/implementation/READ_ONLY_PROTECTED_DEVICE_VERIFICATION_CHECKLIST.md`.

Goal: keep a short checklist for the first Todd-assisted protected read-only route test after the secret is entered on device.

Files likely involved: `docs/implementation/DEVICE_SETUP_RUNBOOK.md`, `MOBILE_CODEX_COACH_SETUP.md`.

Acceptance criteria: checklist names the route class to test (`sync-status`, `coach-today`, or `weekly-review`), expected safe readback, and what not to share back with Codex.

Expected verification: docs-only tests above.

Boundaries: no secret entry, no protected route call by Codex, no GPT Action write call.

### 4. Red Safety Intent Output Test Expansion

Goal: deepen iOS tests proving Siri/Shortcuts-facing outputs cannot turn Red safety into hard training.

Files likely involved: `apps/ios-health-sync/ToddHealthSyncTests/CoachTodaySummaryTests.swift`, possibly `apps/ios-health-sync/ToddHealthSync/Models.swift` if a gap is found.

Acceptance criteria: test coverage shows Red/medical/symptom flags remain conservative in `CoachShortcutOutput`, direct action summaries, and workout handoff text.

Expected verification: Node tests if backend docs are touched, iOS simulator build, explicit serial iOS tests, `git diff --check`, `git diff -- HEALTH_DATABASE.json`.

Boundaries: code/tests/docs only; no protected routes, no write calls, no device setup.

### 5. App Entity And Widget Design Spec

Goal: turn the existing safe string contract into a design spec for future App Entity/widget/notification targets without creating those targets.

Files likely involved: `docs/IOS27_SIRI_SHORTCUTS_COACH_STRATEGY.md`, `docs/implementation/IPHONE_READINESS_AUDIT.md`.

Acceptance criteria: spec maps safe strings to candidate surfaces, privacy allowlists, and acceptance tests for a future implementation PR.

Expected verification: docs-only tests above.

Boundaries: no widget target, notification workflow, App Entity target, signing/provisioning, entitlements, capabilities, or device settings.

## Todd / Device / Account Boundary Backlog

### 1. Physical iPhone Install And Local Setup

Todd action: install/run the latest app on the physical iPhone, enter the production API base URL, enter the Coach secret directly on device, save, and check setup.

Prerequisite repo state: clean main, public ping healthy, runbook current.

Codex/GPT Pro must not handle: secret value, passcode, Face ID, device trust, account prompts, permission prompts, or device-control steps without Todd present.

Safe evidence Todd can provide: setup status text such as `Coach is configured locally`, with no secret value.

### 2. HealthKit Permission And Manual Sync

Todd action: grant needed Apple Health read permissions, run `Sync Now`, then run Daily Data Freshness or Morning Coach.

Prerequisite repo state: app installed and locally configured.

Codex/GPT Pro must not handle: Health permission prompts or private Health app screens.

Safe evidence Todd can provide: whether Apple Health freshness is fresh/stale/missing and any non-secret error text.

### 3. Protected Read-Only Device Verification

Todd action: run one protected read-only Shortcut or app path after local setup, preferably `Check Coach Sync Status`, `Weekly Coach Review`, or `Morning Coach`.

Prerequisite repo state: app configured with Todd-entered secret and public ping healthy.

Codex/GPT Pro must not handle: the secret, raw headers, account settings, or protected payloads containing sensitive detail unless Todd intentionally summarizes safe output.

Safe evidence Todd can provide: top-line status, `protected_verification_status`, `write_status`, and whether the action succeeded.

### 4. Siri, Action Button, And Personal Automation

Todd action: manually confirm Siri phrase behavior, assign Action Button if desired, and test Personal Automation `Run Immediately` if available.

Prerequisite repo state: manual Shortcuts work reliably.

Codex/GPT Pro must not handle: device settings, permission prompts, passcodes, Face ID, or unattended automation assumptions.

Safe evidence Todd can provide: whether each trigger ran the expected Shortcut and whether the output matched the manual run.

## Human-Approved Production/Admin Backlog

### 1. Supabase Observations Schema/Cache Readiness

Why approval is needed: schema inspection, migration application, schema-cache refresh, and production SQL cross the database/admin boundary.

Boundary crossed: Supabase production admin/data plane.

Before verification: confirm local code still treats `coach_observations` as optional for weekly review/dashboard reads and tests pass without it.

After verification: confirm whether the production warning is schema absence, schema cache, permissions, or harmless optional fallback. Do not apply migrations without a separate scoped approval.

### 2. GPT Action Auth Or Schema Reimport

Why approval is needed: GPT Builder action auth and schema import are account settings and may involve secrets.

Boundary crossed: GPT Action settings and secret entry.

Before verification: public ping and production OpenAPI URL should be healthy.

After verification: Todd can report raw non-secret action results for `pingCoachApi`, `getSyncStatus`, or `buildWeeklyReview`. Codex must not request or inspect the secret.

### 3. Netlify Environment Or Secret Changes

Why approval is needed: environment variables and site settings are production account configuration.

Boundary crossed: Netlify production settings.

Before verification: identify whether the issue is code, deploy, route, or secret mismatch using public ping and non-secret evidence.

After verification: public ping should remain healthy; protected route status should be verified only through Todd-entered credentials or saved action auth.

## Deferred Write-Readiness Backlog

- Coach Memory observation/correction/retirement from iPhone.
- Workout debrief submission from the physical device.
- Nutrition closeout writes.
- Post-workout Coach writes.
- Blood pressure/intake writes.
- Applying weekly review recommendations or next-week plan changes.

Each write-readiness task needs explicit confirmation UX, deterministic safety checks, redaction tests, no duplicate submission behavior, production write auditability, and Todd-approved live verification. Until then, draft-only and manual-handoff-only outputs are the correct behavior.
