# Garmin Approval Checklist

Last updated: 2026-06-16 Asia/Taipei.

Purpose: prepare a future official Garmin integration without starting OAuth, touching secrets, calling production routes, or automating Garmin surfaces. This playbook is admin-facing only.

## What This Does And Does Not Do

- This checklist supports the disabled mock-only scaffold in [official-provider-scaffolding.mjs](/Users/toddsdesktop/Codex%20Git%20Projects/health-dashboard-disabled-garmin-oura-integration-scaffolding-v1/lib/official-provider-scaffolding.mjs).
- It does not authorize scraping Garmin Connect, logging into Garmin, handling credentials, starting device setup, or enabling a live sync.
- It does not approve writes to Supabase, protected Coach routes, or GPT Actions.

## Intended Future Read Scope

- Garmin sleep/recovery as primary readiness input when fresh and reliably worn.
- Garmin activities as workout-physiology and corroboration input only.
- Garmin Nutrition as nutrition authority when daily totals are usable.

## Approval Prerequisites

- Todd confirms Garmin official integration is worth pursuing and still fits Coach boundaries.
- Todd/admin identifies the correct Garmin developer program path and application owner.
- A later scoped Codex task exists for read-only integration work after approval.

## Information To Prepare Before Applying

- Product description: Todd Blackhurst's Personal Coach, a no-write coaching assistant with strict source hierarchy.
- Intended Garmin data classes: sleep/recovery, activity summary/workout physiology, nutrition totals if Garmin exposes them through the approved program.
- Privacy posture: read-only use, no credential sharing in chat, no scraping, no background automation before approval.
- User scale: private personal-coach use unless Todd explicitly widens the scope later.
- Data retention summary: read-only mock scaffolding exists now; any real persistence stays behind a later approved write-readiness boundary.

## Garmin Approval Questions To Resolve

- Which Garmin program is the right fit: Health API, Health SDK, or another approved developer path?
- Which exact data families are approved for Todd's intended use?
- What review, compliance, privacy, and business-entity requirements apply?
- What redirect, callback, or webhook requirements would exist for a later read-only integration?
- Are nutrition totals covered, or would Garmin Nutrition remain manual/provider-bound?

## Todd/Admin Checklist

- Confirm the desired Garmin program and official documentation entrypoint.
- Decide who will own the Garmin developer account and legal contact.
- Prepare the product summary and privacy explanation.
- Confirm the Coach boundary language:
  - read-only by default
  - no scraping
  - no automated provider writes
  - no secret handling in Codex chat
  - Rack/Motra remains strength-log authority
- Record Garmin's response, approval state, and any missing prerequisites in a non-secret admin note.

## Proof Needed Before A Later Read-Only Build

- Garmin approval or sandbox access exists in Todd/admin-controlled systems.
- Required scopes/data families are documented.
- Redirect/callback details are known.
- No secrets have been pasted into repo files, issue comments, or ChatGPT relay messages.
- A separate scoped Codex instruction explicitly authorizes the next read-only integration task.

## Hard Stops

- Stop for login, 2FA, CAPTCHA, payment, business verification, secret entry, or account-security prompts.
- Stop if Garmin approval requires terms Todd/admin has not reviewed.
- Stop if the requested data families would weaken Coach source hierarchy or bypass Rack/Motra authority.

