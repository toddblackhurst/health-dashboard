# Personal Coach — Start Here

This project is now a Supabase-backed, API-brained, iPhone-first coaching system.

## Active Source Of Truth

Read only this active set first:

1. `COACH_OPERATING_SYSTEM.md` — canonical coaching logic, data hierarchy, World Gym rules, nutrition rules, safety gates, and iPhone workflows.
2. `MOTRA_SETTINGS.md` — exact Motra exercise names and custom-exercise rules.
3. `DATABASE_GUIDE.md` — data model notes and legacy JSON context.
4. `coach-openapi.json` — Custom GPT / Shortcut action contract.

## Live Data

- Supabase is canonical for live coaching data.
- `HEALTH_DATABASE.json` is legacy/bootstrap/export backup.
- The API logs coach calls to `coach_decisions` and chat to `coach_messages`.

## Archive Rule

The old numbered strategy docs are historical reference. Do not require a coach to read all of them before building a workout. If a durable rule matters, move it into `COACH_OPERATING_SYSTEM.md` or Supabase `coach_state`.
