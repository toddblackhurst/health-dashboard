# Personal Coach V2 Architecture

This document defines the target structure for the best version of Todd's personal coach. It is intentionally architectural, not a feature wishlist. Use it to guide Codex work, schema changes, HealthKit work, API changes, and future migrations.

## Executive Call

Do not rebuild from scratch.

The current repo already has the right foundation:

- Netlify function API
- Supabase canonical database
- deterministic coach engine
- Custom GPT / Shortcut action contract
- WhatsApp support
- Motra-oriented workout planning
- legacy JSON bootstrap/export file
- tests for safety and readiness logic

The best next version is a cleaner, more durable coaching platform built around four hard boundaries:

1. **Ingestion layer** — receives data from iPhone, Apple Health, screenshots, manual notes, Rack/Motra logs, and future Oura/Garmin paths.
2. **Canonical data layer** — Supabase tables with normalized daily summaries, workout records, feedback, coach decisions, and durable observations.
3. **Coach brain layer** — deterministic safety/readiness/progression rules first; LLM second for synthesis and communication.
4. **Delivery layer** — Custom GPT, iPhone Shortcuts, WhatsApp, internal web tools, and later a native iOS surface if useful.

## Non-Negotiables

- Supabase remains the canonical live store.
- `HEALTH_DATABASE.json` remains legacy/bootstrap/export backup only.
- The coach must never require reading the entire legacy JSON file to build a workout.
- Safety gates run before workout generation.
- Medical overrides beat app scores.
- Subjective pain/fatigue beats optimistic device scores.
- The coach must preserve serious strength training while adding athletic-functional work.
- Rack/Motra remains the workout execution/logging target for now; do not automate Rack entry until the core system is stable.
- Apple Health becomes the first-class automated ingestion path because much of Todd's device data is already there.
- Garmin, Oura, Rack, and Hume direct integrations are later optimizations, not V2 blockers.

## Target Repository Structure

The repo should gradually move toward this structure without breaking production:

```text
health-dashboard/
├── apps/
│   ├── ios-health-sync/              # Native Swift HealthKit sync app, added when ready
│   └── internal-web/                 # Optional future extracted internal UI
├── docs/
│   ├── architecture/                 # Durable design docs
│   ├── operations/                   # Setup, deploy, troubleshooting, shortcuts
│   └── product/                      # Coaching philosophy, user workflows
├── netlify/
│   └── functions/
│       ├── coach-api.mjs             # Existing public/private API router
│       ├── _coach-lib.mjs            # Existing coach engine; split later only after tests cover behavior
│       ├── health-sync.mjs           # Future focused health ingestion handler, if router becomes too large
│       └── whatsapp-*.mjs            # Existing WhatsApp helpers
├── packages/
│   ├── coach-core/                   # Future extracted deterministic coach rules
│   ├── health-normalizers/           # Future shared Apple Health/Oura/Garmin normalization
│   └── shared/                       # Future shared schemas/types
├── supabase/
│   └── migrations/
├── tests/
├── index.html                        # Internal service landing page
├── coach-openapi.json
├── COACH_OPERATING_SYSTEM.md
├── DATABASE_GUIDE.md
└── HEALTH_DATABASE.json              # Legacy/bootstrap/export backup
```

Do not move files immediately unless a PR is explicitly scoped to that change. First stabilize behavior, add tests, then extract modules.

## Data Architecture

### Current Canonical Domains

The current live domains are correct and should remain:

- profile and goals
- coach state
- coach decisions
- coach messages
- recovery/sleep
- blood pressure
- nutrition
- body composition
- activity sessions
- strength sessions/exercises/sets
- session feedback
- doctor notes
- weekly plans and planned sessions
- raw imports

### Add V2 Apple Health Domains

Add these as non-destructive migrations:

#### `health_daily_summaries`

One row per profile/date/source. This is the primary Apple Health coaching input.

Recommended columns:

- `id uuid primary key`
- `profile_id uuid references profiles(id)`
- `summary_date date not null`
- `source text not null default 'apple_health'`
- `timezone text default 'Asia/Taipei'`
- `sleep_asleep_min integer`
- `sleep_in_bed_min integer`
- `sleep_efficiency_pct numeric`
- `resting_hr_bpm numeric`
- `hrv_sdnn_ms numeric`
- `walking_hr_avg_bpm numeric`
- `vo2_max numeric`
- `respiratory_rate_rpm numeric`
- `spo2_pct numeric`
- `wrist_temp_c numeric`
- `steps integer`
- `active_energy_kcal numeric`
- `exercise_min numeric`
- `stand_hours numeric`
- `walking_running_distance_km numeric`
- `workout_count integer`
- `strength_workout_count integer`
- `cardio_workout_count integer`
- `raw jsonb not null default '{}'::jsonb`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- unique constraint on `(profile_id, summary_date, source)`

#### `health_workouts`

One row per Apple Health workout. Use this to compare Apple Fitness/Garmin/Oura activity with Motra/Rack strength logs.

Recommended columns:

- `id uuid primary key`
- `profile_id uuid references profiles(id)`
- `external_id text`
- `source text not null default 'apple_health'`
- `workout_type text not null`
- `started_at timestamptz`
- `ended_at timestamptz`
- `duration_min numeric`
- `active_energy_kcal numeric`
- `total_energy_kcal numeric`
- `distance_km numeric`
- `avg_hr_bpm numeric`
- `max_hr_bpm numeric`
- `raw jsonb not null default '{}'::jsonb`
- `created_at timestamptz default now()`
- unique constraint on `(profile_id, source, external_id)` when `external_id` is present

#### `health_sync_logs`

Tracks sync health, not body health.

Recommended columns:

- `id uuid primary key`
- `profile_id uuid references profiles(id)`
- `source text not null default 'ios_healthkit'`
- `sync_started_at timestamptz default now()`
- `sync_finished_at timestamptz`
- `status text not null`
- `days_requested integer`
- `days_upserted integer`
- `workouts_upserted integer`
- `error_message text`
- `app_version text`
- `raw jsonb not null default '{}'::jsonb`

## Apple Health Strategy

Use a native iOS app only for what HealthKit requires:

- request HealthKit permissions
- read selected HealthKit data
- summarize by day
- upload to the coach API
- show last sync status

The iOS app should not become the main coaching UI at first. The coach already has delivery channels through Custom GPT, Shortcuts, WhatsApp, and internal web tools.

### First HealthKit Data Types

Start with:

- sleep analysis
- resting heart rate
- heart rate variability SDNN
- heart rate summary from workouts if available
- steps
- active energy
- exercise minutes
- Apple workouts
- VO2 max if available
- body mass if available
- respiratory rate if available
- SpO2 if available
- wrist temperature if available

Do not start with raw all-day heart-rate samples unless a specific coaching use case requires them. Daily summaries are enough for V2 readiness.

## Coach Brain Architecture

The deterministic coach engine must stay upstream of the LLM.

Flow:

```text
Request
  -> authenticate
  -> load profile + coach_state
  -> load recent summaries and logs
  -> normalize data freshness
  -> run safety gates
  -> run readiness classifier
  -> run progression/workout planner
  -> create structured coach decision
  -> optionally use LLM for concise wording
  -> store coach_decision
  -> return response
```

### Safety Gates

Safety gates must be hard-coded and tested:

- migraine day = rest or major downgrade
- asthma flare = no hard conditioning
- systolic >= 160 or diastolic >= 100 = red/downshift
- systolic >= 140 or diastolic >= 90 = yellow/modified unless doctor guidance says otherwise
- pain >= 4/10 = downshift
- sharp, radiating, neurological, or worsening pain = stop/medical caution
- HRV materially below personal baseline = downgrade
- recovery score < 35 = downgrade
- device conflict = choose the more conservative interpretation

### Readiness Classes

Use four classes:

- Green: normal training or planned progression
- Yellow: train with reduced intensity/volume or fewer optional blocks
- Orange: modified session, rehab/prehab, zone 2, technique only
- Red: no hard training; recovery or medical caution

### Progression System

Add explicit progression rules before making plans more aggressive:

- progress only one primary variable at a time: load, reps, sets, density, or complexity
- no progression on a movement pattern with pain elevation
- default weekly set increase cap: 5-10% per pattern
- use repeated clean sessions before increasing complexity
- deload when performance drops repeatedly or pain/recovery trends worsen
- keep familiar strength anchors; put novelty in primer, carry/trunk, or athletic-functional block

## Learning System

The coach should learn through explicit observations, not hidden behavior drift.

Add or use a `coach_observations` domain for durable learning. Each observation should include:

- date
- observation
- evidence
- confidence level
- action taken
- review date
- active/inactive status

Examples:

- Explosive rotational hip work is higher risk until rebuilt through controlled anti-rotation progressions.
- Sleep below 6 hours plus HRV below baseline predicts a lower-body downshift.
- Chest-supported rows belong on Floor 2 unless deliberately light.

## Delivery Architecture

### Primary Daily Flow

1. iPhone syncs Apple Health summary.
2. Todd submits morning check-in through Shortcut/Custom GPT.
3. Coach builds daily call.
4. If strength day, coach generates Rack/Motra-ready workout.
5. Todd enters workout into Rack/Motra.
6. Todd sends post-workout feedback.
7. Coach stores feedback and updates coach_state/observations.

### Channels

- Custom GPT: best conversational surface.
- Shortcuts: best fast logging surface.
- WhatsApp: best passive/reminder surface.
- Internal web: best troubleshooting/admin surface.
- Native iOS: HealthKit sync first; coaching UI later only if needed.

## API Architecture

Keep `/api/coach` stable. Add new actions before splitting files.

Recommended V2 actions:

- `health-sync` — ingest Apple Health daily summaries and workouts
- `sync-status` — report last sync state
- `morning-check-in` — structured subjective readiness intake
- `coach-today` — single endpoint for today’s full status
- `workout` — existing workout generation
- `post-workout` — existing feedback/debrief
- `nutrition-closeout` — existing nutrition check

If `coach-api.mjs` becomes hard to maintain, extract health ingestion to `netlify/functions/health-sync.mjs` only after tests cover the route behavior.

## Testing Requirements

Every structural change should include tests before behavior gets more complex.

Required test groups:

1. Readiness/safety gates.
2. Apple Health payload validation.
3. Data freshness and stale-data handling.
4. Workout generation under Green/Yellow/Orange/Red.
5. Travel mode.
6. Rack/Motra naming and output format.
7. Coach observation update rules.
8. Nutrition closeout constraints.

## Migration Strategy

Use small PRs. No big-bang rewrite.

### PR 1 — Architecture and schema plan

- Add this architecture doc.
- Update start-here docs to point to it.
- No production behavior change.

### PR 2 — Apple Health schema

- Add `health_daily_summaries`, `health_workouts`, and `health_sync_logs` migrations.
- Add tests for expected payload shape if test harness is available.
- Do not modify existing coach decisions yet.

### PR 3 — Health sync API

- Add authenticated `health-sync` action.
- Validate payload.
- Upsert summaries and workouts.
- Write sync logs.
- Return clear sync status.

### PR 4 — iOS HealthKit sync app scaffold

- Add `apps/ios-health-sync`.
- Minimal Swift app.
- Permissions + manual sync.
- No coaching UI yet.

### PR 5 — Coach dashboard/readiness integration

- Load Apple Health summaries into dashboard context.
- Use as supporting workload/recovery evidence.
- Respect existing source hierarchy.

### PR 6 — Observations/learning loop

- Add durable `coach_observations` if not already present.
- Convert feedback-derived adaptations into reviewable observations.

### PR 7 — Weekly planning upgrade

- Make weekly plans adapt from actual recovery, workout completion, pain, and progress.
- Keep session-level plans Rack/Motra-ready.

## Explicit Anti-Goals

- Do not migrate to Vercel as part of V2 unless there is a concrete deployment need.
- Do not make a complex iOS app before HealthKit sync is reliable.
- Do not scrape Garmin/Rack web interfaces.
- Do not overfit the coach to one day of BIA body-fat data.
- Do not let LLM output bypass deterministic safety rules.
- Do not store secrets in repo.
- Do not add raw HealthKit firehose data without a clear use case.
- Do not rename existing production endpoints casually.

## Definition Of Best Version

The best version is not the one with the most integrations. The best version is the one that makes the right training decision every morning with the least friction.

V2 is successful when:

- Apple Health sync is automatic or one-tap.
- Morning check-in takes under 60 seconds.
- The coach knows whether today is Green, Yellow, Orange, or Red.
- The workout is specific enough to enter into Rack/Motra.
- Pain and recovery change tomorrow’s plan.
- Weekly reviews identify what worked, what failed, and what changes next.
- The system can explain every major decision from stored evidence.
- Todd can trust it to push hard without ignoring injury signals.
