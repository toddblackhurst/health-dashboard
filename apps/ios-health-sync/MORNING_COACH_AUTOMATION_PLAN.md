# Morning Coach Automation Plan

State target: drafted/staged for local implementation. Morning Coach automation v1 improves the existing iOS Health Sync app and Shortcuts surface. It does not authorize deploys, migrations, new secrets, backend rewrites, or Weekly Review Engine work.

## Goal

Create a one-tap Morning Coach flow on iPhone:

1. Sync Apple Health daily summaries for the last 7 days.
2. Check live coach source freshness through `GET /api/coach/sync-status`.
3. Call `GET /api/coach/coach-today`.
4. Show a concise daily result in the app and Shortcut response.
5. Store the last successful Apple Health sync timestamp and coach readback timestamp locally.

Apple Health remains supporting evidence only.

## Hard Boundaries

- No deploys.
- No Supabase migrations.
- No new secrets in source.
- Do not touch `HEALTH_DATABASE.json`.
- Do not start Weekly Review Engine.
- Do not let Apple Health override readiness, safety, Garmin workout physiology, Garmin Nutrition, Rack/Motra strength history, Oura fallback, or subjective safety feedback.
- Garmin Fenix 8 is primary for integrated training/recovery when fresh and reliable.
- Rack/Motra is the authority for completed strength sets, reps, loads, exercise names, and progression.
- Oura is fallback/secondary sleep-recovery evidence when Garmin is stale, missing, or unreliable.
- Medical/safety flags override every device.

## A. One-Tap Morning Coach

The shared app workflow should be used by both the SwiftUI button and App Intents.

Flow:

1. Require the saved API base URL and Keychain secret.
2. Request HealthKit authorization if needed.
3. Build Apple Health daily summaries for `days = 7`.
4. Upload with `raw.sync_trigger = "morning_coach"` and `raw.summary_grain = "daily"`.
5. Store `last_successful_apple_health_sync_at` only after the API returns success.
6. Call `getSyncStatus`.
7. Call `getCoachToday`.
8. Store `last_successful_coach_today_readback_at` only after successful HTTP 200 readback.
9. Show a concise result.

Concise result shape:

- Daily call: readiness color/tier plus one direct decision sentence.
- Why: up to 3 bullets from readiness, safety, Apple Health supporting context, and schedule.
- Today: one plan line.
- Warnings: source freshness/safety warnings.
- Next action: one clear action.

Local state is stored in `UserDefaults`; the API secret stays in Keychain.

## B. Shortcuts / App Intents

Implemented v1 actions:

- `SyncAppleHealthIntent`: runs Apple Health sync and returns written/requested days.
- `MorningCoachIntent`: runs Apple Health sync, checks sync-status, calls coach-today, and returns the concise result.
- `CheckCoachSyncStatusIntent`: calls sync-status and returns source warnings.
- `OpenCoachTodayIntent`: refreshes coach-today and opens the app.

Shortcut phrases:

- `Morning Coach`
- `Sync Apple Health`
- `Check Coach Sync Status`
- `Open Coach Today`

## C. iOS Personal Automation

Recommended Personal Automation:

1. Open iPhone `Shortcuts`.
2. Confirm the Todd Health Sync actions appear.
3. Create a Shortcut named `Morning Coach`.
4. Add the Todd Health Sync `Morning Coach` action.
5. Create a personal automation by time of day.
6. Choose the `Morning Coach` Shortcut.
7. Use `Run Immediately` if iOS offers it.
8. If iOS requires confirmation, use a notification/reminder fallback to open the Shortcut.

The automation should not assume background execution is guaranteed.

## D. Background HealthKit

Background HealthKit is deferred in v1.

Reason: the current app has a foreground HealthKit query model and no `HKObserverQuery`, anchored-query bookkeeping, `BGTaskScheduler`, background delivery entitlement, or `UIBackgroundModes`. Adding partial background behavior now would risk implying reliability that iOS does not guarantee.

Rules for a future pass:

- Background delivery may attempt an Apple Health sync, but it never replaces manual `Sync Now` or the Morning Coach Shortcut.
- Background attempts must be visible in the app status area.
- Store attempt/result timestamps separately from successful manual sync/readback timestamps.
- Do not call failed background syncs user failure.
- The app must keep an obvious `Sync Now` button.

## E. Sync-Status Warnings

Morning Coach summarizes warnings from `sync-status` without changing backend source hierarchy.

Warn when:

- Apple Health is missing, stale, partial, or failed.
- Garmin recovery/training data is missing, stale, or unreliable.
- Garmin Nutrition is missing or incomplete for the current day.
- BP is missing/stale, yellow, or red.
- Rack/Motra latest strength session is missing/stale relative to the planned/completed training flow.
- Safety flags exist: BP red/yellow, migraine, asthma flare, pain >=4/10, sharp/radiating/worsening pain, high fatigue, or doctor guidance.

Warning copy must say Apple Health is supporting evidence only when relevant.

## Acceptance Criteria

- One tap runs Apple Health 7-day sync, then `getSyncStatus`, then `getCoachToday`.
- The result is concise and usable without opening a dashboard.
- Last successful Apple Health sync and coach readback timestamps persist across app launches.
- Shortcuts expose the four v1 actions.
- Personal Automation setup is documented without promising guaranteed background execution.
- Background HealthKit is labeled deferred/best-effort and does not replace manual sync.
- Sync-status warnings cover Apple Health, Garmin recovery/training, Garmin Nutrition, BP, Rack/Motra, and safety flags.
- Apple Health remains supporting-only in UI text, intent output, and stored state.
