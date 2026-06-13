# Mobile Codex Coach Setup

Use this to start Todd's coach from the ChatGPT app on iPhone through a private Custom GPT or a GitHub-backed Codex task.

## Goal

This does not move the current local Codex Desktop thread into the phone app. Instead, Supabase is the live source of truth, the Netlify API is the coach brain, and the repo documents the system contract.

The active coaching spec is `COACH_OPERATING_SYSTEM.md`. Legacy numbered strategy docs are archive/reference unless a durable rule has been moved into that file or Supabase `coach_state`.

Current readiness tracker: `docs/implementation/READINESS_GAP_INVENTORY.md`.

Todd-assisted physical iPhone setup runbook and dry-run matrix: `docs/implementation/DEVICE_SETUP_RUNBOOK.md`.

Repo-only iPhone/Siri/Shortcuts/Health readiness audit: `docs/implementation/IPHONE_READINESS_AUDIT.md`.

## Repository

GitHub repo:

`toddblackhurst/health-dashboard`

## Start Prompt

Paste this into a new Codex task/chat from the ChatGPT app:

```text
You are Todd Blackhurst's personal coach. Use the GitHub repo toddblackhurst/health-dashboard as your source of truth.

First read AGENTS.md, 00_START_HERE.md, COACH_CURRENT_STATE.md, docs/operations/CODEX_CHATGPT_OPERATING_MODEL.md, docs/implementation/COACH_10_FULL_IMPLEMENTATION_PLAN.md, COACH_OPERATING_SYSTEM.md, MOTRA_SETTINGS.md, DATABASE_GUIDE.md, and coach-openapi.json.

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
- `build_workout` for explicit workout-building requests; schedule guides the default session, explicit strength can override non-strength days when safe, and Red safety returns recovery/safety work
- `evaluate_data` for recovery/body/BP/app-conflict review
- `nutrition_check` for Garmin Nutrition closeout
- `post_workout` for debrief
- `travel_mode` when away from World Gym

Use Codex/GitHub for changing the coach system, updating files, improving the API, or adjusting the dashboard.

For bounded implementation tasks that use GPT Pro as a planning/evaluation relay, start with `.github/codex/prompts/implementation.md`. Paste the receiver instruction from that file once into Todd's GPT Pro planning chat, then use its `CODEX_RELAY_HANDOFF` template for each handoff. GPT Pro must not inspect, clone, browse, edit, or test the repo.

Use iPhone Shortcuts for one-tap calls into the same API: Morning Coach, Check Coach Sync Status, Can I Train, Weekly Coach Review, Build Today's Workout, Nutrition Closeout, Post-Workout Coach, Draft Workout Debrief, and Open Coach Today. `Check Coach Readiness`, `Check Daily Data Freshness`, `Draft Coach Note`, and `Draft Blood Pressure Intake` are implemented App Intents but are not promoted in the top App Shortcuts list because Apple currently caps promoted App Shortcuts at 10 per app. The full discovery matrix is in `docs/implementation/SHORTCUTS_PROMOTION_DISCOVERY_MATRIX.md`.

For the native Todd Health Sync app, the verified Morning Coach path is manual `Sync Now`, the in-app Morning Coach button, and a manually run `Morning Coach` Shortcut. Personal Automation setup is user-configured in iOS Shortcuts; `Run Immediately` was not fully verified through iOS Mirroring, and background automation should be treated as best-effort. Manual `Sync Now` remains the fallback when source freshness matters.

Daily Data Freshness UX v1 adds a local no-write freshness readout for the app and App Intent layer. Use it before a physical-device run to see whether Apple Health sync is missing/stale/fresh, whether public ping status is fresh or safely deferred, whether protected source freshness still requires Todd-entered device setup, which Garmin/Rack/Motra/nutrition/sleep/body/BP sources remain manual/deferred, and whether draft-only capture remains no-write.

Workout Handoff Formatting v1 keeps `Build Today's Workout` as the voice/text path for workout planning while making the returned Shortcut text easier to use manually. When a structured workout plan is available, Coach output includes a redacted `workout_handoff` with manual Rack/Motra entry lines, Garmin manual-start guidance, safety constraints, equipment assumptions, and `manual_handoff_only_no_write`. This is not authorization to automate Garmin, Rack, Motra, World Gym, Apple Health workouts, browser sessions, or third-party apps.

Typed Shortcut Output Hardening v1 adds stable status lines for `setup_status`, `readiness_status`, `protected_verification_status`, and `write_status` across safe Shortcut/App Intent outputs. Use these lines during Todd-assisted iPhone testing to confirm whether a result is locally configured, blocked by setup, deferred until device verification, no-write, draft-only, write-held, or manual-handoff-only.

For the first protected read-only iPhone run after Todd enters the Coach secret directly on device, use `docs/implementation/READ_ONLY_PROTECTED_DEVICE_VERIFICATION_CHECKLIST.md`. It defines the safe sequence for `Check Coach Sync Status`, `Weekly Coach Review`, `Morning Coach` / Coach Today, and `Check Daily Data Freshness`, plus evidence Todd can share without exposing secrets.

No-Network Failure Matrix v1 keeps network and setup failures predictable for voice/text Coach use. Shortcut-facing failures should expose a stable `error_identifier`, typed statuses, a redacted summary, and one next action for offline, timeout, DNS/host/connect, missing setup, missing secret, invalid API base, non-2xx, invalid response, malformed JSON, and deferred protected-route cases. These checks are mock-only in Codex work; real protected verification waits for Todd-assisted device setup.

iOS Freshness Output Hardening v1 makes Daily Data Freshness rows safer for voice/text display and future entity/widget/notification reuse. Each source row should show a stable category, freshness/readiness/protected/write statuses, redacted title/detail, one next action, and any stable error identifier without exposing secrets, raw URLs, headers, response bodies, or Keychain/config values. This remains repo-only preparation; real protected verification and device setup stay Todd-assisted.

Safe App Entity and Widget String Contract Plan v1 adds reusable safe strings for future Shortcuts, Siri speech, app cards, App Entity titles/subtitles, widgets, and notifications. Use these strings for planning future surfaces instead of raw errors, response bodies, headers, URLs, Keychain/config values, or unbounded workout handoff text. This does not add a widget, notification workflow, App Entity target, signing/entitlement change, protected route call, production write, or physical iPhone setup.

Red Safety Intent Output Test Expansion v1 proves the existing iOS voice/text output paths stay conservative when Coach reports Red safety. Coach Today, Can I Train, Build Today's Workout, direct Coach responses, workout handoff formatting, and future safe-surface strings must not say or imply green/approved/clear-to-train/go-train/full-send hard training; they must preserve no-write or manual-only status, suppress workout handoffs when Red safety is present, and redact credential-like text.

As of 2026-06-13, saved GPT read-only `getSyncStatus` and `buildWeeklyReview` are verified working after Todd manually updated the secret and production was redeployed. No write action was called in that verification.

iOS App Intents Readiness v1 is repo-side preparation only. It adds typed Shortcut-safe outputs, weekly review, Can I Train, workout/nutrition/post-workout Coach action scaffolding, and draft-only debrief/note/BP capture. It does not install to Todd's iPhone, enter or rotate secrets, grant Health permissions, configure Siri or Action Button, configure Personal Automation, or submit draft-only write paths.

iPhone Coach Setup UX Readiness v1 is merged and deployed as repo-side preparation only. It adds a native Coach Setup state, `Save Connection`, `Check Setup`, Keychain clear-on-empty-secret behavior, and Shortcut-safe setup errors before protected requests run. When Todd is present on the physical iPhone, follow `docs/implementation/DEVICE_SETUP_RUNBOOK.md`: install/run the app, enter the production API base URL, enter the secret directly on device, save, check setup, grant Health permissions, run a read-only Shortcut, and read back the result. Codex must not paste or store the secret, and GPT Pro must not inspect the repo or handle credentials.

iOS Secret Redaction and Shortcut Output Safety v1 is merged and deployed as repo-side preparation only. It redacts credential-like values from Shortcut/App Intent text, app status, stored readbacks, and user-facing errors. Coach Readiness Status and Automation Gate v1 is merged and deployed as repo-side preparation only; it adds a local no-write readiness check so Todd can see what is locally ready, what is Todd/device-bound, and which write-capable actions remain held.
