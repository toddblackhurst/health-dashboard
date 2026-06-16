# Refresh Coach Data Physical Validation

Last updated: 2026-06-17 Asia/Taipei.

Purpose: give Todd a safe physical-iPhone checklist for validating the merged Refresh Coach Data flow after PR #78 without turning simulator/local proof into false completion.

## Scope

- Validate the physical iPhone behavior of the merged local Refresh Coach Data path.
- Confirm the app still behaves as a local-only, no-write evidence-preparation tool.
- Confirm source grouping and source hierarchy wording on-device.
- Do not use this checklist to call protected production routes, perform production writes, or automate provider apps.

## Preconditions

- Todd is physically holding the iPhone or otherwise directly controlling it.
- The current merged app build is installed or launched on the iPhone.
- No secret is shown to Codex or pasted into ChatGPT.
- If the app prompts for setup, login, Health permissions, Siri, or device-only actions, Todd handles them directly.
- Codex may help interpret safe readback, but not take over protected/account/permission surfaces.

## What Must Stay True

- `write_status` must remain `no_write`, `write_held`, `draft_only_no_write`, or another clearly non-live-write state.
- `protected_route_status` must remain `not_called` for the local Refresh Coach Data flow.
- Apple Health remains supporting-only.
- Oura remains fallback-only.
- Rack/Motra remains the authority for strength session/detail.
- Garmin sleep/recovery is not falsely marked fresh unless real evidence exists.
- BP behavior stays conservative when stale, missing, or risk-flagged.
- No provider app, provider portal, OAuth, or browser automation is used.
- No production write occurs.

## Validation Steps

1. Open the current app build on the physical iPhone.
2. Navigate to the Refresh Coach Data or equivalent local evidence-refresh surface.
3. Run the refresh action once in the normal supported way.
4. Read the resulting status or output on-device.
5. Confirm the output is grouped into Fresh, Fallback, and Needs Todd rather than a single flattened status list.
6. Confirm the output still reads as local evidence orchestration, not a submitted backend sync.
7. Confirm any visible write marker still indicates no live write.
8. Confirm any visible protected-route marker indicates the protected route was not called.
9. Confirm Apple Health appears only as supporting evidence.
10. Confirm Oura appears only as fallback insight, not primary readiness.
11. Confirm Rack/Motra is still treated as strength authority.
12. Confirm BP messaging stays conservative when current BP evidence is absent or stale.
13. If a lane lacks fresh real evidence, confirm it lands in Fallback or Needs Todd rather than being falsely promoted to Fresh.

## Safe Evidence Todd Can Report Back

- A short summary of which lanes showed as Fresh, Fallback, and Needs Todd.
- Whether the app visibly showed `write_status: no_write` or equivalent no-write wording.
- Whether the app visibly showed `protected_route_status: not_called` or equivalent.
- Whether Apple Health was clearly supporting-only.
- Whether Oura was clearly fallback-only.
- Whether Rack/Motra remained the authority for strength history.
- Whether BP wording looked conservative.
- Whether anything on-device looked misleading or falsely fresh.

## Stop Conditions

- Stop if the app appears to call a protected route.
- Stop if the app appears to submit a production write.
- Stop if any secret, token, key, auth header, login prompt, OAuth screen, or 2FA surface would need Codex involvement.
- Stop if the app implies Apple Health, Oura, or another fallback source overrides the source hierarchy.
- Stop if the app marks stale or missing data as Fresh.
- Stop if provider app automation, browser automation, or account setup would be needed to continue.

## Expected Outcome Labels

- `verified`: Todd completed the device checklist and the local Refresh Coach Data behavior matched the no-write/source-hierarchy contract.
- `drafted/staged`: the checklist exists and the app is ready for Todd to run, but physical-device proof has not happened yet.
- `blocked`: device/account/permission/secret issues prevented safe validation.
