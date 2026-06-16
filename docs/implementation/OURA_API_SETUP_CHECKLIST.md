# Oura API Setup Checklist

Last updated: 2026-06-16 Asia/Taipei.

Purpose: prepare a future official Oura read-only fallback integration without starting OAuth, touching secrets, calling production routes, or weakening Garmin primary readiness rules.

## What This Does And Does Not Do

- This checklist supports the disabled mock-only scaffold in [official-provider-scaffolding.mjs](/Users/toddsdesktop/Codex%20Git%20Projects/health-dashboard-disabled-garmin-oura-integration-scaffolding-v1/lib/official-provider-scaffolding.mjs).
- It does not authorize login automation, OAuth completion, token handling, or any live Oura API requests.
- It does not let Oura override fresh reliable Garmin readiness or any medical/safety gate.

## Intended Future Read Scope

- Oura sleep/recovery fallback only when Garmin is stale, missing, or unreliable.
- Oura Advisor or summary text only as supporting fallback context.

## Setup Prerequisites

- Todd confirms Oura is still useful as fallback and not as primary readiness authority.
- Todd/admin identifies the Oura developer/app ownership surface.
- A later scoped Codex task exists for read-only Oura integration after setup approval.

## Information To Prepare Before Any Future OAuth/App Setup

- Product description: fallback-only coaching context for Todd's personal Coach workflow.
- Exact intended data classes: readiness, sleep, HRV, resting heart rate, optional Advisor summary.
- Privacy posture: read-only, no credential sharing in chat, no scraping, no background polling before approval.
- Garmin precedence statement: Oura never marks Garmin fresh and never overrides safety gates.

## Todd/Admin Checklist

- Review Oura's current API documentation and app-registration requirements.
- Decide who owns the Oura app registration and redirect configuration.
- Record intended redirect URI and environment placement without putting secrets in repo files.
- Confirm that the future integration remains:
  - disabled by default
  - read-only
  - fallback-only
  - no-write unless a separate later task is approved
- Keep any client IDs, client secrets, and refresh tokens out of GitHub issues, repo files, and ChatGPT relay messages.

## Proof Needed Before A Later Read-Only Build

- Oura app registration exists in a Todd/admin-controlled surface.
- Required scopes and token flow are documented.
- Redirect URI plan is defined.
- No secrets have been pasted into repo files, issue comments, or ChatGPT relay messages.
- A separate scoped Codex instruction explicitly authorizes the next read-only integration task.

## Hard Stops

- Stop for login, 2FA, CAPTCHA, payment, secret entry, or account-security prompts.
- Stop if Oura setup would be used to bypass Garmin primary readiness or medical/safety boundaries.
- Stop if a future task asks Codex to store or reveal tokens, client secrets, or raw OAuth credentials.

