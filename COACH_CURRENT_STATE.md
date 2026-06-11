# Coach Current State

Last updated: 2026-06-11 17:36 CST, after read-only reviewer fixes and tests on `workout-debrief-capture-v1`.

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

Production OpenAPI now includes Coach Memory / Observations v1 endpoints and actions:

- `POST /api/coach/observations`
- `GET /api/coach/memory`
- `POST /api/coach/memory/correct`
- `POST /api/coach/memory/retire`
- `recordCoachObservation`
- `listCoachMemory`
- `correctCoachMemory`
- `retireCoachMemory`

Local branch OpenAPI adds Workout Debrief Capture v1 actions:

- `POST /api/coach/workout-debrief`
- `GET /api/coach/workout-debriefs`
- `recordWorkoutDebrief`
- `listWorkoutDebriefs`

Local branch also fixes the previously exposed but unimplemented Motra template route:

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

Current branch and PR state:

- Current local branch for next workstream: `workout-debrief-capture-v1`
- Branch status: local only; not pushed.
- First branch commit: `dbcd761 Update handoff after Coach Memory production deploy`.
- Feature implementation commit: `436ef80 Add workout debrief capture v1`.
- Reviewer fix commit: committed after this handoff update.
- Workout Debrief Capture v1 is implemented locally and tested, with reviewer fixes applied, but not pushed, opened as a PR, merged, deployed, or production-verified.
- Pull request: PR #12, `Coach Memory Observations v1 + iOS 27 Coach Strategy`, `https://github.com/toddblackhurst/health-dashboard/pull/12`.
- PR state: merged into `main`.
- Merge commit: `f9f36ea3c78755c9acbf306aac65449eb6355444`.
- Merge method: normal GitHub merge commit.
- Merged at: 2026-06-11 17:09:50 Asia/Taipei.
- `origin/main` includes PR head `403ca3a`.
- Final pre-merge verification: `node --test tests/*.test.mjs`, `66/66` passing.
- Netlify automatic production deploy completed successfully.
- Deploy ID: `6a2a7b60684dfd0009308d2a`.
- Commit deployed: `f9f36ea3c78755c9acbf306aac65449eb6355444`.
- Deploy context: production.
- Deploy state: ready.
- Published at: 2026-06-11 17:10:11 Asia/Taipei.
- Manual deploy: false. No manual Netlify deploy occurred.
- Public production smoke checks:
  - `GET /coach-openapi.json` returned `200`.
  - Production OpenAPI includes Coach Memory endpoints/actions.
  - Unauthenticated `GET /api/coach/memory` returned the expected `401`.
- Authenticated production action tests were not run.
- No `x-coach-secret` was used or printed.
- `HEALTH_DATABASE.json` was untouched by the PR and merge diff.
- No Supabase migration files were changed for PR #12.
- No migrations were applied.
- No production secrets or environment variables were changed.

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

Workout Debrief Capture v1 local status:

- New structured record action:
  - `POST /api/coach/workout-debrief`
  - Custom GPT operation: `recordWorkoutDebrief`
- New optional recent-list action:
  - `GET /api/coach/workout-debriefs`
  - Custom GPT operation: `listWorkoutDebriefs`
- New context field added to `coach-today`, `buildTodayWorkout`, direct coach action responses, compact dashboard context, and source context:
  - `workout_debrief_context`
- New durable table migration created:
  - `supabase/migrations/007_workout_debriefs.sql`
  - Table: `coach_workout_debriefs`
  - Status: migration file created only. It has not been applied.
- New tests added:
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
  - `79/79` passing after reviewer fixes.
- Read-only reviewer follow-up fixes:
  - API/OpenAPI/Auth reviewer found that `/api/coach/motra-template` was already exposed in OpenAPI and `netlify.toml` but fell through to `404`. Fixed by adding `buildMotraDebriefTemplate`, wiring the handler, and adding route/behavior tests.
  - iOS 27 readiness/privacy reviewer found stale strategy-doc language saying Coach Memory was still the current branch. Fixed doc wording and sequence to reflect `workout-debrief-capture-v1`.
  - Safety/source hierarchy reviewer found no issues.
  - Data model/lifecycle reviewer found no issues.
- External action status:
  - No push.
  - No PR opened.
  - No merge.
  - No deploy, manual or automatic from this branch.
  - No migration applied.
  - No Supabase migration run.
  - No production secret or environment variable changed.
  - No `x-coach-secret` used or printed.
  - `HEALTH_DATABASE.json` remains untouched in the working tree.
- Known implementation caveat:
  - The recording endpoint requires the new `coach_workout_debriefs` table. Until Todd explicitly approves applying `supabase/migrations/007_workout_debriefs.sql`, production would not be able to store debrief records from this branch.
  - Dashboard/coach context reads tolerate the missing table and return empty debrief context until the migration is applied.

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
- Do not deploy manually without Todd's explicit approval.
- Do not merge PRs without Todd's explicit approval.
- Do not push or open a PR without Todd's explicit approval.
- Do not apply Supabase migrations without Todd's explicit approval.
- No Supabase migration was applied for PR #12.
- No Supabase migration has been applied for Workout Debrief Capture v1.
- Do not begin unrelated phases early.
- Do not begin iOS 27 Siri/Shortcuts implementation from this Workout Debrief branch unless Todd explicitly approves it.
- Workout Debrief Capture v1 is implemented locally and awaits Todd approval for push/PR and separate approval for migration.
- Garmin official API integration may be valuable later, but it depends on Garmin developer approval and should not block Coach Memory.
- If local `COACH_API_SECRET` is absent, use public `401` checks for route/auth existence and label authenticated checks as not run.

## 9. Current Next Build Sequence

Recommended sequence:

1. PR #12 Coach Memory / Observations v1. Merged and deployed to production.
2. Todd reviews Workout Debrief Capture v1 local branch and approves whether to push/open a PR.
3. If PR is approved and later merged, apply `supabase/migrations/007_workout_debriefs.sql` only after explicit Todd approval.
4. iOS 27 Siri/Shortcuts Readiness PR.
5. Apple Health workout-level intake.
6. Rack/Motra import/debrief support.
7. Weekly Review Engine.
8. Garmin official integration track if approved.

Alternate sequence if Todd wants iOS work pulled forward:

1. Finish local Workout Debrief review and handoff.
2. iOS 27 Siri/Shortcuts Readiness PR, documentation-only.
3. Workout Debrief migration/deploy approval if the backend branch has merged.
4. iOS 27 Siri/Shortcuts Implementation PR.

Coach Memory / Observations v1 completed target:

- Store durable, reviewable, correctable, retireable, evidence-based observations in Supabase. Implemented locally.
- Retrieve relevant active observations into `coach-today` and `buildTodayWorkout`. Implemented locally.
- Include `coach_memory_context` with `summary`, `relevant_observations`, `memory_warnings`, and `last_updated`. Implemented locally.
- Keep memory deterministic and non-authoritative over safety/current data. Implemented locally and covered by tests.
- Add or update OpenAPI actions for recording, listing, correcting, and retiring memory. Implemented locally.
- Add tests for auth, lifecycle, retrieval, retired exclusion, Red safety protection, hard medical/safety protection, current-data precedence, validation errors, secret-like text redaction, and OpenAPI security. Implemented locally; current suite passes `66/66`.

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
