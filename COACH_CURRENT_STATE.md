# Coach Current State

Last updated: 2026-06-13 Asia/Taipei, after PR #47 merge/deploy verification and production public ping.

## 0. Current Verified Snapshot

- Current local branch: `main` unless a scoped Codex branch is active.
- Current verified main commit: `8200082c205dca8ab37d2395ac4892af88d8ecb2`.
- PR #27, `Add iPhone Coach setup readiness UX`, is merged to main and production deployed automatically.
- Working tree is clean after PR #47 merge/deploy verification unless a scoped Codex branch is active.
- Current full local test command: `node --test tests/*.test.mjs`.
- Current verified main test result before PR #47 merge: `97/97` passing on 2026-06-13.
- PR #27 iPhone Coach Setup UX Readiness v1 local iOS test command: `xcodebuild -project apps/ios-health-sync/ToddHealthSync.xcodeproj -scheme ToddHealthSync -destination 'platform=iOS Simulator,name=iPhone 17' test`.
- PR #27 iPhone Coach Setup UX Readiness v1 local iOS test result: succeeded on 2026-06-13, including App Intents metadata extraction and 11 `CoachTodaySummaryTests`.
- Production API ping was verified after Todd's secret rotation and the production redeploy:
  - `GET https://todd-personal-coach.netlify.app/api/coach/ping`
  - Response: `{"ok":true,"action":"ping","version":"coach-brain-v1"}`
- Production API ping was also verified after PR #27 automatic production deploy at main commit `7656419538b094abfe7f498347d48f6917b1c860`.
- PR #27 automatic production deploy:
  - Netlify deploy ID: `6a2cbe646e58290008291dd2`
  - State: `ready`
  - Context: `production`
  - Branch: `main`
  - Commit: `7656419538b094abfe7f498347d48f6917b1c860`
  - Published at: `2026-06-13T02:20:30.076Z`
  - Manual deploy: `false`
- Saved GPT read-only protected actions were verified after Todd manually updated the secret in Netlify and GPT Builder:
  - `getSyncStatus` succeeded for 2026-06-13.
  - `buildWeeklyReview` succeeded for week_start `2026-06-08`, week_end `2026-06-14`, timezone `Asia/Taipei`.
- No GPT Action write action was called during the read-only recovery verification.
- Codex did not view, request, paste, store, or handle the secret. Todd handled secret entry manually.
- `HEALTH_DATABASE.json` remains protected. It may change upstream from daily brief refresh automation, but Codex tasks must not edit it unless Todd explicitly scopes that file.
- iOS App Intents Readiness v1 is merged and repo-side only. It does not install/configure Todd's iPhone, enter or rotate secrets, grant Health permissions, configure Siri/Action Button/Personal Automation, call live production write endpoints, or submit draft-only debrief/note/BP writes.
- iPhone Coach Setup UX Readiness v1 is merged and deployed. It adds native setup status, `Save Connection`, `Check Setup`, API base/Keychain preflight checks, Keychain clear-on-empty-secret behavior, and Shortcut-safe non-secret setup failures before protected requests run. It does not install/configure Todd's iPhone, enter or rotate secrets, grant Health permissions, configure Siri/Action Button/Personal Automation, or call live protected write endpoints.
- Coach Device Setup Runbook and Dry-Run Matrix v1 is merged and deployed. It adds `docs/implementation/DEVICE_SETUP_RUNBOOK.md` for Todd-assisted physical iPhone/Siri/Shortcuts setup.
- iOS Secret Redaction and Shortcut Output Safety v1 is merged and deployed. It redacts credential-like values from Shortcut/App Intent output, visible app status, stored app readbacks, and exposed errors.
- Coach Readiness Status and Automation Gate v1 is merged and deployed as PR #30. It adds a no-write readiness gate for local setup, App Intent readiness, public ping status, protected read-only readiness, HealthKit permissions, Siri/Shortcuts, Action Button, Personal Automation, direct write hold, and draft-only capture status. It does not perform device setup, handle secrets, grant permissions, run Supabase actions, call protected routes, or call write endpoints.
- PR #31 refreshed durable state docs after PR #30 and is merged/deployed. Main is at `46884d128c554f05e94239c28cd803d133cfcaba`; Netlify production deploy `6a2ccfa10c7d490008042094` was ready, production, automatic, and public ping remained healthy.
- Daily Data Freshness UX v1 is merged and deployed as PR #32. It adds a local iOS freshness report for Apple Health sync, public ping state, protected read-only freshness, manual/deferred Garmin/Rack/Motra/nutrition/sleep/body/BP sources, and draft-only write hold. It does not call protected production routes, write endpoints, Supabase actions, env settings, or physical-device setup. Production deploy `6a2cd39f3841b20008699559` was ready, production, automatic, and public ping returned `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- PR #33 refreshed current state after PR #32 and is merged/deployed. Main is at `a6d07b2cccc9b33e270fe4d5ce4406628d6fbcda`; Netlify production deploy `6a2cd544af6864000862aa9c` was ready, production, automatic, and public ping remained healthy.
- Workout Handoff Formatting v1 is merged and deployed as PR #34. It improves Shortcut-friendly manual Rack/Garmin workout handoff text and tests without backend/API/OpenAPI changes, third-party automation, protected production calls, production writes, Supabase work, env changes, physical iPhone setup, or `HEALTH_DATABASE.json` edits. Production deploy `6a2cd96d93dd5d000826def2` was ready, production, automatic, and public ping returned `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- PR #35 refreshed durable state docs after PR #34 and is merged/deployed. Main is at `3208c188bce6e70ee94cf984d200a3d935f840ff`; Netlify production deploy `6a2cdbbc9cffe8000920fc80` was ready, production, automatic, and public ping remained healthy.
- Typed Shortcut Output Hardening v1 is merged and deployed as PR #36. It adds stable `setup_status`, `readiness_status`, `protected_verification_status`, and `write_status` lines across safe Shortcut/App Intent outputs, including setup, readiness, daily freshness, sync status, Coach Today, weekly review, direct Coach action, deferred drafts, workout handoff, and no-network failures. It does not call protected production routes, write endpoints, Supabase actions, env settings, third-party app automation, physical iPhone setup, or `HEALTH_DATABASE.json` edits. Production deploy `6a2ce15832f45b0008fdef08` was ready, production, automatic, and public ping returned `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- PR #37 refreshed durable state docs after PR #36 and is merged/deployed. Main is at `6b0a0916e3ca85b713a72e8dbbeea3712ab74474`; Netlify production deploy `6a2ce3ba4c9f2800081617e8` was ready, production, automatic, and public ping remained healthy.
- No-Network Failure Matrix v1 is merged and deployed as PR #38. It maps offline, timeout, DNS/host/connect, missing setup, invalid base URL, missing secret, non-2xx mocked responses, non-HTTP responses, and malformed JSON/decode failures to stable redacted Shortcut output. Main is at `6dfdd8261b4c8c0412f3aa744db16bd6953dcb82`; Netlify production deploy `6a2ce79080431d00083ef1b1` was ready, production, automatic, and public ping remained healthy.
- PR #39 refreshed durable state docs after PR #38 and is merged/deployed. Main is at `977e3851c8138c2a07fe3fed8b42ae129dd718d1`; Netlify production deploy `6a2ce9247aee2d0008a8d087` was ready, production, automatic, and public ping remained healthy.
- iOS Freshness Output Hardening v1 is merged and deployed as PR #40. It adds typed per-source freshness categories, readiness/protected-verification/write status mappings, optional error identifiers, and redacted future entity/widget-safe title/detail strings without widget/signing/entitlement work, protected route calls, production writes, or physical-device setup. Main is at `6c5e5c89d7c40432f164e6cecaa8c447e5b8471e`; Netlify production deploy `6a2cec740605460008c73c0b` was ready, production, automatic, and public ping returned `{"ok":true,"action":"ping","version":"coach-brain-v1"}`. Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), iOS simulator build, explicit serial iOS tests (`35/35`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged.
- PR #41 refreshed durable state docs after PR #40 and is merged/deployed. Main is at `4832a295f87c47d9171a6fd65d219294744e0f7d`; Netlify production deploy `6a2cede993dd5d0008287888` was ready, production, automatic, and public ping remained healthy.
- Safe App Entity and Widget String Contract Plan v1 is merged and deployed as PR #42. It adds reusable safe strings for future Shortcuts, Siri speech, app cards, App Entity titles/subtitles, widgets, and notifications without adding widget targets, notification targets, App Entity targets, signing/provisioning changes, entitlements, capabilities, protected routes, production writes, or physical-device setup. Main is at `1c3d7dadc70edba04a64e7fe6d81a5ac32b514e7`; Netlify production deploy `6a2cf1eea8dbf50008cf7296` was ready, production, automatic, and public ping returned `{"ok":true,"action":"ping","version":"coach-brain-v1"}`. Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), iOS simulator build, explicit serial iOS tests (`40/40`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged. Protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt.
- PR #43 refreshed durable state docs after PR #42 and is merged/deployed. Main is at `829ec799ba73e5c03ae9c5bd00514fcfe5ef5ad1`; Netlify production deploy `6a2cf42440021c00087a3f2c` was ready, production, automatic, and public ping remained healthy.
- Repo-Wide iPhone Readiness Audit v1 is merged and deployed as PR #44. It audits remaining iPhone/Siri/Shortcuts/Health/setup readiness gaps and separates safe Codex tasks from Todd/device/account/admin boundaries without implementing new features. Main is at `74c7dff8c7b1a719b6ba04d5a25cf818b37e9ae5`; Netlify production deploy `6a2cf69a6f66a00009dfbe85` was ready, production, automatic, and public ping returned `{"ok":true,"action":"ping","version":"coach-brain-v1"}`. Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged. Protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt.
- PR #45 refreshed device setup and durable state docs after PR #44 and is merged/deployed. Main is at `221f18f8a00f8660a88229310eeea9a4aec00a09`; Netlify production deploy `6a2cf94cb9b036000940039d` was ready, production, automatic, manual deploy `false`, and public ping returned `{"ok":true,"action":"ping","version":"coach-brain-v1"}`. Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged. Protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt.
- Shortcuts Promotion and Discovery Matrix v1 is merged and deployed as PR #47. It adds `docs/implementation/SHORTCUTS_PROMOTION_DISCOVERY_MATRIX.md` and cross-links it from durable setup/readiness docs so Todd can distinguish 10 promoted App Shortcuts, 4 implemented-but-unpromoted intents, and physical-device verification boundaries. Main is at `8200082c205dca8ab37d2395ac4892af88d8ecb2`; Netlify production deploy `6a2cfd263e7234000874a64b` was ready, production, automatic, manual deploy `false`, and public ping returned `{"ok":true,"action":"ping","version":"coach-brain-v1"}`. Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; `HEALTH_DATABASE.json` remains unchanged. Protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt. No App Intent/App Shortcut code changed.

## 1. Project Purpose

Todd Blackhurst's Personal Coach is a deterministic, safety-first coaching system connected to Custom GPT Actions, Supabase-backed coach data, Apple Health daily summaries, and durable coach memory. The system should behave like the same coach across new conversations while keeping medical and safety rules deterministic.

## 2. Production URLs

- Production API: `https://todd-personal-coach.netlify.app`
- Production OpenAPI: `https://todd-personal-coach.netlify.app/coach-openapi.json`
- Main Coach API function route: `/api/coach`

## 3. Key Repo Paths

- Coach API handler: `netlify/functions/coach-api.mjs`
- Deterministic coach engine and Supabase helpers: `netlify/functions/_coach-lib.mjs`
- Apple Health daily sync API: `netlify/functions/apple-health-daily.mjs`
- Custom GPT Actions OpenAPI source: `coach-openapi.json`
- Netlify clean-route mappings: `netlify.toml`
- Supabase migrations: `supabase/migrations/`
- Workout Debrief Capture migration: `supabase/migrations/007_workout_debriefs.sql`
- Coach engine tests: `tests/coach-engine.test.mjs`
- GPT route/OpenAPI tests: `tests/coach-action-routing.test.mjs`
- Workout Debrief tests: `tests/workout-debrief.test.mjs`
- Apple Health tests: `tests/apple-health-daily.test.mjs`, `tests/apple-health-dashboard-context.test.mjs`
- iOS HealthKit app: `apps/ios-health-sync/`
- iOS 27 Siri/Shortcuts strategy: `docs/IOS27_SIRI_SHORTCUTS_COACH_STRATEGY.md`
- Coach device setup runbook and dry-run matrix: `docs/implementation/DEVICE_SETUP_RUNBOOK.md`
- Current handoff file: `COACH_CURRENT_STATE.md`
- Codex/GPT Pro operating model: `docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md`
- Full implementation roadmap: `docs/implementation/COACH_10_FULL_IMPLEMENTATION_PLAN.md`
- Weekly Review Engine v1 planning doc: `docs/implementation/WEEKLY_REVIEW_ENGINE_V1_PLAN.md`
- Readiness gap inventory: `docs/implementation/READINESS_GAP_INVENTORY.md`
- iPhone readiness audit: `docs/implementation/IPHONE_READINESS_AUDIT.md`
- Weekly Review Engine v1 deterministic helper candidate: `lib/weekly-review-lib.mjs`
- Weekly Review Engine v1 API/OpenAPI wrapper: `GET /api/coach/weekly-review`, operationId `buildWeeklyReview`
- Canonical Codex prompt library: `.github/codex/prompts/`
- Do not modify: `HEALTH_DATABASE.json`

## 4. Custom GPT Action URL

The Custom GPT Actions schema is loaded from:

`https://todd-personal-coach.netlify.app/coach-openapi.json`

Current known working action set includes:

- `getSyncStatus`
- `getCoachToday`
- `buildTodayWorkout`
- `nutritionCloseout`
- `recordCoachObservation`
- `listCoachMemory`
- `correctCoachMemory`
- `retireCoachMemory`
- `buildMotraDebriefTemplate`
- `recordWorkoutDebrief`
- `listWorkoutDebriefs`
- `buildWeeklyReview` is merged, deployed, available in production OpenAPI, and verified through the saved GPT as a read-only action.
- `pingCoachApi` is a public no-auth diagnostic action at `GET /api/coach/ping`. It returns no private health, training, nutrition, memory, or secret data.

Production OpenAPI now includes Coach Memory / Observations v1 endpoints and actions:

- `POST /api/coach/observations`
- `GET /api/coach/memory`
- `POST /api/coach/memory/correct`
- `POST /api/coach/memory/retire`
- `recordCoachObservation`
- `listCoachMemory`
- `correctCoachMemory`
- `retireCoachMemory`

Production OpenAPI includes Workout Debrief Capture v1 actions:

- `POST /api/coach/workout-debrief`
- `GET /api/coach/workout-debriefs`
- `recordWorkoutDebrief`
- `listWorkoutDebriefs`

Production OpenAPI includes the Motra debrief template action:

- `POST /api/coach/motra-template`
- `buildMotraDebriefTemplate`

## 5. Authentication Rules

- Custom GPT Actions authenticate with the custom header `x-coach-secret`.
- The secret must be stored only in safe runtime surfaces such as Netlify environment variables, the iOS app Keychain/settings flow, Terminal environment variables, or GPT Action settings.
- Never paste or request `COACH_API_SECRET` in chat.
- Public unauthenticated production requests should return `401`, not data.
- Do not expose Supabase service keys or any other secret values in code, logs, docs, OpenAPI, screenshots, or chat.

## 6. Permanent Safety And Source Hierarchy

Safety and medical constraints override all device data and memory:

- Doctor guidance, BP red/yellow thresholds, migraine, asthma flare, sharp/radiating/worsening pain, and subjective pain/fatigue override devices and memory.
- Red safety cannot become hard training.
- Coach memory can only constrain, inform, or personalize. It cannot override current safety, medical flags, Garmin recovery/readiness, Rack/Motra completed strength data, or Garmin Nutrition totals.
- If memory conflicts with current data, current data wins.
- If Todd says a memory is wrong, retire or supersede it.

Source hierarchy:

- Garmin Fenix 8 / Garmin Connect is the primary integrated training, recovery, workout physiology, HR, zones, Body Battery, training load, and recovery-time source when fresh and reliably worn.
- Rack/Motra is the authority for completed strength sets, reps, loads, exercise names, and performance history.
- Garmin Connect+ Nutrition is the nutrition authority.
- Oura is the secondary/fallback sleep and recovery source when Garmin is stale, missing, or unreliable.
- Apple Health is supporting evidence and a data bus only. It must not override readiness, workout authority, safety, Garmin physiology, or Rack/Motra history.
- Soundcore Sleep A30 is a sleep aid/noise/snore masking tool only, not a recovery authority.
- Hume/Ocare is trend-only body composition evidence; do not overreact to single-day BIA swings.
- Workout debriefs are Todd-reported subjective event records. They can constrain or personalize future coaching, but they cannot override current hard safety flags, Garmin readiness/recovery, Garmin workout physiology, or Rack/Motra completed-set authority.

## 7. Completed PRs And Merge/Deploy Status

Completed and merged:

- Apple Health daily sync backend and iOS HealthKit app were built and merged.
- Apple Health daily summaries sync to Supabase.
- PR #17, `Autonomous Implementation Spine`, is merged.
  - Merge commit: `ba374520803db15e511f04e0f0b7f576ea4dbc13`.
  - Scope: docs/prompts only.
  - Added canonical Codex/GPT Pro operating model, full implementation roadmap, and `.github/codex/prompts/` prompt library.
  - No API behavior, OpenAPI, Netlify function, Supabase migration, env/secret, GPT Action auth, deploy, or `HEALTH_DATABASE.json` change.
  - GitHub Pages workflow succeeded for the merge commit. Netlify production was not separately live-verified because the change is docs/prompts only.
- PR #18, `Plan Weekly Review Engine v1`, is merged.
  - Merge commit: `bf749a796255af534fcf12754db01ab15aa9853d`.
  - Scope: planning/docs only.
  - Added `docs/implementation/WEEKLY_REVIEW_ENGINE_V1_PLAN.md`.
  - No Weekly Review Engine behavior, API route, OpenAPI, Netlify function, Supabase migration, env/secret, GPT Action refresh, manual deploy, production verification, or `HEALTH_DATABASE.json` change.
  - GitHub Pages workflow succeeded for the merge commit. Netlify production was not separately live-verified because the change is docs/planning only.
- PR #19, `Weekly Review Engine v1 Deterministic Core`, is merged.
  - Merge commit: `4749ac8b4a27d2549e38b2a15c70ecfeb017445d`.
  - Scope: pure deterministic helper and tests only.
  - Added `lib/weekly-review-lib.mjs` and weekly review tests.
  - No API route, OpenAPI change, Netlify route mapping, Supabase migration, persistence, env/secret change, GPT Action refresh, manual deploy, production verification, or `HEALTH_DATABASE.json` change.
  - GitHub Pages workflow succeeded for the merge commit with a Node.js 20 action deprecation warning only.
- Custom GPT Actions are working for `getSyncStatus`, `getCoachToday`, `buildTodayWorkout`, and `nutritionCloseout`.
- PR #10 merged and deployed: workout builder returns the safest appropriate session whenever Todd asks for a workout. Generic "build workout" should not refuse on non-strength days. Explicit strength requests on non-strength days should return controlled modified strength when non-Red. Red safety returns recovery/medical caution, not hard training.
- PR #11 merged and deployed: added `exercise_coaching_readout` and richer exercise coaching fields for GPT Actions. Production OpenAPI was verified. Production schema uses separate `floor` and `equipment` fields rather than a combined `floor_equipment`; this is acceptable.
- PR #8 merged and deployed: Morning Coach automation v1 with iOS App Intents `SyncAppleHealthIntent`, `MorningCoachIntent`, `CheckCoachSyncStatusIntent`, and `OpenCoachTodayIntent`.

PR #8 physical iPhone testing passed:

- App installed and launched.
- API base and secret stored in app, not source.
- Apple Health connected.
- Sync Now wrote 7/7.
- In-app Morning Coach worked.
- Shortcut action was visible and manually ran.

Documented PR #8 caveat:

- iOS Personal Automation "Run Immediately" could not be fully verified through iOS Mirroring. Treat this as a documented caveat, not a blocker.

Current production state:

- PR #12, `Coach Memory Observations v1 + iOS 27 Coach Strategy`, is merged and deployed.
  - Merge commit: `f9f36ea3c78755c9acbf306aac65449eb6355444`.
  - Netlify deploy ID: `6a2a7b60684dfd0009308d2a`.
  - Published at: 2026-06-11 17:10:11 Asia/Taipei.
  - Pre-merge tests: `node --test tests/*.test.mjs`, `66/66` passing.
  - Public OpenAPI and unauthenticated `GET /api/coach/memory` `401` were verified.
- PR #13, `Add Workout Debrief Capture v1`, is merged and deployed.
  - Branch commits included `dbcd761`, `436ef80`, and `220462b`.
  - Merge commit: `3e74af7ddb245a83267d02f150350dfe7877bb76`.
  - Netlify deploy ID: `6a2aa171e14f7000085e194b`.
  - Published at: 2026-06-11 19:52:35 Asia/Taipei.
  - Production OpenAPI included `recordWorkoutDebrief`, `listWorkoutDebriefs`, and `buildMotraDebriefTemplate`.
  - Public unauthenticated checks returned `401` for `POST /api/coach/workout-debrief` and `POST /api/coach/motra-template`.
- PR #14, `Shorten GPT action OpenAPI descriptions`, is merged and deployed.
  - Merge commit: `09bfb3f819db4a2815e2ccb3cb66eecd29d38cd0`.
  - Netlify deploy ID: `6a2aa672b517080008fe32ec`.
  - Published at: 2026-06-11 20:13:49 Asia/Taipei.
- PR #15, `Shorten workout debrief action description`, is merged and deployed.
  - Merge commit: `c7e1d20293752e9488c41e14360c29c0235fe078`.
  - Netlify deploy ID: `6a2aa7230175320008e2a126`.
  - Published at: 2026-06-11 20:16:46 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
- PR #20, `Weekly Review Engine v1 API/OpenAPI Wrapper`, is merged and deployed.
  - Scope: authenticated read-only `GET /api/coach/weekly-review`, operationId `buildWeeklyReview`, route/OpenAPI/tests.
  - No weekly review persistence, Coach Memory promotion, next-week plan application, OpenAI call, Supabase migration, env/secret change, or production write action.
- PR #21, `GPT Action operation-level security metadata`, is merged and deployed.
  - Scope: OpenAPI compatibility metadata so protected operations explicitly declare `CoachSecret`.
  - No route behavior, env/secret, migration, or production row change.
- PR #22/#23, auth diagnostics, are merged and deployed.
  - Scope: safe non-secret diagnostics around whether auth was configured and whether a header was supplied.
  - Diagnostics do not print or expose secret values.
- PR #24, public `pingCoachApi`, is merged and deployed.
  - Scope: public no-auth diagnostic at `GET /api/coach/ping`, OpenAPI version `2.0.2`.
  - `pingCoachApi` returns only `{ ok, action, version }` and no private coach data.
- 2026-06-13 production recovery after Todd's manual secret rotation:
  - Netlify production deploy ID: `6a2ca78f1078621ccc7c54da`.
  - Production commit: `aaef58be6964d6dcf1b331875c96a3a161613d81`.
  - Direct public ping succeeded.
  - Saved GPT read-only `getSyncStatus` and `buildWeeklyReview` succeeded.
  - No write action was called.
  - Codex did not view, request, paste, store, or handle secrets.
- PR #25, `Document coach readiness gaps and optional memory fallback`, is merged and deployed.
  - Scope: readiness gap inventory and optional memory fallback tests/docs.
  - Production public ping succeeded after the automatic deploy.
- PR #26, `iOS App Intents Readiness v1`, is merged and deployed.
  - Merge brought main to commit `110603e28bcdcc2007e7af1594dbd47919fd36d7`.
  - Netlify production deploy ID: `6a2cbaac40021c0008dcd7b5`.
  - Published at: 2026-06-13 10:04:38 Asia/Taipei.
  - Scope: repo-side App Intents expansion, typed Shortcut-safe outputs, stable error identifiers, read-only weekly review, Can I Train, workout/nutrition/post-workout scaffolding, and draft-only debrief/note/BP capture paths.
  - Public production ping succeeded after the automatic deploy.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #27, `Add iPhone Coach setup readiness UX`, is merged and deployed.
  - Merge brought main to commit `7656419538b094abfe7f498347d48f6917b1c860`.
  - Netlify production deploy ID: `6a2cbe646e58290008291dd2`.
  - Published at: 2026-06-13 10:20:30 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: native Coach Setup state, `Save Connection`, `Check Setup`, API base/Keychain preflight checks, Keychain clear-on-empty-secret behavior, and Shortcut-safe non-secret setup failures before protected requests run.
  - Public production ping succeeded after the automatic deploy.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #28, `Add Coach device setup runbook`, is merged and deployed.
  - Merge brought main to commit `9eb402776a2be7fe22505a36e967f412a41fcf86`.
  - Netlify production deploy ID: `6a2cc1557848ca0008e83fa0`.
  - Published at: 2026-06-13 10:33:05 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: device setup runbook and dry-run matrix for Todd-assisted physical iPhone/Siri/Shortcuts setup.
  - Public production ping succeeded after the automatic deploy.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #29, `Harden iOS shortcut secret redaction`, is merged and deployed.
  - Merge brought main to commit `c2b8c0cde8493e9df9074bb124c3ec7a44f7960d`.
  - Netlify production deploy ID: `6a2cc6884e4ec40008d96348`.
  - Published at: 2026-06-13 10:55:15 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: reusable iOS redaction helper, safe Shortcut/App Intent text, safe visible app status, safe stored readbacks, safe user-facing errors, and fake-placeholder Swift tests.
  - Final verification before merge: `node --test tests/*.test.mjs` passed `97/97`; default `xcodebuild ... test` completed with `TEST SUCCEEDED` and `18/18`; `xcodebuild ... build` passed; `git diff --check` passed; `git diff -- HEALTH_DATABASE.json` was empty.
  - Public production ping succeeded after the automatic deploy.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #30, `Add coach readiness automation gate`, is merged and deployed.
  - Merge brought main to commit `69dd82b47371c3e5bc96c9c15e1da7e46f83d295`.
  - Netlify production deploy ID: `6a2ccd3d9fd3c700085ad5c9`.
  - Published at: 2026-06-13 11:23:53 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: local no-write readiness gate for app configuration, valid API base URL, local secret presence without exposing the value, public ping status, protected read-only readiness, HealthKit permissions, Siri/Shortcuts, Action Button, Personal Automation, direct Coach action write hold, and draft-only capture.
  - Final verification before merge: `node --test tests/*.test.mjs` passed `97/97`; `xcodebuild ... build` passed; explicit simulator `xcodebuild ... test` completed with `TEST SUCCEEDED` and `21/21`; `git diff --check` passed; `git diff -- HEALTH_DATABASE.json` was empty.
  - Public production ping succeeded after the automatic deploy with `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #31, `Refresh current state after PR30 merge`, is merged and deployed.
  - Merge brought main to commit `46884d128c554f05e94239c28cd803d133cfcaba`.
  - Netlify production deploy ID: `6a2ccfa10c7d490008042094`.
  - Published at: 2026-06-13 11:34:04 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: docs-only durable state refresh after PR #30 merge/deploy verification.
  - Final verification before merge: `node --test tests/*.test.mjs` passed `97/97`; `git diff --check` passed; `git diff -- HEALTH_DATABASE.json` was empty. iOS build/test was not run because the change was docs-only.
  - Public production ping succeeded after the automatic deploy with `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #32, `Add daily data freshness UX`, is merged and deployed.
  - Merge brought main to commit `42d83848e8937136d7b2a579c2f4eaa4104a70c8`.
  - Netlify production deploy ID: `6a2cd39f3841b20008699559`.
  - Published at: 2026-06-13 11:51:07 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: local iOS Daily Data Freshness report, app button, unpromoted App Intent, mock-only public ping client test path, and durable docs for freshness boundaries.
  - Final verification before merge: `node --test tests/*.test.mjs` passed `97/97`; `xcodebuild ... build` passed; explicit simulator `xcodebuild ... test` completed with `TEST SUCCEEDED` and `26/26`; `git diff --check` passed; `git diff -- HEALTH_DATABASE.json` was empty.
  - Public production ping succeeded after the automatic deploy with `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #33, `Refresh current state after PR32 merge`, is merged and deployed.
  - Merge brought main to commit `a6d07b2cccc9b33e270fe4d5ce4406628d6fbcda`.
  - Netlify production deploy ID: `6a2cd544af6864000862aa9c`.
  - Published at: 2026-06-13 11:58:08 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: docs-only durable state refresh after PR #32 merge/deploy verification.
  - Final verification before merge: `node --test tests/*.test.mjs` passed `97/97`; `git diff --check` passed; `git diff -- HEALTH_DATABASE.json` was empty. iOS build/test was not run because the change was docs-only.
  - Public production ping succeeded after the automatic deploy with `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #34, `Add workout handoff formatting`, is merged and deployed.
  - Merge brought main to commit `1747f86591317c0b4643daa8c85cd9f6267d2bb6`.
  - Netlify production deploy ID: `6a2cd96d93dd5d000826def2`.
  - Published at: 2026-06-13 12:15:53 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: iOS Shortcut-safe manual workout handoff formatting and docs, including redacted `workout_handoff` output for Rack/Motra and Garmin manual use.
  - Final verification before merge: `node --test tests/*.test.mjs` passed `97/97`; `xcodebuild ... build` passed; explicit simulator `xcodebuild ... test` completed with `TEST SUCCEEDED` and `28/28`; `git diff --check` passed; `git diff -- HEALTH_DATABASE.json` was empty.
  - Public production ping succeeded after the automatic deploy with `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #35, `Refresh state after PR34 merge`, is merged and deployed.
  - Merge brought main to commit `3208c188bce6e70ee94cf984d200a3d935f840ff`.
  - Netlify production deploy ID: `6a2cdbbc9cffe8000920fc80`.
  - Published at: 2026-06-13 12:25:44 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: docs-only durable state refresh after PR #34 merge/deploy verification.
  - Final verification before merge: `node --test tests/*.test.mjs` passed `97/97`; `git diff --check` passed; `git diff -- HEALTH_DATABASE.json` was empty. iOS build/test was not run because the change was docs-only.
  - Public production ping succeeded after the automatic deploy with `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #36, `Harden typed Shortcut outputs`, is merged and deployed.
  - Merge brought main to commit `18b62714bd74afa42425a4363a15edaf8413119d`.
  - Netlify production deploy ID: `6a2ce15832f45b0008fdef08`.
  - Published at: 2026-06-13 12:49:40 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: iOS Shortcut-safe typed status output hardening for setup, readiness, protected verification, write/no-write/manual handoff states, no-network failures, and redaction.
  - Final verification before merge: `node --test tests/*.test.mjs` passed `97/97`; `xcodebuild ... build` passed; explicit simulator serial `xcodebuild ... test` completed with `TEST SUCCEEDED` and `31/31`; `git diff --check` passed; `git diff -- HEALTH_DATABASE.json` was empty.
  - Public production ping succeeded after the automatic deploy with `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- PR #37, `Refresh state after PR36 merge`, is merged and deployed.
  - Merge brought main to commit `6b0a0916e3ca85b713a72e8dbbeea3712ab74474`.
  - Netlify production deploy ID: `6a2ce3ba4c9f2800081617e8`.
  - Published at: 2026-06-13 12:59:50 Asia/Taipei.
  - Manual deploy: false. The production deploy was automatic.
  - Scope: docs-only durable state refresh after PR #36 merge/deploy verification.
  - Final verification before merge: `node --test tests/*.test.mjs` passed `97/97`; `git diff --check` passed; `git diff -- HEALTH_DATABASE.json` was empty. iOS build/test was not run because the change was docs-only.
  - Public production ping succeeded after the automatic deploy with `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
  - Protected read-only routes were not called by Codex after merge because they require `x-coach-secret`.
- Unless explicitly noted otherwise, no production secrets or environment variables were changed by Codex, no secret values were printed or pasted into chat, and Codex did not intentionally edit `HEALTH_DATABASE.json`.

Coach Memory / Observations v1 production status:

- Endpoints added through `netlify.toml` clean routes and `coach-api.mjs` action routing:
  - `POST /api/coach/observations`
  - `GET /api/coach/memory`
  - `POST /api/coach/memory/correct`
  - `POST /api/coach/memory/retire`
- Retrieval added to `coach-today` and workout decisions through `coach_memory_context`.
- Memory context is labeled as durable Supabase observation context, not fresh sensor data.
- Memory warning policy says current BP, doctor guidance, migraine, asthma, sharp/radiating/worsening pain, and fresh readiness data win.
- Read-only reviewer findings fixed before merge:
  - Correction now preserves non-active lifecycle by default instead of promoting proposed/retired memory to active.
  - Known memory validation failures now return `400`, missing observations return `404`, and server/config/Supabase failures remain `500`.
  - Secret-like string values in memory payloads, correction audit fields, previous observation/action audit fields, and retirement reasons are redacted before storage/return.
  - `list-memory` can filter the `proposed` and `superseded` lifecycle buckets while preserving the existing DB `status` constraint.
- Migration status: no migration was applied. No new migration file was created because existing migration `supabase/migrations/005_apple_health_sync.sql` already defines `coach_observations` with `status`, `evidence`, `confidence`, `action_taken`, `review_date`, `source`, `raw`, timestamps, and RLS. Proposed/superseded lifecycle metadata is stored in `raw.memory_lifecycle_status` while DB `status` remains within the existing constraint.

Workout Debrief Capture v1 production status:

- Structured record action:
  - `POST /api/coach/workout-debrief`
  - Custom GPT operation: `recordWorkoutDebrief`
- Recent-list action:
  - `GET /api/coach/workout-debriefs`
  - Custom GPT operation: `listWorkoutDebriefs`
- Context field added to `coach-today`, `buildTodayWorkout`, direct coach action responses, compact dashboard context, and source context:
  - `workout_debrief_context`
- Durable table migration:
  - `supabase/migrations/007_workout_debriefs.sql`
  - Table: `coach_workout_debriefs`
  - Status: applied to production Supabase project `Coach` (`oytxugapzdnuqhhjjsyu`) on 2026-06-11.
  - Supabase migration history shows `20260611115949 007_workout_debriefs`.
  - Production table `public.coach_workout_debriefs` exists with RLS enabled.
- Tests added:
  - `tests/workout-debrief.test.mjs`
  - `tests/coach-action-routing.test.mjs` updated for debrief routes/actions.
- Validation and safety behavior:
  - Requires `x-coach-secret`.
  - Requires valid `workout_date` and `completion_status`.
  - Validates completion status, RPE, energy, and pain severity ranges.
  - Rejects secret-like payload content instead of storing it.
  - Red-flag symptoms produce `safety_outcome: red_flag`.
  - Red-flag debrief context cannot produce a hard-training recommendation.
  - Debrief pain/symptoms can make future coaching more conservative.
  - User-reported completed exercises are explicitly labeled `user_reported_not_rack_motra`.
  - Memory candidates are returned as reviewable/proposed context only; no active Coach Memory observation is silently created.
- Test result after implementation:
  - `node --test tests/*.test.mjs`
  - Historical branch result: `79/79` passing after implementation, reviewer fixes, and OpenAPI description follow-up fixes.
  - Main full suite after later PRs: `96/96` passing on 2026-06-13.
  - This readiness branch adds one weekly-review optional-memory fallback regression, making the branch suite `97/97`.
- Read-only reviewer follow-up fixes:
  - API/OpenAPI/Auth reviewer found that `/api/coach/motra-template` was already exposed in OpenAPI and `netlify.toml` but fell through to `404`. Fixed by adding `buildMotraDebriefTemplate`, wiring the handler, and adding route/behavior tests.
  - iOS 27 readiness/privacy reviewer found stale strategy-doc language saying Coach Memory was still the current branch. Fixed doc wording and sequence to reflect `workout-debrief-capture-v1`.
  - Safety/source hierarchy reviewer found no issues.
  - Data model/lifecycle reviewer found no issues.
- Production verification:
  - Public OpenAPI returned `200` and includes `recordWorkoutDebrief`, `listWorkoutDebriefs`, and `buildMotraDebriefTemplate`.
  - Unauthenticated route checks returned expected `401`.
  - Todd's Performance Coach GPT Action schema was refreshed from the production OpenAPI after PR #15.
  - Fresh GPT Action call used `recordWorkoutDebrief` and returned `ok: true`.
  - Production smoke debrief ID: `9676f78f-de72-45d7-b0dd-5620a5231bd0`.
  - Smoke debrief row was verified in Supabase with marker `codex-recordWorkoutDebrief-smoke-20260611T1240Z`, `workout_date` `2020-01-04`, `completion_status` `skipped`, and `safety_outcome` `none`.
  - The smoke record is old-dated and labeled as non-real production smoke-test data so it should not become real coaching evidence.
- GPT/OpenAPI follow-up:
  - GPT editor initially rejected overlong OpenAPI descriptions.
  - PR #14 and PR #15 shortened only description text in `coach-openapi.json`.
  - The final GPT schema import had no GPT editor description-length warnings.

iOS 27 Siri/Shortcuts research status:

- Todd has installed the iOS 27 developer beta.
- iOS 27 Siri AI, Shortcuts, App Intents, App Schemas, App Entities, Spotlight, View Annotations, AppIntentsTesting, HealthKit notes, hardware triggers, widgets, Live Activities, Focus, Watch, CarPlay, AirPods, privacy, and beta caveats have been researched against official Apple sources.
- Strategy document added: `docs/IOS27_SIRI_SHORTCUTS_COACH_STRATEGY.md`.
- Implementation status: documentation/architecture only. No iOS 27 feature implementation has started in this branch.
- Workout Debrief Capture is documented as a future Siri/App Intent candidate only. The backend response is structured for future Shortcuts/App Intents with `safety_outcome`, `debrief_summary`, `next_recommendation_constraints`, and `requires_follow_up`.
- Stale strategy sequence language from the old Coach Memory branch has been corrected.
- Important beta caveats captured:
  - Avoid `Duration` and `LPLinkMetadata` in Coach App Intents for now unless necessary because of an iOS and iPadOS 27 beta Shortcuts known issue involving "Describe a Shortcut."
  - Avoid enum-value-dependent AppShortcut phrases for critical coach actions because of an Xcode 27 beta Siri/AppShortcut known issue.
  - Do not assume side-button, Action Button, or Siri AI behavior until Apple docs and Todd's physical iPhone testing confirm availability for the installed beta, device, language, and region.
- Safety/source hierarchy remains unchanged: medical/safety flags override all device data and memory; Red safety cannot become hard training; Garmin remains primary integrated training/recovery evidence when fresh; Rack/Motra remains completed strength authority; Apple Health remains supporting evidence only.

## 8. Known Caveats

- Do not modify `HEALTH_DATABASE.json`.
- Do not deploy manually unless a scoped instruction and current approval boundary allow it.
- Do not merge PRs unless a scoped instruction and current approval boundary allow it.
- Do not push or open a PR unless a scoped instruction and current approval boundary allow it.
- Do not apply Supabase migrations without a scoped instruction and explicit migration boundary approval.
- No Supabase migration was applied for PR #12.
- Workout Debrief Capture v1 migration `007_workout_debriefs` has been applied to production Supabase with Todd's broad completion authorization for this run.
- Do not begin unrelated phases early.
- iOS 27 Siri/Shortcuts implementation must stay bounded. Do not install on Todd's iPhone, change device permissions, handle passcodes/Face ID, or claim physical-device proof without Todd's device interaction/readback.
- The production smoke debrief row is intentionally old-dated and labeled as test data. Do not treat it as real workout feedback.
- Garmin official API integration may be valuable later, but it depends on Garmin developer approval and should not block Coach Memory.
- If local `COACH_API_SECRET` is absent, use public `401` checks for route/auth existence and use the configured GPT Action or secure provider surfaces for authenticated verification. Never paste the secret into chat.
- A weekly review production run completed even though Netlify logged a non-blocking optional Supabase warning for `coach_observations`. Local code intentionally uses optional fallback for active memory context in dashboard/weekly-review reads; production schema/cache drift should be investigated through a separate safe Supabase-readiness boundary before any migration/schema-cache action.

## 9. Current Next Build Sequence

Current readiness push:

1. Keep production read-only GPT Actions healthy and documented.
2. Close documentation/state drift so fresh Codex/GPT Pro runs do not follow obsolete PR #20 candidate instructions.
3. Build the iPhone/Siri/ChatGPT voice-text path in bounded stages:
   - current verified repo-side iPhone bridge: native Apple Health sync app plus expanded App Intents for sync, Morning Coach, sync status, Can I Train, weekly review, workout planning, nutrition closeout, post-workout Coach, draft debrief/note/BP intake, readiness/freshness checks, and typed status outputs;
   - latest verified safe app stage: PR #42 Safe App Entity and Widget String Contract Plan v1 is merged at `1c3d7dadc70edba04a64e7fe6d81a5ac32b514e7`, automatically deployed to Netlify production deploy `6a2cf1eea8dbf50008cf7296`, and public ping is healthy (`{"ok":true,"action":"ping","version":"coach-brain-v1"}`). Final pre-merge verification passed `node --test tests/*.test.mjs` (`97/97`), iOS simulator build, explicit serial iOS tests (`40/40`), `git diff --check`, and `git diff -- HEALTH_DATABASE.json`; protected routes remain skipped because they require `x-coach-secret` or a real secret/account prompt;
   - next safe repo-only docs task: Read-Only Protected Device Verification Checklist v1 should define the first Todd-assisted protected read-only device verification sequence after local secret entry, without entering secrets, calling protected routes from Codex, changing signing/entitlements, modifying production settings, running Supabase actions, automating third-party apps, or performing physical-device setup;
   - physical-device stage: install/configure/test only with Todd present for passcodes, Face ID, Health permissions, Shortcut automation, and any secret entry.
4. Investigate the `coach_observations` optional warning as schema/cache readiness, without assuming a migration is applied or needed from local files alone.
5. Use `docs/implementation/READINESS_GAP_INVENTORY.md` as the working gap list for future bounded Codex tasks.

Coach Memory / Observations v1 completed target:

- Store durable, reviewable, correctable, retireable, evidence-based observations in Supabase. Merged and deployed.
- Retrieve relevant active observations into `coach-today` and `buildTodayWorkout`. Merged and deployed.
- Include `coach_memory_context` with `summary`, `relevant_observations`, `memory_warnings`, and `last_updated`. Merged and deployed.
- Keep memory deterministic and non-authoritative over safety/current data. Merged, deployed, and covered by tests.
- Add or update OpenAPI actions for recording, listing, correcting, and retiring memory. Merged and deployed.
- Add tests for auth, lifecycle, retrieval, retired exclusion, Red safety protection, hard medical/safety protection, current-data precedence, validation errors, secret-like text redaction, and OpenAPI security. Merged and deployed; main full suite passed `96/96` before this readiness branch.

## 10. Non-Negotiable File Rule

Do not modify `HEALTH_DATABASE.json`.

If this file appears changed in `git status`, stop and inspect before continuing. Do not commit changes to it unless Todd explicitly asks for that exact file to change.

## 11. Handoff Maintenance Rule

Update `COACH_CURRENT_STATE.md` after every major project change, including:

- New PR or branch status changes.
- New endpoints or Custom GPT Actions.
- New migrations created, applied, or deferred.
- New deploy, production readback, or authenticated verification status.
- New safety/source hierarchy decisions.
- New known caveats or approval requirements.
