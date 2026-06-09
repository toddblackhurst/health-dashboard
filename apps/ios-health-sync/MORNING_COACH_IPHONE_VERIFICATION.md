# Morning Coach iPhone Verification

State target: verified for the core Morning Coach app flow, App Intents visibility, manual Shortcut run, and authenticated production readback. Personal Automation `Run Immediately` remains unverified because the iOS 26 Shortcuts UI in Mirroring did not allow creating or modifying a new Personal Automation. Do not deploy, apply migrations, edit `HEALTH_DATABASE.json`, start Weekly Review Engine, or treat background HealthKit as reliable from this checklist.

Secrets rule: do not paste `COACH_API_SECRET` into chat, docs, screenshots, terminal output, or source. If the app needs the secret, paste it directly into the app's `Coach API secret` field and save it there.

## Verified Readback - 2026-06-09

Core Morning Coach behavior was physically verified on Todd's iPhone:

- Built, installed, and launched Todd Health Sync on the iPhone.
- Production API base URL was verified.
- Coach API secret was stored in the app/Keychain, not source.
- Apple Health connected.
- Manual `Sync Now` wrote 7 of 7 Apple Health summaries.
- In-app `Morning Coach` worked and showed daily call/date, why, warnings, next action, Apple Health supporting-only language, and sync detail.
- Created and saved a `Morning Coach` Shortcut.
- Ran the Shortcut manually; it returned `Morning Coach complete`.
- Shortcuts showed all four Todd Health Sync actions:
  - `Sync Apple Health`
  - `Morning Coach`
  - `Check Coach Sync Status`
  - `Open Coach Today`
- Authenticated production readback returned:
  - `sync-status` 200.
  - `coach-today` 200.
  - Apple Health current for 2026-06-09.

Automation caveat:

- The existing Automation screen showed `At 10:00 AM, daily -> Morning Coach Sync`.
- `Run Immediately` for that automation was not verified.
- Creating or modifying a new Personal Automation was not verified because the iOS 26 Shortcuts UI in Mirroring did not complete that setup path.
- Todd can manually confirm or adjust this later in Shortcuts directly on the phone.
- Manual in-app `Morning Coach`, manual `Sync Now`, and the manual `Morning Coach` Shortcut remain reliable fallbacks.

## Physical iPhone Steps

1. Open `apps/ios-health-sync/ToddHealthSync.xcodeproj`.
2. Select Todd's physical iPhone as the run destination.
3. Confirm signing, team, and capabilities:
   - Team is Todd's expected Apple developer team.
   - Bundle ID is `com.toddblackhurst.ToddHealthSync`.
   - HealthKit capability is enabled.
   - No extra write-health permissions are added.
4. Build and run the app on the iPhone.
5. Confirm the API base URL is `https://todd-personal-coach.netlify.app`.
6. Confirm the secret is stored or entered in the app, never in source.
7. Tap `Connect Apple Health` if needed.
8. Tap `Sync Now` to confirm baseline sync.
9. Tap the `Morning Coach` button in the app.
10. Confirm the result includes:
    - Daily call.
    - Why.
    - Today plan.
    - Warnings.
    - Next action.
    - Apple Health supporting-only language.
11. Open Apple Shortcuts.
12. Confirm Todd Health Sync actions appear:
    - `Sync Apple Health`
    - `Morning Coach`
    - `Check Coach Sync Status`
    - `Open Coach Today`
13. Create a Shortcut named `Morning Coach` using the Todd Health Sync `Morning Coach` action.
14. Run the Shortcut manually.
15. Create a Personal Automation:
    - Time of day.
    - Run `Morning Coach`.
    - Use `Run Immediately` if available.
    - Otherwise use notify or ask-before-run.
    - If the iOS Mirroring UI blocks setup or editing, confirm directly on the iPhone later.
16. Confirm Coach GPT `sync-status` shows fresh Apple Health after the run.
17. Capture evidence:
    - App Morning Coach success screenshot.
    - Shortcut actions visible screenshot.
    - Shortcut run success screenshot.
    - Existing automation schedule screenshot if visible.
    - Supabase latest `apple_health_sync_runs` row if checked.
    - `coach-today` or `sync-status` readback if checked.

## Todd Readback Questions

After running phone verification, report:

1. Did the app build and install on the iPhone?
2. Did the Morning Coach button work?
3. Did Shortcuts show the four actions?
4. Did the Morning Coach Shortcut run?
5. Did the automation setup allow `Run Immediately`?
6. Did `sync-status` become fresh/current afterward?
7. Any error messages?

## Stop Conditions

Stop and make the smallest possible local fix only if physical verification reveals a blocker. Rebuild and retest after the fix. Commit any blocker fix locally, but do not push unless Todd explicitly approves.

If Xcode or the iPhone asks for unlock, trust, Face ID, passcode, or secret entry, Todd should take over that exact phone-only step.
