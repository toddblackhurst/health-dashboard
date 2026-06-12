# Coach Current State

Last updated: 2026-06-12 17:55 Asia/Taipei, after PR #18 merged and PR #19 Weekly Review Engine v1 deterministic-core branch started.

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
- Current handoff file: `COACH_CURRENT_STATE.md`
- Codex/GPT Pro operating model: `docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md`
- Full implementation roadmap: `docs/implementation/COACH_10_FULL_IMPLEMENTATION_PLAN.md`
- Weekly Review Engine v1 planning doc: `docs/implementation/WEEKLY_REVIEW_ENGINE_V1_PLAN.md`
- Weekly Review Engine v1 deterministic helper candidate: `lib/weekly-review-lib.mjs`
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
- `HEALTH_DATABASE.json` remained untouched throughout PR #13, #14, #15, migration, and production verification.
- No production secrets or environment variables were changed.
- No secret values were printed or pasted into chat.

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
  - `79/79` passing after implementation, reviewer fixes, and OpenAPI description follow-up fixes.
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
- PR #19 candidate scope is a pure deterministic Weekly Review Engine v1 helper and tests only. It must not expose an API route, change existing coach behavior, change OpenAPI, change Netlify route mappings, deploy, apply migrations, modify GPT Action authentication, touch secrets, persist weekly reviews, or change `HEALTH_DATABASE.json`.
- Do not deploy manually without Todd's explicit approval.
- Do not merge PRs without Todd's explicit approval.
- Do not push or open a PR without Todd's explicit approval.
- Do not apply Supabase migrations without Todd's explicit approval.
- No Supabase migration was applied for PR #12.
- Workout Debrief Capture v1 migration `007_workout_debriefs` has been applied to production Supabase with Todd's broad completion authorization for this run.
- Do not begin unrelated phases early.
- Do not begin iOS 27 Siri/Shortcuts implementation unless Todd explicitly approves it.
- The production smoke debrief row is intentionally old-dated and labeled as test data. Do not treat it as real workout feedback.
- Garmin official API integration may be valuable later, but it depends on Garmin developer approval and should not block Coach Memory.
- If local `COACH_API_SECRET` is absent, use public `401` checks for route/auth existence and use the configured GPT Action or secure provider surfaces for authenticated verification. Never paste the secret into chat.

## 9. Current Next Build Sequence

Active deterministic-core candidate:

- PR #19, Weekly Review Engine v1 Deterministic Core, is intended to add `lib/weekly-review-lib.mjs`, focused weekly-review tests, and update this current-state file only.
- Scope boundary: pure helper/tests only. API routes, OpenAPI, migrations, persistence, deployments, GPT Action refresh, and production data changes remain outside PR #19.

Recommended sequence:

1. PR #12 Coach Memory / Observations v1. Merged and deployed to production.
2. PR #13 Workout Debrief Capture v1. Merged, migrated, deployed, and GPT Action smoke-verified in production.
3. iOS 27 Siri/Shortcuts Readiness PR.
4. Apple Health workout-level intake.
5. Rack/Motra import/debrief support.
6. Weekly Review Engine.
7. Garmin official integration track if approved.

Alternate sequence if Todd wants iOS work pulled forward:

1. iOS 27 Siri/Shortcuts Readiness PR, documentation-only.
2. iOS 27 Siri/Shortcuts Implementation PR only after Todd explicitly approves implementation.
3. Apple Health workout-level intake or Rack/Motra import/debrief support, depending on Todd's priority.

Coach Memory / Observations v1 completed target:

- Store durable, reviewable, correctable, retireable, evidence-based observations in Supabase. Merged and deployed.
- Retrieve relevant active observations into `coach-today` and `buildTodayWorkout`. Merged and deployed.
- Include `coach_memory_context` with `summary`, `relevant_observations`, `memory_warnings`, and `last_updated`. Merged and deployed.
- Keep memory deterministic and non-authoritative over safety/current data. Merged, deployed, and covered by tests.
- Add or update OpenAPI actions for recording, listing, correcting, and retiring memory. Merged and deployed.
- Add tests for auth, lifecycle, retrieval, retired exclusion, Red safety protection, hard medical/safety protection, current-data precedence, validation errors, secret-like text redaction, and OpenAPI security. Merged and deployed; current full suite passes `79/79`.

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
