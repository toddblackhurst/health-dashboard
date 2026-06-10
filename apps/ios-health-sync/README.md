# Todd Health Sync

Minimal native iOS client for Apple Health daily summaries.

## Scope

This app is intentionally small for PR 2. It requests read-only HealthKit access, summarizes the selected day range on-device, and posts the `apple-health-daily` payload to the existing Netlify coach API.

It does not write HealthKit data, store permanent secrets in source code, replace Garmin/Oura/Rack hierarchy, or change the coach backend.

Phase 3 keeps that boundary. The coach backend may read previously synced Apple Health daily summaries for `sync-status`, `coach-today`, dashboard diagnostics, and brief context, but those rows are supporting evidence only. Apple Health summaries must not override Oura readiness, Garmin workout physiology, Garmin Nutrition, Rack/Motra completed history, medical flags, or subjective safety feedback.

Morning Coach automation v1 adds a one-tap iPhone flow on top of the same boundary. It syncs Apple Health for the last 7 days, checks `sync-status`, calls `coach-today`, and shows a concise daily call. Apple Health remains supporting evidence only.

## Local Use

For first real-phone verification, follow `PHYSICAL_DEVICE_TESTING.md` and keep the result staged until the live API and Supabase rows are read back.

1. Open `ToddHealthSync.xcodeproj` in Xcode.
2. Configure a development team and keep the HealthKit capability enabled.
3. Run on Todd's iPhone. Real Apple Health data is only available on device.
4. Enter the coach API base URL and coach API secret.
5. Tap `Connect Apple Health`.
6. Pick the number of days to summarize. The default is 7.
7. Tap `Sync Now`.
8. Tap `Morning Coach` to run the one-tap daily flow.

The API secret is stored in the iOS Keychain. The app posts to:

```text
/api/coach/apple-health-daily
```

Morning Coach also reads:

```text
/api/coach/sync-status
/api/coach/coach-today
```

## Shortcuts

After the app is installed on Todd's iPhone, open `Shortcuts` and confirm these Todd Health Sync actions appear:

- `Morning Coach`
- `Sync Apple Health`
- `Check Coach Sync Status`
- `Open Coach Today`

Recommended setup:

1. Create a Shortcut named `Morning Coach`.
2. Add the Todd Health Sync `Morning Coach` action.
3. Create a personal automation by time of day.
4. Choose the `Morning Coach` Shortcut.
5. Use `Run Immediately` if iOS offers it.
6. If iOS requires confirmation, use the automation notification as the fallback prompt.

Manual `Sync Now` remains available and should stay the fallback whenever Shortcut/background behavior is uncertain.

Physical iPhone verification on 2026-06-09 confirmed the core Morning Coach flow, all four Shortcuts actions, manual `Morning Coach` Shortcut creation, manual Shortcut run, and authenticated production readback. The existing Shortcuts Automation screen showed `At 10:00 AM, daily -> Morning Coach Sync`, but `Run Immediately` and new Personal Automation setup were not verified because the iOS 26 Shortcuts UI in Mirroring did not allow that setup path. Todd can confirm or adjust the automation later directly on the phone.

Background HealthKit delivery is not implemented in v1. It should remain best-effort only in a future phase and must never replace the manual button or Morning Coach Shortcut.

## Payload Notes

Daily summaries use `source_app = Apple Health` and `source_device = <device name>`. The app includes duplicate policy and provenance fields so these rows can complement, not overwrite, canonical Garmin, Oura, Rack/Motra, nutrition, recovery sleep, or strength-session data.

Phase 3 readback should use the existing `apple_health_sync_runs` and `apple_health_daily_summaries` tables. It does not require a new secret, migration, deployment instruction, HealthKit permission, or `HEALTH_DATABASE.json` change.
