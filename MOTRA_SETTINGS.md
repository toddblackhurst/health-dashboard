# Motra App Settings Reference
*Authoritative settings for building exercises in Motra. Last updated: 2026-05-03.*

---

## Confirmed Muscle Group Options

These are the ONLY muscle options available in Motra. Use these exact names when building exercises.

abs · biceps · calves · chest · forearms · glutes · hamstrings · lats · lower back · obliques · quads · shoulders · traps · triceps · adductors · abductors · hip flexors · tibialis

Do NOT use: "core", "upper back", "rhomboids", "rear delt", "mid trap", "erectors", or any other label not in this list.
Best-fit mapping for unlisted muscles:
- Rear delt → shoulders
- Rhomboids / mid trap → traps
- Erector spinae → lower back
- Hip abductors → abductors
- Serratus / low trap → traps (closest available)
- Spinal stabilizers → lower back

---

## Exercise Entry Fields

Every exercise in Motra requires:
1. **Name** — descriptive, matches what's shown on the dashboard
2. **Category** — Strength (default for all current exercises)
3. **Metric** — Reps / Time / Distance
4. **Weighted** — Yes / No
5. **Unilateral** — Yes / No (one limb at a time)
6. **Double** — Yes / No (bilateral, both limbs moving simultaneously)
7. **Muscles** — select from confirmed list above

## Current App Behavior Research (verified 2026-05-03)

Official Motra documentation confirms:
- Motra uses Apple Watch motion to auto-detect exercises, count reps, detect set starts/ends, suggest weights from history, and track supersets, warm-up/cool-down sets, splits, tempo, and RPE.
- Motra currently advertises 470+ supported auto-detected exercises.
- Custom exercises are created on iPhone: **Workout tab → + button → Create Custom Exercise**.
- Custom exercises can be accessed during Watch workouts from the **+** button by scrolling to custom exercises or searching by name.
- If a newly created custom exercise does not show up on Watch immediately, exit and re-enter the Library to refresh.
- Motra Pro supports unlimited saved templates and up to 40 custom exercises.

Coach workflow:
- Search Motra first before creating a custom exercise, because the app library changes.
- Use this file as the local source of truth for confirmed names and allowed muscle labels.
- If using a custom exercise, provide all required fields and keep the coaching note focused on what Todd should feel and do, not muscle anatomy.
- Generated workouts should be Rack-first: keep `rack_name`, `app_entry_name`, and `tracking_app: "Rack"` stable. Preserve `motra_name` only as a backward-compatible legacy/history alias.
- Keep the Rack entry line concise: exercise name, equipment, sets, reps, load, and rest. Put coaching, feel, avoid, and safety notes in separate fields.

---

## Confirmed Motra Exercise Library

### Already in Motra (confirmed)

| Exercise Name (in Motra) | Metric | Weighted | Unilateral | Double | Muscles |
|--------------------------|--------|----------|------------|--------|---------|
| Machine Hip Thrust (Glute Bridge) | Reps | Yes | No | No | glutes, hamstrings, abs |
| Machine Lat Pull Down Wide-Grip | Reps | Yes | No | No | lats, traps, biceps |
| Cable Face Pull | Reps | Yes | No | No | shoulders, traps |
| Dead Bug | Reps | No | No | No | abs, obliques, hip flexors |
| Resistance Band Pull Apart | Reps | No | No | No | shoulders, traps |
| Kettlebell Suitcase Carry | Distance | Yes | Yes | No | abs, obliques, traps, glutes |
| Cable Pull Through | Reps | Yes | No | No | glutes, hamstrings, lower back |
| Dumbbell Incline Bench Press | Reps | Yes | No | Yes | chest, shoulders, triceps |
| Dumbbell Split Squat | Reps | Yes | Yes | No | quads, glutes, hamstrings, adductors |
| Cable Single-Arm Row | Reps | Yes | Yes | No | lats, traps, biceps, shoulders |
| Dumbbell Chest-Supported Row | Reps | Yes | No | Yes | lats, traps, biceps, shoulders |
| Cross Cable Lateral Raise | Reps | Yes | Yes | No | shoulders, traps |
| Kettlebell Swing | Reps | Yes | No | No | glutes, hamstrings, lower back, abs |
| Kettlebell Goblet Squat | Reps | Yes | No | No | quads, glutes, abs |
| Barbell/Dumbbell Romanian Deadlift | Reps | Yes | No | Yes | hamstrings, glutes, lower back |
| Machine Front Pull Down | Reps | Yes | No | No | lats, biceps, traps |
| Cable Pallof Hold | Time | Yes | Yes | No | abs, obliques |
| Landmine Single-Arm Push Press | Reps | Yes | Yes | No | shoulders, triceps, quads, glutes, traps |
| Landmine Reverse Lunge | Reps | Yes | Yes | No | quads, glutes, hamstrings, adductors, obliques |
| Landmine Half-Kneeling Arc Press | Reps | Yes | Yes | No | obliques, abs, shoulders, chest |
| Landmine Rainbow | Reps | Yes | No | No | obliques, abs, lower back, shoulders, traps |
| Hammer Strength Lateral Raise | Reps | Yes | Yes | No | shoulders, traps |

### Custom exercises added (previously built)

| Exercise | Metric | Weighted | Unilateral | Double | Muscles |
|----------|--------|----------|------------|--------|---------|
| Half-Kneeling Single-Arm Cable Pull-Down | Reps | Yes | Yes | No | lats, biceps, traps, abs |
| Kettlebell Sumo Deadlift | Reps | Yes | No | No | glutes, hamstrings, quads, adductors, lower back |
| Cable Chop High to Low | Reps | Yes | Yes | No | obliques, abs, shoulders, glutes |
| Offset Farmer Carry | Distance | Yes | No | No | abs, obliques, traps, glutes, quads |
| Rope Cable Face Pull to W | Reps | Yes | No | No | shoulders, traps, lats |
| Landmine Half-Kneeling Press | Reps | Yes | Yes | No | shoulders, triceps, abs, obliques |
| Landmine Tall-Kneeling Side-to-Side Press | Reps | Yes | No | No | shoulders, triceps, abs, obliques |
| Landmine Z Press | Reps | Yes | No | No | shoulders, triceps, abs, hip flexors |
| Landmine Anti-Rotation Twist | Reps | Yes | No | No | obliques, abs, shoulders |
| Landmine Rear Delt Raise | Reps | Yes | No | No | shoulders, traps, lats |
| Landmine Turkish Sit-Up | Reps | Yes | Yes | No | abs, obliques, hip flexors, shoulders |

---

## Exercises to Build — Monday Apr 28 Session

The following exercises are NOT yet in Motra and need to be created before Monday's session can be logged:

### 1. Scapular Pull-Up
*Dead hang position, pull shoulder blades DOWN without bending elbows. Warm-up drill for lat/trap activation and upper trap decompression.*
- Category: Strength
- Metric: Reps
- Weighted: No
- Unilateral: No
- Double: No
- Muscles: **lats, traps**

### 2. Machine Mid Row (Hoist ROC-IT)
*Seated machine row on the Hoist ROC-IT Mid Row. Articulating cam, bilateral pull. Replaces One-Arm Cable Row in this session slot.*
- Category: Strength
- Metric: Reps
- Weighted: Yes
- Unilateral: No
- Double: Yes
- Muscles: **lats, traps, biceps, shoulders**

### 3. Cable Chop Low to High
*Functional trainer, cable at foot level. Half-kneeling, pull diagonally up and across the body. Opposite direction from Cable Chop High to Low. Rotate these two across sessions.*
- Category: Strength
- Metric: Reps
- Weighted: Yes
- Unilateral: Yes
- Double: No
- Muscles: **obliques, abs, shoulders, glutes**

### 4. Kettlebell Front-Rack Carry
*Hold KB in rack position (one hand at shoulder, elbow down, knuckles up), walk for distance. Left arm primary. New carry pattern — postural/thoracic demand, different from suitcase or farmer carry.*
- Category: Strength
- Metric: Distance
- Weighted: Yes
- Unilateral: Yes
- Double: No
- Muscles: **glutes, quads, abs, traps, shoulders**

---

## Exercises to Confirm Exist in Motra

Check before Monday — these are standard exercises that may already be in the app's default library:

- [ ] Pull-Up — Strength · Reps · Weighted: No · Unilateral: No · Muscles: lats, biceps, traps
- [ ] Hanging Leg Raise — Strength · Reps · Weighted: No · Unilateral: No · Muscles: abs, hip flexors, obliques
- [ ] Dead Hang — Strength · Time · Weighted: No · Unilateral: No · Muscles: lats, traps, forearms
- [ ] Glute Kickback — Strength · Reps · Weighted: No · Unilateral: Yes · Muscles: glutes, hamstrings

If any are missing from the default library, build them with the settings above.

---

## Exercises to Build or Confirm — Hybrid Finishers

Use these for the next coaching round's planned hybrid compound finishers. If an exercise already exists in Motra, use the existing entry instead of duplicating.

### 1. Medicine Ball Slam
*Floor slam with slam ball. Power close, full reset between reps.*
- Category: Strength
- Metric: Reps
- Weighted: Yes
- Unilateral: No
- Double: No
- Muscles: **abs, obliques, shoulders, glutes**

### 2. Medicine Ball Rotational Slam
*Rotational slam from overhead or diagonal path. Alternate sides with control; not a speed circuit.*
- Category: Strength
- Metric: Reps
- Weighted: Yes
- Unilateral: No
- Double: No
- Muscles: **abs, obliques, shoulders, glutes**

### 3. Landmine Rotational Press
*Light landmine rotational press. Hips start the movement, hands guide the bar. Athletic power, not max strength.*
- Category: Strength
- Metric: Reps
- Weighted: Yes
- Unilateral: Yes
- Double: No
- Muscles: **shoulders, chest, triceps, obliques, glutes**

### 4. Kettlebell Single-Arm Clean
*Single-arm KB clean from hinge to rack position. Left arm first. Use as a progression from KB swing only when technique is clean.*
- Category: Strength
- Metric: Reps
- Weighted: Yes
- Unilateral: Yes
- Double: No
- Muscles: **glutes, hamstrings, lower back, shoulders, traps, forearms**

### 5. ViPR Step-and-Tilt
*Step forward or lateral, tilt ViPR to the opposite side, return tall. Moving implement drill for anti-lateral and rotational control.*
- Category: Strength
- Metric: Reps
- Weighted: Yes
- Unilateral: No
- Double: No
- Muscles: **obliques, abs, glutes, shoulders**

### Hybrid finisher logging note
If a finisher combines reps and distance, log components separately.
- KB Swing + Front-Rack Carry = two Motra entries
- Landmine Rotational Press + Anti-Rotation Twist = two Motra entries
- Med Ball Slam alone = one Motra entry

---

## Motra Build Rules (for future exercises)

1. Always use muscle names from the confirmed list above — no exceptions.
2. Any carry = Distance metric (not Reps or Time).
3. Unilateral = Yes when one limb works at a time (single-arm, single-leg).
4. Double = Yes when both limbs move simultaneously (e.g., DB Incline Press — both hands move at once).
5. Weighted = Yes for any exercise using a machine, cable, KB, DB, or barbell — even bodyweight machines.
6. Warm-up drills (Wall Slides, Dead Hang, Band Pull-Apart) can be built in Motra or tracked externally — Todd's call.
7. Preserve spelling once a Rack/Motra exercise name is chosen. App-created exercise names do not get automatic cleanup, so stable naming matters more than clever variation.
