# App Intent Execution Evidence Packet

Last updated: 2026-06-13 Asia/Taipei.

Purpose: give Todd a safe, non-secret template for reporting physical iPhone, Siri, and Shortcuts execution results back to Codex/GPT Pro after Todd completes device setup. This packet is a preparation artifact only. It does not authorize Codex, GPT Pro, or automation to perform physical setup, enter secrets, call protected routes, change production settings, run Supabase actions, add signing/entitlements/capabilities, modify App Intent/App Shortcut code, automate third-party apps, submit writes, or handle login/security/payment/account prompts.

## Current Repo Baseline

- Main is at `fd8d5491d90af5483049957a9023769e89d5d221` after PR #54.
- PR #54, Post-PR53 Current-State Refresh, is merged/deployed.
- Automatic Netlify production deploy `6a2d111ff3a2e900080d3959` is ready for commit `fd8d5491d90af5483049957a9023769e89d5d221`.
- Public production ping is healthy: `{"ok":true,"action":"ping","version":"coach-brain-v1"}`.
- Protected routes were skipped by Codex/GPT Pro because they require `x-coach-secret` or a real secret/account prompt.
- `HEALTH_DATABASE.json` remains unchanged.

## How To Use This Packet

Use this packet after Todd has completed the physical iPhone steps in `docs/implementation/DEVICE_SETUP_RUNBOOK.md`. Todd may paste back only the safe fields below. If a result includes secrets, account prompts, security prompts, payment prompts, device-trust prompts, raw protected response bodies, or write-capable confirmation prompts, stop and do not paste the content.

Codex/GPT Pro should use the evidence to classify each result as:

- `repo_safe`: likely fixable with docs, local code, tests, parser handling, or safe output wording.
- `todd_device_bound`: requires Todd's physical iPhone, Health permissions, Shortcuts/Siri settings, Action Button, Personal Automation, app install, or direct device setup.
- `production_admin_bound`: requires a separately scoped production/admin action such as Supabase schema inspection, Netlify/env/GPT Action setting changes, deployment setting review, account access, or secret rotation.

Do not infer protected verification success unless Todd-provided evidence clearly shows a protected read-only status such as `protected_verification_status: verified_read_only` or equivalent.

## Do Not Paste

Never paste these into Codex, GPT Pro, docs, PRs, screenshots, logs, test fixtures, or issue comments:

- Coach secret.
- `x-coach-secret`.
- Authorization or Bearer headers.
- API keys, tokens, passwords, JWT-like strings, `sk-` style keys, or credential-like values.
- Full URLs with credential-like query parameters.
- Keychain, config, environment, Netlify, Supabase, GPT Action auth, or secret screens.
- Account, login, 2FA, security, payment, passcode, Face ID, device trust, permission prompt, or Apple ID contents.
- Raw protected response bodies if they may contain sensitive or personal content.
- Screenshots containing any item above.

Screenshots are allowed only when they contain no secret/account/security/payment/device-trust content and no raw protected data that Todd does not want retained.

## Safe Evidence Fields

Todd may paste or summarize these fields when visible:

- Date/time and device model/iOS version, if Todd chooses.
- App build or version, if visible.
- Action or Shortcut name.
- Trigger surface: app, Shortcuts app, Siri, Action Button, or Personal Automation.
- `setup_status`.
- `readiness_status`.
- `protected_verification_status`.
- `write_status`.
- Stable non-secret `error_identifier`, if present.
- Redacted summary lines.
- Non-secret freshness labels or timestamps.
- Green/Yellow/Red-style safety state, if present.
- Confirmation that no write action was submitted.
- Confirmation that draft-only, no-write, write-held, or manual-handoff-only state was preserved.

## Stop And Escalate

Stop the session and ask Todd to handle the boundary manually if any of these appear:

- Any prompt asking Todd to expose a secret to Codex/GPT Pro.
- Login, 2FA, security, payment, account, Apple ID, passcode, Face ID, device trust, or permission prompt uncertainty.
- Any write-capable confirmation, submit button, save-to-production prompt, or "are you sure" write prompt.
- Any protected route response that appears to expose sensitive data.
- Any unexpected credential request outside the app's expected setup UI.
- Any third-party app attempting real write, submit, update, sync, or activity/workout creation behavior.
- Any screen that would require Codex/GPT Pro to view, copy, store, or confirm a secret.

## Evidence Templates

Copy only the safe fields that are available. Leave unknown fields as `not_observed`.

### App-Side Setup Checks

```text
evidence_type: app_side_setup
date_time:
device_model_ios_version:
app_build_version:
surface: app
screen_or_action_name:
api_base_status:
setup_status:
readiness_status:
protected_verification_status:
write_status:
safe_summary:
error_identifier:
no_secret_or_account_prompt_visible: yes/no
no_write_action_submitted: yes/no
blocker_category: repo_safe | todd_device_bound | production_admin_bound | none | unknown
notes_redacted:
```

Safe success shape: app opens, setup is locally configured or clearly tells Todd what remains, no secret is shown, and write status remains no-write/write-held/draft-only/manual-only.

### Check Coach Sync Status

```text
evidence_type: check_coach_sync_status
date_time:
device_model_ios_version:
app_build_version:
surface: app | Shortcuts app | Siri
action_or_shortcut_name: Check Coach Sync Status
setup_status:
readiness_status:
protected_verification_status:
write_status:
completion_or_source_status:
missing_or_stale_source_labels:
apple_health_warning_if_present_redacted:
freshness_timestamps_non_secret:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: protected verification is read-only, source labels are summarized, and `write_status` is `no_write` or equivalent.

### Weekly Coach Review

```text
evidence_type: weekly_coach_review
date_time:
device_model_ios_version:
app_build_version:
surface: app | Shortcuts app | Siri
action_or_shortcut_name: Weekly Coach Review
week_range:
setup_status:
readiness_status:
protected_verification_status:
write_status:
overall_call:
verified_strength_session_count:
nutrition_logged_days_count:
source_warnings_redacted:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: review is read-only, weekly call is visible, source warnings are non-secret, and no write action is called.

### Morning Coach / Coach Today

```text
evidence_type: morning_coach_or_coach_today
date_time:
device_model_ios_version:
app_build_version:
surface: app | Shortcuts app | Siri
action_or_shortcut_name: Morning Coach | Open Coach Today
setup_status:
readiness_status:
protected_verification_status:
write_status:
safety_state:
daily_call_redacted:
source_freshness_labels:
next_action_redacted:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: daily call preserves source hierarchy, safety state is conservative when data is stale/missing, and the output remains no-write or explicit about any Apple Health sync Todd intentionally ran.

### Can I Train

```text
evidence_type: can_i_train
date_time:
device_model_ios_version:
app_build_version:
surface: app | Shortcuts app | Siri
action_or_shortcut_name: Can I Train?
setup_status:
readiness_status:
protected_verification_status:
write_status:
safety_state:
training_call_redacted:
next_action_redacted:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: Red or medical caution never becomes permission for hard training; `write_status` remains `no_write`.

### Build Today Workout

```text
evidence_type: build_today_workout
date_time:
device_model_ios_version:
app_build_version:
surface: app | Shortcuts app | Siri
action_or_shortcut_name: Build Today's Workout
setup_status:
readiness_status:
protected_verification_status:
write_status:
safety_state:
workout_title_or_type_redacted:
manual_handoff_status:
rack_or_garmin_manual_notes_present: yes/no
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: workout output is a manual handoff only, with no Rack/Motra/Garmin/Apple Health/third-party automation and no hard-training permission during Red safety.

### Daily Data Freshness

```text
evidence_type: daily_data_freshness
date_time:
device_model_ios_version:
app_build_version:
surface: app | Shortcuts app | Siri
action_or_shortcut_name: Daily Data Freshness
setup_status:
readiness_status:
protected_verification_status:
write_status:
source_rows_redacted:
freshness_labels_or_timestamps:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: freshness rows show stable source categories, redacted labels/details, one next action, and no raw URLs, headers, response bodies, or Keychain/config values.

### Coach Readiness Check

```text
evidence_type: coach_readiness_check
date_time:
device_model_ios_version:
app_build_version:
surface: app | Shortcuts app | Siri
action_or_shortcut_name: Check Coach Readiness
setup_status:
readiness_status:
protected_verification_status:
write_status:
local_ready_items:
device_bound_items:
write_held_items:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: local setup and device-bound gates are clearly separated, and write-capable actions remain held.

### Promoted Shortcuts Discovery

```text
evidence_type: promoted_shortcuts_discovery
date_time:
device_model_ios_version:
app_build_version:
surface: Shortcuts app
visible_promoted_shortcuts:
missing_expected_promoted_shortcuts:
unexpected_shortcuts:
search_terms_tried:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Expected promoted Shortcuts: `Morning Coach`, `Sync Apple Health`, `Check Coach Sync Status`, `Can I Train?`, `Weekly Coach Review`, `Build Today's Workout`, `Nutrition Closeout`, `Post-Workout Coach`, `Draft Workout Debrief`, and `Open Coach Today`.

### Unpromoted App Action Discovery

```text
evidence_type: unpromoted_app_action_discovery
date_time:
device_model_ios_version:
app_build_version:
surface: Shortcuts app | app actions search
action_names_checked:
visible_unpromoted_actions:
missing_unpromoted_actions:
search_terms_tried:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Expected implemented but not promoted actions: `Check Coach Readiness`, `Check Daily Data Freshness`, `Draft Coach Note`, and `Draft Blood Pressure Intake`.

### Siri Phrase Attempts

```text
evidence_type: siri_phrase_attempt
date_time:
device_model_ios_version:
app_build_version:
surface: Siri
phrase_attempted:
recognized_action_or_shortcut:
setup_status:
readiness_status:
protected_verification_status:
write_status:
spoken_or_displayed_summary_redacted:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: Siri triggers the intended action and speaks/displays only redacted status lines. Do not paste transcript content if it includes secrets, account prompts, or raw protected data.

### Action Button Candidate Behavior

```text
evidence_type: action_button_candidate
date_time:
device_model_ios_version:
app_build_version:
surface: Action Button settings | Action Button run
candidate_shortcut_name:
assignment_status:
run_result_status:
setup_status:
readiness_status:
protected_verification_status:
write_status:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: assignment is Todd-device-bound and no write-capable action is triggered unintentionally.

### Personal Automation Candidate Behavior

```text
evidence_type: personal_automation_candidate
date_time:
device_model_ios_version:
app_build_version:
surface: Shortcuts Personal Automation
automation_trigger:
candidate_shortcut_name:
run_immediately_status:
manual_confirmation_required:
run_result_status:
setup_status:
readiness_status:
protected_verification_status:
write_status:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: automation behavior is observed by Todd only after manual runs are stable, and write-capable paths stay blocked unless a separate write-readiness phase is approved.

### Draft-Only Note / Debrief / BP Paths

```text
evidence_type: draft_only_capture
date_time:
device_model_ios_version:
app_build_version:
surface: app | Shortcuts app | Siri
action_or_shortcut_name: Draft Workout Debrief | Draft Coach Note | Draft Blood Pressure Intake
setup_status:
readiness_status:
protected_verification_status:
write_status:
draft_created_locally: yes/no
submit_or_save_prompt_seen: yes/no
redaction_status:
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: draft-only output stays local/review-only, redacts credential-like values, and no production write is submitted.

### Manual Workout / Rack / Garmin Handoff Paths

```text
evidence_type: manual_workout_handoff
date_time:
device_model_ios_version:
app_build_version:
surface: app | Shortcuts app | Siri
action_or_shortcut_name:
setup_status:
readiness_status:
protected_verification_status:
write_status:
manual_handoff_status:
rack_motra_manual_entry_lines_present: yes/no
garmin_manual_start_guidance_present: yes/no
third_party_automation_attempted: yes/no
error_identifier:
no_write_action_submitted: yes/no
notes_redacted:
```

Safe success shape: Coach gives manual instructions only. It does not automate Garmin, Rack, Motra, World Gym, Apple Health workouts, browser sessions, or third-party apps.

## Failure Evidence

Use this shape for any failure. Do not paste raw protected bodies, URLs with credential-like query values, headers, secrets, or screenshots containing sensitive content.

```text
evidence_type: failure
date_time:
device_model_ios_version:
app_build_version:
surface:
action_or_shortcut_name:
failure_category:
setup_status:
readiness_status:
protected_verification_status:
write_status:
error_identifier:
redacted_failure_summary:
safe_next_action_displayed:
no_secret_or_account_prompt_visible: yes/no
no_write_action_submitted: yes/no
blocker_category: repo_safe | todd_device_bound | production_admin_bound | unknown
notes_redacted:
```

Known failure categories:

- `missing_secret`
- `invalid_api_base_url`
- `health_permission_required`
- `no_network`
- `protected_verification_deferred`
- `malformed_response`
- `backend_unavailable`
- `stale_data`
- `red_safety_training_held`
- `no_write_manual_handoff_only`
- `shortcut_not_visible`
- `siri_phrase_not_recognized`
- `action_button_not_assigned`
- `personal_automation_not_running`

## Later Codex/GPT Pro Review Rules

- Accept only non-secret evidence.
- Do not ask Todd to paste secrets or screenshots containing secrets.
- Do not ask GPT Pro to inspect, clone, browse, edit, or test the repo.
- Classify each problem as repo-safe, Todd/device-bound, or production/admin-bound before proposing work.
- Do not treat Apple Health as readiness authority over Garmin/Rack/Motra, medical/safety, or nutrition authority.
- Do not treat Apple Health workout counts as completed Rack/Motra strength history.
- Do not infer protected verification success unless Todd's evidence clearly shows a verified read-only protected status.
- Do not infer writes happened unless Todd explicitly reports a write submission; draft-only and manual-handoff-only are no-write states.
- Stop at any boundary involving secrets, login, 2FA, security, payment, account access, device trust, Health permissions, or write-capable confirmation.
