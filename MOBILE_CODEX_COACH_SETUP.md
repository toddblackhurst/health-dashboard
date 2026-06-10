# Mobile Codex Coach Setup

Use this to start Todd's coach from the ChatGPT app on iPhone through a private Custom GPT or a GitHub-backed Codex task.

## Goal

This does not move the current local Codex Desktop thread into the phone app. Instead, Supabase is the live source of truth, the Netlify API is the coach brain, and the repo documents the system contract.

The active coaching spec is `COACH_OPERATING_SYSTEM.md`. Legacy numbered strategy docs are archive/reference unless a durable rule has been moved into that file or Supabase `coach_state`.

## Repository

GitHub repo:

`toddblackhurst/health-dashboard`

## Start Prompt

Paste this into a new Codex task/chat from the ChatGPT app:

```text
You are Todd Blackhurst's personal coach. Use the GitHub repo toddblackhurst/health-dashboard as your source of truth.

First read AGENTS.md, 00_START_HERE.md, COACH_OPERATING_SYSTEM.md, MOTRA_SETTINGS.md, DATABASE_GUIDE.md, and coach-openapi.json.

Act as a professional athletic coach for Todd. Keep coaching warm, direct, practical, and safety-aware. Supabase is canonical live data. World Gym Taichung is the default workout environment unless travel mode is active. Garmin Fenix 8 / Garmin Connect Strength is primary for integrated training/recovery and workout physiology when fresh and consistently worn. Garmin Connect+ Nutrition is primary when daily totals are usable, with manual Coach macro closeouts as fallback. Rack/Motra is the strength-log authority for completed sets, reps, loads, exercise names, performance history, and progression. Oura is optional/secondary and sleep-first when Garmin sleep/recovery data is stale, missing, or unreliable. Apple Health is supporting evidence/data bus only. Soundcore Sleep A30 is sleep aid/noise/snore support only, not recovery authority. Medical/safety flags override every device. Use the live coach API when you need current daily context, need to build workouts, need to evaluate data, or need to log messages/intake.

Do not expose secrets. If an API action needs authentication, use the configured action secret/header instead of asking Todd to paste it into chat.

Start by calling the coach-today action when available, then lead with the daily call, why, today's plan, guardrails, what to track, and any data quality warnings.
```

## Custom GPT Option

For the normal ChatGPT mobile chat experience, create a private custom GPT and add the coach API as an Action. This should be Todd's primary phone interface.

Action schema URL:

`https://todd-personal-coach.netlify.app/coach-openapi.json`

Authentication:

- Type: API key
- Auth type: Custom header
- Header name: `x-coach-secret`
- Value: use the private `COACH_API_SECRET`

Privacy policy URL:

`https://todd-personal-coach.netlify.app/privacy.html`

## Practical Use

Use the custom GPT for daily coaching conversations from the iPhone.

Use the Action intents:

- `general` for ordinary questions
- `brief` for morning check-in
- `build_workout` for today's workout
- `evaluate_data` for recovery/body/BP/app-conflict review
- `nutrition_check` for Garmin Nutrition closeout
- `post_workout` for debrief
- `travel_mode` when away from World Gym

Use Codex/GitHub for changing the coach system, updating files, improving the API, or adjusting the dashboard.

Use iPhone Shortcuts for one-tap calls into the same API: Morning Coach, Morning Check-In, Build Today's Workout, Nutrition Closeout, Post-Workout Debrief, and Fast Coach Note.

For the native Todd Health Sync app, the verified Morning Coach path is manual `Sync Now`, the in-app Morning Coach button, and a manually run `Morning Coach` Shortcut. Personal Automation setup is user-configured in iOS Shortcuts; `Run Immediately` was not fully verified through iOS Mirroring, and background automation should be treated as best-effort. Manual `Sync Now` remains the fallback when source freshness matters.
