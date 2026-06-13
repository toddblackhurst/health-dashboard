# Supabase Readiness Diagnostic Plan

Last updated: 2026-06-13 Asia/Taipei.

Purpose: define a future diagnostic path for the `coach_observations` production schema/cache readiness warning without performing any production Supabase inspection or action in this PR. This is a docs-only planning artifact. It does not verify production schema, inspect Supabase, run SQL, apply migrations, refresh schema cache, call protected routes, handle secrets, change Netlify/GPT Action settings, write production data, or configure Todd's iPhone.

## Current Verified Baseline

- Main baseline for this plan: `26adc6a1d6f498b1ee1bb2a23f94d6d989b11d7a`.
- PR #58 is merged and deployed after PR #57 Write-Readiness Boundary Plan v1.
- Automatic Netlify production deploy `6a2d1ace65a6680008484201` is ready for main commit `26adc6a1d6f498b1ee1bb2a23f94d6d989b11d7a`.
- Public production ping is healthy: `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Protected routes are skipped by Codex and GPT Pro because they require `x-coach-secret` or a real secret/account prompt.
- `HEALTH_DATABASE.json` remains protected and must remain unchanged.

## Current Known Issue

Production weekly review completed successfully, but Netlify previously logged a non-blocking optional Supabase warning for `coach_observations`, described as a production schema/cache readiness gap. This planning task does not determine whether production has the table, whether PostgREST schema cache is stale, or whether a migration/admin action is needed.

Repo-side facts only:

- `supabase/migrations/005_apple_health_sync.sql` defines `coach_observations` with `id`, `profile_id`, `observation_date`, `category`, `observation`, `evidence`, `confidence`, `action_taken`, `review_date`, `status`, `source`, `raw`, `created_at`, `updated_at`, an index on profile/status/date, and RLS enabled.
- `dashboardFromSupabase(...)` reads active `coach_observations` through `safeSupabase(...)` and falls back to `[]` if the optional read fails.
- Weekly review tests cover read-only behavior and tolerate a missing optional `coach_observations` table.
- Coach Memory write actions use `coach_observations` directly and remain held by `docs/implementation/WRITE_READINESS_BOUNDARY_PLAN.md`.

## Key Source Questions

Future diagnostics must answer these without guessing from local files alone:

1. Does production Supabase actually have `public.coach_observations`?
2. If the table exists, is the PostgREST/schema cache stale?
3. If the table does not exist, was migration `005_apple_health_sync.sql` or an equivalent migration ever applied to production?
4. Are expected columns, constraints, indexes, RLS state, policies, and grants aligned with repo migration/docs?
5. Does any production function depend on `coach_observations` as required rather than optional?
6. Does weekly review still succeed without observations, and what functionality is degraded?
7. Are Coach Memory write paths blocked only by schema/cache readiness, or are there additional auth/RLS/column/lifecycle issues?
8. What non-secret evidence is sufficient to prove readiness without exposing private health/memory content?

## Future Evidence To Collect

Collect this only in a later approved diagnostic phase:

- Migration history showing whether `005_apple_health_sync.sql` or an equivalent table-creation migration is applied.
- Admin-visible table existence for `public.coach_observations`.
- Approved schema inventory: column names/types, relevant constraints, index presence, RLS enabled state, policies, and grants.
- PostgREST/schema-cache status or reload result if the table exists but API reads fail.
- Safe read-only application smoke result, only if protected access and credential handling are explicitly approved.
- Weekly review behavior with observations unavailable and, if approved, with observations available.
- Non-secret log snippets or error codes that identify cache/table/permission cause without exposing secrets or private protected payloads.

Do not collect raw protected response bodies, Coach secrets, service-role keys, Authorization headers, private memory text, private health rows, or screenshots of secret/admin/security screens.

## Planning-Only Prohibitions

In this planning pass, Codex and GPT Pro must not:

- inspect the production Supabase dashboard, tables, schema cache, SQL editor, logs, migration history, RLS policies, grants, or project settings;
- run production SQL;
- apply migrations;
- refresh PostgREST/schema cache;
- change RLS, policies, grants, roles, auth settings, secrets, environment variables, Netlify settings, or GPT Action settings;
- call protected production routes;
- call production write endpoints or GPT Action write endpoints;
- use real secrets or ask Todd to paste them;
- create, edit, submit, or test real memory, workout, nutrition, BP/intake, note, activity, or health records.

## Future Diagnostic Gates

### Gate A: Repo-Only Evidence Review

- Confirm local main is clean.
- Confirm `HEALTH_DATABASE.json` has no diff.
- Review local migration, code, tests, and docs only.
- Identify expected schema and fallback behavior.
- Produce a no-production-action checklist for the next gate.

### Gate B: Todd/Human Approval For Supabase Admin Inspection

- Todd explicitly approves the exact Supabase project and scope.
- Approval text distinguishes read-only dashboard/schema inspection from SQL, migrations, schema-cache refresh, protected route smoke tests, and writes.
- Stop if the correct project/account cannot be confirmed without secrets or account prompts.

### Gate C: Read-Only Production Schema Inspection

- If approved, inspect only the agreed read-only admin surfaces.
- Collect non-secret evidence of table existence, migration history, columns, indexes, RLS state, policies, and grants.
- Do not run SQL unless a separate SQL approval was granted.

### Gate D: Schema-Cache Refresh Decision

- Enter this gate only if the table exists and evidence points to stale PostgREST/schema cache.
- Refresh requires its own explicit approval.
- Record non-secret before/after evidence and confirm no data rows changed.

### Gate E: Migration Decision

- Enter this gate only if the table is missing or structurally incompatible.
- Migration application requires its own explicit approval, backup/rollback plan, and migration-history check.
- Do not infer migration need from local files alone.

### Gate F: Safe Read-Only Application Smoke

- Enter this gate only after admin readiness is understood and Todd approves protected access.
- Use a protected read-only route only; do not call write actions.
- Public ping remains the only unauthenticated route Codex may call without secret boundaries.

### Gate G: No-Op Confirmation And Audit Note

- Confirm whether the diagnostic changed nothing or whether an approved admin action occurred.
- Confirm no production data writes occurred unless separately approved.
- Record non-secret findings, timestamp, project identifier label, approval scope, and next decision.

## Stop Conditions

Stop and return a blocked or human-required state if:

- any secret, token, API key, service-role key, auth header, `x-coach-secret`, password, 2FA, login, payment, account-security, device-trust, passcode, Face ID, or permission prompt appears;
- the next step requires production SQL;
- the next step requires a migration;
- the next step requires schema-cache refresh;
- the next step requires RLS, grant, role, policy, auth, env, or project setting changes;
- a protected route call would require real credentials;
- a write, destructive action, or data repair is needed;
- the target Supabase project/account is ambiguous;
- evidence is contradictory enough that proceeding could risk data integrity.

## Future Approval Wording

Use separate approvals for separate boundaries. Do not bundle them.

Read-only Supabase dashboard/schema inspection:

```text
I approve Codex to perform read-only Supabase admin inspection for the Coach production project only, limited to migration history, table existence, columns, indexes, RLS state, policies, grants, and non-secret error/status evidence for public.coach_observations. Do not run SQL, apply migrations, refresh schema cache, change settings, view secrets, or write data.
```

Schema-cache refresh:

```text
I approve a Supabase/PostgREST schema-cache refresh for the Coach production project after read-only evidence shows public.coach_observations exists and the cache appears stale. Do not apply migrations, run SQL, change RLS/policies/grants, or write data.
```

Migration application:

```text
I approve applying the specifically reviewed migration for public.coach_observations to the Coach production project after confirming the table is missing and migration history shows it has not been applied. Do not run unrelated SQL or modify unrelated tables.
```

SQL execution:

```text
I approve the exact read-only SQL statements shown in this task for the Coach production project. Do not run any other SQL and do not write data.
```

Protected route smoke test:

```text
I approve a single protected read-only Coach route smoke test using the configured secure credential surface. Do not expose or paste the secret, do not call write endpoints, and stop on any auth/account/security prompt.
```

Write-capable validation:

```text
I approve only the separately reviewed write-readiness phase for the exact route and one low-risk payload named in that task. Follow docs/implementation/WRITE_READINESS_BOUNDARY_PLAN.md before any live write.
```

## Rollback And Audit Planning

For future approved diagnostics, log only:

- date/time and timezone;
- approved boundary and approver;
- project label, not secret values;
- table/schema/cache status summary;
- migration ids or table names, if non-secret;
- non-secret error code or status text;
- whether any admin action was performed;
- confirmation that no data writes occurred.

Never log:

- service-role keys, Coach secrets, `x-coach-secret`, auth headers, tokens, passwords, API keys, JWT-like strings, or credential-like URLs;
- raw protected route bodies;
- private health, nutrition, memory, doctor, BP, or workout data;
- screenshots of Supabase secret screens, GPT Action auth screens, Netlify env screens, login/security/payment/device prompts, or Keychain/config screens.

Rollback/no-op rules:

- A read-only inspection has no data rollback, but still needs an audit note.
- A schema-cache refresh should be treated as an admin action with before/after non-secret evidence.
- A migration decision must include a migration-history check and a rollback or no-op decision before any migration is applied.
- If approval is not explicit for the next boundary, stop before crossing it.

## Current Readiness Conclusion

The current repo state is ready for a future human-approved diagnostic decision, not for production admin action. Local tests prove weekly review can tolerate optional `coach_observations` unavailability. They do not prove production schema/cache readiness. Coach Memory writes and any live observation mutations remain held by the write-readiness gates.
