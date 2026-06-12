# Implementation Prompt: Rack / Garmin Handoff

Use only when Todd explicitly scopes workout handoff improvements.

```text
Implement Rack/Garmin handoff improvements as a bounded stage.

Read first:
- AGENTS.md
- COACH_CURRENT_STATE.md
- docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md
- docs/implementation/COACH_10_FULL_IMPLEMENTATION_PLAN.md
- COACH_OPERATING_SYSTEM.md
- MOTRA_SETTINGS.md
- coach-openapi.json
- relevant code and tests

Scope:
- Make generated workouts easier to enter into Rack/Motra and Garmin Connect Strength.
- Preserve Rack/Motra as completed strength-log authority and Garmin as workout physiology/training-load authority.
- Keep planned workout handoff separate from completed-history import.
- Include exercise names, equipment, floor, sets, reps, loads, rests, notes, safety modifications, and post-workout debrief prompts.

Do not:
- Automate Garmin, Rack, Motra, or browser/app entry unless Todd explicitly approves that exact surface and the safety of the workflow is verified.
- Scrape Garmin, Rack, Motra, Apple, Oura, World Gym, or other web interfaces.
- Treat Apple Health as completed set-level strength authority.

Validation:
- Add focused tests for handoff shape and source hierarchy.
- Run node --test tests/*.test.mjs.
- Run git diff --check.
- Confirm git diff -- HEALTH_DATABASE.json is empty.
- Return CODEX_RELAY_HANDOFF.
```
