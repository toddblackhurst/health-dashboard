# Coach Operating System (v2)

Date locked: 2026-05-03
Athlete: Todd Blackhurst (57)

## 1) Locked Goal Stack (from Todd)
1. VAT / belly reduction (primary)
2. Muscle retention/gain
3. Conditioning
4. Mobility
5. Aesthetics

### 90-day success target (through ~2026-08-01)
- Waist/belly reduction: **-1 to -2 inches**
- Maintain or improve strength markers on primary patterns
- Keep training consistency at >=90% planned sessions

## 2) Constraints and Current Status
- Hip pain currently low (1-2/10), no new pain areas.
- BP tracking in progress (day 3 as of 2026-05-03), currently stable; keep daily compliance until 7-day block complete.
- No recent asthma flare.
- Travel: one 4-day Kuala Lumpur trip with gym access.
- Session duration: **flexible cap** (not strict 65 min).

## 3) Coaching Decision Engine (Priority Order)
1. Safety (pain, asthma, BP, recovery red flags)
2. Readiness (train hard/modify/recover)
3. Goal fit (VAT reduction while preserving/gaining muscle)
4. Adherence realism (plan he will actually execute)
5. Variety with pattern continuity (avoid repetitive sessions)

## 4) Training Architecture (Research-informed for age 57 + goals)

### Weekly structure
- Mon (gym): full-body strength + power emphasis
- Wed (gym): posterior chain + pull + unilateral correction
- Fri (gym): athletic hybrid (landmine/carries/med-ball) + compound strength
- Tue/Thu/Sat: walking/cycling zone-2 base (optional short intervals when readiness is green)
- Sun: formal training off (active recovery optional)

### Athletic vs pure strength ratio
- **Recommended split: 60% strength / 40% athletic-functional**
  - Why: VAT loss and conditioning benefit from athletic density work, but muscle retention at 57 requires sufficient progressive loading.

### Session time standard
- Flexible 60-75 minute target (default plan built for ~68 min)
- Hard stop only when recovery trends decline

### Non-negotiables
- Left side leads unilateral work.
- Hip-safe alternatives always pre-wired.
- Progression is by quality and repeatability first, then load.
- Deload trigger when recovery markers stack negative for 3+ days.

## 5) Nutrition Operating Rules

### Protein floor (research-based recommendation)
- **Set daily floor at 150g minimum**.
- Practical range: 150-180g/day, biased higher on training days.
- Rationale: supports muscle retention/gain in older lifters and offsets anabolic resistance.

### Main nutrition constraint to coach
- Primary risk identified by Todd: **fat intake drift**.
- Coaching rule: set a daily fat budget first; allocate fats deliberately across meals.
- If fat is exceeded early, remaining meals become lean-protein + carb dominant.

### Daily nutrition loop
1. Morning targets locked.
2. Midday gap check.
3. Evening closeout correction (protein-first).
4. End-of-day adherence tag and tomorrow adjustment.

## 6) Readiness Source Hierarchy (authoritative order)
When signals conflict, use this order:
1. **Oura** (primary physiology trend anchor)
2. Subjective check-in (pain/fatigue/soreness)
3. Hume (secondary corroboration)
4. Apple Fitness (workload/activity context)

Rule: if Oura is green but subjective pain/fatigue is high, downshift anyway.

## 7) iPhone-First Interaction Model (maximum automation)

### Primary coach interaction
- Responsive, query-first coach via message endpoint (on-demand).
- No rigid-only broadcast schedule; optional AM digest can be added.

### High-value shortcut automations
1. **Morning Check-In Shortcut**
   - Inputs: sleep quality, pain score, asthma status, BP reading
   - Action: POST to `/api/coach/intake`
   - Output: readiness call + training decision

2. **Build Today’s Workout Shortcut**
   - Trigger phrase: “Build my workout”
   - Action: POST to `/api/coach/message`
   - Output: floor-aware session with alternatives

3. **Post-Workout Debrief Shortcut**
   - Inputs: RPE, pain changes, completed/modified exercises, duration
   - Action: POST to `/api/coach/intake`
   - Output: recovery + nutrition correction + next-session adjustments

4. **Nutrition Closeout Shortcut**
   - Inputs: Bevel totals
   - Output: protein/fat gap correction before day close

### Messaging channels
- Keep iPhone messaging lightweight and actionable.
- Prefer fast command-style prompts over long-form conversational friction.

## 8) Simplification Rules for the Repo
- Single planning source: this file (`31_COACH_OPERATING_SYSTEM.md`).
- `24_MASTER_COACH_PROMPT.md` remains voice/format contract.
- Historical logs remain append-only and are not used as planning specs.
- Any new coaching feature must update this file first.

## 9) Immediate Build Plan

### Phase A (Now)
- Use this file as canonical design.
- Stop splitting planning logic across multiple strategy docs.
- Confirm API response schema supports workout build + readiness call + nutrition correction in one response.

### Phase B (Next)
- Implement configurable ratios (strength/athletic) and time caps in coach API payload.
- Add BP compliance state + travel mode toggle.
- Add readiness-source confidence tagging.

### Phase C (Operate)
- Weekly QA: waist trend, protein adherence, session completion, pain/recovery flags.
- Adjust loading and athletic density based on real response.
