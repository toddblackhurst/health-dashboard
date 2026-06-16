# First Production Write Candidate: BP Intake

Last updated: 2026-06-17 Asia/Taipei.

Purpose: nominate the safest first production write candidate without authorizing a live write. This packet is planning-only and sits behind the write-readiness gates in `docs/implementation/WRITE_READINESS_BOUNDARY_PLAN.md`.

Current repo refinement status: a local fail-closed helper exists at `lib/bp-write-readiness.mjs` for planning/test scaffolding only. It is not wired into the live production route and cannot submit a write.

## Recommendation

Recommended first production write candidate: blood pressure intake through `POST /api/coach/intake` with type `bp`.

Why this is the best first candidate:

- The payload is narrow and structured.
- The source authority is clear.
- Duplicate prevention is simpler than workout, nutrition, or broader memory writes.
- The coaching impact can stay conservative and easy to inspect.
- Rollback/correction is easier than more complex multi-row or narrative-heavy writes.

## Exact Source Authority

- Primary authority: Todd-reported blood pressure reading from an approved source such as a physical cuff/device reading Todd chooses to submit.
- Supporting-only context: Apple Health may support readback or date context later, but must not invent or silently submit the reading.
- No provider automation: Codex must not scrape or operate a cuff app, Apple Health UI, or another provider surface.

## Proposed Data Shape

- route: `POST /api/coach/intake`
- intake type: `bp`
- minimum fields:
  - `measured_at`
  - `systolic`
  - `diastolic`
  - `source`
- recommended safe metadata:
  - `timezone`
  - `notes_redacted_or_empty`
  - `correlation_id`
  - `idempotency_key`

## Idempotency Key

Suggested idempotency key:

`bp:<profile_or_actor>:<measured_at_iso>:<systolic>:<diastolic>:<source>`

Requirements:

- Generated before the request is sent.
- Stable across safe retries for the same reading.
- Logged in non-secret audit evidence.

## Duplicate-Prevention Rule

- Natural duplicate check: same profile, same `measured_at`, same systolic, same diastolic, same source.
- If the same idempotency key is retried, the route should no-op or return the already-recorded row instead of creating a second row.
- If Todd intentionally corrects a timestamp or value, that should be a distinct approved correction path, not an accidental duplicate.

## Audit Requirements

Record non-secret evidence for:

- request timestamp,
- actor or surface,
- route and intake type,
- measured timestamp,
- BP category or summary,
- correlation id,
- idempotency key,
- returned non-secret row id or accepted status,
- explicit approval reference for the live test.

## Rollback Or Repair Path

- Preferred rollback is compensating correction or duplicate-marking rather than silent deletion when history matters.
- If a test write is wrong, mark or correct the row through an explicitly approved repair path.
- Verify the repaired row no longer influences active coaching in an unintended way.
- If no safe correction or repair path exists, do not run the live write.

## Read-Only Prerequisites Before Any Live Test

- Protected read-only device verification is complete.
- The physical iPhone or chosen submit surface is verified as the exact path Todd will use.
- The route contract and expected response are verified without submitting a live mutation.
- Any schema/cache readiness confirmation is obtained without Codex handling secrets or performing Supabase admin actions.
- The source hierarchy wording remains conservative.
- GPT Pro explicitly approves the exact first live BP test case immediately before execution.

## Exact Preflight Gates

All of these must be true before a live BP write can even be considered:

- protected read-only verification complete
- schema/cache readiness confirmed without Codex handling secrets
- exact Todd-approved payload named
- idempotency key generated before submit
- duplicate-prevention rule confirmed
- audit record defined
- rollback or repair path defined
- post-write readback plan defined
- medical/safety interpretation boundary confirmed

## Safe Fake Test Payload Shape

Use fake/local-only payloads for planning and tests only. Example shape:

```json
{
  "type": "bp",
  "measured_at": "2026-01-15T07:30:00+08:00",
  "systolic": 121,
  "diastolic": 79,
  "source": "manual_cuff",
  "timezone": "Asia/Taipei",
  "notes": "test-only fake payload",
  "correlation_id": "codex-bp-dry-run-001",
  "idempotency_key": "bp:test-profile:2026-01-15T07:30:00+08:00:121:79:manual_cuff"
}
```

This example is not approval to submit a live write.

## Production Verification Plan

1. Todd is present and explicitly approves one exact low-risk BP reading to submit.
2. Confirm read-only prerequisites and expected duplicate behavior.
3. Submit exactly one live write through the approved surface.
4. Perform readback to verify exactly one intended row exists.
5. Confirm no duplicate row or unrelated mutation occurred.
6. Capture non-secret audit evidence.
7. If the write was a test or incorrect, run the approved repair or rollback path.

## Human And Provider Boundaries

- Todd must handle any physical-device, permission, login, or account step.
- Codex/GPT must not handle secrets, OAuth, 2FA, auth headers, or provider dashboards.
- No Apple Health, Garmin, Oura, Rack, or other provider automation is allowed in the first live-write step.

## Current Live-Route Caution

- The existing protected intake route already accepts `type: bp`, but this refinement phase does not change or exercise that live route.
- The local helper and tests exist to make future approval safer, not to open a write path.
- Default posture remains `write_status: write_held` and no live write is allowed.

## Why Other Candidates Are Lower Priority

- Workout debrief: richer narrative payload, more safety nuance, and more potential downstream coaching influence.
- Manual source evidence packet persistence: broader payload surface and more ambiguity around what should become durable production state first.
- Body composition: lower urgency and easier to defer until a simpler intake path is proven.
- Nutrition closeout: more ambiguity about source authority, daily upsert semantics, and meal/day duplication rules.

## Explicit Approval Gate

No live BP write may occur until all of the following are true:

- write-readiness gates are satisfied,
- idempotency, duplicate prevention, audit, rollback, payload, and verification are fully specified,
- the exact test case is named,
- GPT Pro explicitly approves that specific write,
- Todd is present for the execution and readback.
