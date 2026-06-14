# Personal Coach Readiness Gap Inventory

Last updated: 2026-06-15 Asia/Taipei.

Purpose: keep the readiness push explicit. This file separates what is already verified, what Codex can safely build next, and what must wait for Todd/device/account/manual boundaries.

## Verified Now

- Repo main is verified at `6617094108e90e395088e582246cfc80d2099a2f` after PR #65, `Add data integration readiness map`, merged. PR #65 was docs-only and did not change protected routes, production writes, provider accounts, Netlify/Supabase/GPT Action settings, or `HEALTH_DATABASE.json`.
- PR #63, `Harden iOS device command runner fallback`, is merged and deployed. Netlify production deploy `6a2f34ee63d2f6000703ab27` is ready for commit `c140815117acc7ebfcd0b3812eb5dd6c1aaed115`, and public ping is healthy: `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Full local Node test suite passed on 2026-06-15 before PR #63 merge: `node --test tests/*.test.mjs` -> `98/98`.
- iOS simulator verification before PR #63 merge passed: simulator build succeeded and explicit serial XCTest on iPhone 17 simulator id `70CC325F-9E67-43C2-9286-F5DB244399C8` passed `53/53`.
- PR #63 Device Command Runner safety model is now durable: only `daily-freshness` is allowed by default and records `completed_no_write` with redacted output; write-capable commands such as `apple-health-sync`, `sync`, `sync-apple-health`, `morning-coach`, and `all` are blocked as `blocked_write_command`; protected commands such as `sync-status`, `weekly-review`, `coach-today`, `open-coach-today`, `can-i-train`, and `build-today-workout` are blocked as `blocked_protected_command`; unknown command text is not persisted raw.
- Todd-approved physical iPhone evidence from 2026-06-15: Apple Health supporting evidence refreshed at 6:55 AM with `Wrote 7 of 7 Apple Health daily summaries`; protected read-only sync status worked through the iOS app path at 6:56 AM with `protected_verification_status: verified_read_only` and `write_status: no_write`.
- Overall Coach source freshness remained 0% for 2026-06-15 because Garmin sleep/recovery, BP, Garmin Nutrition, body composition, Rack/Motra strength session, and Rack/Motra exercise detail were stale, missing, pending, or manual/provider-bound. Coach remains usable for cautious caveated browser/GPT guidance, not full autonomous high-confidence readiness.
- Remaining local dirty-state caution: the primary main worktree is behind/dirty with unrelated changes in `ContentView.swift`, `HealthSyncViewModel.swift`, `netlify/functions/_coach-lib.mjs`, `tests/coach-engine.test.mjs`, and `tests/coach-memory.test.mjs`; the original experiment worktree still has the earlier two-file DeviceCommandRunner experimental patch. These are not approved for commit by this document.
- Current safe repo-only task: `Manual Source Evidence Packet v1`, scoped by GPT Pro from a fresh clean worktree. It should add `docs/implementation/MANUAL_SOURCE_EVIDENCE_PACKET.md` and minimal durable links only.
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
- PR #37 Current State Refresh after PR #36 merged and production deployed automatically from main.
- PR #38 No-Network Failure Matrix v1 merged and production deployed automatically from main.
- PR #39 Current State Refresh after PR #38 merged and production deployed automatically from main.
- Automatic Netlify production deploy for PR #39 merge commit `977e3851c8138c2a07fe3fed8b42ae129dd718d1` is ready: deploy id `6a2ce9247aee2d0008a8d087`, published at `2026-06-13T05:22:57.490Z`, manual deploy `false`.
- Production public ping works: `GET /api/coach/ping` returns `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Saved GPT read-only `getSyncStatus` works for 2026-06-13.
- Saved GPT read-only `buildWeeklyReview` works for 2026-06-08 through 2026-06-14.
- No GPT Action write action was called during the read-only recovery verification.
- The current OpenAPI is version `2.0.2`; public `pingCoachApi` has `security: []`; protected actions explicitly require `CoachSecret` in the `x-coach-secret` header.
- The existing iPhone app bridge exposes `SyncAppleHealthIntent`, `MorningCoachIntent`, `CheckCoachSyncStatusIntent`, `CanITrainIntent`, `WeeklyCoachReviewIntent`, `BuildTodayWorkoutIntent`, `NutritionCloseoutIntent`, `PostWorkoutCoachIntent`, `DraftWorkoutDebriefIntent`, `OpenCoachTodayIntent`, `CoachReadinessCheckIntent`, `CheckDailyDataFreshnessIntent`, `DraftCoachNoteIntent`, and `DraftBloodPressureIntakeIntent`.
- The promoted App Shortcuts list is capped at 10 to satisfy Apple's metadata processor limit; `CoachReadinessCheckIntent`, `CheckDailyDataFreshnessIntent`, `DraftCoachNoteIntent`, and `DraftBloodPressureIntakeIntent` remain implemented but are not promoted.
- iPhone Coach Setup UX Readiness v1 is merged. It adds native setup state, local API base/Keychain preflight checks, and non-secret Shortcut setup failures before protected requests run.
- iOS Secret Redaction and Shortcut Output Safety v1 is merged. It redacts credential-like values from Shortcut/App Intent output, visible app status, stored readbacks, and exposed errors.
- Daily Data Freshness UX v1 is merged. It adds a local no-write freshness report for Apple Health/iOS sync freshness, public ping state when safely checked or mocked, protected source freshness deferment, manual Garmin/Rack/Motra/nutrition/sleep/body-source deferment, BP action need, and draft-only write hold.
- Workout Handoff Formatting v1 is merged. Mocked iOS workout output exposes a redacted `workout_handoff` for manual Rack/Garmin use while preserving no-write and no-third-party-automation boundaries.
- Typed Shortcut Output Hardening v1 is merged and deployed. It extends `CoachShortcutOutput` with stable setup/readiness/protected-verification/write status fields and mock tests for missing setup, invalid setup, no-network failure, redaction, deferred writes, and manual workout handoff status.
- PR #38 No-Network Failure Matrix v1 is merged/deployed at main commit `6dfdd8261b4c8c0412f3aa744db16bd6953dcb82`. Netlify production deploy `6a2ce79080431d00083ef1b1` is ready, public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`), and protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt. Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), iOS simulator build, explicit serial iOS tests (`34/34`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged.
- PR #39 refreshed durable docs after PR #38 and is merged/deployed at main commit `977e3851c8138c2a07fe3fed8b42ae129dd718d1`. Netlify production deploy `6a2ce9247aee2d0008a8d087` is ready and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`).
- PR #40 iOS Freshness Output Hardening v1 is merged/deployed at main commit `6c5e5c89d7c40432f164e6cecaa8c447e5b8471e`. Netlify production deploy `6a2cec740605460008c73c0b` is ready, public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`), and protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt. Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), iOS simulator build, explicit serial iOS tests (`35/35`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged. PR #40 added typed per-source freshness categories, readiness/protected-verification/write status mappings, optional error identifiers, and redacted future entity/widget-safe title/detail strings without widget/signing/entitlement work, protected route calls, production writes, or physical-device setup.
- PR #41 refreshed durable docs after PR #40 and is merged/deployed at main commit `4832a295f87c47d9171a6fd65d219294744e0f7d`. Netlify production deploy `6a2cede993dd5d0008287888` is ready and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`).
- PR #42 Safe App Entity and Widget String Contract Plan v1 is merged/deployed at main commit `1c3d7dadc70edba04a64e7fe6d81a5ac32b514e7`. Netlify production deploy `6a2cf1eea8dbf50008cf7296` is ready, public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`), and protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt. Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), iOS simulator build, explicit serial iOS tests (`40/40`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged. PR #42 added reusable safe strings for future Shortcuts, Siri speech, app cards, App Entity titles/subtitles, widgets, and notifications without adding targets, changing signing/entitlements, entering secrets, calling protected routes, modifying production settings, running Supabase actions, automating third-party apps, or performing physical-device setup.
- PR #43 refreshed durable docs after PR #42 and is merged/deployed at main commit `829ec799ba73e5c03ae9c5bd00514fcfe5ef5ad1`. Netlify production deploy `6a2cf42440021c00087a3f2c` is ready and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`).
- PR #44 Repo-Wide iPhone Readiness Audit v1 is merged/deployed at main commit `74c7dff8c7b1a719b6ba04d5a25cf818b37e9ae5`. Netlify production deploy `6a2cf69a6f66a00009dfbe85` is ready and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`). Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged.
- PR #45 Device Setup Runbook Baseline Refresh is merged/deployed at main commit `221f18f8a00f8660a88229310eeea9a4aec00a09`. Netlify production deploy `6a2cf94cb9b036000940039d` is ready and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`). Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged.
- PR #47 Shortcuts Promotion and Discovery Matrix v1 is merged/deployed at main commit `8200082c205dca8ab37d2395ac4892af88d8ecb2`. Netlify production deploy `6a2cfd263e7234000874a64b` is ready and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`). Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged.
- PR #48 Current-State Refresh after PR #47 is merged/deployed at main commit `dbefa1af03be0d0d151cda84d97d732befb9c0b5`. Netlify production deploy `6a2cfeaa9cffe8000922ea6d` is ready and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`).
- PR #49 Read-Only Protected Device Verification Checklist v1 is merged/deployed at main commit `caf80b0e0e5bf61002aabbc2069e386444603e62`. Netlify production deploy `6a2d01780605460008c9fb8a` is ready, public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`), protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt, final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`, and `HEALTH_DATABASE.json` remains unchanged.
- PR #50 Current-State Refresh after PR #49 is merged/deployed at main commit `2985ec6527293b7abad4b322ea1a847afdc96963`. Netlify production deploy `6a2d0399f117b400080835f2` is ready and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`).
- PR #51 Red Safety Intent Output Test Expansion v1 is merged/deployed at main commit `4e8b176bcd103260cc5523f23a17b37d8cedfc8b`. Netlify production deploy `6a2d079440021c0009b92721` is ready, public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`), protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt, final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), iOS simulator build, explicit serial iOS tests (`44/44`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`, and `HEALTH_DATABASE.json` remains unchanged.
- PR #52 Current-State Refresh after PR #51 is merged/deployed at main commit `21c3341b6cc0af29efc341e5242c952bbec150d7`. Netlify production deploy `6a2d09aaf3a2e90007fd492c` is ready and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`).
- PR #53 App Intent Execution Dry-Run Matrix v1 is merged/deployed at main commit `541b5b9c8687921c499f66c76d32b782c6499a54`. Netlify production deploy `6a2d0e2e81eea70008c10bf6` is ready, public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`), protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt, final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), iOS simulator build, explicit serial iOS tests (`46/46`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`, and `HEALTH_DATABASE.json` remains unchanged.
- PR #55 App Intent Execution Evidence Packet v1 is merged/deployed at main commit `4ced57bdd133a004e6d59c8b5ba17b94ee19e05c`. Netlify production deploy `6a2d13f1e1d662000820aa50` is ready, public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`), protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt, final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`, and `HEALTH_DATABASE.json` remains unchanged.
- PR #57 Write-Readiness Boundary Plan v1 is merged/deployed at main commit `0650c64f0ade249fb1b8fb46cb638553641f2cf9`. Netlify production deploy `6a2d19ccde8412000856cc98` is ready, public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`), protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt, final PR #57 verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`, and `HEALTH_DATABASE.json` remains unchanged.
- PR #59 Supabase Readiness Diagnostic Plan v1 is merged/deployed at main commit `e929f50e9681cded3f8fb03ec9c03ebb249d75de`. Netlify production deploy `6a2d1dd9cb800e000843ed68` is ready, public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`), GitHub Pages run `27462472861` succeeded, protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt, final PR #59 verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`, and `HEALTH_DATABASE.json` remains unchanged.
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
- Keep `docs/implementation/APP_INTENT_EXECUTION_DRY_RUN_MATRIX.md` aligned with each App Intent's execution entry point, setup gate, expected status shape, safe evidence fields, and mock/simulator coverage.
- Keep the no-network/failure matrix current so offline, timeout, invalid response, missing setup, and deferred protected-route cases return stable identifiers, typed statuses, redacted summaries, and next actions.
- Add deeper tests for Red safety behavior in intent outputs.
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
- Use `docs/implementation/DATA_INTEGRATION_READINESS_PLAN.md` and `docs/implementation/MANUAL_SOURCE_EVIDENCE_PACKET.md` to keep manual evidence distinct from saved/imported source data.
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

1. Manual Source Evidence Packet v1: current docs-only task to give Todd one safe verbal/chat packet for stale or manual Garmin, BP, Garmin Nutrition, body, Rack/Motra, Oura, Apple Health, and safety-note evidence.
2. Sync Status Source Classification Improvements v1: future code task to distinguish primary, fallback, supporting, stale, manual/provider-bound, write-held, and not-expected source states.
3. Manual Source Freshness Draft UI v1: future iOS draft-only/no-write task using the evidence packet fields.
4. Todd-assisted Device Setup Session: when Todd is present, follow `docs/implementation/DEVICE_SETUP_RUNBOOK.md` for install, local secret entry, Health permissions, read-only Shortcut checks, Siri/Action Button/Automation setup, and readback.
5. Supabase Readiness Diagnostic Boundary: use `docs/implementation/SUPABASE_READINESS_DIAGNOSTIC_PLAN.md` if Todd separately approves production/admin inspection. Do not inspect production schema, run SQL, apply migrations, refresh schema cache, or perform admin actions without that boundary.
6. Future Write-Readiness Execution: use `docs/implementation/WRITE_READINESS_BOUNDARY_PLAN.md` before any future live write phase, GPT Action write call, Shortcut submit flow, Supabase mutation, or third-party update.
