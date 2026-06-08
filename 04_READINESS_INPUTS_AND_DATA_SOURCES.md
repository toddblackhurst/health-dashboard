# Readiness Inputs and Data Sources

## Main data sources
- Oura
- Apple Fitness / Apple Health
- Garmin Connect / Garmin Fenix 8
- Garmin Nutrition
- Stelo / RightTest iFree CGM (not currently active)
- Hume / Ocare-style body composition scale
- Garmin built-in strength workouts
- Rack (legacy/inactive)
- Motra legacy history
- user subjective feedback

## IMPORTANT — Devices Todd does NOT own
- **Whoop** — Todd does not have a Whoop device. Never attribute any data to Whoop. If a metric looks like a Whoop metric, it is from Oura, Motra, or another listed source.

---

## Oura
Use for:
- Readiness Score
- Recovery Breakthrough / readiness classification
- HRV (nightly average and trend)
- Resting HR
- Sleep timing and staging (REM, deep, light)
- Sleep fragmentation / restfulness
- Respiratory rate
- SpO2
- Wrist temperature
- Sleep latency

Oura is the primary sleep/readiness source when it conflicts with generic Apple Health sleep summaries.

Direct process:
- use `bin/sync_hrv_sources.mjs` with `OURA_ACCESS_TOKEN` for local/manual sync
- production also has `/api/coach/oura-sync` plus a daily scheduled sync so Oura readiness can land without phone-side Apple Health guesswork
- when same-day Oura and Apple Health recovery rows both exist, Coach should prefer the richer Oura row

## Apple Fitness / Apple Health
Use for:
- Workout sessions (duration, HR, calories, pace)
- Activity rings
- Daily steps
- Cardio load / movement burden
- Blood pressure records written by Omron or other approved BP devices
- HRV only when Apple Health has direct HRV samples, usually from Apple Watch or another app/device that explicitly writes `Heart Rate Variability`; do not expect Garmin Connect to write HRV into Apple Health.
- Sleep duration only as a cross-check against Oura/Garmin

Native HealthKit daily-summary route:
- `POST /api/coach?action=apple-health-daily` or `/api/coach/apple-health-daily`
- requires the existing `x-coach-secret`
- stores one pre-summarized row per day in `apple_health_daily_summaries`
- logs each attempt in `apple_health_sync_runs` and durable sync notes in `coach_observations`
- does not write into `recovery_sleep`, `nutrition_days`, `activity_sessions`, or `strength_sessions`

Daily-summary rule:
- summarize on device before upload; do not upload raw HealthKit samples by default
- use Apple Health daily summaries for steps, movement burden, activity rings, broad HR context, direct Apple HRV samples, and sleep-duration cross-checks
- keep duplicate-policy flags when Garmin/Fenix data may be mirrored through Apple Health
- never treat Apple Health daily summaries as a second independent Garmin workout, calorie, or nutrition source

## Garmin Connect / Garmin Fenix 8
Use while Todd is wearing the Fenix 8 as Apple Watch replacement:
- Built-in Garmin strength workout execution, including planned exercise steps, sets, reps, loads/targets, rest steps, and post-workout activity records
- Heart rate, HR zones, training effect, exercise load, recovery time, calories, sweat loss, and temperature when visible
- Body Battery, HRV Status, Training Readiness, Training Status, stress, sleep, and recovery trends
- Apple Health can mirror basic workout data, but Garmin-only training metrics must come from Garmin Connect screenshots/exports/API access. Garmin's Apple Health sharing does not include HRV; use Garmin Connect directly for HRV Status and Garmin readiness HRV.

Garmin fallback process: capture Garmin Connect HRV Status / Training Readiness directly and ingest it with `bin/sync_hrv_sources.mjs --source garmin-json`.

Coach Pro 10.0 delivery rule: Rack is the trackable planned-routine layer when active, Apple Notes are the detailed workout coaching layer, and Garmin/Fenix 8 is the completed workout evidence and physiology layer. Use Garmin as the primary source for completed strength evidence, set rows when available, reps, loads/targets, rests, duration, HR, calories, training load, recovery time, zones, and route/pace data. If a Garmin exercise label or rep detection is obviously wrong, correct it with Todd's post-workout feedback rather than pretending the watch was perfect.

Duplicate-source rule: while Garmin/Fenix is active, do not count the same workout physiology twice through Garmin Connect and Apple Health. Apple Health may mirror basic Garmin workout data, but Coach should avoid treating mirrored Apple Health workout records as a separate second source.

Accuracy rule:
- Garmin is primary for structured strength execution, completed set rows, workout duration, HR zones, Training Effect, exercise load, recovery time, Training Status, Training Readiness, HRV Status, Body Battery, stress, and acute load.
- Garmin wrist HR is good enough for broad training-load context but not the highest-confidence source for fast intervals, gripping, cycling, rowing, or weightlifting HR spikes. If HR accuracy becomes a hard decision point, use a compatible chest strap for the activity.
- Garmin exercise labels and rep counts are useful but not final when the watch clearly mis-detects a lift. Preserve the activity as the base record, then correct meaningful drift with Todd's post-workout feedback.
- Garmin HRV Status and Training Readiness require consistent watch wear, especially overnight. Do not interpret early or reset-period values as stable until the watch has enough baseline data.

## Garmin Nutrition
Use for:
- Nutrition logging and macro totals
- Calorie, protein, carbohydrate, fat, fiber, sodium, sugar, water, and per-meal totals when visible
- Garmin Connect+ daily target tracking and Active Intelligence nutrition context

Garmin Nutrition is the source of truth as of 2026-06-07 because the Garmin subscription is active and the targets are configured to 2,150 kcal / 161g protein / 72g fat / 215g carbs.

Garmin Nutrition rule:
- Use Garmin totals when complete enough to judge calories, protein, carbs, fat, and preferably fiber, sodium, sugar, and water.
- If Garmin totals are not visible to Coach, use a manual macro closeout from Garmin rather than estimating from partial screenshots.
- Oura Meals can explain sleep/meal-timing patterns, but it does not replace Garmin Nutrition for calories and macros.

## Rack
Use for:
- Trackable planned routines when active
- Routine-builder workflow
- Completed workout history only when using Rack's supported import format

Rack is the concise trackable core for workout delivery when Todd is using it. Rack import is still completed-history only; do not use it to create future planned sessions.

## Apple Notes
Use for:
- One note per delivered workout
- The full coaching layer: point of the day, readiness/pain gate, warmup, floor/equipment context, purpose, cues, feel checks, progression, substitutions, cut order, and stop rules

Do not deliver only Markdown or a bare Rack routine when a workout plan is being built.

## Motra legacy
Use only for:
- Older strength history from Apple Watch/Motra sessions
- Prior exercise names, patterns, and working weights when Garmin history needs older context
- Pattern frequency and rotation from historical Motra data
- HRV trend (7d, 30d, 90d)
- RHR trend
- VO2 Max trend
- Weight trend and projection
- Training status rating

Do not ask Todd to maintain Motra as a parallel active workout logger. Do not duplicate the same workout across tools without a clear role: Rack is planning/tracking, Apple Notes is coaching detail, Garmin is completed physiology/evidence, and Apple Health is the bus/cross-check.

## Stelo / RightTest iFree CGM
Todd is not currently using a CGM. Treat glucose as not tracked, not stale or broken. If Todd reactivates a CGM, use it for blood-glucose response to meals, glucose variability, and post-workout glucose patterns.

## Hume / Ocare-style body composition scale
Use for:
- Weight trend
- Body-fat trend
- Lean-mass trend
- Visceral-fat trend if the same device/method is used consistently

Use body composition as trend-only. Consumer BIA devices are not accurate enough for one-day body-fat or lean-mass decisions, especially with hydration, creatine, sodium, and training soreness in play.

---

## Interpretation rule
Trends matter more than one isolated metric.
The coach should synthesize:
- sleep (Oura primary)
- HRV (Oura primary, Garmin for trends)
- resting HR (Oura + Garmin)
- previous workout strain/load (Garmin primary while Fenix is active)
- set-level lifting detail (Garmin built-in strength workouts plus Todd's post-workout feedback)
- performance trend (Garmin strength history for lifting progression and physiology/load)
- glucose context only if Todd reactivates Stelo / RightTest
- body composition (Hume/Ocare-style BIA trend only)
- nutrition (Garmin Nutrition primary)
- BP (Omron/Apple Health primary)
- user motivation and soreness (subjective)

## Phone-side audit queue
When Todd reconnects the phone and explicitly permits visible phone control, audit these screens before changing settings:

1. Garmin Connect: device sync status, Fenix firmware/app version, user profile, weight, HR zones, obvious bad LTHR values, training-readiness glances, and Apple Health sharing toggles.
2. Garmin Strength: confirm each planned workout uses rest steps after sets so reps and weight can be edited on-watch during rest and cleaned up after the workout.
3. Oura: confirm ring sync, overnight data freshness, API-backed Coach sync, and tags for travel, alcohol/late meal, sickness, migraine, and hip irritability.
4. Garmin Nutrition: confirm the phone app can log/search/reuse meals and shows the active 2,150 / 161P / 72F / 215C targets.
5. Apple Health permissions: keep BP and approved cross-check data available; avoid treating mirrored Garmin workouts as separate independent workouts.
6. Coach screenshot/export path: after any phone-side changes, capture the relevant settings screens into the Coach Screenshots iCloud folder so Coach can verify the actual state.
