# Personal Coach Readiness Gap Inventory

Last updated: 2026-06-13 Asia/Taipei.

Purpose: keep the readiness push explicit. This file separates what is already verified, what Codex can safely build next, and what must wait for Todd/device/account/manual boundaries.

## Verified Now

- Repo main was clean at `18b62714bd74afa42425a4363a15edaf8413119d` after PR #36 merge.
- Full local Node test suite passed on 2026-06-13 before PR #36 merge: `node --test tests/*.test.mjs` -> `97/97`.
- PR #26 iOS App Intents Readiness v1 merged and production deployed automatically from main.
- PR #27 iPhone Coach Setup UX Readiness v1 merged and production deployed automatically from main.
- PR #28 Coach Device Setup Runbook and Dry-Run Matrix v1 merged and production deployed automatically from main.
- PR #29 iOS Secret Redaction and Shortcut Output Safety v1 merged and production deployed automatically from main.
- PR #30 Coach Readiness Status and Automation Gate v1 merged and production deployed automatically from main.
- PR #31 Current State Refresh merged and production deployed automatically from main.
- PR #32 Daily Data Freshness UX v1 merged and production deployed automatically from main.
- PR #33 Current State Refresh after PR #32 merged and production deployed automatically from main.
- PR #34 Workout Handoff Formatting v1 merged and production deployed automatically from main.
- PR #35 Current State Refresh after PR #34 merged and production deployed automatically from main.
- PR #36 Typed Shortcut Output Hardening v1 merged and production deployed automatically from main.
- Automatic Netlify production deploy for PR #36 merge commit `18b62714bd74afa42425a4363a15edaf8413119d` is ready: deploy id `6a2ce15832f45b0008fdef08`, published at `2026-06-13T04:49:40.323Z`, manual deploy `false`.
- Production public ping works: `GET /api/coach/ping` returns `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Saved GPT read-only `getSyncStatus` works for 2026-06-13.
- Saved GPT read-only `buildWeeklyReview` works for 2026-06-08 through 2026-06-14.
- No GPT Action write action was called during the read-only recovery verification.
- The current OpenAPI is version `2.0.2`; public `pingCoachApi` has `security: []`; protected actions explicitly require `CoachSecret` in the `x-coach-secret` header.
- The existing iPhone app bridge exposes `SyncAppleHealthIntent`, `MorningCoachIntent`, `CheckCoachSyncStatusIntent`, `CanITrainIntent`, `WeeklyCoachReviewIntent`, `BuildTodayWorkoutIntent`, `NutritionCloseoutIntent`, `PostWorkoutCoachIntent`, `DraftWorkoutDebriefIntent`, `DraftCoachNoteIntent`, `DraftBloodPressureIntakeIntent`, and `OpenCoachTodayIntent`.
- The promoted App Shortcuts list is capped at 10 to satisfy Apple's metadata processor limit; `DraftCoachNoteIntent` and `DraftBloodPressureIntakeIntent` remain implemented but are not promoted.
- iPhone Coach Setup UX Readiness v1 is merged. It adds native setup state, local API base/Keychain preflight checks, and non-secret Shortcut setup failures before protected requests run.
- iOS Secret Redaction and Shortcut Output Safety v1 is merged. It redacts credential-like values from Shortcut/App Intent output, visible app status, stored readbacks, and exposed errors.
- Daily Data Freshness UX v1 is merged. It adds a local no-write freshness report for Apple Health/iOS sync freshness, public ping state when safely checked or mocked, protected source freshness deferment, manual Garmin/Rack/Motra/nutrition/sleep/body-source deferment, BP action need, and draft-only write hold.
- Workout Handoff Formatting v1 is merged. Mocked iOS workout output exposes a redacted `workout_handoff` for manual Rack/Garmin use while preserving no-write and no-third-party-automation boundaries.
- Typed Shortcut Output Hardening v1 is merged and deployed. It extends `CoachShortcutOutput` with stable setup/readiness/protected-verification/write status fields and mock tests for missing setup, invalid setup, no-network failure, redaction, deferred writes, and manual workout handoff status.
- Todd-assisted physical iPhone/Siri/Shortcuts setup should follow `docs/implementation/DEVICE_SETUP_RUNBOOK.md`.

## Readiness Gaps

### P0: State And Instruction Drift

Status: improved by PR #27; continuing as a standing maintenance rule.

Why it matters: stale docs can cause future Codex/GPT Pro runs to treat shipped behavior as a candidate, repeat old constraints, or stop before the real next step.

Safe Codex work:

- Keep `COACH_CURRENT_STATE.md` aligned with production and test reality.
- Keep prompt scaffolding clear that GPT Pro evaluates handoffs only and does not inspect the repo.
- Keep completion states explicit: verified, drafted/staged, or blocked.

Human boundary: none unless a doc update requires live account or secret verification.

### P0: Coach Observations Schema/Cache Readiness

Status: warning observed; not blocking weekly review.

Observed behavior:

- Weekly review completed in production.
- Netlify logged a non-blocking optional Supabase warning for `coach_observations`.
- Local migration `005_apple_health_sync.sql` defines `coach_observations`.
- Local code reads active memory context through `safeSupabase(...)`, so missing/unavailable observations fall back to an empty memory context for dashboard and weekly review reads.

Safe Codex work:

- Keep tests proving weekly review remains read-only and succeeds when optional `coach_observations` read is unavailable.
- Document that this warning is a readiness gap, not proof that a migration should be applied.

Human-boundary work:

- Any production Supabase schema inspection, migration application, schema-cache refresh, SQL repair, or database write requires a separate scoped instruction and approval boundary.

### P0: iPhone/Siri Daily Coach Surface

Status: repo-side App Intents readiness and iPhone Coach Setup UX Readiness v1 are merged; not yet physical-device verified for the expanded voice/text Coach.

Verified:

- Native app can sync Apple Health and run Morning Coach manually.
- Shortcuts can expose the existing app intents.
- Repo-side App Intents now cover weekly review, Can I Train, build workout, nutrition closeout, post-workout coach, draft debrief, draft note, draft BP intake, and Open Coach Today.
- Native setup UX now reports local configuration state and preflights protected requests before network calls.
- `docs/implementation/DEVICE_SETUP_RUNBOOK.md` now captures Todd-assisted physical setup, rollback, and dry-run validation gates.

Remaining safe Codex work:

- Keep expanding typed intent outputs, setup preflights, and safe error identifiers so Siri/Shortcuts can branch without scraping prose.
- Add deeper tests for secret redaction, missing secret, invalid secret, offline/backend failure, and Red safety behavior in intent outputs.
- Keep Apple Health supporting-only in all iPhone outputs.
- Keep draft-only write paths explicit until Todd-assisted device confirmation exists.
- Keep the merged local Coach readiness gate current as setup, public ping, protected read-only readiness, HealthKit, Siri/Shortcuts, Action Button, Personal Automation, write hold, and draft-only capture behavior evolves.
- Use the device setup runbook for future physical-device sessions rather than improvising from chat memory.

Human/device boundary:

- Installing on Todd's iPhone, entering/storing the API secret, HealthKit permission prompts, Shortcuts Personal Automation, Siri/Action Button assignment, passcodes, Face ID, or physical-device readback require Todd interaction.

### P1: Minimal-Interaction Daily Data Chain

Status: partly live, still dependent on manual or best-effort iOS behavior.

Safe Codex work:

- Keep the local Daily Data Freshness UX aligned with sync-status wording so missing/stale Garmin Nutrition, BP, sleep/recovery, and Apple Health data are actionable without Todd reading dashboards.
- Add idempotent local app or Shortcut flows where the backend contract already exists.
- Add local tests for stale/missing source explanations when behavior changes.

Human/device boundary:

- Background HealthKit automation reliability and iOS Personal Automation `Run Immediately` must be verified on Todd's physical device. Simulator or docs-only proof is not enough.

### P1: Weekly Review To Next-Week Adaptation

Status: read-only weekly review is working; automatic application is not implemented and should remain blocked by design.

Safe Codex work:

- Improve weekly review explainability and recommendation grouping if needed.
- Keep recommendations `output_only`.
- Add tests before any behavior change.

Human boundary:

- Persisting weekly reviews, applying next-week plan changes, promoting memory observations, or writing plan rows requires a separately scoped approval boundary.

### P1: Rack/Garmin Workout Execution Handoff

Status: workout output is Rack-first and Garmin-aware, but direct app automation is not safe by default.

Safe Codex work:

- Improve copy-friendly workout handoff fields for title, session type, safety status, constraints, blocks, exercises, sets/reps/rest, equipment, Rack entry lines, Garmin manual-start notes, and one next action.
- Keep handoff output redacted, Shortcut-friendly, and explicit that it is `manual_handoff_only_no_write`.
- Keep planned workout handoff separate from completed-history import.
- Add tests for output shape and source hierarchy.

Human/app boundary:

- Direct Garmin, Rack, Motra, or browser/app entry requires Todd approval for the exact surface and must stop at login, payment, permission, 2FA, account-security, or secret-entry screens.

### P2: Future Integrations

Candidate tracks:

- Apple Health workout-level intake.
- Share extension / screenshot intake inside the native app.
- Garmin official integration if approved and available.
- Watch, widgets, Live Activities, Action Button, AirPods, or CarPlay surfaces.

Rules:

- Do not scrape Garmin, Rack, Motra, Oura, Apple, World Gym, or other web interfaces.
- Do not let Apple Health override Garmin, Rack/Motra, Garmin Nutrition, safety, or medical data.
- Do not let Siri, widgets, shortcuts, or model text override deterministic safety gates.

## Next Safe Codex Task Candidates

1. Todd-assisted Device Setup Session: when Todd is present, follow `docs/implementation/DEVICE_SETUP_RUNBOOK.md` for install, local secret entry, Health permissions, read-only Shortcut checks, Siri/Action Button/Automation setup, and readback.
2. Supabase Readiness Diagnostic Plan: document and, only if separately approved, inspect production schema/cache state for `coach_observations` without applying migrations.
3. No-Network Failure Matrix v1: expand mock-only tests/docs for offline, timeout, invalid response, missing config, and deferred protected-route cases without entering secrets or calling protected routes.
4. iOS Freshness Output Hardening: consider future typed App Intent result models or `SyncStatus` entities without adding production writes.
5. iOS Secret-Redaction Test Expansion: add deeper local tests for future entity/widget strings without using real secrets.
