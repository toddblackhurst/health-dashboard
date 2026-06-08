# Todd Health Sync Live Verification Runbook

State target: staged until the branch is committed, live Supabase migration 006 is applied, Netlify production includes the new route, and Todd's physical iPhone produces a verified sync.

Do not paste secrets into chat, terminal output, screenshots, docs, or commits. Enter `COACH_API_SECRET` only in trusted account/app surfaces.

## 1. Confirm Local Commit State

Before live work, confirm the Apple Health sync work is committed on a feature branch:

```sh
git branch --show-current
git status --short
git log --oneline -5
```

Expected:

- Branch is not `main`, unless Todd explicitly approved working on `main`.
- Relevant Apple Health backend, migration, tests, iOS app, and verification docs are committed.
- `HEALTH_DATABASE.json` is not staged or committed.

## 2. Apply Supabase Migration 006

Apply `supabase/migrations/006_apple_health_daily_summaries.sql` to the live Supabase project only after Todd confirms the correct project/account.

The migration must create or confirm:

- `apple_health_sync_runs`
- `apple_health_daily_summaries`
- `coach_observations`
- service-role grants and RLS boundaries

After applying, verify the tables exist in Supabase before testing the iPhone app.

## 3. Deploy Netlify Backend

Deploy only after Todd confirms production deploy is allowed.

The deployed site must include:

- `netlify/functions/apple-health-daily.mjs`
- `coach-api` support for `action=apple-health-daily`
- `netlify.toml` route from `/api/coach/apple-health-daily` to `/api/coach?action=apple-health-daily`

Expected public route:

```text
https://todd-personal-coach.netlify.app/api/coach/apple-health-daily
```

## 4. Verify Auth Boundary

Confirm the endpoint rejects missing or bad `x-coach-secret` without crashing.

Safe expectation:

- Missing/bad secret returns an auth error.
- No secret value is printed.
- No Supabase rows are written for unauthorized requests.

Do not test a valid secret by pasting it into chat. Use a trusted local environment, Netlify environment, or the iPhone app UI.

## 5. Run The iPhone App

1. Open `apps/ios-health-sync/ToddHealthSync.xcodeproj` in Xcode.
2. Select Todd's physical iPhone as the run target.
3. Confirm signing Team, Bundle ID, and HealthKit capability.
4. Build and run on the iPhone.
5. Enter the base URL:

   ```text
   https://todd-personal-coach.netlify.app
   ```

6. Enter `COACH_API_SECRET` directly in the app's `Coach API secret` field.
7. Tap `Save Connection`.
8. Tap `Connect Apple Health`.
9. Grant the requested Apple Health read permissions.
10. Set `Days to sync` to `7`.
11. Tap `Sync Now`.

Expected app result:

```text
Sync succeeded. Wrote 7 of 7 days.
```

If the app writes fewer than 7 days, treat it as a partial result and inspect the API response/logs before rerunning.

## 6. Verify Live Evidence

Check Netlify function logs around the sync time:

- Route/action is `/api/coach/apple-health-daily` or `action=apple-health-daily`.
- HTTP response is 200 for success.
- Response includes `sync_run_id`, `days_requested`, and `days_written`.
- There are no auth, validation, or Supabase write errors.

Check Supabase:

```sql
select id, started_at, completed_at, status, days_requested, days_written, errors, device_name, client_version
from apple_health_sync_runs
order by started_at desc
limit 5;
```

```sql
select summary_date, source_app, source_device, steps, active_energy_kcal, resting_hr_bpm, hrv_sdnn_ms, sleep_minutes, workout_count, updated_at
from apple_health_daily_summaries
order by updated_at desc, summary_date desc
limit 10;
```

```sql
select message_at, channel, body, raw
from coach_messages
where channel = 'apple-health-daily'
order by message_at desc
limit 5;
```

Expected:

- Latest `apple_health_sync_runs.status` is `success`.
- `days_requested` is `7`.
- `days_written` matches the app success message.
- `apple_health_daily_summaries` has one row per written day.
- `coach_messages` has a `channel = 'apple-health-daily'` audit row if the backend write completed.

## 7. Stop Line

Stop after the first physical-device sync is verified. Do not start PR 3 and do not connect Apple Health summaries to readiness scoring until Todd confirms the phone-to-live-API path is verified.
