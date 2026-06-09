# Personal Coach — Start Here

This project is now a Supabase-backed, API-brained, iPhone-first coaching system.

## Active Source Of Truth

Read only this active set first:

1. `ARCHITECTURE_V2.md` — target architecture for the best version of the coach: ingestion, canonical storage, coach brain, delivery channels, HealthKit, testing, and migration sequence.
2. `COACH_OPERATING_SYSTEM.md` — canonical coaching logic, data hierarchy, World Gym rules, nutrition rules, safety gates, and iPhone workflows.
3. `MOTRA_SETTINGS.md` — exact Motra exercise names and custom-exercise rules.
4. `DATABASE_GUIDE.md` — data model notes and legacy JSON context.
5. `coach-openapi.json` — Custom GPT / Shortcut action contract.

## Live Data

- Supabase is canonical for live coaching data.
- `HEALTH_DATABASE.json` is legacy/bootstrap/export backup.
- The API logs coach calls to `coach_decisions` and chat to `coach_messages`.

## Current State — 2026-06-08

- Production site/API is live at `https://todd-personal-coach.netlify.app`.
- Latest coach brain is deployed through Netlify and should be used through Custom GPT Actions, especially `POST /api/coach/workout`.
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
  - `Coach Build Today Workout`
  - `Coach Morning Check-In`
  - `Coach Nutrition Closeout`
  - `Coach Fast Note`
  - `Coach Motra Debrief Lean`
- Older shortcuts still present but not preferred: `Coach Motra Debrief`, `Coach Message`, `Coach Intake`, `Coach Upload`. Delete only with Todd's explicit confirmation.

## Architecture Rule

Do not rebuild this repo from scratch. Use small PRs that preserve production behavior: architecture/doc alignment, Apple Health schema, health-sync API, iOS HealthKit sync app, then coach-readiness integration.

## Archive Rule

The old numbered strategy docs are historical reference. Do not require a coach to read all of them before building a workout. If a durable rule matters, move it into `COACH_OPERATING_SYSTEM.md`, `ARCHITECTURE_V2.md`, or Supabase `coach_state`.
