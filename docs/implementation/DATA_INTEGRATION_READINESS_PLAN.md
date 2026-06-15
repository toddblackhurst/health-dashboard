# Data Integration Readiness Plan

Last updated: 2026-06-15 Asia/Taipei.

Purpose: make the stale-source problem implementation-ready without crossing protected routes, production writes, provider accounts, secrets, Supabase/admin actions, third-party automation, or Todd's physical iPhone. This is a repo-only planning artifact.

## Current State

- PR #65, `Add data integration readiness map`, is merged to main at `6617094108e90e395088e582246cfc80d2099a2f`.
- PR #66, `Add manual source evidence packet`, is merged to main at `35febba701f9e5e11ad09fc42164b0013ddc3670`.
- Companion manual packet is complete: `docs/implementation/MANUAL_SOURCE_EVIDENCE_PACKET.md`.
- Baseline branch for PR #65 was `codex/data-integration-readiness`, based on `origin/main` at `0cf593f08225260ddca46dad8b55647b49c26133`.
- Latest verified device evidence from 2026-06-15: Apple Health supporting evidence refreshed at 6:55 AM with `Wrote 7 of 7 Apple Health daily summaries`.
- Latest protected read-only device evidence from 2026-06-15: sync-status succeeded through the iOS app path at 6:56 AM with `protected_verification_status: verified_read_only` and `write_status: no_write`.
- Overall Coach source freshness still remained `0%` for 2026-06-15 because Garmin sleep/recovery, BP, Garmin Nutrition, body composition, Rack/Motra strength session, and Rack/Motra exercise detail were stale, missing, pending, or manual/provider-bound.
- The repo already has tables and protected intake routes for most missing source classes. The immediate blocker is not storage absence; it is safe, source-correct, approved collection and write readiness.

## Repo Implementation Map

| Area | Current repo evidence | Status |
| --- | --- | --- |
| Source hierarchy | `DEFAULT_COACH_STATE.source_hierarchy` defines safety override, Garmin readiness/workout physiology, Rack/Motra strength logs, Garmin Nutrition, Oura fallback, Apple Health supporting, and Hume/Ocare trend roles. | Implemented policy |
| Read-only sync status | `buildSyncStatus(...)` reports required source checks from `buildDataCompleteness(...)`. | Implemented protected read-only |
| Supabase read model | `dashboardFromSupabase(...)` reads `recovery_sleep`, `blood_pressure_readings`, `body_comp_measurements`, `nutrition_days`, `strength_sessions` with nested exercises/sets, `session_feedback`, `doctor_notes`, `coach_observations`, `coach_workout_debriefs`, and Apple Health summaries/runs. | Implemented |
| Protected intake route | `POST /api/coach/intake` supports `bp`, `food`, `body`, `workout`, `recovery`, `activity`, `strength`, and `doctor`. | Production write capable, held |
| Apple Health daily sync | `apple_health_daily_summaries` and `apple_health_sync_runs` are read into dashboard/sync-status/coach-today as supporting evidence only. | Implemented and device-proven once |
| iOS daily freshness | `DailyDataFreshnessReport.local(...)` separates Apple Health local freshness, public ping, protected read-only freshness, device permissions, manual third-party sources, BP action need, and draft-only capture. | Implemented local no-write |
| Draft-only capture | iOS workflows include draft note, draft debrief, and draft BP intake without submitting production writes. | Draft-only |
| Write readiness | `WRITE_READINESS_BOUNDARY_PLAN.md` classifies every write-capable/write-adjacent path and gates live writes. | Implemented as policy |

## Source Readiness Matrix

### Garmin Sleep/Recovery

- Authority role: primary readiness/recovery source when Fenix 8 data is fresh and reliably worn.
- Current freshness evidence: stale/missing in latest sync-status evidence; latest known recovery/sleep was 2026-06-08.
- Repo implementation: `recovery_sleep` table exists; `dashboardFromSupabase(...)` reads it; `buildDataCompleteness(...)` requires today's row; `evaluateReadiness(...)` uses Garmin-specific recovery fields when fresh/reliable and falls back only when Garmin is stale, missing, or unreliable.
- Endpoint/model coverage: protected `POST /api/coach/intake` with `type: recovery`; iOS daily freshness labels sleep/recovery as manual third-party deferred.
- Current state: write-held and manual/provider-bound.
- Needed for high-confidence Coach: measured date, Garmin readiness/recovery or Body Battery-style recovery context, sleep score, HRV, resting HR, sleep duration/stages where available, and a reliability signal that the watch was worn.
- Safest near-term update path: Todd gives a short non-secret Garmin summary before training; Coach treats it as manual evidence unless and until an approved intake write phase stores it.
- Long-term path: official Garmin integration only. Garmin documents Health API metrics including sleep, heart rate, stress, Pulse Ox, Body Battery, body composition, respiration, and blood pressure through the Garmin Connect Developer Program: [Garmin Health API](https://developer.garmin.com/gc-developer-program/health-api/). Garmin also documents mobile Health SDK access for direct device/app integrations: [Garmin Health SDK](https://developer.garmin.com/health-sdk/). Any use requires provider/account approval and no scraping.
- Todd/device/account/admin approval required: yes for Garmin account/API authorization; yes for any live intake write.
- Codex/GPT Pro must not: scrape Garmin Connect, log into Garmin, request credentials, call protected production writes, or paste raw protected health payloads.
- Fresh enough acceptance: same-day or previous-night row for the target date, Garmin source label, watch-worn reliability not false, and no safety override.
- Safe evidence Todd can provide: "Garmin sleep/recovery for YYYY-MM-DD: sleep score __, readiness/recovery __, HRV __, resting HR __, Body Battery __, watch worn yes/no."
- Future PR tests/builds: Node tests for source classification and freshness wording; iOS tests only if visible output changes.

### Blood Pressure

- Authority role: safety/medical override input.
- Current freshness evidence: stale/missing in latest sync-status evidence; latest known BP was 2026-06-05.
- Repo implementation: `blood_pressure_readings` table exists; `dashboardFromSupabase(...)` reads it; `buildDataCompleteness(...)` requires today's BP; `evaluateReadiness(...)` uses BP safety thresholds; iOS has draft-only BP intake.
- Endpoint/model coverage: protected `POST /api/coach/intake` with `type: bp`; local `DraftBloodPressureIntakeIntent` is no-write.
- Current state: production-write capable but held; draft-only on iOS.
- Needed for high-confidence Coach: recent systolic, diastolic, optional HR, measured time, source, symptoms/notes, and whether the reading is a repeated/resting measurement.
- Safest near-term update path: Todd reports one current reading in chat before training; Coach can downgrade or block based on thresholds without storing it.
- Long-term path: start with manual approved BP intake after write-readiness because BP is the smallest high-impact safety update. Garmin official Health API may include blood pressure data if Todd uses a compatible source and account approval exists, but manual BP remains the fastest safety path.
- Todd/device/account/admin approval required: yes for live write; no for Todd verbally summarizing a reading.
- Codex/GPT Pro must not: request screenshots of medical apps, submit BP intake, or treat a draft as saved.
- Fresh enough acceptance: same-day resting BP or doctor-instructed cadence; no red-flag symptoms; clear measured time/source.
- Safe evidence Todd can provide: "BP today at __: __/__; HR __; symptoms none/yes; resting measurement yes/no."
- Future PR tests/builds: Node tests for BP freshness status and red/yellow safety wording; iOS tests for draft-only BP output if changed.

### Garmin Nutrition

- Authority role: nutrition authority when usable.
- Current freshness evidence: stale/missing in latest sync-status evidence; latest known Garmin Nutrition day was 2026-06-07.
- Repo implementation: `nutrition_days` and `meals` tables exist; `dashboardFromSupabase(...)` reads `nutrition_days`; `buildDataCompleteness(...)` requires today's Garmin Nutrition; nutrition closeout remains write-held/write-adjacent.
- Endpoint/model coverage: protected `POST /api/coach/intake` with `type: food`; OpenAPI exposes protected intake; iOS has nutrition closeout scaffolding but not a live approved write.
- Current state: write-held and manual/provider-bound.
- Needed for high-confidence Coach: date, source, calories, protein, carbs, fat, fiber/sodium if available, completeness, and meal count/notes only when reviewed.
- Safest near-term update path: Todd gives a short Garmin Nutrition daily total summary; Coach uses it as low-friction planning context and marks confidence lower if incomplete.
- Long-term path: official Garmin route if available/approved, or manual daily closeout with write-readiness. Do not scrape Garmin Connect. Any third-party aggregator would be a separate vendor/account decision.
- Todd/device/account/admin approval required: yes for Garmin account/API or live write.
- Codex/GPT Pro must not: log into Garmin, scrape food logs, call nutrition closeout writes, or treat Apple Health calories as Garmin Nutrition.
- Fresh enough acceptance: today's totals or prior-day closeout depending on coaching question; source is Garmin Nutrition or clearly labeled manual fallback; protein and calories present at minimum.
- Safe evidence Todd can provide: "Nutrition for YYYY-MM-DD: calories __, protein __g, carbs __g, fat __g, completeness partial/full."
- Future PR tests/builds: Node tests for nutrition-source classification and manual fallback wording; no iOS build unless Shortcut output changes.

### Body Composition / Weight

- Authority role: trend evidence only; never a one-day readiness override.
- Current freshness evidence: stale in latest sync-status evidence; latest known body composition was 2026-05-23.
- Repo implementation: `body_comp_measurements` table exists; `dashboardFromSupabase(...)` reads it; `buildDataCompleteness(...)` treats <=14 days as current and optional.
- Endpoint/model coverage: protected `POST /api/coach/intake` with `type: body`.
- Current state: optional, write-held, manual/provider-bound.
- Needed for useful Coach: date, source, weight, body-fat percentage if available, confidence tier/source method, and trend note.
- Safest near-term update path: Todd reports current scale/body-comp summary; Coach treats it as trend context only.
- Long-term path: manual approved body intake or official/export path from Hume/Ocare if available and separately approved.
- Todd/device/account/admin approval required: yes for account/export or live write.
- Codex/GPT Pro must not: overreact to one-day BIA swings, scrape body-comp apps, or request sensitive screenshots.
- Fresh enough acceptance: <=14 days old for general trend; same-day only if specifically discussing weight trend or safety context; source and confidence labeled.
- Safe evidence Todd can provide: "Weight/body comp on YYYY-MM-DD: weight __, body fat __ if available, source __, trend up/down/flat."
- Future PR tests/builds: Node tests for optional body-composition classification and trend-only wording.

### Rack/Motra Strength Session

- Authority role: primary completed strength history source for sessions, exercise names, performance history, sets, reps, and loads.
- Current freshness evidence: pending/manual/provider-bound in latest sync-status evidence; latest known Rack/Motra strength session was 2026-06-08.
- Repo implementation: `strength_sessions`, `strength_exercises`, and `strength_sets` tables exist; `dashboardFromSupabase(...)` reads nested exercise/set detail; `buildDataCompleteness(...)` requires today's session only on planned strength days.
- Endpoint/model coverage: protected `POST /api/coach/intake` with `type: strength`; workout-debrief routes exist but debriefs do not replace Rack/Motra authority.
- Current state: write-held and manual/provider-bound.
- Needed for high-confidence Coach: session date, source, session name/type, duration, exercise list, set/reps/load details, RPE/notes where available, and whether it was completed in Rack/Motra.
- Safest near-term update path: Todd reports completed session summary after training; Coach can use it as conversational context while clearly labeling it not yet Rack/Motra-imported unless sourced from Motra/Rack export.
- Long-term path: Motra's official help center currently documents workout data export to CSV by email and import using CSV/XLS/XLSX: [Motra data import/export](https://help.motra.com/en/articles/10057923-data-import-and-export). Motra also documents connecting training data to AI assistants: [Motra AI assistant integration](https://help.motra.com/en/articles/14140325-connect-motra-to-your-favorite-ai-assistant). The safest long-term import path is Todd-provided export or provider-approved integration, not app scraping.
- Todd/device/account/admin approval required: yes for app export, account integration, or live write/import.
- Codex/GPT Pro must not: automate Rack/Motra UI, scrape workout screens, submit third-party updates, or count Apple Health workout counts as Rack/Motra strength history.
- Fresh enough acceptance: current planned strength day shows same-day completed session from Rack/Motra or approved manual import; non-strength days can be not expected.
- Safe evidence Todd can provide: "Motra/Rack session YYYY-MM-DD: name __, duration __, exercises summary __, completed yes/no."
- Future PR tests/builds: Node tests for session freshness and not_expected/pending wording; import-parser tests only after a source format is approved.

### Rack/Motra Strength Exercise Detail

- Authority role: primary completed set/rep/load details.
- Current freshness evidence: pending/manual/provider-bound in latest sync-status evidence; latest known detailed strength was 2026-06-08.
- Repo implementation: nested `strength_exercises` and `strength_sets` exist; `buildDataCompleteness(...)` distinguishes session row from exercise detail.
- Endpoint/model coverage: protected `POST /api/coach/intake` with `type: strength` inserts exercises, but current code does not insert nested `strength_sets` from intake.
- Current state: partial backend shape, write-held, provider/export-bound.
- Needed for high-confidence Coach: per-exercise ordered names, sets, reps, load, duration/distance for carries or timed work, and notes.
- Safest near-term update path: Todd gives a concise post-workout exercise summary; Coach avoids claiming it is fully imported until a Rack/Motra export/import path is built.
- Long-term path: implement an approved CSV/export parser and review packet before writing strength history. If the provider exposes a formal API or AI assistant connector suitable for export, that becomes a separate approved integration.
- Todd/device/account/admin approval required: yes for export retrieval, account connection, or live write/import.
- Codex/GPT Pro must not: infer loads from memory, scrape screens, or overwrite completed-history rows from weak evidence.
- Fresh enough acceptance: same-day planned strength exercise detail with at least exercise names plus sets/reps/load for key work; detail can be pending until Todd finishes training.
- Safe evidence Todd can provide: "Exercises: name - sets x reps x load; RPE/pain notes."
- Future PR tests/builds: parser tests, duplicate-prevention tests, and Node tests before any live import; iOS tests only if a draft UI is changed.

### Oura Fallback Sleep/Recovery

- Authority role: fallback sleep/recovery only when Garmin is stale, missing, or unreliable.
- Current freshness evidence: fallback existed in weekly review for 2026-06-08; latest current-day status is not fresh in sync-status evidence.
- Repo implementation: Oura-like fields can live in `recovery_sleep.raw`; `evaluateReadiness(...)` falls back to Oura readiness/HRV when Garmin usable data is absent.
- Endpoint/model coverage: protected `POST /api/coach/intake` with `type: recovery`.
- Current state: fallback, write-held/manual or API-bound.
- Needed for useful Coach: date, readiness, sleep score, HRV, resting HR, total sleep, and whether Garmin is stale/unreliable.
- Safest near-term update path: Todd reports Oura readiness only if Garmin sleep/recovery is unavailable; Coach labels it fallback.
- Long-term path: official Oura API v2 supports sleep/readiness-style data, with app sync timing caveats: [Oura API documentation](https://cloud.ouraring.com/v2/docs). This would require OAuth/account setup and separate approval.
- Todd/device/account/admin approval required: yes for OAuth/API or live write.
- Codex/GPT Pro must not: use Oura to override fresh reliable Garmin readiness, log into Oura, or scrape app screens.
- Fresh enough acceptance: same-day or previous-night row, Garmin unavailable/stale/unreliable, Oura source clearly labeled fallback.
- Safe evidence Todd can provide: "Oura fallback for YYYY-MM-DD: readiness __, sleep __, HRV __, RHR __; Garmin missing/stale/unreliable."
- Future PR tests/builds: Node tests proving Oura fallback label and Garmin precedence.

### Apple Health Supporting Evidence

- Authority role: supporting cross-check/data bus only.
- Current freshness evidence: refreshed on Todd's physical iPhone on 2026-06-15 at 6:55 AM; protected sync-status later saw read-only state at 6:56 AM.
- Repo implementation: Apple Health daily summaries and sync runs are ingested via device-authorized path; dashboard/sync-status/coach-today expose Apple Health as supporting evidence.
- Endpoint/model coverage: `POST /api/coach/apple-health-daily`; tests cover dashboard, sync-status, and coach-today Apple Health context.
- Current state: implemented and device-proven once; not a replacement for Garmin/Rack/Motra/Nutrition/BP.
- Needed for useful Coach: daily summary date, steps, exercise minutes, active calories, sleep/supporting vitals, sync run status, and warnings when stale.
- Safest near-term update path: keep using daily freshness/local sync checks when Todd is present and permissions are already handled.
- Long-term path: continue HealthKit device path. Apple documents HealthKit as a permissioned local iPhone/Apple Watch repository: [HealthKit](https://developer.apple.com/documentation/healthkit), with data types and read queries documented separately: [HealthKit data types](https://developer.apple.com/documentation/healthkit/data-types), [Reading data from HealthKit](https://developer.apple.com/documentation/healthkit/reading-data-from-healthkit).
- Todd/device/account/admin approval required: yes for Health permissions and physical-device setup; no for local tests/mocks.
- Codex/GPT Pro must not: handle Health permission screens, treat Apple Health workout counts as completed Rack/Motra strength logs, or override Garmin/Rack/safety/nutrition authority.
- Fresh enough acceptance: daily summary current for today or yesterday in Asia/Taipei depending on time of day; supporting-only label visible.
- Safe evidence Todd can provide: "Apple Health daily sync says fresh/stale/missing; days written __; no errors."
- Future PR tests/builds: Node tests if backend wording changes; iOS simulator tests if app/Shortcut output changes.

### Other Represented Sources

- Doctor notes: safety override source, protected `doctor` intake exists, write-held.
- Workout debriefs/session feedback: subjective response and future adaptation constraints, not authority for Rack/Motra or Garmin data. Write-held except local drafts.
- Coach Memory/observations: continuity and preferences only; cannot override current safety, Garmin, Rack/Motra, or nutrition data. Production schema/cache uncertainty remains a separate Supabase/admin boundary.
- Planned sessions/weekly plans: read-only planning context; automatic application is blocked by design.
- Soundcore Sleep A30: sleep aid/noise/snore support only, not recovery authority.
- Hume/Ocare: body-composition trend evidence only, not a same-day readiness override.

## Fastest Path To Useful Coaching Today

Before training, Todd can tell Coach:

```text
Coach, my source data may be stale. Use low confidence and ask what you need.
Sleep/recovery: Garmin ___, or Oura fallback ___ because Garmin is stale/unreliable.
Energy: __/10. Soreness: __/10. Pain/hip: __/10. Any sharp/radiating/worsening pain: yes/no.
BP today: __/__ if available. Symptoms: none/___.
Nutrition today/yesterday: calories __, protein __g, completeness partial/full.
Last strength session: date ___, main lifts/exercises ___, what felt good/bad ___.
Build a safe Rack/Motra-friendly plan for today, and do not assume stale data is fresh.
```

Coach should compensate by:

- Treating stale Garmin/Rack/Nutrition/BP/body data as low confidence.
- Using subjective pain, fatigue, symptoms, and BP as safety gates.
- Preserving strength anchors only when safety and readiness allow.
- Avoiding hard conditioning, aggressive progression, or dense finishers when readiness or source quality is uncertain.
- Asking for missing fields instead of hallucinating current data.

Hard training should be blocked or downshifted by:

- Doctor/medical restrictions.
- High or symptomatic BP, chest pain, fainting, neurological symptoms, severe shortness of breath, asthma flare, migraine, illness, or sharp/radiating/worsening pain.
- Garmin recovery/readiness red or clearly poor when fresh and reliable.
- Severe fatigue or pain even if device data looks good.

Coach should not trust as fresh:

- Apple Health workout counts as completed strength history.
- Oura readiness when fresh reliable Garmin data exists.
- Old Rack/Motra sessions as today's completion.
- Old Garmin Nutrition totals as today's nutrition.
- Body-composition one-day swings as readiness or plan overrides.
- Workout debriefs or Coach Memory as replacements for current source data.

## Manual Source Update Checklist For Todd

Use this when Todd returns. Do not paste credentials, API keys, account pages, raw exports with private content, screenshots containing secrets, or protected response bodies. Summaries are enough.

| Source | Safe non-secret summary Todd can give | Why it matters |
| --- | --- | --- |
| Garmin sleep/recovery | Date, sleep score/time, readiness/recovery/Body Battery if available, HRV, RHR, watch worn yes/no. | Primary readiness/recovery. |
| BP | Date/time, systolic/diastolic, HR if available, resting/repeat yes/no, symptoms yes/no. | Safety override. |
| Garmin Nutrition | Date, calories, protein, carbs, fat, completeness. | Nutrition authority. |
| Body composition | Date, source, weight, body fat if available, trend up/down/flat. | Trend evidence only. |
| Rack/Motra session | Date, session name, completed yes/no, duration, major exercises. | Completed strength history. |
| Rack/Motra exercise detail | Exercise names, sets, reps, loads, carries/durations, RPE/pain notes. | Progression and exercise selection. |
| Oura fallback | Date, readiness, sleep, HRV, RHR, and why Garmin is stale/unreliable. | Fallback readiness only. |
| Apple Health | Fresh/stale/missing, days written, error yes/no. | Supporting context only. |

## Prioritized Backlog

### A. Safe Codex Repo-Only Tasks

1. Manual Source Evidence Packet v1
   - Status: completed by PR #66.
   - Why it matters: gives Todd one clear non-secret template for the missing daily sources so Coach can work safely before write-readiness.
   - Working file: `docs/implementation/MANUAL_SOURCE_EVIDENCE_PACKET.md`, plus minimal durable links from start/current/readiness docs.
   - Acceptance criteria: source-by-source prompt templates, do-not-paste rules, low-confidence rules, and proof states for "reported but not saved" vs "saved."
   - Tests/builds: `node --test tests/*.test.mjs`, `git diff --check`, `git diff -- HEALTH_DATABASE.json`.
   - Hard boundaries: docs-only, no protected routes, no writes, no provider automation, no device setup.

2. Sync Status Source Classification Improvements v1
   - Why it matters: the current sync-status `missing`/`pending` states are accurate but not always specific enough for Todd. Better classification can distinguish stale, manual/provider-bound, write-held, fallback-only, and supporting-only.
   - Likely files: `netlify/functions/_coach-lib.mjs`, tests in `tests/*.test.mjs`, docs updates.
   - Acceptance criteria: sync-status exposes stable source role/status fields without changing source hierarchy; tests cover Garmin primary, Oura fallback, Apple Health supporting, Rack/Motra pending, BP safety, nutrition authority, body optional.
   - Tests/builds: full Node tests; iOS tests only if app parsing/output changes.
   - Hard boundaries: no protected route calls, no production writes, no OpenAPI/GPT Action auth/settings.

3. Manual Source Freshness Draft UI v1
   - Why it matters: expands local no-write drafting from BP/debrief/note into structured prompts for nutrition, Garmin recovery, body comp, and Rack/Motra evidence.
   - Likely files: iOS workflow/model/tests and docs.
   - Acceptance criteria: all new paths are draft-only/no-write, redacted, and labeled "not saved"; no backend route calls.
   - Tests/builds: Node tests if docs/backend touched; iOS simulator build and explicit tests if iOS code changes.
   - Hard boundaries: no live intake, no Health permission changes, no physical iPhone automation.

4. Isolated Anti-Repeat Backend Triage v1
   - Why it matters: Todd lost confidence when Coach gave the wrong old workout. This is adjacent to data freshness because stale completed history can cause bad workout selection.
   - Likely files: `netlify/functions/_coach-lib.mjs`, `tests/coach-engine.test.mjs`.
   - Acceptance criteria: uses clean worktree only; no unrelated dirty primary-main changes; tests prove tomorrow/future-date and "do not repeat" behavior.
   - Tests/builds: full Node tests; no iOS tests unless output contract changes.
   - Hard boundaries: no production calls, no protected writes, no dirty worktree cherry-picking without review.

### B. Todd / Manual Provider Tasks

- Provide the manual source summaries in the checklist above after training.
- Export Motra workout CSV only if Todd chooses to do it manually from the app and can share a safe reviewed file or summary.
- Confirm whether Garmin Nutrition is being actively logged and whether a daily summary can be reported without screenshots.
- Provide BP readings using a normal text summary, not app screenshots.

### C. Todd / Device / Account Tasks

- Physical iPhone setup, Health permissions, Siri/Shortcuts visibility, Action Button, and Personal Automation remain Todd/device-bound.
- Garmin/Oura/Motra account authorization or API/export setup requires Todd present and a separate approved task.
- GPT Builder action auth/schema changes require Todd/account boundary handling.

### D. Production / Admin Tasks

- Supabase schema/cache/admin diagnostics remain held behind `SUPABASE_READINESS_DIAGNOSTIC_PLAN.md`.
- Netlify environment, production variables, deploy settings, and GPT Action secrets remain held.
- Any production protected route check using `x-coach-secret` remains Todd-entered or saved-action only; Codex does not call it.

### E. Future Write-Readiness Tasks

- First low-risk live write candidate: BP intake, because it is small, safety-critical, and has an existing draft-only iOS path plus protected backend intake.
- Next candidate: manual source evidence save for nutrition/recovery/body, only after idempotency, audit, rollback, and source labels are tested.
- Later candidate: Motra/Rack export import parser, only after Todd provides an approved export format and duplicate-prevention tests pass.
- Deferred: automatic weekly review application, Coach Memory writes, workout debrief writes, nutrition closeout writes, and third-party provider writes.

## Next Implementable PR Recommendation

Recommended next PR: Sync Status Source Classification Improvements v1, unless GPT Pro scopes a different bounded step.

Why this is the best next step:

- Highest immediate readiness impact after PR #66: make current sync-status output more useful by labeling source roles and boundaries more precisely.
- Low boundary risk when scoped carefully: code/tests/docs only, no secrets, no protected routes from Codex, no writes, no Supabase/admin work, no device automation, and no third-party scraping.
- Builds on the manual packet: source classification can reuse the completed packet's primary/fallback/supporting/manual-provider-bound/write-held distinctions.

Acceptance criteria for that next PR:

- Sync status distinguishes primary, fallback, supporting-only, stale, missing, manual/provider-bound, write-held, verified-read-only, and not-expected states.
- Garmin, Rack/Motra, Garmin Nutrition, BP, Oura fallback, Apple Health, body comp, doctor notes, workout debriefs, and Coach Memory keep the source hierarchy intact.
- Manual evidence remains labeled as reported/not saved unless a separate write-readiness task approves persistence.
- Verification includes Node tests, diff check, and `HEALTH_DATABASE.json` no diff; iOS tests run only if iOS output code changes.

## Non-Actions In This Plan

This plan did not and does not authorize:

- protected production route calls from Codex;
- production write calls;
- Supabase SQL, migrations, schema-cache refresh, RLS/grant/policy changes, or admin inspection;
- Netlify/env/GPT Action/OpenAI/Supabase/GitHub settings changes;
- manual deploys;
- provider scraping or app automation;
- physical iPhone setup, Health permissions, Siri/Shortcuts, Action Button, or Personal Automation;
- editing `HEALTH_DATABASE.json`;
- source ingestion implementation.
