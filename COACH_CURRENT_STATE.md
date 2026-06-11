# Coach Current State

Last updated: 2026-06-11

## 1. Project Purpose

Todd Blackhurst's Personal Coach is a deterministic, safety-first coaching system connected to Custom GPT Actions, Supabase-backed coach data, Apple Health daily summaries, and planned durable coach memory. The system should behave like the same coach across new conversations while keeping medical and safety rules deterministic.

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
- Coach engine tests: `tests/coach-engine.test.mjs`
- GPT route/OpenAPI tests: `tests/coach-action-routing.test.mjs`
- Apple Health tests: `tests/apple-health-daily.test.mjs`, `tests/apple-health-dashboard-context.test.mjs`
- iOS HealthKit app: `apps/ios-health-sync/`
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

Coach Memory / Observations v1 is the next active build target and should add safe, reviewable memory actions after implementation and approval.

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

Current local branch state:

- Branch: `coach-memory-observations-v1`
- Base observed on 2026-06-11: `origin/main` at `0c7a0e2 Daily brief refresh - 2026-06-11`
- Local branch already contains an unpushed Coach Memory / Observations v1 implementation commit `644a456 Add coach memory observations v1`.
- This handoff file was added after discovering that local feature commit; do not rewrite history without Todd's explicit approval.

## 8. Known Caveats

- Do not modify `HEALTH_DATABASE.json`.
- Do not deploy manually without Todd's explicit approval.
- Do not merge PRs without Todd's explicit approval.
- Do not apply Supabase migrations without Todd's explicit approval.
- Do not begin unrelated phases early.
- Workout Debrief Capture is intentionally deferred until after Coach Memory / Observations v1 unless Todd explicitly widens scope.
- Garmin official API integration may be valuable later, but it depends on Garmin developer approval and should not block Coach Memory.
- If local `COACH_API_SECRET` is absent, use public `401` checks for route/auth existence and label authenticated checks as not run.

## 9. Current Next Build Sequence

Recommended sequence:

1. Create/update `COACH_CURRENT_STATE.md`.
2. Coach Memory / Observations v1.
3. Workout Debrief Capture.
4. iOS Siri/Shortcuts Readiness PR.
5. Apple Health workout-level intake.
6. Rack/Motra import/debrief support.
7. Weekly Review Engine.
8. Garmin official integration track if approved.

Coach Memory / Observations v1 target:

- Store durable, reviewable, correctable, retireable, evidence-based observations in Supabase.
- Retrieve relevant active observations into `coach-today` and `buildTodayWorkout`.
- Include `coach_memory_context` with `summary`, `relevant_observations`, `memory_warnings`, and `last_updated`.
- Keep memory deterministic and non-authoritative over safety/current data.
- Add or update OpenAPI actions for recording, listing, correcting, and retiring memory.
- Add tests for auth, lifecycle, retrieval, retired exclusion, Red safety protection, hard medical/safety protection, current-data precedence, and OpenAPI security.

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
