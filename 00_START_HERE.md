# Personal Coach — Start Here

This project is now a Supabase-backed, API-brained, iPhone-first coaching system.

## Active Source Of Truth

Read only this active set first:

1. `COACH_CURRENT_STATE.md` — current branch, PR, deploy, migration, Custom GPT Action, and verification state.
2. `ARCHITECTURE_V2.md` — target architecture for the best version of the coach: ingestion, canonical storage, coach brain, delivery channels, HealthKit, testing, and migration sequence.
3. `COACH_OPERATING_SYSTEM.md` — canonical coaching logic, data hierarchy, World Gym rules, nutrition rules, safety gates, and iPhone workflows.
4. `docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md` — Codex/GPT Pro relay rules, human-approval stops, and handoff requirements for bounded implementation tasks.
5. `docs/implementation/COACH_10_FULL_IMPLEMENTATION_PLAN.md` — durable staged roadmap for Weekly Review Engine, Rack/Garmin handoff, review lanes, and future integrations.
6. `docs/implementation/READINESS_GAP_INVENTORY.md` — current readiness gaps, safe Codex work, and Todd/device/account boundaries.
7. `docs/implementation/DEVICE_SETUP_RUNBOOK.md` — Todd-assisted iPhone/Siri/Shortcuts setup runbook and dry-run validation matrix.
8. `docs/implementation/APP_INTENT_EXECUTION_DRY_RUN_MATRIX.md` — dry-run execution contract, setup gates, status expectations, and mock-test coverage for every current App Intent.
9. `docs/implementation/APP_INTENT_EXECUTION_EVIDENCE_PACKET.md` — Todd-safe non-secret evidence templates for physical iPhone/Siri/Shortcuts execution results.
10. `docs/implementation/WRITE_READINESS_BOUNDARY_PLAN.md` — required approval, audit, duplicate-prevention, rollback, and verification gates before any future live Coach write.
11. `docs/implementation/SUPABASE_READINESS_DIAGNOSTIC_PLAN.md` — docs-only plan for a future human-approved `coach_observations` schema/cache readiness diagnostic.
12. `docs/implementation/SHORTCUTS_PROMOTION_DISCOVERY_MATRIX.md` — promoted versus implemented/unpromoted App Intents, Shortcuts discovery expectations, and Todd-device verification steps.
13. `docs/implementation/READ_ONLY_PROTECTED_DEVICE_VERIFICATION_CHECKLIST.md` — first Todd-assisted protected read-only iPhone verification checklist after direct device secret entry.
14. `docs/implementation/IPHONE_READINESS_AUDIT.md` — repo-only audit of remaining iPhone/Siri/Shortcuts/Health readiness work and Todd/device/account boundaries.
15. `docs/implementation/DATA_INTEGRATION_READINESS_PLAN.md` — source-by-source readiness map for stale Garmin, BP, nutrition, body, Rack/Motra, Oura, and Apple Health data.
16. `docs/implementation/MANUAL_SOURCE_EVIDENCE_PACKET.md` — Todd-safe verbal/chat evidence packet for stale or manual source data.
17. `.github/codex/prompts/` — canonical Codex implementation and review prompt library.
18. `MOTRA_SETTINGS.md` — exact Motra exercise names and custom-exercise rules.
19. `DATABASE_GUIDE.md` — data model notes and legacy JSON context.
20. `coach-openapi.json` — Custom GPT / Shortcut action contract.

## Live Data

- Supabase is canonical for live coaching data.
- `HEALTH_DATABASE.json` is legacy/bootstrap/export backup.
- The API logs coach calls to `coach_decisions` and chat to `coach_messages`.

## Current State — 2026-06-15

- Production site/API is live at `https://todd-personal-coach.netlify.app`.
- Latest coach brain is deployed through Netlify and should be used through Custom GPT Actions. Read-only `getSyncStatus` and `buildWeeklyReview` were verified through the saved GPT after Todd manually updated the secret; no write action was called.
- PR #66, `Add manual source evidence packet`, is merged to main at `35febba701f9e5e11ad09fc42164b0013ddc3670`. GitHub Pages/check-run status succeeded, public ping remained healthy, protected routes remained skipped by Codex, and `HEALTH_DATABASE.json` remained unchanged. No Netlify production commit status attached during the observed polling window; no manual deploy was triggered.
- PR #65, `Add data integration readiness map`, is merged to main at `6617094108e90e395088e582246cfc80d2099a2f`.
- PR #63, `Harden iOS device command runner fallback`, is merged and automatically deployed at main commit `c140815117acc7ebfcd0b3812eb5dd6c1aaed115`; automatic Netlify production deploy `6a2f34ee63d2f6000703ab27` is ready, manual deploy `false`, and public ping is healthy.
- PR #63 keeps the device-command runner safe by allowing only local `daily-freshness` by default. Apple Health sync, protected sync status, Coach Today, weekly review, training checks, workout builds, and `all` are blocked or unavailable by default through unattended launch commands.
- Todd-approved physical iPhone evidence from 2026-06-15 shows Apple Health supporting evidence refreshed at 6:55 AM with `Wrote 7 of 7 Apple Health daily summaries`, and protected read-only sync status worked through the iOS app at 6:56 AM with `protected_verification_status: verified_read_only` and `write_status: no_write`.
- Overall Coach source freshness still remained 0% for 2026-06-15 because Garmin sleep/recovery, BP, Garmin Nutrition, body composition, Rack/Motra strength session, and Rack/Motra exercise detail were stale, missing, pending, or manual/provider-bound.
- PR #68, `Classify sync status source states`, is merged at main commit `6d85eeeb8825f2466feea2551bc2a8963306b70b`. It adds source-state classification for sync status and iOS freshness output while preserving the source hierarchy: Garmin sleep/recovery primary, Oura fallback-only, BP write-held when stale/missing, Garmin Nutrition manual/provider-bound when stale/missing, Rack/Motra authority lanes, Apple Health supporting-only, and protected read-only status as verified-read-only/no-write.
- The next safe repo-only task is `Manual Source Freshness Draft UI v1`, scoped from a fresh clean worktree by GPT Pro. It should add no-write iOS/app-side draft capture surfaces for Garmin recovery, BP, nutrition, body composition, and Rack/Motra evidence without provider scraping, secrets, protected route calls from Codex, production writes, Supabase/admin actions, or `HEALTH_DATABASE.json` edits. Do not casually use the older dirty primary main worktree or commit its unrelated dirty files.
- The public dashboard posture has been retired; the Netlify site is now primarily a private coach backend and internal tool surface.
- V2 architecture is defined in `ARCHITECTURE_V2.md` and should guide future Codex work.
- Apple Health / HealthKit daily sync is live as supporting evidence for activity context, freshness, and diagnostics.
- Garmin Fenix 8 / Garmin Connect Strength is the active integrated training/recovery and workout physiology surface.
- Rack/Motra is the strength-log authority for completed sets, reps, loads, exercise names, performance history, and progression.
- Oura is optional/secondary and sleep-first when Garmin sleep/recovery data is stale, missing, or unreliable.
- Soundcore Sleep A30 is sleep aid/noise/snore support only, not recovery authority.
- Garmin Nutrition, Apple Health, Hume, and future direct integrations should preserve the source hierarchy in `COACH_OPERATING_SYSTEM.md`: Apple Health is supporting evidence/data bus only, and medical/safety flags override every device.
- Workout planning preserves World Gym Taichung routing:
  - Pull-ups: prefer Floor 3 Matrix trainer if available; Floor 2 pull-up station is fallback.
  - Dumbbell + bench work, including chest-supported rows, belongs on Floor 2 unless intentionally light with Floor 3 dumbbells up to 10 kg.
- Training design uses a strength-enjoyment contract:
  - Real strength training stays the anchor.
  - Functional/athletic work keeps sessions interesting, challenging, and skillful without replacing the lifting.
  - Use about a 20-30% novelty budget so sessions vary without becoming random.
- Functional conditioning uses a variation engine:
  - Rotate pattern family, tool, plane, stance, carry, coordination constraint, and progression target.
  - Do not repeat the exact same complex back-to-back unless intentionally retesting or progressing it.
  - Avoid generic internet-style filler; every athletic block needs a clear challenge and measurable target.
- iPhone screenshot/file upload destination is `iCloud Drive > Coach Screenshots`, which maps on the Mac to `/Users/toddsdesktop/Library/Mobile Documents/com~apple~CloudDocs/Coach Screenshots`.
- Recommended current shortcuts:
  - `Morning Coach`
  - `Sync Apple Health`
  - `Check Coach Sync Status`
  - `Can I Train?`
  - `Weekly Coach Review`
  - `Build Today's Workout`
  - `Nutrition Closeout`
  - `Post-Workout Coach`
  - `Draft Workout Debrief`
  - `Open Coach Today`
- Implemented but not promoted because Apple caps promoted App Shortcuts at 10 per app:
  - `Check Coach Readiness`
  - `Check Daily Data Freshness`
  - `Draft Coach Note`
  - `Draft Blood Pressure Intake`
- Current readiness gaps and next safe Codex tasks are tracked in `docs/implementation/READINESS_GAP_INVENTORY.md`; the data integration readiness map is in `docs/implementation/DATA_INTEGRATION_READINESS_PLAN.md`; Todd-safe manual source prompts are in `docs/implementation/MANUAL_SOURCE_EVIDENCE_PACKET.md`; the App Intent dry-run contract is in `docs/implementation/APP_INTENT_EXECUTION_DRY_RUN_MATRIX.md`, Todd-safe physical-device evidence templates are in `docs/implementation/APP_INTENT_EXECUTION_EVIDENCE_PACKET.md`, future write-readiness boundaries are in `docs/implementation/WRITE_READINESS_BOUNDARY_PLAN.md`, the Supabase readiness diagnostic plan is in `docs/implementation/SUPABASE_READINESS_DIAGNOSTIC_PLAN.md`, the iPhone/Siri/Shortcuts/Health readiness audit is in `docs/implementation/IPHONE_READINESS_AUDIT.md`, and the first protected read-only device verification checklist is in `docs/implementation/READ_ONLY_PROTECTED_DEVICE_VERIFICATION_CHECKLIST.md`.
- Supabase Readiness Diagnostic Plan v1 is complete as a docs-only planning artifact. The next readiness step is not an autonomous repo-only implementation by default; choose either Todd-assisted physical iPhone protected read-only verification, or a separately approved Supabase production/admin diagnostic boundary.
- Todd-assisted physical iPhone setup should follow `docs/implementation/DEVICE_SETUP_RUNBOOK.md`.
- Older shortcuts still present but not preferred: `Coach Motra Debrief`, `Coach Message`, `Coach Intake`, `Coach Upload`. Delete only with Todd's explicit confirmation.

## Architecture Rule

Do not rebuild this repo from scratch. Use small PRs that preserve production behavior: architecture/doc alignment, Apple Health schema, health-sync API, iOS HealthKit sync app, then coach-readiness integration.

## Autonomous Codex Rule

When Todd asks for an autonomous Codex task with GPT Pro planning/evaluation, use `docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md`, `docs/implementation/COACH_10_FULL_IMPLEMENTATION_PLAN.md`, and the `.github/codex/prompts/` templates. Codex handles repo implementation. GPT Pro evaluates only the structured handoff. Merge, deploy, Supabase migration apply, production environment changes, GPT Action secret/auth changes, login, 2FA, payment, permission, account-security, and secret entry remain Todd approval boundaries.

## Archive Rule

The old numbered strategy docs are historical reference. Do not require a coach to read all of them before building a workout. If a durable rule matters, move it into `COACH_OPERATING_SYSTEM.md`, `ARCHITECTURE_V2.md`, or Supabase `coach_state`.
