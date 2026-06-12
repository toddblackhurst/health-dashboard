# Review Prompt: iOS And Privacy

Use after iOS, HealthKit, Shortcuts, app intent, browser, device, or privacy-sensitive workflow changes.

```text
Review the Codex handoff for iOS, device, and privacy risks.

Do not inspect, clone, browse, edit, or test the repo. Use only the Codex handoff.

Findings first. Flag any case where:
- simulator success is treated as physical-device proof
- installed is treated as launched, launched as configured, or configured as synced
- HealthKit permission, Apple Health data access, or Shortcuts automation state is assumed without readback
- iOS Personal Automation is treated as verified when only documented
- passcodes, Face ID, 2FA, account-security, payment, or permission prompts are handled by Codex instead of Todd
- raw HealthKit samples are introduced without a clear approved use case
- Apple Health is promoted beyond supporting evidence/data bus
- private health data is transmitted or stored beyond the scoped destination

Return CODEX_RELAY_RESPONSE only.
```
