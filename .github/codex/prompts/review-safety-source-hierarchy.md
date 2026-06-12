# Review Prompt: Safety And Source Hierarchy

Use after coach behavior, weekly review, workout generation, memory, debrief, or data-source changes.

```text
Review the Codex handoff for safety and source-hierarchy regressions.

Do not inspect, clone, browse, edit, or test the repo. Use only the Codex handoff.

Findings first. Flag any case where:
- medical/safety overrides do not beat devices and memory
- Garmin Fenix 8 / Garmin Connect is not primary for readiness, recovery, workout physiology, HR, zones, Body Battery, training load, or recovery-time context when fresh and reliably worn
- Rack/Motra is not authority for completed strength sets, reps, loads, exercise names, performance history, and progression
- Garmin Connect+ Nutrition is displaced when usable
- Oura is used before Garmin is stale, missing, or unreliable
- Apple Health overrides readiness, workout authority, Garmin physiology, nutrition, safety, or Rack/Motra history
- Coach Memory or workout debriefs override current safety, Garmin, Garmin Nutrition, or Rack/Motra authority
- Red safety can become hard training

Return CODEX_RELAY_RESPONSE only.
```
