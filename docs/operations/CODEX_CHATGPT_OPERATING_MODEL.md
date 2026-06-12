# Codex / ChatGPT Operating Model

Use this operating model when Todd asks Codex to implement a bounded Personal Coach repo task with ChatGPT/GPT Pro as a planning and evaluation relay.

This document is repo instructions and prompt scaffolding only. It does not approve merge, deploy, Supabase migration, production environment edits, GPT Action secret changes, or live account-security work.

## Roles

- Codex owns repository work: inspect files, make scoped edits, run tests, commit, push, open PRs, and prepare handoffs.
- ChatGPT/GPT Pro is planning and evaluation only. It must not inspect, clone, browse, edit, or test this repo.
- Todd owns human-approval boundaries: merge, deploy, migration apply, production environment changes, account security, payment, 2FA, login, and secret entry.

## Fresh-Start Procedure

1. Confirm the live target surface and proof needed before work begins.
   - Repo task proof usually means clean starting git state, protected-file diff check, tests, committed diff, pushed branch, PR URL, and handoff.
   - Live-system proof means production route, database, dashboard, GPT Action, or device state readback. Local tests are not production proof.
2. Resolve the active checkout.
   - The active implementation repo is `toddblackhurst/health-dashboard`.
   - The normal local checkout is `/Users/toddsdesktop/Codex Git Projects/health-dashboard`.
   - The broader Personal Coach folders can contain context, docs, or old local work, but they are not automatically the implementation checkout.
3. Check clean state before edits.
   - `git status -sb`
   - current branch
   - current commit
   - whether the requested baseline commit is an ancestor of `HEAD`
   - `git diff -- HEALTH_DATABASE.json`
4. Stop with `HUMAN_REQUIRED` if the starting worktree is dirty unless Todd explicitly scopes how to handle the existing changes.
5. Read the current source set before implementation:
   - `AGENTS.md`
   - `COACH_CURRENT_STATE.md`
   - `docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md`
   - `docs/implementation/COACH_10_FULL_IMPLEMENTATION_PLAN.md`
   - `.github/codex/prompts/`
   - `COACH_OPERATING_SYSTEM.md`
   - `ARCHITECTURE_V2.md`
   - `NEXT_PHASE_OPTIONS.md`
   - `MOBILE_CODEX_COACH_SETUP.md`
   - `coach-openapi.json`
   - relevant code and tests for the scoped task
6. Create a focused branch from the approved base.
7. Implement only the scoped stage.
8. Keep `HEALTH_DATABASE.json` untouched unless Todd explicitly names that file as the target.

## ChatGPT / GPT Pro Relay Procedure

1. Open Todd's correct GPT Pro planning chat only when safe.
2. If the correct chat is not identifiable, ask Todd to select it.
3. If login, 2FA, permission, payment, account-security, or secret-entry screens appear, stop and ask Todd to take over manually.
4. Paste the receiver instruction from `.github/codex/prompts/implementation.md` once before the first handoff in that chat.
5. After implementation and verification, paste a handoff that begins with `CODEX_RELAY_HANDOFF`.
6. Wait for a response that begins with `CODEX_RELAY_RESPONSE`.
7. Follow the next Codex instruction only if it is safe, scoped, and does not cross a human-approval boundary.
8. If GPT Pro asks to inspect, clone, browse, edit, or test the repo, treat the response as `HUMAN_REQUIRED` or `REVIEW_REQUIRED`; do not use GPT Pro as a repo agent.

## Human-Approval Stops

Stop and report the exact state before any of these:

- Merge a PR.
- Deploy or trigger a manual production deploy.
- Apply a Supabase migration.
- Modify production environment variables.
- Modify secrets, tokens, API keys, or GPT Action authentication settings.
- Ask Todd to paste `COACH_API_SECRET`.
- Use login, 2FA, payment, passcode, account-security, or permission screens.
- Scrape Garmin, Rack, Motra, Oura, Apple, World Gym, or other web interfaces.
- Change `HEALTH_DATABASE.json`.
- Begin a new feature phase not included in the current scope.

## Required Handoff Shape

Every relay handoff must include:

- task name
- branch and commit
- PR URL if opened
- exact files changed
- scope completed
- tests run and result
- protected-file check for `HEALTH_DATABASE.json`
- secrets/env/deploy/migration status
- known risks or unverified items
- recommended next Codex instruction
- explicit stop boundary

Use the relay handoff template in `.github/codex/prompts/implementation.md`.

## Completion States

End every run in one of these states:

- `verified`: target state was directly checked.
- `drafted/staged`: work exists but the target state is not live or not approved.
- `blocked`: the next step needs Todd or an external state change.

Examples:

- PR opened and tests pass is `drafted/staged`, not merged and not deployed.
- Deployment ready is `drafted/staged` until production readback proves the live target.
- Migration file created is `drafted/staged` until Todd approves and production history/table state confirms apply.
- GPT Action schema prepared is `drafted/staged` until refreshed and verified in the GPT editor/action call.
