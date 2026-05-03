# Database Guide

Supabase Postgres is the canonical live coaching database. `HEALTH_DATABASE.json` is now an archive/export/bootstrap backup, not the primary coach brain.

The active coach reads live data through Netlify Functions, stores durable rules in `coach_state`, and logs coach calls in `coach_decisions`.

---

## Canonical Live Tables

| Table | Purpose |
|---|---|
| `profiles` | Todd's core profile and baseline context |
| `coach_state` | Goals, constraints, World Gym profile, source hierarchy, travel mode, active medical loops |
| `coach_decisions` | Audit log of coach calls, readiness tiers, risk flags, nutrition calls, workout builds |
| `coach_messages` | User/coach conversation logs from web, Custom GPT, Shortcuts, and WhatsApp |
| `recovery_sleep` | Oura/Bevel sleep and recovery signals |
| `blood_pressure_readings` | Home BP tracking and doctor-review loop |
| `nutrition_days` / `meals` | Bevel nutrition totals and meal detail |
| `body_comp_measurements` | Bevel/Hume/Ocare body-composition trend inputs |
| `strength_sessions` / `strength_exercises` | Motra workout logs |
| `session_feedback` | Post-workout ratings, pain notes, best/worst movements |
| `doctor_notes` | Medical guidance that can override app scores |

## `coach_state` Requirements

`coach_state` must retain:

- World Gym Taichung as default environment
- Floor 3 functional floor preference
- Floor 1/2/3 equipment and logistics
- Floor 3 pull-up preference: use Matrix trainer if available; Floor 2 pull-up station is fallback
- Floor 2 dumbbell/bench rule: chest-supported DB rows and real dumbbell bench work belong on Floor 2; Floor 3 dumbbells only go to 10 kg
- No cross-floor supersets
- exact Motra names when known
- travel mode flag and hotel-gym inventory rule
- 60% strength / 40% athletic-functional default bias
- 150g protein floor and fat budget
- Oura > subjective/medical > Bevel > Apple hierarchy for readiness
- Bevel as nutrition source of truth
- Hume/Ocare as trend inputs, not one-day body-fat truth

## HEALTH_DATABASE.json Archive

`HEALTH_DATABASE.json` remains useful as a backup/export and migration source.

Historically, it was a single structured JSON file that accumulated Todd's health, training, and recovery data. It now serves two purposes:

1. **Archive/export backup** — local copy of imported coach data.
2. **Bootstrap/import source** — `bin/import_health_database.py` can migrate it into Supabase.

---

## Source Apps

| App | What It Tracks |
|---|---|
| **Oura** | Recovery score, HRV, resting HR, sleep stages, SpO2, respiratory rate, wrist temp, activity strain, cardio load, glucose integration |
| **Bevel** | Body weight, body fat %, visceral fat level, weekly composition trends |
| **Stelo** | Continuous glucose monitoring (CGM) — mg/dL readings, variability, time in range. Data also surfaces inside Oura |
| **Apple Fitness** | Apple Watch activity tracking (steps, calories, HR during non-gym activities) |
| **Motra** | Full exercise-level workout logs — exercise name, sets × reps × weight |
| **Hume Body Pod** | Air-displacement body composition — BF%, lean mass, body water, BMI, segmental muscle and fat distribution |
| **Ocare3** | (App confirmed, no screenshots yet — will add schema when data provided) |

> Crosspoint (WorldGym Taiwan AI posture assessment at i.worldgymtaiwan.com) is NOT a personal app — it is a gym-based assessment system. Data is stored in the `posture_assessment` section.

---

## Data Sections

| Section | Source Apps | What It Tracks |
|---|---|---|
| `body_composition` | Bevel, Hume Body Pod | Weight, BF%, lean mass, fat mass, VAT level, BMI, body water, segmental muscle and fat |
| `recovery_sleep` | Oura | HRV, resting HR, recovery score, sleep duration/stages/efficiency, SpO2, respiratory rate, wrist temp, HR dip, sleep debt, cardio load |
| `nutrition` | Food photos, descriptions, app screenshots, Oura | Meal-by-meal food items with calories and macros, daily totals vs. targets, nutrition score |
| `glucose` | Stelo (via Oura) | Real-time glucose readings, daily variability, waking glucose, average glucose, time in range |
| `activity_sessions` | Oura | Cardio and strength session overviews — strain, HR, calories, volume, reps, HR zones, muscle split |
| `strength_logs` | Motra | Full exercise-level workout logs — exercise name, sets × reps × weight |
| `posture_assessment` | Crosspoint / WorldGym AI | Posture scores, hip offset, spine deviation, head deviation, flagged muscles |

---

## Unit Conventions

- **Weight**: kg as default. `weight_lbs` field preserved when original source used lbs.
- **Volume**: kg total (Motra reports this natively).
- **Distance**: km (converted from mi where needed).
- **Duration**: minutes.
- **Temperature**: Fahrenheit preserved as `wrist_temp_f`, Celsius stored as `wrist_temp_c`.
- **Glucose**: mg/dL (Stelo/US standard).
- **Negative weights** (e.g. `-80 kg` for Machine Assisted Pull-Up) = assistance weight (assistance machine).
- **`weight_kg: 0` + `is_bodyweight: true`** = bodyweight exercise.

---

## How to Add New Data

### From Motra (after each workout)

Tell Claude: *"Add today's Motra log"* and paste the workout text. Claude will add a new entry to `strength_logs`.

Required fields per log:
- `date` (YYYY-MM-DD)
- `session_name`, `location`, `start_time`, `duration_min`, `volume_kg`, `calories_kcal`, `exercise_count`
- `exercises[]` with sets (reps × weight or duration)

### From Oura (daily or weekly)

Drop a screenshot of your Recovery, Sleep, or Activity screen. Claude will extract:
- Recovery score, HRV, resting HR, respiratory rate, SpO2, wrist temp → `recovery_sleep`
- Activity sessions → `activity_sessions`
- Glucose readings → `glucose`

### From Stelo (glucose)

Drop a screenshot of your Stelo app or the Glucose tab in Oura. Claude will extract:
- Current reading (mg/dL), trend direction, variability %, waking/average glucose, time in range → `glucose`

### From Bevel (body composition scans)

Drop a screenshot of your Body Composition screen or Progress Report. Claude will extract:
- Weight, body fat %, visceral fat level, lean mass → `body_composition`

### From Hume Body Pod (body composition)

Drop a screenshot of your Hume app. Claude will extract:
- Weight, BMI, BF%, lean mass, body water, subcutaneous fat, segmental muscle/fat → `body_composition`

### From Crosspoint / WorldGym AI Assessment

Drop a screenshot of the posture assessment screens. Claude will extract:
- Dynamic score, hip offset, spine/head deviation, segment scores, flagged muscles → `posture_assessment`

### From food photos, descriptions, or screenshots (nutrition tracking)

Tell Claude any of the following:
- *"Log my breakfast"* + type what you had
- *"I had X for lunch"* (description)
- Upload a photo of your meal, a nutrition label, or a food app screenshot

Claude will:
1. Identify all foods and estimate calories + macros (protein, carbs, fat)
2. Add the meal to `NUTRITION_LOG.md` (human-readable log)
3. Add or update today's entry in the `nutrition` array of `HEALTH_DATABASE.json`
4. Give you a running daily total against your targets (1800 kcal / 135g P / 180g C / 60g F)

**Meal types:** breakfast, lunch, dinner, snack, pre_workout, post_workout, supplement

If a nutrition label is visible in a photo, exact values are used. Otherwise Claude estimates from standard food references. Estimates are flagged with `"estimated": true`.

See `29_NUTRITION_TRACKING_ENGINE.md` for full estimation rules, Taiwan-specific food references, and coaching integration logic.

### Manual entry

Just tell Claude the numbers and the date. Claude will add them with `"source": "Manual Entry"`.

---

## Coaching Use

Claude reads this file at the start of each session (via `SESSION.md` instructions) to:

- Check recent recovery trends before generating a workout
- Monitor HRV baseline (32.5 ms) — readings below this signal recovery deficit
- Track progression in key lifts (Pull-Up reps, Hip Thrust load, Face Pull weight)
- Monitor body composition changes over time (Bevel weekly, Hume monthly)
- Spot drift signals (rising resting HR, falling HRV, declining sleep scores)
- Adjust weekly planning based on Oura cardio load status (Productive vs. Detraining vs. Overreaching)
- Monitor glucose trends for metabolic health and training fueling decisions

---

## Oura Biology Baselines (stored in `profile.oura_biology_baselines`)

| Metric | Baseline |
|---|---|
| HRV | 32.5 ms — readings below this = recovery deficit |
| Resting HR | 62.6 bpm |
| Body Fat | 16.3% |
| VO2 Max | 38.9 (Below Average — cardio fitness improvement target) |
| Avg Bedtime | 9:23 PM |
| Avg Wake Time | 5:44 AM |
| Avg Sleep | 6h 25m/night (chronic mild debt) |

---

## Google Sheets Dashboard (Planned)

Each JSON array will become a tab in a Google Sheet:

| Sheet Tab | JSON Section |
|---|---|
| Body Composition | `body_composition` |
| Recovery & Sleep | `recovery_sleep` |
| Glucose | `glucose` |
| Nutrition | `nutrition` |
| Activity Sessions | `activity_sessions` |
| Workout Log (summary) | `strength_logs` (flattened) |
| Posture | `posture_assessment` |

A Google Apps Script will be written to pull data from this file and populate the sheet automatically.

---

## Current Data Coverage

| Section | Entries | Date Range |
|---|---|---|
| Body Composition | 4 | Nov 2025 – Apr 10, 2026 |
| Recovery & Sleep | 7 | Jan 29 – Apr 11, 2026 |
| Nutrition | 2 | Oct 2025, Apr 1, 2026 |
| Glucose | 4 | Apr 7–11, 2026 |
| Activity Sessions | 5 | Jan 29 – Apr 10, 2026 |
| Strength Logs | 24 sessions | Feb 2 – Apr 10, 2026 |
| Posture Assessment | 1 | Apr 2026 (Crosspoint) |

*Ocare3 data not yet in database — screenshots not provided yet.*

---

## Nutrition Section Schema (v1.2+)

Each entry in the `nutrition` array uses this structure:

```json
{
  "date": "YYYY-MM-DD",
  "source": "Manual Entry / Screenshot / Label",
  "targets": {
    "calories_kcal": 1800,
    "protein_g": 135,
    "carbs_g": 180,
    "fat_g": 60
  },
  "meals": [
    {
      "meal": "breakfast",
      "time": "07:30",
      "items": [
        {
          "food": "Food name",
          "amount": "portion description",
          "calories_kcal": 300,
          "protein_g": 30,
          "carbs_g": 20,
          "fat_g": 10,
          "estimated": true,
          "source": "Estimate"
        }
      ],
      "subtotals": {
        "calories_kcal": 300,
        "protein_g": 30,
        "carbs_g": 20,
        "fat_g": 10
      }
    }
  ],
  "daily_totals": {
    "calories_kcal": 1650,
    "protein_g": 128,
    "carbs_g": 165,
    "fat_g": 55
  },
  "vs_targets": {
    "calories_delta": -150,
    "protein_delta": -7,
    "carbs_delta": -15,
    "fat_delta": -5
  },
  "nutrition_score": null,
  "notes": "Optional coaching notes"
}
```

**Valid meal types:** `breakfast`, `lunch`, `dinner`, `snack`, `pre_workout`, `post_workout`, `supplement`

**Source values:** `"Label"` (from nutrition label), `"Estimate"` (AI-estimated), `"App"` (from Oura/Cronometer), `"Manual Entry"`

---

## Schema Version

Current: `1.2` — updated 2026-04-11.

Changes from 1.1:
- Rebuilt `nutrition` section with meal-by-meal schema
- Added `meals[]` array with per-item macro breakdown
- Added `daily_totals` and `vs_targets` fields
- Added `targets` block (1800 kcal / 135g P / 180g C / 60g F)
- Migrated legacy nutrition entries to new schema
- Added `NUTRITION_LOG.md` as human-readable companion to JSON nutrition data
- Added `29_NUTRITION_TRACKING_ENGINE.md` for food processing rules

Changes from 1.0:
- Corrected all source labels (Whoop/Bolt → Oura)
- Added `glucose` section (Stelo CGM data)
- Added `posture_assessment` section (Crosspoint AI scan)
- Added Hume Body Pod body composition entries with segmental data
- Added Oura Biology baselines to `profile`
- Merged duplicate date entries in `recovery_sleep`
- Added full sleep detail fields to all recovery entries where available
