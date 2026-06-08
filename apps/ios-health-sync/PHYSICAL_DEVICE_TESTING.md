# Todd Health Sync Physical Device Testing

State target: drafted/staged until the app is installed on Todd's iPhone, Apple Health permission is granted on-device, the live coach API returns `days_written`, and the matching Supabase rows are read back.

Do not use simulator success as Apple Health proof. The simulator can prove the app compiles, but only Todd's iPhone can prove HealthKit data access.

## What This Test Proves

- The iOS app can run on Todd's iPhone with HealthKit enabled.
- Todd enters the live coach API base URL and `x-coach-secret` directly in the app.
- The app reads Apple Health daily summary data on-device.
- The live coach API writes rows to `apple_health_sync_runs` and `apple_health_daily_summaries`.
- The sync is recorded as cross-check data only. It does not replace Health Auto Export and must not be used in readiness logic until phone sync is verified.

## Preflight Checks

1. Open `apps/ios-health-sync/ToddHealthSync.xcodeproj` in Xcode.
2. Select the `ToddHealthSync` project, then the `ToddHealthSync` target.
3. In `Signing & Capabilities`, confirm:
   - Automatically manage signing is enabled.
   - Team is set to Todd's current Apple developer or Personal Team.
   - Bundle Identifier is `com.toddblackhurst.ToddHealthSync`, unless Xcode requires a unique suffix for local signing.
   - HealthKit capability is present.
4. In `Info`, confirm the generated plist includes:
   - `Privacy - Health Share Usage Description`
   - Value: `Todd Health Sync reads selected Apple Health data to create daily summaries for Todd's private coach.`
5. Confirm there is no API secret in source code. The app should receive the secret only through the `Coach API secret` field and save it in the iOS Keychain.

## Run On Todd's iPhone

1. Connect Todd's iPhone to the Mac.
2. Unlock the iPhone and leave it nearby.
3. In Xcode, choose Todd's iPhone from the run destination menu.
4. If Xcode asks to trust the Mac or enable Developer Mode, follow the phone prompts.
5. If signing fails, keep the same Bundle ID if possible, set Team again, and let Xcode create a provisioning profile.
6. Click Run.
7. If the phone asks to trust the developer profile, open iPhone `Settings > General > VPN & Device Management`, trust the profile, then run again.

## Configure The App

1. In `Coach API base URL`, enter the live base URL only:

   ```text
   https://todd-personal-coach.netlify.app
   ```

   Do not include `/api/coach/apple-health-daily`; the app appends that route automatically.

2. In `Coach API secret`, paste the current `COACH_API_SECRET` value directly into the app.
3. Tap `Save Connection`.
4. Confirm the status changes to `Connection saved.`

## Grant Apple Health Access

1. Tap `Connect Apple Health`.
2. On the Apple Health permission sheet, grant read access for the requested categories.
3. Confirm the app status changes to `Apple Health access is connected.`

If the permission sheet does not appear, check iPhone `Settings > Privacy & Security > Health > Todd Health Sync` and enable the requested read categories.

## First Sync Test

1. Set `Days to sync` to `7`.
2. Tap `Sync Now`.
3. Wait for the status text to finish.
4. Expected app result:

   ```text
   Sync succeeded. Wrote 7 of 7 days.
   ```

The exact written count may be lower only if the API reports a partial write. Treat anything other than a success message as blocked until the API response and logs are checked.

## Check Netlify Logs

Check the live Netlify function logs for the coach API around the sync time.

Look for:

- Request path/action: `/api/coach/apple-health-daily` or `action=apple-health-daily`
- HTTP 200 response for a success
- No `missing auth`, `401`, validation, or Supabase write errors
- Response fields containing `sync_run_id`, `days_requested`, and `days_written`

If using the Netlify dashboard, open the Todd Personal Coach site, then `Logs > Functions`, and filter around the sync time for `coach-api`.

## Check Supabase

Use the Supabase table editor or SQL editor. Do not expose secret values in screenshots or notes.

Latest sync run:

```sql
select id, started_at, completed_at, status, days_requested, days_written, errors, device_name, client_version
from apple_health_sync_runs
order by started_at desc
limit 5;
```

Daily summaries for the first sync:

```sql
select summary_date, source_app, source_device, steps, active_energy_kcal, resting_hr_bpm, hrv_sdnn_ms, sleep_minutes, workout_count, updated_at
from apple_health_daily_summaries
order by updated_at desc, summary_date desc
limit 10;
```

Coach message audit row:

```sql
select message_at, channel, body, raw
from coach_messages
where channel = 'apple-health-daily'
order by message_at desc
limit 5;
```

Expected database evidence:

- `apple_health_sync_runs.status` is `success`.
- `apple_health_sync_runs.days_requested` is `7`.
- `apple_health_sync_runs.days_written` matches the app success text.
- `apple_health_daily_summaries` has one row per written day for `source_app = 'Apple Health'`.
- `coach_messages.channel = 'apple-health-daily'` records the same `sync_run_id` and write count.

## Evidence To Collect

After the first sync, collect:

- App screenshot showing the final success text and last sync time.
- Netlify function log screenshot or copied log line showing successful `apple-health-daily`.
- Supabase `apple_health_sync_runs` latest row with `id`, `status`, `days_requested`, and `days_written`.
- Supabase `apple_health_daily_summaries` rows for the written dates.
- Supabase `coach_messages` row for `channel = 'apple-health-daily'`, if present.
- Any Health permission screen if a category had to be manually enabled.

## Troubleshooting

Health data is not available:

- This is expected on simulator.
- Confirm the app is running on Todd's physical iPhone.
- Confirm Health permissions under iPhone `Settings > Privacy & Security > Health > Todd Health Sync`.

No Health permission prompt:

- Delete the app from the iPhone, reinstall from Xcode, and tap `Connect Apple Health` again.
- Or manually enable categories in the iPhone Health privacy settings.

Signing or provisioning failure:

- Confirm Team is set in Xcode.
- Keep automatic signing enabled.
- If `com.toddblackhurst.ToddHealthSync` is unavailable for the selected team, use a unique suffix such as `com.toddblackhurst.ToddHealthSync.local`.
- Confirm the phone trusts the developer profile in `Settings > General > VPN & Device Management`.

API rejects the sync:

- Confirm the base URL is only the site origin, not the full API path.
- Confirm the secret was pasted into the app, not committed to source.
- A 401 or `missing auth` means the `x-coach-secret` value does not match the live `COACH_API_SECRET`.
- A 400 validation error means at least one daily summary field did not match the API contract; compare against `docs/sample-apple-health-daily-payload.json`.

Netlify succeeds but Supabase rows are missing:

- Check the `sync_run_id` in the response.
- Query `apple_health_sync_runs` first, then `apple_health_daily_summaries`.
- If the sync run exists with `partial` or `failed`, inspect its `errors` column before rerunning.

## Stop Line

Stop after collecting the first physical-device sync evidence. Do not wire Apple Health into readiness scoring, coach recommendations, or PR 3 until this checklist has verified the phone-to-live-API path.
