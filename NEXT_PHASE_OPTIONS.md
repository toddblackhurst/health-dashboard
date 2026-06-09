# Next Phase Options

This plan started after the verified Apple Health Phase 3 production milestone from 2026-06-08.

## Recommendation

Daily coach UX polish is live and production-verified. The current prerequisite before Weekly Review Engine is this Garmin source-hierarchy update: Garmin Fenix 8 primary for integrated training/recovery and workout physiology, Rack/Motra primary for strength logs, Apple Health supporting-only, Oura secondary/fallback, Soundcore sleep aid only, and medical/safety flags above every device.

Why: the codebase already exposes `coach-today`, `sync-status`, compact dashboard context, and Apple Health supporting evidence. Weekly Review Engine should not aggregate a week of training, recovery, and activity until the source hierarchy is explicit and test-covered.

Recommended order:

1. Review and merge Garmin source hierarchy update.
2. Weekly review engine.
3. Coach observations learning loop.
4. Rack/Motra workout handoff improvement.
5. Automated Apple Health sync improvements.

## Option 1: Daily Coach UX Polish

Goal: make the daily coach output easier to read and act on.

Status: live and production-verified.

Possible scope:

- Make `coach-today` easier to scan.
- Improve the morning check-in flow.
- Make workout output more Rack/Motra-friendly while preserving Garmin workout physiology and Rack/Motra strength-log authority.
- Keep Apple Health clearly labeled as supporting cross-check evidence.
- Preserve deterministic safety/readiness gates.

Pros:

- Lowest-risk next phase because the main endpoints and Apple Health supporting-evidence objects already exist.
- Directly improves Todd's daily use.
- Can be tested with existing coach engine and dashboard-context tests.
- Does not require new schema, deployment process changes, or iPhone sync changes.

Cons:

- Does not solve the bigger weekly adaptation problem by itself.
- Could drift into behavior changes if output polish is not kept separate from readiness/workout authority.
- Needs careful acceptance tests so "easier to read" does not hide source hierarchy details.

Suggested acceptance criteria:

- `coach-today` leads with the call, why it matters, and the next action.
- Morning check-in fields are clear and short.
- Workout output uses names and structure that are practical for Rack/Motra strength logging and Garmin physiology/training-load context.
- Apple Health remains supporting evidence only.
- Existing tests pass, with focused additions for response structure if needed.

## Option 2: Weekly Review Engine

Goal: summarize the week and turn actual evidence into next-week training adjustments.

Possible scope:

- Summarize training, recovery, Apple Health activity, pain, and nutrition.
- Identify what changed during the week.
- Recommend what next week should do.
- Compare planned sessions with Rack/Motra strength-log evidence and Garmin workout physiology/recovery evidence.
- Keep Apple Health as activity/context cross-check, not completed strength authority.
- Keep Oura as secondary sleep/recovery fallback when Garmin overnight data is stale or missing.
- Keep Soundcore Sleep A30 out of recovery authority.

Pros:

- High coaching value because it improves adaptation instead of only daily display.
- The repo already has weekly plan tables and a weekly planning script, so there is a natural place to connect future review logic.
- Helps prevent repeated mistakes by making weekly changes explicit.
- Gives Todd a durable review artifact instead of scattered daily notes.

Cons:

- Higher risk than daily UX polish because it aggregates multiple source lanes.
- Existing weekly planning scripts still reference legacy local paths and `HEALTH_DATABASE.json`, so this phase should be designed carefully before implementation.
- Needs strong tests for missing data, partial data, mirrored workouts, pain flags, and nutrition gaps.

Suggested acceptance criteria:

- Weekly review has clear sections for Rack/Motra strength-log evidence, Garmin recovery/physiology, Apple Health activity context, pain/safety, nutrition, and next-week changes.
- Review distinguishes source data, missing data, and coaching interpretation.
- Apple Health cannot count as completed set-level strength work.
- Medical/safety flags override all device data.
- Next-week recommendations cite the evidence that drove the change.
- No behavior changes occur without tests.

## Option 3: Coach Observations Learning Loop

Goal: turn repeated feedback into explicit, reviewable coach observations.

Possible scope:

- Create or refine observation-writing rules.
- Turn repeated feedback into explicit observations.
- Review, retire, or update observations on a schedule.
- Keep each observation source-labeled with evidence, confidence, action taken, review date, and status.

Pros:

- Matches the architecture rule that the coach should learn through explicit observations rather than hidden drift.
- Helps make recurring constraints, preferences, and safety patterns durable.
- Can reduce repeated corrections in daily workout generation.

Cons:

- Risk of overfitting if observations are created from one-off feedback.
- Needs review/retire mechanics so stale observations do not accumulate.
- May need careful UI or report design so Todd can approve or correct observations.

Suggested acceptance criteria:

- Observations have evidence, confidence, action, review date, and active/retired status.
- One-off events are not promoted without enough evidence.
- Stale observations are surfaced for review.
- Coach output can explain which observations influenced a decision.

## Option 4: Rack/Motra Workout Handoff Improvement

Goal: make coach-generated workouts easier to enter into Rack/Motra or adjacent workout tools without unsafe direct automation.

Possible scope:

- Produce cleaner Rack/Motra-friendly exercise names, blocks, sets, loads, reps, rests, and notes.
- Add copy-friendly workout export formats.
- Preserve Rack/Motra as strength-log authority and Garmin as workout physiology/training-load authority.
- Avoid direct automation unless the target surface and safety are verified.

Pros:

- Reduces daily friction at the gym.
- Helps keep workout execution and history cleaner.
- Supports Todd's actual workflow without pretending Apple Health is a strength log.

Cons:

- Direct app automation is risky and should not be attempted until the surfaces are well understood.
- Rack import is completed-history only, so planned workout handoff must respect Rack's actual constraints.
- Exercise naming can become brittle if the app library changes.

Suggested acceptance criteria:

- Workout output is entry-ready with exact names, order, sets, reps, loads, rests, and notes.
- Planned workouts are not pushed through completed-history import paths.
- Direct automation is skipped unless explicitly approved and verified safe.
- No duplicate workout records are created.

## Option 5: Automated Apple Health Sync Improvements

Goal: improve reliability around the Apple Health sync lane without changing its supporting-evidence role.

Possible scope:

- Background sync or reminder.
- Sync health diagnostics.
- Missing-day repair.
- Clear stale, partial, and failed-sync messages.

Pros:

- Improves data freshness and reduces manual sync dependence.
- Can make production diagnostics more trustworthy.
- Missing-day repair would help keep weekly reviews complete.

Cons:

- Higher operational risk because it touches iPhone behavior, reminders/background execution, or repair flows.
- Could create confusing duplicate sync attempts without careful idempotency.
- Should not happen before daily and weekly coach surfaces know how to use the data well.

Suggested acceptance criteria:

- Sync status distinguishes current, stale, missing, partial, and failed states.
- Missing-day repair is idempotent.
- Background/reminder behavior is visible and controllable.
- Apple Health remains supporting cross-check evidence only.
