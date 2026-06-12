# Coach 10 Full Implementation Plan

This is the durable roadmap for future bounded Codex tasks. It is planning scaffolding only; it does not approve merge, deploy, Supabase migration apply, production environment edits, GPT Action auth changes, or secret handling.

## Operating Principle

Build the coach in small verified stages. Each stage should have one target surface, a clear proof chain, tests, and a handoff. Do not let a planning document imply production state.

Permanent boundaries:

- `HEALTH_DATABASE.json` remains untouched unless Todd explicitly names it.
- Supabase is canonical live data.
- Garmin Fenix 8 / Garmin Connect is primary for integrated training/recovery and workout physiology when fresh and reliably worn.
- Rack/Motra is strength-log authority for completed sets, reps, loads, exercise names, and progression.
- Garmin Connect+ Nutrition is nutrition authority when usable.
- Oura is fallback sleep/recovery only when Garmin data is stale, missing, or unreliable.
- Apple Health is supporting evidence/data bus only.
- Coach Memory and workout debriefs personalize and constrain; they do not override current safety, Garmin readiness/recovery, Garmin workout physiology, Garmin Nutrition totals, or Rack/Motra completed logs.

## Stage 0: Operating Spine

Goal: make future Codex tasks restartable without relying on exhausted chat context.

Deliverables:

- Canonical operating model at `docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md`.
- Canonical prompt library at `.github/codex/prompts/`.
- Orientation links in `AGENTS.md`, `00_START_HERE.md`, `MOBILE_CODEX_COACH_SETUP.md`, and `COACH_CURRENT_STATE.md`.

Acceptance:

- Docs/prompts only.
- No API, OpenAPI, Netlify function, migration, env, secret, deployment, or GPT Action auth change.
- `node --test tests/*.test.mjs` passes.
- `git diff -- HEALTH_DATABASE.json` is empty.

## Stage 1: Weekly Review Engine

Goal: produce a weekly review that summarizes actual evidence and proposes next-week adaptations without silently applying changes.

Source lanes:

- Rack/Motra completed strength evidence.
- Garmin recovery/readiness and workout physiology.
- Garmin Connect+ Nutrition totals when usable.
- Apple Health activity context as supporting evidence only.
- Oura fallback sleep/recovery only when Garmin is stale, missing, or unreliable.
- Coach Memory and workout debriefs as advisory constraints.
- Medical/safety overrides above every device and memory source.

Acceptance:

- Output is review-only unless Todd explicitly approves application.
- Distinguishes source data, missing data, interpretation, and next-week recommendations.
- Does not count Apple Health as completed set-level strength work.
- Does not let memory or debriefs override current safety or Garmin/Rack/Motra authority.
- Includes tests for missing data, stale Garmin, Apple Health supporting-only, Rack/Motra authority, red safety, nutrition gaps, and non-application by default.

Prompt:

- `.github/codex/prompts/weekly-review-engine.md`

## Stage 2: Rack/Garmin Handoff

Goal: make generated workouts easier to execute in Garmin Connect Strength and log in Rack/Motra without unsafe direct automation.

Acceptance:

- Workout output remains Rack-first for strength logs and Garmin-ready for physiology/training-load context.
- Planned workout handoff does not use completed-history import paths.
- Exercise names, sets, reps, loads, rests, floor/equipment, and notes are copy-friendly.
- Direct app/browser automation is skipped unless explicitly approved and the target surface is verified safe.

Prompt:

- `.github/codex/prompts/rack-garmin-handoff.md`

## Stage 3: Review Lanes

Run focused review prompts after substantial implementation:

- Safety/source hierarchy: `.github/codex/prompts/review-safety-source-hierarchy.md`
- API/OpenAPI/auth: `.github/codex/prompts/review-api-openapi-auth.md`
- Data lifecycle: `.github/codex/prompts/review-data-lifecycle.md`
- iOS/privacy: `.github/codex/prompts/review-ios-privacy.md`

Each review must state findings first, separate verified facts from assumptions, and avoid asking GPT Pro to inspect the repo.

## Stage 4: Future Integrations

Candidate tracks after the above are stable:

- Apple Health workout-level intake.
- Garmin official integration if approved and available.
- Rack/Motra import/debrief support based on verified app constraints.
- iOS 27 Siri/Shortcuts implementation only after Todd explicitly approves implementation.

Every future stage must preserve the human-approval stops in `docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md`.
