> Superseded on 2026-05-03 by `31_COACH_OPERATING_SYSTEM.md` as the single planning source.

# Coach Rebuild Blueprint v1

Date: 2026-05-03  
Owner: Todd + Coach System

## Objective

Rebuild the coach from the ground up so it delivers:
- Better daily decision quality (train / adjust / recover)
- Better weekly progression with lower injury risk
- Better body composition outcomes through tighter nutrition execution
- Better use of your existing data stack (Motra + Bevel + wearable + coach database)

---

## 1) System Design: How the Rebuilt Coach Should Work

### A. Inputs Layer (Data Ingestion)
Primary inputs used each day:
- **Readiness**: sleep duration/quality, HRV trend, resting HR, subjective fatigue, pain flags
- **Training history**: recent sessions, volume, intensity, movement patterns, time cap adherence
- **Nutrition**: calories, protein, adherence trend, meal timing consistency
- **Medical/safety**: blood pressure week log, asthma status, hip OA flare status
- **Schedule constraints**: M/W/F gym mornings, off-day cycling/walking, weekend formal-rest preference

### B. Decision Engine (Daily Coaching Logic)
The coach runs explicit rules in this order:
1. **Safety gate** (red flags first: pain spikes, BP alerts, poor recovery clusters)
2. **Readiness gate** (green/amber/red session intensity selection)
3. **Goal gate** (VAT reduction + muscle retention bias)
4. **Constraint gate** (hip-safe movement library, 65-minute cap, gym logistics)
5. **Adherence gate** (chooses plans you will actually do, not “perfect” plans)

### C. Output Layer (What You Receive)
Every coach output should include:
- A single top-line call (train hard / train modified / active recovery / rest)
- A structured session plan with alternatives by equipment/floor availability
- A nutrition correction target (specific grams + next-meal fix)
- A daily risk watchlist (3 triggers only)
- A quick end-of-day debrief prompt that updates tomorrow’s decision

---

## 2) Data Architecture Optimization (Use What You Already Built)

### Database-first principles
- Keep **Motra** as workout truth for exercise detail, set/rep/load, and execution quality notes.
- Keep **Bevel** as nutrition truth for calories/protein/adherence.
- Keep wearable signals in the health database as readiness context, not as isolated score chasing.

### Required computed fields to add/maintain
- 7-day rolling: sleep, HRV, resting HR, protein adherence, calorie adherence
- 14-day rolling: training monotony, session time-cap compliance, movement pattern balance
- “Coach confidence score” (high/medium/low) based on data completeness that day
- BP compliance tracker (for physician-requested 7-day consistency block)

### Suggested derived alerts
- **Recovery risk alert**: 3-day HRV drop + elevated RHR + poor sleep
- **Muscle risk alert**: protein misses >=3 in 7 days + hard training cluster
- **Hip risk alert**: repeated deep-flexion substitutions or pain not resolving in 72h
- **Overrun risk alert**: >65 min sessions in 2 of last 3 workouts

---

## 3) Training System Rebuild

### Weekly template (base)
- **Mon (Gym)**: Strength + power emphasis (push/quad or pull/posterior alternation)
- **Wed (Gym)**: Structural + posterior + unilateral balance emphasis
- **Fri (Gym)**: Athletic mixed/corrective + carries/landmine/med-ball
- **Tue/Thu/Sat**: Walk/cycle conditioning (zone-2 anchored, optional short intensity only when readiness supports)
- **Sun**: Formal training off, active recovery optional

### Programming standards
- 65-minute hard cap enforced by block timer
- Left-side-leading unilateral work each gym day
- Hip-safe alternatives pre-wired for every deep-flexion pattern
- Movement rotation to prevent boredom while preserving pattern continuity
- 4-week mesocycle structure with built-in week-4 unload/recalibration logic

---

## 4) Nutrition System Rebuild

### Daily nutrition control loop
1. Morning target set (calories/protein/fat/carbs + meal distribution)
2. Midday checkpoint (gap-to-target logic)
3. Evening closeout protocol (protein-first correction)
4. Day-end adherence tag (on-target / under-protein / over-calorie / under-calorie)

### Coaching focus
- Protein floor is non-negotiable for muscle retention
- Undereating patterns are corrected (especially on training days)
- Sweets/chocolate managed through pre-planned budget, not restriction-only strategy
- Bevel logs interpreted with practical “next action” calls

---

## 5) Safety & Medical Integration Rebuild

- Blood pressure capture protocol surfaced daily until physician’s 7-day block is complete
- Asthma check before high-intensity work (controller adherence + rescue inhaler access)
- Hip pain check integrated into warm-up decision branch
- Coach gives clear “downshift rules” when risk factors stack
- Coach never diagnoses; always aligns with physician guidance

---

## 6) Product/UX Rebuild (How You Interact With the Coach)

### Daily cadence
- **AM**: readiness call + training decision + planned nutrition anchors
- **Pre-workout**: session confirmation + modifications if needed
- **Post-workout**: logging checklist + recovery and feeding instruction
- **PM**: day close, adherence summary, next-day setup

### Message style (kept)
- Direct, decisive, practical
- Bullet-first
- One correction per issue, with fix attached

---

## 7) Implementation Plan (Fastest Path)

### Phase 1 — Rebaseline (2–3 days)
- Confirm all profile constraints, goals, and schedule realities
- Validate data pipelines and required fields
- Finalize coach decision rules and red flags

### Phase 2 — Build Core Decision Engine (3–5 days)
- Implement readiness + safety + goal gates
- Implement session generator with hip-safe alternatives and 65-min budgeting
- Implement nutrition correction module

### Phase 3 — Integrate & Tune (5–7 days)
- Connect daily dashboard + message endpoint outputs to rebuilt logic
- Test with last 2–4 weeks of your real data
- Tune false positives/false negatives in alerts

### Phase 4 — Operate + Iterate (ongoing weekly)
- Weekly coaching QA: what calls were right/wrong and why
- Adjust thresholds to your response patterns
- Expand exercise library variation while preserving movement intent

---

## 8) Questions Needed From Todd To Complete Rebuild

### A. Goal Priority & Timeline
1. Rank current priorities 1–5 today: VAT loss, muscle gain/retention, conditioning, mobility, aesthetics.
2. What does “winning” by 90 days from now look like in measurable terms?
3. Are there any upcoming travel periods/events that require plan adjustments?

### B. Recovery, Pain, and Safety
4. Current hip status this week (0–10 pain at rest and with loaded flexion)?
5. Any new pain signals (shoulder, knee, low back, Achilles, etc.)?
6. Is the physician-requested 7-day BP tracking done yet? If yes, what were the ranges?
7. Any recent asthma flare or exercise-limiting respiratory event?

### C. Training Preferences & Logistics
8. Confirm your current World Gym floor/equipment preferences and any machines you dislike or avoid.
9. Preferred session length target now: strict 65 min, or 70 min flexible cap?
10. How much athletic work do you want weekly (med-ball, carries, landmine power) vs pure strength?

### D. Nutrition Execution
11. What are your biggest adherence failures right now: under-protein, sweets, under-eating, or late-night intake?
12. Do you want a fixed daily protein floor (e.g., 150g minimum) enforced with hard correction prompts?
13. Are Bevel entries complete daily, or are there recurring missing meals/times?

### E. Technology & Workflow
14. Which readiness source should be primary when signals conflict (Oura, Hume, Apple, subjective feel)?
15. Do you want coach messages triggered automatically at fixed times, or only when you prompt?
16. Do you want a one-screen “Coach Command Dashboard” view that shows only the day’s critical calls?

---

## 9) First-Version Success Criteria

The rebuild is successful if, over 4 weeks:
- >=90% of training sessions stay within planned time cap
- Protein target hit >=6 days/week average
- No unresolved pain flare >72 hours
- Blood pressure tracking is compliant when requested
- Clear trend improvement in readiness stability and session quality
- You report higher confidence in daily training calls and less decision friction

