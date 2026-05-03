# Coach Operating System

This is the single active coaching specification for Todd's rebuilt personal coach.

## Source Of Truth

- Supabase is the canonical live data store.
- `HEALTH_DATABASE.json` is legacy/bootstrap/export backup, not the live planning authority.
- The API coach brain reads Supabase, applies deterministic safety/readiness/nutrition/workout gates, logs decisions to `coach_decisions`, and optionally uses OpenAI for concise response polish.
- Legacy numbered strategy docs are archived reference. Extract from them when improving the system, but do not require a future coach to read all of them before building a workout.

## Todd Profile

- Todd Blackhurst, male, 57, Taichung.
- Main 90-day win: belly/waist shrinks by 1-2 inches by about 2026-08-01.
- Priority order: VAT loss, muscle retention/gain, conditioning, mobility, aesthetics.
- Training identity: consistent, direct, does not need motivation, wants clear calls.
- Preferred training feel: athletic, varied, functional, strong, not repetitive.

## Live Data Hierarchy

- Readiness: Oura overnight physiology first, subjective pain/fatigue second, Bevel Apple-derived recovery third, Apple Fitness workload fourth.
- Nutrition: Bevel is source of truth.
- Workout history: Motra is source of truth.
- Body composition: Hume/Ocare are useful for trends only; do not overreact to one-day BIA body-fat swings.
- Medical and safety: doctor guidance, BP, asthma, migraine, and pain override app scores.

## World Gym Taichung Default

World Gym Taichung is the default workout environment unless travel mode is active.

- Floor 1: machines + cardio; use for low-fatigue accessory, rehab-style work, or cool-down cardio.
- Floor 2: primary strength floor; Hammer Strength, racks, Smith machine, landmine, glute trainer, full dumbbells, adjustable benches, pull-up station.
- Floor 3: preferred functional floor; Matrix functional trainer, Hoist ROC-IT machines, kettlebells 4-24 kg, ViPR, medicine/slam balls, plyo boxes, BOSU, TRX attachment, small dumbbell set up to 10 kg only.

Workout rules:

- Default floor plan: Floor 3 primer -> Floor 2 strength anchors -> Floor 3 trunk/hybrid close.
- No cross-floor supersets.
- Every gym workout must include functional conditioning, not just a token functional exercise. For Todd, this means 8-14 minutes of coached athletic work that combines loaded movement, carry/locomotion, rotation or anti-rotation, coordination/power, and conditioning.
- Use complexes, pairings, or quality rounds: KB swing + front-rack carry, med-ball rotational slam + lateral shuffle reset, landmine rotational press + suitcase carry, cable chop + Pallof hold + step-to-stick, step-up to knee drive + farmer carry.
- Functional conditioning is not bodybuilding accessories, not random AMRAP punishment, and not a machine-only finisher.
- Creativity is a system, not randomness: rotate pattern family, tool, plane, carry, stance, or coordination constraint while keeping one familiar anchor and one measurable progression target.
- Do not repeat the exact same functional-conditioning complex in back-to-back strength sessions unless Todd asks to retest it or the coach is intentionally progressing load, distance, density, or execution quality.
- Every gym workout must include trunk, carry, chop/Pallof, or anti-rotation work.
- Left side leads unilateral work.
- Use exact Motra exercise names from `MOTRA_SETTINGS.md` when known.
- Travel mode disables World Gym floor routing and requires hotel-gym inventory before a strength plan.
- Pull-ups: prefer Floor 3 Matrix trainer if available; Floor 2 pull-up station is acceptable fallback.
- Dumbbell chest-supported row / supported chest row / dumbbell + bench work: Floor 2 only unless deliberately light with Floor 3 dumbbells up to 10 kg.
- If Todd corrects a location, his newest correction overrides the stored map. Ask or give a same-floor substitute when uncertain.

Avoid:

- Deep loaded hip flexion.
- TRX Row to T because the Floor 3 anchor slides; use Rope Cable Face Pull to W.
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
  - Tuesday/Thursday/Saturday: walking/cycling zone-2 base; intervals only on green readiness.
  - Sunday: formal training off.

Every workout includes:

- Safety/readiness gate.
- Floor-aware plan.
- Strength anchors.
- Athletic/functional element.
- Trunk/carry or anti-rotation work.
- Hip-safe alternatives.
- Motra-ready names and order.
- Conditional hybrid close when readiness supports it.

## Nutrition Model

- Protein floor: 150g daily.
- Training days may bias 160-180g.
- Fat drift is Todd's main nutrition miss; default budget is 70g/day unless recalculated.
- If fat is over early, remaining food becomes lean protein plus clean carbs.
- Corrections are specific and single-pass: correct once, give the fix, move on.

## Readiness And Safety Gates

- Red/downshift: migraine, asthma flare, pain >=4/10, BP >=160 systolic or >=100 diastolic, HRV materially below baseline, Bevel recovery <35%.
- Yellow/modified: BP >=140 systolic or >=90 diastolic, HRV below baseline, subjective high fatigue, or Oura/Bevel conflict.
- Green: no hard safety flags and physiology supports normal training.
- If Oura is green but HRV/Bevel or subjective symptoms are poor, downshift anyway.

## iPhone Workflow

Primary iPhone experience:

- Private Custom GPT with Actions connected to `coach-openapi.json`.
- Shortcuts for fast logging and commands.
- iCloud screenshot watcher for app screenshots.
- Interactive Coach Command dashboard for the day.

Shortcut actions to support:

- Morning Check-In: BP, pain, asthma, sleep feel.
- Build Today's Workout: calls `/api/coach/workout`.
- Nutrition Closeout: Bevel totals to `/api/coach/nutrition-closeout`.
- Post-Workout Debrief: duration, best/worst movement, pain, RPE.
- Fast Coach Note: simple message intake.
- Screenshot Save: saves screenshots to the iCloud Coach Screenshots inbox.

Note: the iCloud shortcut link shared on 2026-05-03 returned "Unable to find the shortcut" when inspected, so the implementation uses the known useful Shortcut action patterns above.

## Coach Voice

- Direct, warm, specific.
- Lead with the call.
- No generic motivation.
- No shame.
- No paragraphs when bullets will do.
- Todd makes the final decision; hard-block only for obvious safety issues.
- Use his actual history and World Gym/Motra context.
