# Codex Relay Handoff Template

Paste this into Todd's GPT Pro planning chat after implementation and verification.

````text
CODEX_RELAY_HANDOFF
task_name: <short task name>
status: verified | drafted/staged | blocked

repo:
- repository: toddblackhurst/health-dashboard
- branch: <branch>
- base: <base branch and commit>
- head_commit: <commit sha>
- pr: <url or not opened>

scope_completed:
- <what Codex implemented>
- <what was intentionally not implemented>

files_changed:
- <path>: <short reason>

verification:
- starting_clean_state: <yes/no plus commit>
- protected_file_check: HEALTH_DATABASE.json <unchanged/changed with explanation>
- tests: <command and result>
- live_readback: <if applicable; otherwise not applicable for docs-only/local-only PR>

boundaries:
- secrets_env: <unchanged/not touched>
- supabase_migrations: <not created/not applied or exact status>
- deployment: <not deployed or exact status>
- gpt_action_schema: <not changed/not refreshed or exact status>
- merge_status: <not merged or exact status>

risks_or_unknowns:
- <known issue, unverified item, or none>

recommended_next_codex_instruction:
```text
<exact next safe instruction for Codex>
```

stop_boundary:
- <what requires Todd approval before Codex continues>
````
