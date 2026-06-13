# Read-Only Protected Device Verification Checklist

Last updated: 2026-06-13 Asia/Taipei.

Purpose: define the first Todd-assisted protected read-only verification session after Todd has entered the Coach secret directly on the physical iPhone. This checklist is for safe readback only. It does not authorize Codex, GPT Pro, or any automation layer to handle secrets, call protected production routes, submit writes, change account settings, grant permissions, deploy, run Supabase actions, or perform physical-device setup.

Related references:

- `00_START_HERE.md`
- `MOBILE_CODEX_COACH_SETUP.md`
- `docs/implementation/DEVICE_SETUP_RUNBOOK.md`
- `docs/implementation/APP_INTENT_EXECUTION_DRY_RUN_MATRIX.md`
- `docs/implementation/IPHONE_READINESS_AUDIT.md`
- `docs/implementation/SHORTCUTS_PROMOTION_DISCOVERY_MATRIX.md`
- `docs/implementation/READINESS_GAP_INVENTORY.md`

## Current Repo Baseline

- Main is at `541b5b9c8687921c499f66c76d32b782c6499a54`.
- PR #53, App Intent Execution Dry-Run Matrix v1, is merged and deployed.
- Automatic Netlify production deploy `6a2d0e2e81eea70008c10bf6` is ready for commit `541b5b9c8687921c499f66c76d32b782c6499a54`.
- Public ping is healthy: `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Protected routes remain skipped by Codex and GPT Pro because they require `x-coach-secret` or a real secret/account prompt.
- `HEALTH_DATABASE.json` remains unchanged.
- This checklist did not call protected production routes. Post-merge verification used only the public ping route.

## Hard Boundary

Codex and GPT Pro must not handle:

- Coach secret values.
- Authorization or Bearer headers.
- `x-coach-secret` values.
- Passcodes, Face ID, device trust, or Keychain credential entry.
- Health, notification, microphone, location, account, login, 2FA, payment, or security prompts.
- Protected production route calls using real secrets.
- Write-capable actions, write endpoints, GPT Action writes, Supabase production actions, Netlify/env changes, migrations, physical-device setup, or third-party app automation.

Stop immediately if any screen or workflow asks Codex or GPT Pro to enter, view, copy, paste, store, inspect, or confirm a secret, credential, payment method, account security item, permission prompt, passcode, Face ID prompt, or protected route call.

## Preconditions Todd Completes On Physical iPhone

Todd performs these steps directly on the device:

1. Install or open the latest Todd Health Sync app build.
2. Open Coach Setup.
3. Enter the production API base URL.
4. Enter the Coach secret directly on the iPhone. Do not paste or dictate it through Codex, GPT Pro, screenshots, or chat.
5. Save setup.
6. Review `Check Setup` if available.
7. Grant Apple Health permissions where needed.
8. Run `Check Coach Readiness` and `Check Daily Data Freshness` if present to confirm local setup/freshness state before protected read-only checks.

Expected local setup evidence Todd may report:

- `setup_status` says configured or ready.
- `readiness_status` says ready, locally ready, or device-bound checks remain.
- `protected_verification_status` says deferred or blocked before the first protected read-only route.
- `write_status` says no-write, write-held, draft-only, or manual-handoff-only depending on the action.

Before running an action, cross-check its dry-run contract in `docs/implementation/APP_INTENT_EXECUTION_DRY_RUN_MATRIX.md` so Todd knows whether it is local-only, protected read-only, draft-only, manual-handoff-only, or device-bound.

## First Session Order

1. Confirm latest app build is installed and opens.
2. Confirm the API base URL is saved.
3. Todd confirms the Coach secret was entered directly on device.
4. Confirm local setup/freshness checks show no secret-like values.
5. Run one protected read-only action manually from the app or Shortcuts, not through unattended automation.
6. Read back only the safe evidence fields below.
7. If the first protected read-only check passes, run one second read-only check to compare status wording.
8. Stop before any write-capable path, draft submission, memory save, workout debrief submit, nutrition closeout write, post-workout write, BP/intake write, or automation setup.

## Candidate Protected Read-Only Actions

### Check Coach Sync Status

Purpose: verify the device can call the protected sync-status/readiness source summary path without writing.

Required local setup:

- API base URL saved.
- Coach secret entered directly by Todd on device.
- Network available.
- Apple Health permissions are useful but not required for the protected read-only route itself.

Expected safe status lines:

- `setup_status`: configured, ready, or equivalent.
- `readiness_status`: ready, stale-data warning, or conservative status.
- `protected_verification_status`: verified_read_only, protected_read_verified, or equivalent success wording.
- `write_status`: no_write or equivalent.

Safe evidence Todd can paste back:

- Action name.
- Top-line complete/partial/stale status.
- Missing or stale source labels.
- `setup_status`, `readiness_status`, `protected_verification_status`, and `write_status`.
- Public/non-secret timestamps or freshness labels.
- Stable redacted error identifier if it fails.

Failure modes and next actions:

- Missing setup: recheck API base URL and have Todd re-enter the secret directly on device.
- Unauthorized: do not paste secret or headers; Todd can re-enter the secret directly on device, then rerun `Check Setup`.
- No network: retry when online and report only stable error identifier if present.
- Sensitive/raw response shown: stop and do not paste it.

### Weekly Coach Review

Purpose: verify protected weekly review readback can summarize the week without writing.

Required local setup:

- API base URL saved.
- Coach secret entered directly by Todd on device.
- Date range defaults or manually selected range.

Expected safe status lines:

- `setup_status`: configured, ready, or equivalent.
- `readiness_status`: conservative, green/yellow/red, or source-quality status.
- `protected_verification_status`: verified_read_only, protected_read_verified, or equivalent success wording.
- `write_status`: no_write or equivalent.

Safe evidence Todd can paste back:

- Action name.
- Date range.
- Overall call.
- Count-style summary such as verified strength sessions or nutrition logged days.
- Source warnings.
- `protected_verification_status` and `write_status`.
- Statement that no write action was called, if present.

Failure modes and next actions:

- Missing/stale data: report source labels only; do not inspect third-party apps through Codex.
- Optional backend warning: treat as a separate schema/cache readiness boundary, not an immediate migration instruction.
- Unauthorized or setup failure: Todd re-enters local secret directly; Codex must not receive the secret.
- Any write prompt or save prompt: stop.

### Morning Coach / Coach Today

Purpose: verify the daily Coach readback path and source hierarchy for voice/text use. Use this only if the current app path is read-only for the session or if Apple Health sync is intentionally being run by Todd as part of the manual app flow.

Required local setup:

- API base URL saved.
- Coach secret entered directly by Todd on device.
- Apple Health permissions granted if the flow includes local Health sync.
- Manual app or Shortcut run; no unattended Personal Automation for the first protected verification.

Expected safe status lines:

- `setup_status`: configured, ready, or equivalent.
- `readiness_status`: green/yellow/red or conservative coaching call.
- `protected_verification_status`: verified_read_only or equivalent for the protected readback portion.
- `write_status`: no_write, write_held, or explicit non-write status for the session.

Safe evidence Todd can paste back:

- Action name.
- One-line daily call.
- Source freshness labels.
- Safety/downshift warnings.
- `setup_status`, `readiness_status`, `protected_verification_status`, and `write_status`.
- Redacted next action.

Failure modes and next actions:

- Health permission prompt appears: Todd handles it directly.
- App asks for credential, account, or security action outside expected setup: stop.
- Output attempts to submit a debrief, note, BP intake, or nutrition write: stop before submitting.
- Siri or Shortcuts cannot find the action: return to the discovery matrix before changing app code.

### Daily Data Freshness

Purpose: verify the local freshness display and, if available after protected setup, the protected-readiness state without writing.

Required local setup:

- App installed and local setup reviewed.
- API base URL saved for public/setup checks.
- Coach secret entered directly by Todd only if the action is expected to report protected-readiness success.
- Health permissions useful for Apple Health freshness rows.

Expected safe status lines:

- `setup_status`: configured, needs_setup, or equivalent.
- `readiness_status`: ready, deferred, stale, missing, or conservative status.
- `protected_verification_status`: deferred_until_todd_device before protected verification, then verified_read_only or equivalent only after Todd runs a protected read-only check.
- `write_status`: no_write.

Safe evidence Todd can paste back:

- Per-source freshness labels.
- Redacted source titles/details.
- One next action per row.
- Stable `error_identifier` if present.
- `protected_verification_status` and `write_status`.

Failure modes and next actions:

- Protected status remains deferred: run `Check Coach Sync Status` manually after setup, or leave as deferred.
- Apple Health missing/stale: Todd reviews permissions and runs manual Sync Now.
- Raw URL/header/response body appears: stop and do not paste it.

## Safe Evidence Todd Can Report

Todd may paste or summarize:

- Action name.
- `setup_status`.
- `readiness_status`.
- `protected_verification_status`.
- `write_status`.
- Public/non-secret timestamps.
- Fresh/stale/missing labels.
- Redacted summaries.
- Overall call such as Green, Yellow, or Red.
- Stable non-secret error identifiers.
- Confirmation that no write action was called.

## Evidence Todd Must Not Paste

Do not paste or screenshot:

- Coach secret.
- Authorization headers.
- Bearer tokens.
- `x-coach-secret` values.
- Full URLs with credential-like query parameters.
- Screenshots showing secrets, account security prompts, payment prompts, or device trust prompts.
- Raw response bodies if they contain sensitive personal details.
- Keychain, config, env, dashboard secret, or action-auth screens.
- Account/device/security prompt contents.

## Stop Conditions

Stop and return to Todd if any of these happen:

- Secret prompt confusion.
- Login, 2FA, security, payment, account, passcode, Face ID, device trust, or permission prompt appears.
- Any write-capable endpoint/action is selected.
- Any save/submit/confirm prompt appears for Coach Memory, workout debrief, nutrition, BP/intake, post-workout Coach, or third-party app data.
- Unexpected protected route error exposes sensitive details.
- The app asks for credentials outside the expected setup UI.
- Siri, Shortcuts, Action Button, or Personal Automation setup requires a device setting Todd has not explicitly handled.

## Rollback And Recovery

Todd-safe recovery steps:

1. If supported, clear the local secret by saving a blank secret in Coach Setup.
2. Re-enter the production API base URL.
3. Todd re-enters the Coach secret directly on device.
4. Rerun `Check Setup`.
5. Todd may retry an in-app public/setup check if available.
6. Review Health permissions directly on the iPhone.
7. Run `Check Daily Data Freshness` or manual `Sync Now` to check local freshness.
8. Return to `docs/implementation/DEVICE_SETUP_RUNBOOK.md` before any Siri, Action Button, Personal Automation, or write-readiness phase.

Codex/GPT Pro recovery boundary:

- Do not receive or inspect the secret.
- Do not call protected production routes.
- Do not submit writes.
- Do not change production settings.
- Do not apply migrations or schema/cache changes.
- Do not automate third-party apps or physical iPhone setup.

## Completion State

This verification session is complete only when Todd reports at least one protected read-only action with safe status evidence and `write_status` confirms no write. Until then, the state remains Todd/device-bound and unverified, even if repo tests pass or public ping is healthy.
