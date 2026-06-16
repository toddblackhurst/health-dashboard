# Garmin Follow-Up Packet

Last updated: 2026-06-17 Asia/Taipei.

Purpose: prepare Todd/admin follow-up for Garmin without logging into Garmin, handling secrets, or enabling live integration work.

## Current Status

- Codex already applied to the Garmin Developer Program.
- Earlier Gmail search did not find a Garmin Developer confirmation email.
- The approved v1 ask is read-only only:
  - Health API access.
  - Activity API access.
- Do not request Training, Courses, or other write-capable access in v1.

## V1 Positioning

- Product: Todd Blackhurst's Personal Coach.
- Role: deterministic, safety-first coaching assistant.
- Intended Garmin role: read-only recovery/readiness and activity evidence when fresh and approved.
- Current boundary: no provider writes, no provider automation, no OAuth handling in Codex or ChatGPT.

## Short Call Script

Hello, I’m following up on a Garmin Developer Program application for Todd Blackhurst’s Personal Coach. We are only seeking read-only access for v1, specifically Garmin Health API and Activity API access. We are not requesting Training, Courses, or other write-capable scopes. Could you confirm application status, whether our current request is in the correct Garmin program, and whether any non-secret next steps are needed from the applicant?

## Email Or Contact Form Draft

Subject: Follow-up on Garmin Developer application for read-only Health API + Activity API access

Hello Garmin team,

I’m following up on an existing Garmin Developer Program application for Todd Blackhurst’s Personal Coach.

Our intended v1 scope is read-only only:
- Health API access
- Activity API access

We are not requesting Training API, Courses, or any write-capable integration in v1.

Could you please confirm:
- whether the application is in the correct Garmin program,
- the current application status,
- whether any non-secret additional materials are needed,
- and whether read-only Health API plus Activity API access is the right path for this use case?

Thank you.

## Questions For A Garmin Follow-Up Call

- Is Garmin Health API the correct approval path for read-only sleep/recovery/readiness data in this use case?
- Is Activity API the correct approval path for read-only workout/activity evidence in this use case?
- Are Health API and Activity API approved together or separately?
- Are there any required compliance or product-description materials still missing?
- Is nutrition data available through the same approved path, or should nutrition remain manual/provider-bound for now?
- Are there sandbox or testing prerequisites before any production OAuth or member linking work?
- Are there rate limits, freshness limits, or use restrictions that matter for a no-write coaching assistant?
- What exact non-secret status markers should Todd/admin expect as the application moves forward?

## Safe Fields Todd/Admin Can Capture Back

- Garmin case number or application reference if one is shown.
- Garmin program name the application is actually in.
- Status label such as submitted, under review, approved, needs more information, or wrong program.
- Any non-secret checklist items Garmin says are still required.
- Any stated limit on APIs, scopes, or allowed use cases.
- Any next follow-up date or response-time expectation.

## Forbidden Handling

- Do not share passwords, tokens, client secrets, refresh tokens, cookies, or auth headers with Codex or ChatGPT.
- Do not ask Codex or ChatGPT to log into Garmin, complete OAuth, pass 2FA, or operate Garmin account settings.
- Do not request write-capable Garmin scopes in v1.
- Do not claim Garmin is live or approved until Todd/admin has direct confirmation.

## Status Labels

- `drafted/staged`: this packet is prepared, but Garmin status is still awaiting Todd/admin follow-up.
- `verified`: Todd/admin completed a follow-up and can report non-secret Garmin status.
- `blocked`: Garmin requires account, legal, security, payment, or other human-only steps before progress continues.
