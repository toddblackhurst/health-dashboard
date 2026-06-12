# Weekly Review Engine v1 Plan

Status: planning candidate for PR #18. This document does not implement Weekly Review Engine behavior.

## Purpose

Weekly Review Engine v1 should produce a source-backed, review-only weekly coaching artifact that turns the last week of training, recovery, nutrition, safety, workout debriefs, and relevant coach memory into clear next-week recommendations.

The review should help Todd and Coach answer:

- What actually happened this week?
- Which evidence is authoritative, supporting, missing, or stale?
- What worked?
- What failed or created friction?
- What should change next week, and why?
- Which observations should be proposed for review rather than silently added to active memory?

## Non-Goals

This v1 planning PR does not implement the engine.

The later implementation should also avoid these unless separately approved:

- No silent application of next-week changes.
- No automatic Coach Memory promotion from a weekly review.
- No Supabase migration apply without Todd approval.
- No OpenAPI/GPT Action schema change without a scoped implementation PR.
- No production deploy or GPT Action refresh from this planning PR.
- No scraping Garmin, Rack/Motra, Oura, Apple, World Gym, or other web interfaces.
- No use of `HEALTH_DATABASE.json` as live authority.

## Existing Data Sources

The current dashboard loader already gathers the core source lanes in `dashboardFromSupabase()`:

- `recovery_sleep`: Garmin/Oura/fallback recovery and sleep rows.
- `blood_pressure_readings`: BP safety context.
- `body_comp_measurements`: trend evidence only.
- `nutrition_days`: Garmin Connect+ Nutrition or manual closeout rows.
- `strength_sessions`, `strength_exercises`, `strength_sets`: Rack/Motra completed strength history.
- `session_feedback`: older feedback/debrief lane.
- `coach_messages`: recent conversation continuity.
- `weekly_plans` and `planned_sessions`: planned week and session intent.
- `apple_health_daily_summaries` and `apple_health_sync_runs`: supporting activity/sleep/sync context.
- `doctor_notes`: medical/safety overrides.
- `coach_observations`: active reviewable memory.
- `coach_workout_debriefs`: subjective workout response records.
- `coach_decisions`: recent deterministic coaching decisions.

Current code loads enough data for a first read-only weekly review without adding a migration.

## Source Hierarchy And Authority Rules

Weekly Review v1 must preserve this exact source hierarchy:

1. Medical and safety overrides.
2. Garmin Fenix 8 / Garmin Connect readiness, recovery, workout physiology, HR, zones, Body Battery, training load, and recovery-time context when fresh and reliably worn.
3. Rack/Motra completed strength logs for completed sets, reps, loads, exercise names, performance history, and progression.
4. Garmin Connect+ Nutrition when daily totals are usable, with manual Coach macro closeouts as fallback.
5. Oura sleep/recovery fallback only when Garmin data is stale, missing, or unreliable.
6. Apple Health supporting evidence and data bus only.
7. Soundcore Sleep A30 as sleep aid/noise/snore support only, not recovery authority.
8. Hume/Ocare as body-composition trend evidence only.
9. Coach Memory and workout debriefs as personalization and constraint context only.

Rules:

- Red safety cannot become hard training.
- Apple Health workout counts cannot count as completed set-level strength evidence.
- Workout debrief completed exercises remain user-reported, not Rack/Motra completed-set authority.
- Memory and debriefs can downshift, personalize, or constrain recommendations, but cannot override current safety, Garmin readiness/recovery, Garmin workout physiology, Garmin Nutrition, or Rack/Motra completed logs.
- Missing source data must be named as missing, not inferred.

## Proposed API Surface

Planning recommendation for a later implementation PR:

- Add a read-only action such as `GET /api/coach/weekly-review` or `POST /api/coach/weekly-review`.
- Prefer `POST` if the request accepts week-start, timezone, dry-run, or output options.
- Expose a Custom GPT operation only after local tests and route behavior pass.
- Keep the response structured and output-only:
  - `ok`
  - `action`
  - `week_start`
  - `status`
  - `review`
  - `source_coverage`
  - `recommendations`
  - `proposed_observations`
  - `not_applied_automatically`

This planning PR must not change `coach-openapi.json`, `netlify.toml`, or Netlify functions.

## Proposed Supabase Schema Options

Weekly Review v1 can likely start without a new table by generating a review from existing dashboard data.

Possible later options:

1. No new table in v1.
   - Generate weekly review output on demand.
   - Log the action through existing `coach_decisions` only if the later implementation routes it through the coach decision lane.

2. Add `coach_weekly_reviews` in a later approved migration.
   - Useful if Todd wants durable review artifacts, approval state, or later comparison.
   - Suggested fields: `profile_id`, `week_start`, `status`, `source_coverage`, `review_json`, `recommendations`, `proposed_observations`, `approved_at`, `applied_at`, `raw`, timestamps.
   - Must keep `status` values explicit, for example `draft`, `reviewed`, `approved`, `applied`, `superseded`.

3. Add `weekly_review_items` later only if individual recommendation lifecycle becomes necessary.

This planning PR must not add a migration.

## Deterministic Aggregation Flow

Suggested implementation flow for the later PR:

1. Resolve profile and week window.
   - Default week should use Todd's timezone, `Asia/Taipei`.
   - Make week-start explicit in the response.
2. Load dashboard data from Supabase.
3. Filter rows into the target week and a short lookback window when trend context is needed.
4. Build source coverage:
   - present
   - missing
   - stale
   - partial
   - supporting-only
5. Run safety scan:
   - doctor notes
   - BP red/yellow thresholds
   - migraine/asthma/sharp/radiating/worsening pain
   - red-flag workout debriefs
6. Summarize completed strength work from Rack/Motra lane.
7. Summarize Garmin readiness/recovery/workout physiology when present and fresh.
8. Summarize nutrition from Garmin Connect+ Nutrition/manual closeouts.
9. Summarize Apple Health activity/sleep context as supporting only.
10. Summarize workout debrief patterns.
11. Add relevant active Coach Memory context with warning labels.
12. Generate evidence-linked next-week recommendations.
13. Generate proposed observations for review only.
14. Return `not_applied_automatically: true`.

The deterministic aggregator should run upstream of any optional language polish. Optional polish may improve wording only; it must not add, remove, upgrade, or soften recommendations or safety flags.

## Required Weekly Review Sections

### Rack/Motra Completed Strength Evidence

Use `strength_sessions`, `strength_exercises`, and `strength_sets`.

Include:

- completed sessions in the week
- exercises trained
- set/reps/load summaries where available
- skipped or missing planned strength days
- progression or regression signals
- naming/provenance caveats

Do not use Apple Health workout counts or debrief completed exercises as completed strength authority.

### Garmin Readiness, Recovery, And Workout Physiology

Use Garmin recovery/workout physiology when available in current rows and source metadata.

Include:

- readiness/recovery trend
- sleep/recovery context
- training load or workout-cost indicators if present
- stale/missing Garmin warning when applicable

Use Oura only as fallback when Garmin is stale, missing, or unreliable.

### Garmin Nutrition / Manual Nutrition Closeout Evidence

Use `nutrition_days`.

Include:

- days with usable totals
- calories/protein/fat/carbs where available
- protein target adherence
- fat drift
- missing or partial days
- Garmin Nutrition as primary when usable

### Apple Health Supporting Activity / Sleep Context Only

Use `apple_health_daily_summaries` and sync status.

Include:

- steps/activity trend
- exercise minutes
- sleep context if useful
- sync freshness
- duplicate/mirroring cautions

Label Apple Health as supporting evidence only and never completed strength authority.

### Workout Debrief Patterns

Use `coach_workout_debriefs`.

Include:

- RPE/energy patterns
- pain patterns
- skipped/stopped/modified work
- red-flag symptoms
- exercise response notes
- candidate memory summaries

Keep debriefs subjective and non-authoritative over Rack/Motra or Garmin.

### Pain And Safety Events

Use doctor notes, BP readings, debrief safety outcomes, subjective pain, asthma/migraine indicators, and relevant memory.

Include:

- red/yellow events
- safety-driven downshifts
- unresolved follow-up loops
- next-week guardrails

### Relevant Coach Memory Context

Use active observations only by default.

Include:

- relevant constraints/preferences
- source/evidence/confidence when available
- warning that current safety and current data override memory

Do not include retired memory as active context.

### What Worked

Evidence-backed positives only. Examples:

- completed sessions
- improved adherence
- better recovery response
- nutrition target wins
- reduced pain or cleaner movement response

### What Failed

Evidence-backed friction only. Examples:

- missing authoritative data
- skipped sessions
- pain escalation
- nutrition drift
- poor sleep/recovery trend
- plan/execution mismatch

### Recommended Next-Week Changes With Evidence

Each recommendation should include:

- recommendation
- evidence driver
- affected source lane
- safety impact
- whether it is output-only or needs approval

### Proposed Observations For Review

Generate only proposed observations. Do not silently create active memory.

Each proposed observation should include:

- category
- observation
- evidence summary
- confidence
- suggested action
- review date
- why it should not override current safety/source hierarchy

## Test Plan For Later Implementation

Recommended tests:

- Weekly review returns output-only with `not_applied_automatically: true`.
- Missing Garmin data uses Oura fallback only when appropriate.
- Apple Health activity does not count as completed strength evidence.
- Rack/Motra completed sets remain strength authority over debrief text.
- Red safety event prevents hard-training recommendations.
- Nutrition gaps are labeled partial/missing instead of inferred.
- Active memory can constrain recommendations but cannot override current safety or data.
- Proposed observations are returned as proposed/review-only and not inserted as active memory.
- OpenAPI/route tests if a route is added.
- No `HEALTH_DATABASE.json` dependency.
- Optional polish cannot alter deterministic recommendations.

Existing relevant suites to extend:

- `tests/coach-engine.test.mjs`
- `tests/coach-action-routing.test.mjs`
- `tests/workout-debrief.test.mjs`
- `tests/coach-memory.test.mjs`
- `tests/apple-health-dashboard-context.test.mjs`

Suggested new suite:

- `tests/weekly-review.test.mjs`

## Suggested Implementation PR Breakdown

After Todd and GPT Pro approve this plan:

1. PR #19: deterministic weekly review helper only.
   - Add pure helper functions and tests.
   - No route/OpenAPI/migration.
2. PR #20: API route and OpenAPI action.
   - Add route, `netlify.toml` mapping, OpenAPI, route tests.
   - No persistence unless separately approved.
3. PR #21: optional persistence plan or migration.
   - Only if Todd wants durable weekly review artifacts.
   - Requires explicit Supabase migration approval.
4. PR #22: production/GPT Action verification.
   - Refresh GPT Action schema only with Todd approval.
   - Verify production route/action with safe readback.

## Production Verification Checklist For Later Implementation

For the later implementation PR, verify separately:

- local tests pass
- PR checks pass
- PR merged only after Todd approval
- Netlify deploy status if merge triggers deploy
- public unauthenticated route returns expected auth behavior
- hosted OpenAPI includes any new action only after intended route is live
- GPT Action schema refreshed only after Todd approval
- authenticated action call works through configured GPT Action, without pasting secrets into chat
- output includes `not_applied_automatically: true`
- no proposed observations become active memory without Todd approval
- `HEALTH_DATABASE.json` remains untouched

## Stop And Approval Boundaries

Stop before:

- implementing Weekly Review Engine behavior
- changing `coach-openapi.json`
- changing Netlify functions
- adding or applying Supabase migrations
- deploying
- refreshing GPT Actions
- modifying env/secrets
- changing `HEALTH_DATABASE.json`
- scraping external services
- applying recommendations automatically
- promoting observations to active memory automatically

This PR should end as a planning/docs-only draft PR and a GPT Pro relay handoff.
