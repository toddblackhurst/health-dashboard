# GPT Pro Relay Response Template

GPT Pro must respond to `CODEX_RELAY_HANDOFF` with exactly this shape.

````text
CODEX_RELAY_RESPONSE
status: APPROVED_CONTINUE | FIX_REQUIRED | REVIEW_REQUIRED | MERGE_APPROVAL_REQUIRED | HUMAN_REQUIRED | NEW_CODEX_THREAD_REQUIRED | STOP
task_name: <short task name>
reason: <brief reason>
codex_instruction:
```text
<the exact next instruction Codex should follow>
```
````

Use `MERGE_APPROVAL_REQUIRED` when the PR is ready but merging would trigger production deploy or otherwise needs Todd's explicit approval.

Use `HUMAN_REQUIRED` when the next step requires login, 2FA, permission, payment, account-security, secret entry, production environment changes, GPT Action secret/auth changes, or Supabase migration apply.

Use `FIX_REQUIRED` only for a concrete defect in the Codex handoff, docs, tests, or PR scope.

Use `REVIEW_REQUIRED` when the handoff is insufficient to evaluate or a human review decision is needed.
