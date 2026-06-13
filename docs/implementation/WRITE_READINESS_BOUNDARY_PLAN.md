# Write-Readiness Boundary Plan

Last updated: 2026-06-13 Asia/Taipei.

Purpose: define the approval, audit, duplicate-prevention, rollback, and verification gates required before any future Coach path may perform a live production write. This is a planning artifact only. It does not authorize Codex, GPT Pro, the saved GPT, iPhone Shortcuts, Siri, Action Button, Personal Automation, Netlify, Supabase, or any third-party app to submit a write.

## Current Baseline

- Main baseline for this plan: `73ff7aa39a8512e2d87723b39cb98dc80b6f6414`.
- PR #56 is merged and deployed after PR #55 App Intent Execution Evidence Packet v1.
- Automatic Netlify production deploy `6a2d15c4f496a300081ae524` is ready for main commit `73ff7aa39a8512e2d87723b39cb98dc80b6f6414`.
- Public production ping is healthy: `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Protected routes are skipped by Codex and GPT Pro because they require `x-coach-secret` or a real secret/account prompt.
- `HEALTH_DATABASE.json` remains protected and must remain unchanged.

## Non-Negotiable Boundary

Read-only device verification must pass before write-readiness work starts. A working public ping, a local test suite, a successful docs PR, or a saved GPT read-only action is not write approval.

Codex and GPT Pro must not:

- handle, paste, print, request, rotate, store, or inspect secrets;
- call protected production routes with real credentials;
- call GPT Action write endpoints;
- run Supabase SQL, migrations, schema-cache refreshes, or admin actions;
- change Netlify, Supabase, OpenAI, GitHub, GPT Action, iOS signing, entitlement, capability, or production environment settings;
- operate login, 2FA, passcode, Face ID, device trust, payment, account-security, Health permission, or secret-entry screens;
- automate Garmin, Rack, Motra, Oura, Apple, World Gym, or other third-party app writes.

## Status Labels

- `not_implemented`: no current production path exists.
- `draft_only`: local text or evidence can be drafted, but no production write occurs.
- `write_held`: production-capable or write-adjacent path exists but must not submit writes until a later approved phase.
- `local_only`: runs on device or local code without production mutation.
- `protected_read_only`: authenticated readback that should not mutate production state.
- `production_write_capable`: current backend route can mutate production data when authenticated and called.
- `unknown`: not enough verified information exists to classify safely.

## Write-Capable And Write-Adjacent Inventory

| Path | Current status | Route or surface | Preconditions before live write test | Todd approval point | Human/admin boundary | Safe evidence | Duplicate prevention requirement | Audit requirement | Rollback/recovery | Read-only prerequisite | Codex/GPT Pro must not handle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coach Memory observation create | `production_write_capable`, held | `POST /api/coach/observations`, GPT `recordCoachObservation`, `coach_observations` | production schema/cache verified; validation/redaction reviewed; rollback plan; single test payload approved | explicit per-test approval immediately before first live write | GPT Action auth and Supabase production/admin | action name, timestamp, redacted observation type, returned non-secret id/status | idempotency key or natural key by profile, observation type, date, source, and review marker | action, actor/surface, correlation id, status, redacted summary, approval record | retire or correct created observation; verify it is excluded from active memory if rollback needed | protected memory list/read context verified | secret, raw payload with sensitive data, SQL/admin screens |
| Coach Memory correction | `production_write_capable`, held | `POST /api/coach/memory/correct`, GPT `correctCoachMemory` | existing observation id verified by read-only path; previous state captured safely; rollback correction prepared | explicit approval naming the observation id or safe label | Supabase production row mutation | observation safe label, previous status, new redacted summary, correction status | correction request must include target id and expected previous status/version | previous and new non-secret lifecycle state, correlation id, approver | apply compensating correction or retire if wrong | read-only memory list verifies target row | secret, full raw memory payload, unrelated row edits |
| Coach Memory retirement | `production_write_capable`, held | `POST /api/coach/memory/retire`, GPT `retireCoachMemory` | target observation verified; retirement reason redacted; recovery path known | explicit approval naming target safe label | Supabase production row mutation | safe target label, retirement status, reason category | target id plus expected active status; repeated retire is no-op or explicit already-retired result | lifecycle transition, correlation id, approver | correction/re-activation only in a separately approved phase | read-only memory list verifies target | secret, raw memory/private evidence |
| Workout debrief submission | `production_write_capable`, held | `POST /api/coach/workout-debrief`, GPT `recordWorkoutDebrief`, `coach_workout_debriefs` | protected read-only device verification complete; debrief payload reviewed; old-dated smoke-test policy avoided for real data; rollback plan | explicit approval for one debrief submission | production write and possible future coaching influence | workout date, completion status, safety outcome, non-secret row id | client submit lock plus idempotency by profile, workout date, source, session title, and correlation id | action, row id, timestamp, redacted debrief summary, safety outcome | mark as test/retire/correct only via approved compensating path; verify it is not counted as real if test | list recent debriefs read-only works | secret, raw sensitive health text, private screenshots |
| Direct Coach message/action logging | `production_write_capable`, write-adjacent | `POST /api/coach/message`, `brief`, `workout`, `nutrition-closeout`, `post-workout`; `coach_messages` | decide whether logging is intended; verify no duplicate chat rows; confirm text redaction | explicit approval before treating any action as live write-capable | production row mutation through normal coach action | action, response status, safe top-line summary, write/log status | correlation id per request; avoid retries creating duplicate chat rows | request surface, action, non-secret message category, response id/time | delete/ignore/mark duplicate only through approved data action | read-only Coach Today/sync-status verified | secret, raw protected response bodies, private message content beyond Todd-approved summary |
| Nutrition closeout | `write_held` and write-adjacent | iOS `NutritionCloseoutIntent`, backend `nutrition-closeout`, GPT `nutritionCloseout` | Garmin Nutrition source quality verified; decide whether action only evaluates or logs; duplicate chat logging covered | explicit approval before any closeout can be treated as a persisted daily nutrition record | GPT Action auth and any future nutrition table mutation | day, source-quality label, no-write or write-held status | one closeout per date/source unless explicitly superseded | date, action, correlation id, source quality, no raw secret/header data | supersede prior closeout or mark ignored through approved path | sync status or weekly review read-only shows nutrition state | Garmin account screens, secret, nutrition credential handling |
| Post-workout Coach | `write_held` and write-adjacent | iOS `PostWorkoutCoachIntent`, backend `post-workout` | workout context known; debrief submission remains separate; no third-party write | explicit approval if saving any debrief, memory, or plan adjustment | production chat/audit write; future debrief or memory writes | write status, debrief prompt, next-session constraint | request correlation id and session/date key | action, timestamp, safe prompt summary | discard prompt; do not treat prompt as completed debrief | read-only workout/debrief context verified | Rack/Garmin/Motra app automation, secret, protected raw body |
| Feedback route | `production_write_capable`, held | `POST /api/coach/feedback`, `session_feedback` | clarify whether feedback is replacing or supplementing workout debrief/intake; duplicate session logic defined | explicit approval for the feedback event | production feedback row | session/date label, feedback category, non-secret status | session/source/date duplicate check | row id, action, timestamp, correlation id | compensating feedback or ignored marker through approved path | read-only current session context verified | secret, raw private note unless Todd approves |
| Blood pressure intake | `production_write_capable` through intake, held | `POST /api/coach/intake` with type `bp`, `blood_pressure_readings`; iOS draft BP is local | Todd confirms reading source/time; medical thresholds reviewed; rollback plan; draft evidence reviewed | explicit approval at submit time | production health data write | systolic/diastolic category, measured date/time, safe status | natural key by profile, measured date/time, source; retry lock | row id, measured timestamp, category, correlation id | mark duplicate/incorrect row only through approved correction path | device setup and protected read-only verified | raw medical screens, secret, unapproved PHI screenshots |
| Food/nutrition intake | `production_write_capable` through intake, held | `POST /api/coach/intake` with type `food`, `nutrition_days`, `meals` | Garmin Nutrition authority considered first; day/source chosen; meal payload reviewed | explicit approval per day/source before first live test | production nutrition write | date, source, totals category, meal count | upsert by profile, log date, source; meals need client-generated ids or correlation marker | day row, meal count, correlation id, source | supersede day totals or mark duplicate through approved path | read-only sync status confirms current nutrition gap | Garmin account automation, secret, raw private screenshots |
| Body-composition intake | `production_write_capable` through intake, held | `POST /api/coach/intake` with type `body`, `body_comp_measurements` | source and trend-only semantics confirmed; no overreaction in coaching | explicit approval per measurement source | production health metric write | date, source, trend-safe category | upsert by profile, date, source | row id/date/source/correlation id | supersede/mark duplicate through approved path | read-only current body comp freshness known | device/account screens, secret |
| Workout/session feedback intake | `production_write_capable` through intake, held | `POST /api/coach/intake` with type `workout`, `session_feedback`, `coach_state` | clarify whether feedback or workout debrief is canonical for the event; prevent double logging | explicit approval naming the session/date | production row plus `coach_state` update | session date, feedback category, safety state | one feedback event per session/source unless superseding | row id, coach_state keys touched, correlation id | compensating feedback or state restoration plan | read-only context shows current session state | secret, raw private debrief |
| Recovery/sleep intake | `production_write_capable` through intake, held | `POST /api/coach/intake` with type `recovery`, `recovery_sleep` | Garmin/Oura fallback hierarchy confirmed; date/source chosen | explicit approval per source/date | production recovery write | date, source, readiness/sleep category | upsert by profile, measured date, source | row id/date/source/correlation id | supersede row or mark ignored through approved path | read-only source freshness verified | Garmin/Oura account automation, secret |
| Activity intake | `production_write_capable` through intake, held | `POST /api/coach/intake` with type `activity`, `activity_sessions` | Apple Health supporting-only rule preserved; activity source/date/start chosen | explicit approval for first live write | production activity write | activity date/type/duration category | upsert by profile, activity date, source, type, start time | row id, source, correlation id | mark duplicate or supersede through approved path | Apple Health sync/read-only freshness checked | Apple/Garmin app automation, secret |
| Strength intake | `production_write_capable` through intake, held | `POST /api/coach/intake` with type `strength`, `strength_sessions`, `strength_exercises` | Rack/Motra remains authority; exercise names match Motra settings; prevent duplicate completed-history | explicit approval naming session/source | production strength history write | session date/name/source, exercise count | upsert by profile, session date, source, session name; exercise dedupe by stable exercise/session key | session id, exercise count, correlation id | remove/mark duplicate only through approved data repair | Rack/Motra read-only/manual evidence verified | Rack/Motra automation, secret, browser scraping |
| Doctor note intake | `production_write_capable` through intake, held | `POST /api/coach/intake` with type `doctor`, `doctor_notes` | Todd explicitly wants note stored; sensitivity/redaction reviewed | explicit approval per note | production medical note write | date, note category, safety restriction label | natural key by date/source/category plus confirmation | row id, category, correlation id | retire/correct note through approved path | read-only safety source hierarchy reviewed | raw medical documents unless Todd intentionally provides safe text |
| Apple Health daily sync | `production_write_capable`, existing device-authorized path | `POST /api/coach/apple-health-daily`, `apple_health_sync_runs`, `apple_health_daily_summaries`, optional `coach_observations`, `coach_messages` | physical device setup; Health permission; sync-run id visible; duplicate window understood | Todd approval during device setup and any automation change | Health permission prompts and production rows | sync run id, days written, source dates, no secret | `on_conflict` for day/source/device plus sync run id; no repeated manual taps without readback | sync_run_id, written dates, rows written, source app/device | rerun safely or mark duplicate via approved data repair | local setup and read-only freshness verified | Health permission screens, secret, raw Health data screenshots |
| Motra debrief template | `protected_read_only` or no-write template | `POST /api/coach/motra-template`, GPT `buildMotraDebriefTemplate` | verify output remains template-only | no write approval needed if template-only | protected auth only | template fields, no-write status | not applicable except request correlation for troubleshooting | request timestamp if logged by platform only | discard template | protected read-only setup verified | Motra app automation, secret |
| iOS draft workout debrief/note/BP | `draft_only`, local | `DraftWorkoutDebriefIntent`, `DraftCoachNoteIntent`, `DraftBloodPressureIntakeIntent` | none for local draft; review before any future submit path | approval only if a later submit/write is added | physical Shortcut UI only | draft text status, no-write confirmation | local drafts should not auto-submit; clear submit boundary | none beyond local evidence packet | discard draft | not required | secret, automatic production submit |
| Workout plan save/adaptation | `not_implemented` or `write_held` | future plan-save, weekly-review application, next-week adaptation | deterministic plan model, rollback, preview, and Todd approval designed first | explicit approval for generated plan and save | future production schema/admin and possibly third-party apps | plan id/title/week, preview summary, no third-party write | plan versioning, idempotency key, supersedes pointer | plan version, source review id, approval state | revert active plan pointer or supersede plan | weekly review read-only works | automatic application without Todd approval |
| GPT Action write endpoints | `production_write_capable`, held | `recordCoachObservation`, `correctCoachMemory`, `retireCoachMemory`, `recordWorkoutDebrief`, write-adjacent direct actions | GPT Builder schema/auth confirmed by Todd; write-readiness phase approved; one action selected | explicit Todd/account approval in GPT Builder and per live write | GPT Action auth and schema settings | action name, safe operation id, no-write/write-held status until approved | same idempotency as backing route | operation id, correlation id, response status | remove action or revoke schema/auth if unsafe | read-only GPT Actions verified | secret entry, GPT Builder auth screens |
| Future Health/Rack/Garmin/Motra/third-party writes | `not_implemented`, blocked | official APIs or app surfaces only if later approved | official integration terms, account permission, rollback, and safety model | explicit per-integration approval | account, permission, payment/security, official API authorization | permission status only, no credentials | provider-specific idempotency and duplicate reconciliation | provider id, local correlation id, action summary | provider rollback/delete if supported; otherwise stop before write | read-only/manual evidence path works | scraping, browser/app automation, login/2FA/payment/security |
| Supabase migrations/schema/cache/admin | `production_admin_bound`, held | Supabase dashboard/API/SQL/migrations | separate production-admin task; backup/rollback plan; affected code/tests reviewed | explicit production-admin approval immediately before action | Supabase production admin/data plane | migration id, schema table names, status, no secrets | migration history check and no duplicate application | migration id, actor, timestamp, status | revert migration only with approved rollback plan | local tests and read-only production behavior known | SQL/admin screens unless scoped; service keys/secrets |

## Gates

### Gate 0: Repo-Only Design And Test Readiness

- This plan exists and is linked from the active instruction docs.
- Tests pass without calling protected routes or writing production data.
- Candidate write path is classified with status, evidence, idempotency, audit, rollback, and hard stops.
- `HEALTH_DATABASE.json` has no diff.

### Gate 1: Todd-Assisted Physical iPhone Setup Complete

- Todd installs or opens the current app on the physical iPhone.
- Todd enters the production API base URL and Coach secret directly on device.
- Todd handles passcode, Face ID, device trust, account, and permission prompts.
- Local setup says configured without exposing a secret.

### Gate 2: Protected Read-Only Device Verification Complete

- At least one protected read-only action succeeds from Todd's device after Todd-entered setup.
- Preferred checks: `Check Coach Sync Status`, `Weekly Coach Review`, or `Morning Coach` / Coach Today.
- Evidence uses `docs/implementation/APP_INTENT_EXECUTION_EVIDENCE_PACKET.md`.
- `write_status` remains `no_write`, `write_held`, `draft_only_no_write`, or `manual_handoff_only_no_write`.

### Gate 3: Write Endpoint, Schema, And Admin Readiness Explicitly Approved

- Todd approves the exact write path, route/action, and one low-risk test case.
- Any required production schema/cache/admin verification is separately scoped and approved.
- GPT Builder schema/auth changes, if any, are done by Todd or with Todd present at the account boundary.

### Gate 4: Dry-Run Or Mock Write Proof With No Production Mutation

- Local or mock tests prove validation, redaction, idempotency, audit fields, duplicate behavior, and failure rollback wording.
- Retried requests must not create duplicate intended rows in the mock proof.
- Siri/Shortcuts copy must clearly say no-write, draft-only, write-held, or live-write pending approval.

### Gate 5: Single Low-Risk Live Write With Todd Present

- Todd is present and explicitly approves the single live write immediately before it runs.
- The action uses the smallest safe payload and a non-secret correlation id.
- No other write path is tested in the same step.
- If any prompt, uncertainty, duplicate risk, or account/security screen appears, stop.

### Gate 6: Rollback And Audit Review

- Verify exactly one intended write occurred.
- Verify no duplicate row, unintended table mutation, or third-party write occurred.
- Capture non-secret audit evidence.
- Run the rollback/recovery step if the write was a test, duplicate, wrong, or should not influence coaching.

### Gate 7: Broader Automation Consideration

- Only after Gate 6 passes for a path may Todd consider repeated use, Siri trigger, Action Button, or Personal Automation.
- Automation must start with conservative frequency, visible status, and an easy off switch.
- Third-party app writes remain blocked unless that exact provider path passes its own gates.

## Hard Stops

Stop and report a blocked state if any of these occur:

- Todd approval is missing, ambiguous, stale, or for a different path.
- Any secret, login, 2FA, account-security, payment, device-trust, passcode, Face ID, Health permission, or credential screen appears.
- Protected read-only device verification is incomplete.
- No rollback or audit path exists.
- Duplicate-prevention behavior is uncertain.
- Production schema/cache state is uncertain for the target write path.
- App, Siri, Shortcut, or GPT text implies writes are already enabled before the approved write phase.
- A third-party app or browser surface attempts to create, submit, sync, or update data.
- A protected response exposes sensitive data that would need to be pasted into Codex or GPT Pro.
- `HEALTH_DATABASE.json` appears modified.

## Rollback And Audit Requirements

Every future live write test must log or preserve non-secret evidence for:

- route or GPT operation id;
- trigger surface: app, Shortcut, Siri, GPT Action, backend, or manual admin task;
- timestamp and timezone;
- non-secret correlation id or sync run id;
- Todd approval state;
- target table or data class, not raw secrets or headers;
- returned non-secret row id/status when safe;
- redacted payload summary;
- duplicate check result;
- rollback or recovery decision.

Never log or paste:

- Coach secret, `x-coach-secret`, Authorization/Bearer headers, API keys, tokens, passwords, JWT-like strings, or credential-like URLs;
- raw protected response bodies that include private health, training, nutrition, memory, or medical content Todd has not intentionally summarized;
- Keychain, env, Netlify, Supabase, GPT Builder auth, account, device-trust, passcode, Face ID, payment, or permission prompt contents;
- screenshots containing any of the above.

Duplicate prevention must include at least one of:

- explicit idempotency key generated before the request;
- natural unique key with `on_conflict` or equivalent server-side protection;
- expected previous status/version on update routes;
- client-side submit lock plus server-side duplicate detection;
- post-write readback that verifies exactly one intended row.

Rollback must be defined before the write:

- delete is not assumed available or safe;
- correction, retirement, superseding, or ignore markers are preferred when history should remain auditable;
- test writes must be marked as test or old-dated only if the route's coaching logic can safely ignore them;
- disabling the write path can include removing a Shortcut action from use, reverting a PR, holding a GPT Action, disabling an automation, or adding a server-side hold.

Todd can provide safe evidence by copying only status lines, non-secret ids, timestamps, redacted summaries, source labels, and yes/no confirmations. If the only available evidence includes secrets or sensitive raw payloads, Todd should summarize the status manually instead of pasting it.

## Supabase And `coach_observations`

`coach_observations` is a production/admin readiness boundary. Local files and tests can show intended behavior, but they do not prove production schema/cache state.

- Production schema inspection, SQL, migration application, schema-cache refresh, RLS changes, and admin repair are human-approved production/admin work.
- Codex must not claim production schema is verified unless a future approved task verifies it through the allowed production-admin path.
- Weekly review and dashboard reads are locally covered to tolerate optional `coach_observations` unavailability through fallback behavior.
- A warning about optional memory reads is not a migration instruction by itself.
- Coach Memory write paths must remain held until schema/cache readiness, idempotency, audit, rollback, and Todd approval are all satisfied.

## GPT Actions

GPT Actions must distinguish read-only actions from write-capable actions.

Read-only or no-write actions currently expected for device/GPT verification include:

- `pingCoachApi`
- `getSyncStatus`
- `getCoachToday`
- `buildWeeklyReview`
- `listCoachMemory`
- `listWorkoutDebriefs`
- `buildMotraDebriefTemplate`

Write-capable or write-adjacent actions held for a later phase include:

- `recordCoachObservation`
- `correctCoachMemory`
- `retireCoachMemory`
- `recordWorkoutDebrief`
- `buildTodayWorkout` when routed through direct Coach action logging, even though the user-facing workout handoff remains manual-only
- direct Coach actions that log `coach_messages`
- any current or future nutrition, post-workout, intake, plan-save, or adaptation action that writes rows or changes state.

Todd/account approval is required for GPT Builder schema imports, auth settings, action-set changes, secret entry, and any live write action call. Codex and GPT Pro must not enter the secret or call write actions during planning/evaluation.

## iPhone, Siri, Shortcuts, Action Button, And Automation

Voice/text Coach should remain the target interface, but write-capable behavior stays held until the gates above pass.

- Siri and Shortcut output must clearly say `no_write`, `write_held`, `draft_only_no_write`, or `manual_handoff_only_no_write` when applicable.
- Draft Workout Debrief, Draft Coach Note, and Draft Blood Pressure Intake remain local drafts until a separately approved submit flow exists.
- Build Today's Workout remains a planning/manual Rack/Garmin handoff path, not a third-party app automation path.
- Nutrition Closeout and Post-Workout Coach must not imply live persistence unless a later write-readiness phase changes the contract.
- Action Button and Personal Automation cannot submit writes in the first device setup or read-only verification phase.
- HealthKit permission prompts and Siri/Shortcuts/Action Button/Automation settings are Todd/device-bound.

## Remaining Readiness Gaps

Safe Codex work:

- keep this plan linked and current as write paths change;
- add local/mock tests for idempotency, audit fields, duplicate prevention, and write-held wording before any write phase;
- improve safe status fields so Siri/Shortcuts/GPT can distinguish read-only, draft-only, manual-handoff-only, and write-held paths;
- document a future production-admin diagnostic plan for `coach_observations` without applying it.

Todd/device/account/production-admin work:

- physical iPhone setup and protected read-only verification;
- Coach secret entry on device and GPT Builder auth handling;
- Health permission grants and iOS automation settings;
- any Supabase schema/cache/admin verification;
- any GPT Action write call;
- any third-party integration account permission or official API authorization.
