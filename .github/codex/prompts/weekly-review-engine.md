# Implementation Prompt: Weekly Review Engine

Use only when Todd explicitly scopes Weekly Review Engine implementation.

```text
Implement the Weekly Review Engine as a bounded stage.

Read first:
- AGENTS.md
- COACH_CURRENT_STATE.md
- docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md
- docs/implementation/COACH_10_FULL_IMPLEMENTATION_PLAN.md
- COACH_OPERATING_SYSTEM.md
- ARCHITECTURE_V2.md
- NEXT_PHASE_OPTIONS.md
- coach-openapi.json
- relevant code and tests

Scope:
- Build a review-only weekly summary unless Todd explicitly approves applying recommendations.
- Summarize Rack/Motra strength evidence, Garmin readiness/recovery/workout physiology, Garmin Nutrition, Apple Health supporting activity context, Oura fallback only when Garmin is stale/missing/unreliable, pain/safety, memory/debrief constraints, missing data, and next-week recommendations.
- Do not implement unrelated Rack/Garmin handoff or iOS work in the same PR.

Required safeguards:
- HEALTH_DATABASE.json unchanged.
- No deploy, merge, migration apply, env change, secret handling, or GPT Action auth change without Todd approval.
- Apple Health cannot count as completed set-level strength work.
- Medical/safety overrides beat all device and memory data.
- Coach Memory and workout debriefs cannot override current safety, Garmin, Garmin Nutrition, or Rack/Motra authority.

Validation:
- Add focused tests for the weekly review behavior.
- Run node --test tests/*.test.mjs.
- Run git diff --check.
- Confirm git diff -- HEALTH_DATABASE.json is empty.
- Return CODEX_RELAY_HANDOFF.
```
