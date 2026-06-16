# Protected Read-Only Verification Execution Plan

Last updated: 2026-06-17 Asia/Taipei.

Purpose: define the safest post-merge protected read-only verification path for Coach behavior without performing writes, exposing secrets, or improvising around device/account/auth boundaries.

## Scope

- This plan covers protected read-only Coach verification only.
- It does not authorize any production write.
- It does not authorize secret handling by Codex or ChatGPT.
- It does not replace Todd-assisted device verification when device/account/auth prompts are involved.

## Approved Read-Only Targets

- `getSyncStatus`
- `buildWeeklyReview`
- `coach-today` only if the current route/path is clearly read-only and can be verified without secret exposure or prompt handling

## Explicitly Excluded

- all write-capable GPT Actions or routes
- BP intake writes
- nutrition writes
- workout debrief writes
- observation or memory writes
- provider account, OAuth, or login actions
- manual secret-header route calls from Codex
- any route/path that could mutate production state

## Execution Modes

### 1. Codex-Executable

Allowed only if all of the following are true:

- the protected read-only path is already configured
- the path is redacted and non-secret from Codex's point of view
- Codex does not need to see, enter, copy, print, paste, or store a secret
- no device unlock, keychain access, login, OAuth, 2FA, Health permission, or account-security prompt appears
- the path is unquestionably no-write

Current status:

- No Codex-safe protected read-only execution path is currently confirmed from repo/runtime evidence alone.
- Saved GPT and physical iPhone history prove protected read-only behavior exists, but those proofs depended on Todd/admin/device-controlled secret surfaces.

### 2. Todd-Assisted

Required if any of the following are involved:

- physical iPhone unlock
- iPhone keychain or app setup
- GPT Action auth
- secret entry or secret-backed header use
- Siri/Shortcuts/Action Button setup
- device permission prompts
- any account, login, OAuth, or 2FA step

## Safe Evidence To Collect

- route or action name
- date and time
- non-secret status result
- `protected_verification_status`
- `write_status`
- source freshness summary
- no-write confirmation
- no provider operation confirmation

## Stop Conditions

- any secret or account prompt appears
- any login, OAuth, 2FA, or account-security prompt appears
- any Health permission or device setup prompt appears
- any action looks write-capable
- any raw protected response would expose more than a redacted safe summary
- the only available path requires Codex to supply a secret header manually

## Post-Verification Handling

- Update GitHub issue #74 with redacted status only.
- Do not store raw secrets.
- Do not store excessive protected health payloads.
- Keep the result labeled `verified`, `drafted/staged`, or `blocked`.

## Current Determination

- Public verification is healthy and complete for the current main branch.
- Protected read-only verification remains available in principle through Todd-controlled surfaces already proven historically:
  - saved GPT read-only actions
  - physical iPhone protected read-only app/Shortcut path
- Those surfaces are not currently Codex-executable without risking secret exposure or device/account interaction.
- Therefore the current safe posture is:
  - Codex may plan and document.
  - Todd/admin must execute protected read-only verification unless a future no-secret preconfigured path is demonstrated first.

## If A Future No-Secret Path Appears

Before Codex uses it:

1. Describe the exact path in a `CODEX_RELAY_HANDOFF`.
2. Confirm it is already configured and requires no secret exposure.
3. Confirm it is redacted and read-only.
4. Get GPT Pro approval for that exact execution path.
5. Run one read-only check only after that approval.
