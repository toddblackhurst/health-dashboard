# Coach Current State

Last updated: 2026-06-11 16:44 CST, after pushing the Coach Memory / Observations v1 branch and opening PR #12.

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

Coach Memory / Observations v1 is implemented locally on branch `coach-memory-observations-v1` and is not merged or deployed.

Local OpenAPI now adds:

- `recordCoachObservation`
- `listCoachMemory`
- `correctCoachMemory`
- `retireCoachMemory`

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

Current branch and PR state:

- Branch: `coach-memory-observations-v1`
- Remote branch: pushed to `origin/coach-memory-observations-v1` on 2026-06-11.
- Pull request: PR #12, `Coach Memory Observations v1 + iOS 27 Coach Strategy`, `https://github.com/toddblackhurst/health-dashboard/pull/12`.
- PR state: open normal PR, not draft, not merged.
- No deployment was performed from this branch.
- No migrations were applied.
- No production secrets or environment variables were modified.
- Verification before push/open PR on 2026-06-11: `node --test tests/*.test.mjs`, `65/65` passing.
- Preserved Todd-verified pre-handoff status on 2026-06-11: branch was ahead of `origin/main` by 3 commits with no uncommitted changes.
- Base observed on 2026-06-11: `origin/main` at `0c7a0e2 Daily brief refresh - 2026-06-11`
- Branch contains Coach Memory / Observations v1 implementation commit `644a456 Add coach memory observations v1`.
- Phase 0 handoff file commit: `876aa33 Add coach current state handoff`.
- Reviewer fixes/hardening commit: `32ef0e6 Harden coach memory lifecycle and validation`.
- Local handoff preservation commit after Todd's checkpoint: `b75042c Update coach memory handoff state`.
- iOS 27 strategy documentation commit: `7dc8bca Add iOS 27 coach strategy`.
- Current branch caveat: Phase 0 was not the first historical commit in this branch because the branch already contained Coach Memory implementation before the state-file commit. The state file was added before further feature edits; do not rewrite history without Todd's explicit approval.

Coach Memory / Observations v1 local work status:

- Local endpoints added through `netlify.toml` clean routes and `coach-api.mjs` action routing:
  - `POST /api/coach/observations`
  - `GET /api/coach/memory`
  - `POST /api/coach/memory/correct`
  - `POST /api/coach/memory/retire`
- Retrieval added to `coach-today` and workout decisions through `coach_memory_context`.
- Memory context is labeled as durable Supabase observation context, not fresh sensor data.
- Memory warning policy says current BP, doctor guidance, migraine, asthma, sharp/radiating/worsening pain, and fresh readiness data win.
- Tests run locally on 2026-06-11: `node --test tests/*.test.mjs`, `65/65` passing.
- Read-only reviewer findings fixed locally:
  - Correction now preserves non-active lifecycle by default instead of promoting proposed/retired memory to active.
  - Known memory validation failures now return `400`, missing observations return `404`, and server/config/Supabase failures remain `500`.
  - Secret-like string values in memory payloads are redacted before storage/return.
- Migration status: no migration was applied. No new migration file was created because existing migration `supabase/migrations/005_apple_health_sync.sql` already defines `coach_observations` with `status`, `evidence`, `confidence`, `action_taken`, `review_date`, `source`, `raw`, timestamps, and RLS. Proposed/superseded lifecycle metadata is stored in `raw.memory_lifecycle_status` while DB `status` remains within the existing constraint.
- External action status: branch push and PR creation are complete. No deploy, merge, migration, production secret/environment change, or other secret-sensitive operation has been performed from this branch.
- Production status: not deployed from this branch. Public production OpenAPI was checked on 2026-06-11 and returned `200`, but it reflects current production, not this unmerged branch. Public production `/api/coach/workout` without `x-coach-secret` returned the expected `401`, verifying existing deployed auth behavior only.
- Manual approvals still required before merge, deploy, migration/application, or any production secret/environment change.

iOS 27 Siri/Shortcuts research status:

- Todd has installed the iOS 27 developer beta.
- iOS 27 Siri AI, Shortcuts, App Intents, App Schemas, App Entities, Spotlight, View Annotations, AppIntentsTesting, HealthKit notes, hardware triggers, widgets, Live Activities, Focus, Watch, CarPlay, AirPods, privacy, and beta caveats have been researched against official Apple sources.
- Strategy document added: `docs/IOS27_SIRI_SHORTCUTS_COACH_STRATEGY.md`.
- Implementation status: documentation/architecture only. No large iOS 27 feature implementation has started in this branch.
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
- No Supabase migration has been applied for Coach Memory / Observations v1 in this branch.
- Do not begin unrelated phases early.
- Do not begin iOS 27 Siri/Shortcuts implementation from this Coach Memory branch unless Todd explicitly approves a stacked branch or separate implementation branch.
- Workout Debrief Capture is intentionally deferred until after Coach Memory / Observations v1 unless Todd explicitly widens scope.
- Garmin official API integration may be valuable later, but it depends on Garmin developer approval and should not block Coach Memory.
- If local `COACH_API_SECRET` is absent, use public `401` checks for route/auth existence and label authenticated checks as not run.

## 9. Current Next Build Sequence

Recommended sequence:

1. Create/update `COACH_CURRENT_STATE.md`. Completed locally on branch `coach-memory-observations-v1`.
2. Coach Memory / Observations v1. Implemented and opened as PR #12; pending Todd review and separate approval before any merge, deploy, migration, or production secret/environment change.
3. Workout Debrief Capture.
4. iOS 27 Siri/Shortcuts Readiness PR.
5. Apple Health workout-level intake.
6. Rack/Motra import/debrief support.
7. Weekly Review Engine.
8. Garmin official integration track if approved.

Alternate sequence if Todd wants iOS work pulled forward:

1. Finish Coach Memory branch.
2. iOS 27 Siri/Shortcuts Research PR, documentation-only.
3. Workout Debrief Capture.
4. iOS 27 Siri/Shortcuts Implementation PR.

Coach Memory / Observations v1 target:

- Store durable, reviewable, correctable, retireable, evidence-based observations in Supabase. Implemented locally.
- Retrieve relevant active observations into `coach-today` and `buildTodayWorkout`. Implemented locally.
- Include `coach_memory_context` with `summary`, `relevant_observations`, `memory_warnings`, and `last_updated`. Implemented locally.
- Keep memory deterministic and non-authoritative over safety/current data. Implemented locally and covered by tests.
- Add or update OpenAPI actions for recording, listing, correcting, and retiring memory. Implemented locally.
- Add tests for auth, lifecycle, retrieval, retired exclusion, Red safety protection, hard medical/safety protection, current-data precedence, validation errors, secret-like text redaction, and OpenAPI security. Implemented locally; current suite passes `65/65`.

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
