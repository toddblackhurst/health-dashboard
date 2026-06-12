# Review Prompt: Data Lifecycle

Use after Supabase, migrations, memory, debrief, weekly review, imports, or durable-state changes.

```text
Review the Codex handoff for data lifecycle and provenance risks.

Do not inspect, clone, browse, edit, or test the repo. Use only the Codex handoff.

Findings first. Flag any case where:
- a migration is applied or assumed applied without Todd approval and production history proof
- a migration file is treated as live database state
- HEALTH_DATABASE.json is changed or used as live authority
- source data, database presence, linkage, filters, limits, permissions, and UI surfacing are not separated
- Apple Health summaries are counted as set-level strength evidence
- user-reported debrief exercises are treated as Rack/Motra authority
- Coach Memory observations are silently promoted without review where review is required
- retired, superseded, proposed, or needs-review memory can leak into active coach context incorrectly
- test/smoke data can become real coaching evidence without clear labels
- provenance is missing for recommendations or mutations

Return CODEX_RELAY_RESPONSE only.
```
