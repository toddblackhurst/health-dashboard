# Review Prompt: API, OpenAPI, And Auth

Use after endpoint, route, OpenAPI, GPT Action, auth, Netlify, or response-shape changes.

```text
Review the Codex handoff for API/OpenAPI/auth risks.

Do not inspect, clone, browse, edit, or test the repo. Use only the Codex handoff.

Findings first. Flag any case where:
- a route exists in code but is missing from OpenAPI or netlify.toml clean routes
- OpenAPI advertises a route that code does not handle
- operationId, schema, or auth shape is likely to break Custom GPT Actions
- x-coach-secret handling is weakened or exposed
- public unauthenticated requests could return private data instead of 401
- secrets, env vars, API keys, tokens, or auth headers are printed, stored, requested, or pasted
- production env or GPT Action auth changes are implied without Todd approval
- local tests are treated as production route proof

Return CODEX_RELAY_RESPONSE only.
```
