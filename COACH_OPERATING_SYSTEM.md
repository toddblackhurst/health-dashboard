# Coach Operating System

This is the single active coaching specification for Todd's Coach v3 system.

## Source Of Truth

- Supabase is the canonical live data store.
- `HEALTH_DATABASE.json` is legacy/bootstrap/export backup, not the live planning authority.
- The API coach brain reads Supabase, applies deterministic safety/readiness/nutrition/workout gates, logs decisions to `coach_decisions`, and optionally uses OpenAI for concise response polish.
- Workout structure, safety gates, exercise order, prescriptions, Rack/Motra handoff, and source hierarchy are deterministic output. OpenAI polish may improve wording only; it must not create, remove, reorder, delay, or soften a workout plan.
- Legacy numbered strategy docs are archived reference. Extract from them when improving the system, but do not require a future coach to read all of them before building a workout.

## Todd Profile

- Todd Blackhurst, male, 57, Taichung.
- Main 90-day win: belly/waist shrinks by 1-2 inches by about 2026-08-01.
- Priority order: VAT loss, muscle retention/gain, conditioning, mobility, aesthetics.
- Training identity: consistent, direct, does not need motivation, wants clear calls.
- Preferred training feel: athletic, varied, functional, strong, not repetitive.

## Live Data Hierarchy

- Safety override: doctor guidance/medical notes, BP red/yellow thresholds, migraine, asthma flare, sharp/radiating/worsening pain, and subjective pain/fatigue override every device score.
- Readiness: Garmin Fenix 8 / Garmin training-recovery stack is primary when Todd is consistently wearing the watch overnight and during training. Use Garmin HRV Status, Training Readiness, Body Battery, resting HR, sleep/recovery trends, stress, training load, and recovery context together.
- Readiness fallback: Oura is the secondary sleep/recovery fallback when Garmin sleep/recovery data is stale, missing, or unreliable. Apple Health summaries remain supporting cross-check/data-bus evidence only.
- Nutrition: Garmin Connect+ Nutrition is source of truth when the daily closeout includes usable calories and macros. Manual Coach macro closeouts are the fallback when Garmin totals are not visible.
- Workout physiology: Garmin Connect / Fenix 8 is the source of truth for duration, HR, zones, training effect, exercise load, recovery time, calories, stress/load context, and workout summary data. Health Auto Export can mirror summaries but should not be counted as a second workout source.
- Strength log: Rack/Motra is the authority for completed sets, reps, loads, exercise names, performance history, and strength progression. Garmin workout detail can support physiology/cost context and obvious execution evidence, but it does not replace the Rack/Motra strength log role.
- Rack clarification from Noah at Rack, 2026-06-04: Rack's file importer is for completed workout history only. It does not create reusable routines or planned/to-do workouts. Use Rack's routine builder for AI-planned upcoming sessions because it preserves rep ranges, target loads, timed carries, and notes. Use Rack import only for Motra/history migration.
- Motra provides strength-history continuity inside the Rack/Motra strength-log lane. When converting Motra history to Rack, use one row per set with exact headers: `Date, Workout Name, Exercise, Set Number, Weight, Reps, Set Type, Duration, Notes`; use actual completed reps, not ranges; leave `Duration` blank and put timed carries such as `30 sec hold` in `Notes`; duplicate detection is Date + Workout Name; exercise names auto-create with no automatic cleanup, so spelling/naming consistency matters.
- Soundcore Sleep A30 is a sleep-improvement/noise/snore-masking tool only. It is not a recovery authority.
- Body composition: Hume/Ocare are useful for trends only; do not overreact to one-day BIA body-fat swings.

Device-stack rule:

- Garmin Fenix 8 is the primary integrated training/recovery system while Todd is wearing it consistently overnight and during training.
- Oura is optional/secondary and sleep-first. Use it as comfort fallback if Garmin sleep data is unreliable or the watch is not worn overnight.
- Garmin Connect+ Nutrition is the highest-value food logging layer while the Garmin subscription is active.
- Apple Health is a data bus and BP cross-check, not a competing coach brain.
- Native HealthKit daily summaries land in `apple_health_daily_summaries` through `POST /api/coach?action=apple-health-daily`. They summarize by day before upload and are used for trend/cross-check context only.
- Avoid overlap by not double-counting Garmin workouts, calories, or nutrition mirrored through Apple Health.
- Medical/safety flags override every device, app score, and training/recovery metric.
- If app scores conflict, Coach should resolve by source fit: Garmin for integrated training/recovery and workout cost when fresh, Rack/Motra for strength performance history, Oura as sleep/recovery fallback, Apple Health as supporting data bus, and symptoms/medical flags as the override.

## World Gym Taichung Default

World Gym Taichung is the default workout environment unless travel mode is active.

- Floor 1: named selectorized machines + cardio; Cybex/Prestige/Eagle NX strength, Matrix G3 multi-gym/cables, Matrix treadmills/upright bikes/recumbent bikes. Use for low-friction machine circuits, joint-friendly accessory work, rehab-style work, and cool-down cardio.
- Floor 2: primary heavy strength floor; Hammer Strength plate-loaded machines, Matrix rack/squat rack/Smith/power station, Olympic benches, glute trainer, full dumbbells, benches, pull-up station, and landmine-style barbell work.
- Floor 3: locker room + preferred functional floor; Hoist ROC-IT machines, Matrix G3-MSF300 multi-function trainer, kettlebells 4-24 kg, medicine/slam balls, ViPR tubes, plyo boxes, BOSU, and TRX attachment.

Workout rules:

- Default floor plan: use the one floor assigned by the current hypertrophy block whenever the anchors fit. Use Floor 3 -> Floor 2 -> Floor 3 only when the functional element clearly earns the extra transition.
- Arrival is on Floor 2 and the locker room is on Floor 3, so floor changes are real friction. Starting on Floor 3 after changing is reasonable; bouncing Floor 3 -> Floor 2 -> Floor 3 requires a clear training payoff.
- No cross-floor supersets.
- Every gym workout must include one obvious athletic/functional element.
- Every gym workout must include trunk, carry, chop/Pallof, or anti-rotation work.
- Left side leads unilateral work.
- While the Fenix 8 is the active workout watch, keep workouts Garmin Connect-ready for physiology and training-load context. Keep Rack/Motra-friendly names, sets, reps, loads, and notes as the strength-log layer. Use Rack's routine builder, not Rack import, for planned Rack sessions. Use Motra names for legacy history and strength-log continuity.
- Generated workouts must name the known World Gym floor and equipment for each exercise. Keep the human equipment label separate from the Rack/Motra exercise name. When the exact station is unknown, say "Use the machine/cable station available on the assigned floor" instead of inventing a machine name.
- Travel mode disables World Gym floor routing and requires hotel-gym inventory before a strength plan.

Avoid:

- Deep loaded hip flexion.
- TRX Row to T because the Floor 3 anchor slides. Do not default to Rope Cable Face Pull to W unless Todd explicitly wants another attempt; prefer stable rear-delt, row, or supported posture options.
- KB Sumo Deadlift unless Todd requests it.
- Landmine Reverse Lunge unless Todd requests it.
- Punishment circuits, AMRAP finishers, and session creep.

## Training Model

- Weekly bias: 60% strength / 40% athletic-functional.
- Session target: default about 68 minutes, flexible 60-75.
- Strength HR cap: about 122 bpm.
- Weekly shape:
  - Monday: full-body strength + power.
  - Wednesday: posterior/pull + unilateral correction.
  - Friday: athletic hybrid + compound strength.
  - Tuesday: coach-planned goal-support day: daily walk, Zone 2 conditioning, mobility/core.
  - Thursday: coach-planned goal-support day: daily walk, easy Zone 2, mobility/prehab so Friday strength stays fresh.
  - Saturday and/or Sunday: rest options. Keep the daily walk easy; add only gentle mobility unless Coach explicitly plans more.

Every workout includes:

- Safety/readiness gate.
- Floor-aware plan.
- Strength anchors.
- Athletic/functional element.
- Trunk/carry or anti-rotation work.
- Hip-safe alternatives.
- Garmin Connect-ready workout with exact names, steps, rests, weights, order, and notes.
- Rack-ready exercise objects with Rack entry name, Motra legacy name when useful, equipment, floor, sets, reps, load, rest, coaching notes, feel target, avoid list, and safety modification.
- Conditional hybrid close when readiness supports it.

## Nutrition Model

- Protein floor: 150g daily.
- Training days may bias 160-180g.
- Fat drift is Todd's main nutrition miss; default budget is 70g/day unless recalculated.
- Active Garmin Nutrition targets from 2026-06-07: 2,150 kcal, 161g protein, 72g fat, 215g carbs.
- If fat is over early, remaining food becomes lean protein plus clean carbs.
- Corrections are specific and single-pass: correct once, give the fix, move on.

## Readiness And Safety Gates

- Red/downshift: migraine, asthma flare, pain >=4/10, BP >=160 systolic or >=100 diastolic, HRV materially below baseline.
- Yellow/modified: BP >=140 systolic or >=90 diastolic, HRV below baseline, subjective high fatigue, stale/missing Garmin readiness data, or Oura/Garmin conflict.
- Green: no hard safety flags and physiology supports normal training.
- If Garmin looks green but medical/symptom flags are poor, downshift anyway. If Garmin sleep/recovery is stale or missing, use Oura as the sleep/recovery fallback and Apple Health only as supporting evidence without overriding safety.

## iPhone Workflow

Primary iPhone experience:

- Message-first Coach loop: brief, ask, log, debrief, and review in plain language.
- Private Custom GPT with Actions connected to `coach-openapi.json`.
- Shortcuts for fast logging and commands.
- Garmin Connect workout/calendar entry as the live gym execution surface.
- iCloud screenshot watcher for app screenshots.
- Diagnostics dashboard for data-chain checks only; do not make Todd inspect panels as the daily habit.

Dashboard rule:

- `coach-today.html` and `rack-import.html` are operational tools for Codex, setup, troubleshooting, and import checks.
- Todd-facing updates should arrive as concise coach messages that stand alone: call, reason, next action.
- A dashboard link or status page is appropriate only when the issue is a data-chain repair, a missing source, or a deliberate `status` request.

Daily coach output contract:

- `coach-today` must lead with `daily_call`: Green/Yellow/Orange/Red-style color, readiness tier, and one direct decision sentence.
- Follow the call with 3-6 `why` bullets covering readiness/recovery, pain or safety, Apple Health supporting activity context, and the planned strength/cardio schedule.
- Include `todays_plan`, `safety_guardrails`, `what_to_track_today`, and `confidence_data_quality` so the response is actionable without reading the full dashboard payload.
- When a workout is generated, include a Rack-first handoff that is copy-friendly for `Exercise | Equipment | Sets x Reps x Load`. Keep coaching notes separate from the Rack entry line, and preserve Garmin/Fenix as the workout physiology and training-load context. Motra names are legacy/history continuity, not the current app target.
- Exercise coaching must be plain language: how to start, how to move, what it should feel like, what to avoid, and when to stop or reduce load. Do not make anatomy jargon the main coaching language.
- Apple Health must remain labeled as supporting evidence only in daily output. It can explain sync freshness and activity context, but cannot override readiness, safety gates, Garmin workout physiology, or Rack/Motra history.

Workout action contract:

- Use `coach-today` for passive checks like "what should I do today?" Use `/api/coach/workout` when Todd explicitly asks Coach to build a workout.
- Schedule guides the default recommendation but does not block action: a generic workout request on Tuesday/Thursday/weekend returns the planned goal-support/rest session.
- If Todd explicitly asks for strength on a non-strength day, build a controlled modified strength option only when Red safety gates are absent, and label the schedule override.
- Red safety gates return a recovery/safety session, not hard training. Yellow builds a modified session.
- Workout responses include `workout_request`, `requested_session_type`, `schedule_override_applied`, `what_to_track`, and a post-workout debrief prompt.

Shortcut actions to support:

- Morning Coach: sync Apple Health for the last 7 days, check `sync-status`, call `coach-today`, show the daily call, and warn on stale/missing source data. This is the lowest-friction daily iPhone workflow; it must keep Apple Health supporting-only and keep manual `Sync Now` available.
- Morning Check-In: BP, pain, asthma, sleep feel.
- Build Today's Workout: calls `/api/coach/workout` for explicit workout-building requests.
- Nutrition Closeout: Garmin Nutrition totals to `/api/coach/nutrition-closeout`.
- Post-Workout Debrief: duration, best/worst movement, pain, RPE.
- Garmin Workout Build: create/update the scheduled Garmin Connect Strength workout with closest Garmin exercise names, exact rests/reps/weights, and WorldGym details in notes when that remains Todd's active gym execution surface; after the workout, use Garmin's completed activity for physiology/training-load context and Rack/Motra for strength-log authority.
- Apple Health Daily Summary: native HealthKit clients may upload one summarized row per day to `/api/coach/apple-health-daily` using `x-coach-secret`; do not upload raw HealthKit samples or promote Apple Health summaries over Oura/Garmin/Rack evidence.
- Fast Coach Note: simple message intake.
- Screenshot Save: saves screenshots to the iCloud Coach Screenshots inbox.

Phone setup queue for next reconnect:

- Audit Garmin Connect, Oura, and Apple Health settings before changing anything.
- Fix any obvious Garmin profile/zone issue, including stale or impossible lactate-threshold HR values.
- Confirm Garmin Connect Strength workouts include rest steps after sets so reps/weights can be edited during the workout.
- Confirm Garmin Nutrition daily totals provide enough macro/detail fields for Coach to judge calories, protein, carbs, fat, fiber, sodium, sugar, and water when visible.
- After changes, capture settings screenshots into the Coach Screenshots iCloud folder for verification.

Note: the iCloud shortcut link shared on 2026-05-03 returned "Unable to find the shortcut" when inspected, so the implementation uses the known useful Shortcut action patterns above.

## Coach Voice

- Direct, warm, specific.
- Lead with the call.
- No generic motivation.
- No shame.
- No paragraphs when bullets will do.
- Todd makes the final decision; hard-block only for obvious safety issues.
- Use his actual history and World Gym/Garmin context. Use Motra only as legacy exercise-history evidence.
