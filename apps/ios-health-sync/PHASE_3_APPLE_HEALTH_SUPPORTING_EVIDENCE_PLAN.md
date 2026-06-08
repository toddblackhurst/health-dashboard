# Phase 3 Apple Health Supporting Evidence Plan

State target: planning only. Do not implement Phase 3 from this document until Todd explicitly approves execution.

## Goal

Integrate Apple Health daily summaries into diagnostics and `coach-today` as cross-check/supporting evidence only.

Apple Health should make the coach system better at seeing whether daily movement, sleep-adjacent summaries, heart-rate context, and iPhone sync freshness are present. It should not become the deciding source for readiness, workout physiology, completed set history, or workout prescription.

## Source Hierarchy Boundary

Apple Health daily summaries may support these questions:

- Did a recent Apple Health sync reach the backend?
- Do daily summary metrics roughly agree with other sources?
- Is there movement/activity context when Garmin, Rack/Motra, or Oura data is delayed?
- Are there stale or missing Apple Health rows that should be shown as diagnostics?
- Is a workout row likely a mirrored Garmin/Apple duplicate instead of a separate session?

Apple Health must not do these yet:

- Override Oura readiness, overnight sleep, HRV, or sleep/recovery interpretation.
- Override Garmin workout physiology, training load, heart-rate response, or set-level Garmin strength details.
- Override Rack/Motra completed sets, exercise names, loads, reps, or completed-session history.
- Directly change workout prescription, readiness tier, intensity, volume, or exercise selection without the existing safety hierarchy.
- Convert summary-only Apple Health workout counts into completed strength sets.
- Double count Garmin workouts that Apple Health mirrors through HealthKit.
- Treat stale or missing Apple Health data as a user compliance failure.

## Surfaces To Update

### `sync-status`

Show Apple Health as an additional sync source with its own freshness state.

Planned fields:

- latest Apple Health summary date.
- latest sync run status.
- days requested and days written from the latest sync run when available.
- row freshness status: `current`, `stale`, `missing`, or `partial`.
- non-authoritative role label: `supporting_evidence`.
- duplicate policy flag when `garmin_mirror_possible` or equivalent provenance exists.

Behavior:

- Missing Apple Health should be a diagnostic warning, not a readiness blocker.
- Stale Apple Health should explain that Oura/Garmin/Rack/Motra remain authoritative.
- Partial syncs should surface counts and errors without failing unrelated source checks.

### `coach-today`

Add an Apple Health supporting-evidence block to the daily coach context.

Planned use:

- Mention steps, exercise minutes, active energy, resting heart rate, and workout count only as context.
- Include a short source note such as `Apple Health daily summary is supporting evidence only`.
- If Apple Health shows activity but Garmin/Rack/Motra has no completed workout, phrase it as a prompt to verify upstream sources, not as proof of completed strength work.
- If Garmin/Rack/Motra already shows a workout, Apple Health may confirm movement volume but must not create a second workout.

Guardrail:

- `evaluateReadiness()` and `buildWorkoutPlan()` must not consume Apple Health summary metrics as prescription inputs in Phase 3.

### Dashboard Diagnostics

Add Apple Health to compact dashboard diagnostics as a cross-check section.

Planned placement:

- `compactDashboard(base).current.apple_health_daily_summary`
- `compactDashboard(base).recent.apple_health_daily_summaries`
- `compactDashboard(base).current.data_completeness.checks[]` as an optional diagnostic check
- `buildBrief(base).data_completeness` through the same data-completeness object

Recommended diagnostic fields:

- summary date.
- sync freshness.
- steps.
- active energy kcal.
- exercise minutes.
- resting heart rate.
- HRV SDNN and sample count when present.
- sleep minutes only as cross-check, not Oura replacement.
- workout count, strength workout count, cardio workout count.
- source app/device.
- duplicate policy flags.
- metric quality.
- updated timestamp.

### Data Freshness Checks

Include Apple Health in freshness checks without penalizing core readiness coverage.

Planned freshness rule:

- `current`: latest Apple Health summary date is today in the profile timezone.
- `stale`: latest summary is older than today but within a bounded recent window.
- `missing`: no Apple Health summaries are available.
- `partial`: latest sync run succeeded with fewer written days than requested or recorded errors.

Scoring:

- Apple Health should be `required: false` in data completeness.
- Missing/stale Apple Health should not lower the core required-source score.
- The dashboard can expose a separate `supporting_evidence_missing` list if useful.

## Likely Files To Change During Implementation

- `netlify/functions/_coach-lib.mjs`
  - Add Apple Health summary compaction helpers.
  - Add optional Apple Health diagnostics to `buildDataCompleteness()`.
  - Add Apple Health context to `compactDashboard()`.
  - Add supporting evidence to `buildBrief()` or `buildCoachDecision()` only if it stays non-authoritative.
  - Preserve `evaluateReadiness()` and `buildWorkoutPlan()` authority boundaries.

- `netlify/functions/coach-api.mjs`
  - Change only if `sync-status`, `coach-today`, or dashboard actions need to fetch or pass Apple Health rows/runs differently.
  - Do not change Apple Health ingest semantics unless a read-path bug is found.

- `tests/coach-engine.test.mjs`
  - Add source-hierarchy tests proving Apple Health appears as supporting evidence without changing readiness tier or workout prescription.
  - Add stale/missing Apple Health tests for data completeness.
  - Add no-double-counting tests for Garmin/Apple mirrored workouts.

- `tests/apple-health-daily.test.mjs`
  - Extend only if read-path fixtures need to share Apple Health daily summary shape with dashboard/coach tests.

- New tests as needed
  - Consider `tests/apple-health-dashboard-context.test.mjs` if dashboard context coverage becomes large enough to separate from coach engine tests.

- Docs
  - Update `apps/ios-health-sync/README.md` after implementation to explain the Phase 3 read path.
  - Update `apps/ios-health-sync/LIVE_VERIFICATION_RUNBOOK.md` if live verification adds dashboard or `coach-today` readback steps.
  - Add production verification notes only after implementation and live verification.

Do not change:

- `HEALTH_DATABASE.json`
- source-of-truth hierarchy documents unless Todd approves a source-hierarchy update.
- iOS HealthKit permissions unless Phase 3 discovers a missing field that is explicitly approved.

## Data Shape Assumptions

Phase 2 already posts daily summaries to the backend using `apple-health-daily-summary-v1` shape. Phase 3 should read from the persisted Apple Health summary/run tables rather than introducing a second local cache.

Required read models:

- latest Apple Health sync run.
- latest Apple Health daily summary.
- recent Apple Health daily summaries, likely 3 to 7 rows.

Implementation should tolerate:

- no Apple Health tables in older environments.
- tables present but empty.
- sync run present with zero daily rows.
- daily rows present without complete optional metrics.
- malformed optional provenance/quality objects.
- duplicate policy flags represented as strings or booleans.

## No Double Counting Rule

Apple Health workout summary counts are weaker than Garmin/Rack/Motra workout evidence.

Planned handling:

- If a Garmin strength session exists for the same date, Apple Health `workout_count` and `strength_workout_count` are confirmation/context only.
- If Rack/Motra completed sets exist for the same date, Apple Health cannot add sets, volume, exercise names, or session completion detail.
- If Apple Health has `garmin_mirror_possible`, show that flag in diagnostics and avoid counting the Apple Health workout as an independent session.
- If Apple Health has activity but no Garmin/Rack/Motra workout, describe it as `activity detected` or `summary-only workout evidence`, not a completed strength session.

## Acceptance Criteria

- Apple Health appears in `sync-status` as a supporting evidence source with freshness and latest sync status.
- Apple Health appears in `coach-today` as context only, with language that preserves Oura/Garmin/Rack/Motra authority.
- Apple Health appears in dashboard diagnostics and data freshness checks as optional supporting evidence.
- Missing Apple Health summaries are handled gracefully without errors or readiness penalties.
- Stale Apple Health summaries are labeled clearly without blocking the coach response.
- Partial sync runs surface days requested/written and errors without implying total failure.
- Garmin/Apple mirrored workouts are not double counted.
- Summary-only Apple Health workout rows are not treated as Garmin strength detail or Rack/Motra completed sets.
- Tests prove Apple Health does not override Oura readiness.
- Tests prove Apple Health does not override Garmin workout physiology.
- Tests prove Apple Health does not override Rack/Motra completed sets.
- Tests prove Apple Health does not directly alter workout prescription in Phase 3.
- Tests cover current, stale, missing, and partial Apple Health states.
- `HEALTH_DATABASE.json` remains untouched.

## Verification Plan For Future Implementation

Local verification:

- Run the coach engine tests.
- Run Apple Health ingest tests if shared fixtures or read-path assumptions change.
- Confirm `HEALTH_DATABASE.json` has no diff.
- Confirm dashboard/brief outputs include Apple Health only in supporting-evidence fields.

Live verification after deployment:

- Verify the production `sync-status` response includes Apple Health freshness after a real iPhone sync.
- Verify `coach-today` includes Apple Health context without changing readiness tier or workout prescription.
- Verify dashboard diagnostics show stale/missing states when Apple Health is absent or older than today.
- Verify a Garmin workout mirrored into Apple Health is not counted twice.

## Stop Line

Stop at this plan until Todd approves Phase 3 implementation. This planning pass does not change backend behavior, tests, database schema, iOS app behavior, or production routes.
