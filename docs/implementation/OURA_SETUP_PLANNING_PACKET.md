# Oura Setup Planning Packet

Last updated: 2026-06-17 Asia/Taipei.

Purpose: prepare Todd/admin for a future read-only Oura setup path while keeping Oura explicitly fallback-only and keeping all real credentials/account/OAuth work out of Codex and ChatGPT.

## Oura Role

- Oura is fallback-only for recovery/sleep insight.
- Oura does not override Garmin when Garmin is fresh and reliable.
- Oura does not become the primary readiness authority.
- Oura Advisor or narrative insight remains supporting context only.

## Todd/Admin Checklist

- Confirm Oura is still worth keeping as a fallback/insight source.
- Confirm who owns the Oura app registration and account surface.
- Review Oura’s current API app-registration requirements in a Todd/admin-controlled session.
- Decide the redirect/callback URL ownership and where it should live.
- Decide where Todd/admin will store any future client credentials or tokens outside Codex and ChatGPT.
- Confirm that any future build remains read-only first.

## Real Setup Steps That Stay Human-Only

- Creating or managing the Oura developer app.
- Logging into Oura.
- Completing OAuth or consent.
- Handling client ids, client secrets, authorization codes, access tokens, refresh tokens, or callback verification.
- Any billing, legal, security, or permission approval steps.

## Callback And Config Planning Needs

- Expected redirect/callback URL for the eventual read-only integration.
- Clear separation between local dev, preview, and production callback values if later needed.
- A non-secret place to record which environment owns the future Oura app.
- Explicit instruction that Codex/GPT must not enter or store credentials.

## Proposed CoachEvidencePacket Mapping

- Sleep duration or sleep summary -> fallback sleep evidence when Garmin is stale or missing.
- Readiness/recovery-style summary -> fallback recovery evidence when Garmin is stale or missing.
- Resting metrics or simple trend indicators -> supporting fallback context only.
- Advisor/narrative text -> narrative supporting insight only, not deterministic authority.

## Narrative-Only Oura Advisor Rule

- Oura Advisor text, if used later, must stay narrative-only.
- It cannot silently become structured authority over deterministic Garmin/Rack/Motra/safety rules.
- It cannot mark stale Garmin data as fresh.

## Stop Boundaries

- Stop if Oura setup would require Codex or ChatGPT to touch secrets.
- Stop if Oura would be used to bypass Garmin-primary readiness rules.
- Stop if any plan implies live OAuth completion, portal operation, or provider automation by Codex.
- Stop if Oura would be framed as production-ready before Todd/admin completes the real account setup.

## Status Labels

- `drafted/staged`: planning is complete, but no live Oura setup has been performed.
- `verified`: Todd/admin has completed non-secret planning decisions and can name the future setup owner/path.
- `blocked`: account, credential, or provider-bound steps are now the only remaining path.
