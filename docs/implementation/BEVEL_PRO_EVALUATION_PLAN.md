# Bevel Pro Evaluation Plan

Last updated: 2026-06-18 Asia/Taipei.

Purpose: evaluate whether Bevel Pro can become the primary readiness, recovery, strain, nutrition, and health-intelligence layer for Todd's Personal Coach project, potentially simplifying the architecture before more custom integration is built.

## Current Hypothesis

Bevel may become the primary consumer-facing health brain if its Garmin Connect plus Apple Health sync, Recovery, Strain, Sleep, Nutrition, Bevel Intelligence, and Strength Builder are reliable enough for Todd's real workflow.

## Initial Phone Setup Result

Status as of 2026-06-18 07:57 Asia/Taipei:

- Bevel is installed on Todd's physical iPhone and launched successfully.
- Installed app version verified from the paired-device app list: `3.0.8`.
- Bevel opens in an authorized app state, not onboarding or login.
- Garmin Connect is connected in Bevel Data Sources.
- Oura is connected in Bevel Data Sources.
- The working evaluation setup is Garmin-first for Garmin-owned physiology/activity categories, Oura for sleep, and Bevel for nutrition logging.
- Active Energy, Heart Rate Variability, Resting Heart Rate, and other inspected Garmin-owned categories are set to Garmin Connect.
- Heart Rate has both Oura Ring and Garmin Connect active, with duplicate/hidden-source controls available.
- Sleep is set to Oura Ring as the visible priority source, with Garmin Connect, Health, Bevel, Soundcore, and other duplicate sleep sources hidden.
- Nutrition is set to Bevel as the active source, with hidden-source controls available.
- Bevel Intelligence is working and answered a safe readiness/strain question with an easy/low-impact recommendation. Treat that as consumer coaching context, not medical authority.
- Fitness and Strength Builder entry points are visible: Log activity, Create workout, Generate template, Guided template, and Freeform template.
- Journal nutrition entry points are visible: Describe food, Import food, Capture food, Scan food, Ask Bevel, and Search food.
- A Garmin resync was triggered from Bevel's own Garmin Connect Manage screen after source configuration. The app remained usable but still showed global `Syncing...` at last readback.
- No workout, nutrition record, provider account, Apple Health permission, subscription, payment, production write, or Coach runtime/source-policy change was performed.

Current working decision:

- Continue the Bevel evaluation sprint.
- Do not promote Bevel to production source of truth yet.
- Do not replace Rack/Motra for completed strength yet.
- Do not replace Garmin Nutrition yet.
- Do not resume BP production-write work yet.

## Explicit Non-Decision

- Do not make Bevel the source of truth yet.
- Do not replace Garmin, Rack, Oura, or Apple Health in production policy yet.
- Do not remove BP write-readiness scaffolding.
- Do not wire Bevel into the runtime source registry yet.
- Do not perform live writes.

## Temporary Evaluation Hierarchy

This hierarchy is an evaluation overlay only. It does not change production source policy.

1. Medical and safety guidance still overrides everything.
2. Bevel Pro is an evaluation candidate for readiness, recovery, strain, sleep, nutrition, and AI insight.
3. Garmin remains the raw device source and backup authority.
4. Apple Health remains the local data bus and supporting evidence.
5. Rack is paused for new integration work while Bevel Strength Builder is tested.
6. Oura remains fallback unless Bevel makes it redundant.
7. BP remains safety-critical and cannot be inferred from Bevel, Garmin, Apple Health, or Oura.

## Bevel Facts To Verify

- Garmin Connect direct sync works for Todd.
- Apple Health sync works for Todd.
- Garmin data appears in Bevel with useful recency.
- Bevel Recovery, Sleep, and Strain are understandable and actionable.
- Bevel Intelligence can answer Coach-like questions from Todd's real data.
- Bevel Strength Builder can support a real World Gym strength session.
- Bevel nutrition is good enough to consider replacing or supplementing Garmin Nutrition.
- Bevel output can be manually summarized or exported into the GPT Coach without screenshot or account babysitting.

## Known Cautions

- Treat Bevel as consumer health intelligence, not medical authority.
- Do not let Bevel override doctor, safety, or BP concerns.
- Do not assume Bevel exposes an API or export path until verified.
- Do not assume Bevel imports Garmin Connect+ Nutrition or Garmin Connect+ Strength detail unless Todd verifies it.
- Do not assume Bevel Strength Builder fits Todd's workflow until a live gym test.
- Do not assume Bevel Intelligence replaces Coach memory or source policy.

## Evaluation Sprint Phases

### Phase 1: Todd Device And Account Setup

- Todd installs or opens Bevel Pro.
- Todd connects Garmin Connect.
- Todd connects Apple Health.
- Todd grants only the permissions he is comfortable granting.
- Codex and GPT do not handle login, OAuth, passwords, tokens, 2FA, account security, payment, screenshots with sensitive data, or Health permission screens.

### Phase 2: Passive Data Validation

- Confirm Bevel shows recent Garmin and Apple Health data.
- Confirm Sleep, Recovery, Strain, HR, HRV, RHR, steps, and activity data are fresh enough.
- Capture Todd-safe summary only.

### Phase 3: Bevel Intelligence Test

Ask Bevel Intelligence safe, non-medical questions:

- "Based on my recent recovery and strain, should today be hard, moderate, or easy?"
- "What limited my recovery last night?"
- "What should I watch before strength training today?"
- "What training pattern do you see over the last week?"

Todd reports summarized answers, not screenshots with private or account details.

### Phase 4: Strength Builder Test

Use Bevel Strength Builder for one real or mock World Gym workout.

Evaluate:

- exercise creation/search
- templates
- set, rep, and load handling
- notes and coaching cues
- rest timer
- Garmin watch compatibility
- HR visibility
- completion flow
- post-workout summary
- whether GPT Coach can use the output afterward

### Phase 5: Nutrition Test

- Evaluate Bevel nutrition logging only.
- Do not switch nutrition authority yet.
- Compare Bevel nutrition against Garmin Nutrition:
  - ease of logging
  - calories and protein visibility
  - meal detail
  - daily closeout quality
  - availability to GPT Coach
  - burden on Todd

### Phase 6: Architecture Decision

Choose one:

A. Bevel-first: Bevel becomes the primary readiness, strain, nutrition, and strength app; GPT Coach becomes planner/evaluator.

B. Bevel-readiness-only: Bevel becomes readiness/strain brain; Rack remains strength authority.

C. Garmin/Rack-first remains: Bevel is useful but not authoritative.

D. Hybrid trial continues.

## Decision Matrix

| Domain | Current authority | Bevel candidate role | Evidence needed | Pass criteria | Fail criteria | Todd/device-bound action | Codex-safe action | Decision after sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| readiness/recovery | Garmin primary when fresh; Oura fallback; safety overrides all | Primary readiness interpretation candidate | Garmin and Apple Health sync recency, Recovery explanation quality, safe manual summary | Fresh enough for morning coaching, clear explanations, low manual burden, BP limits visible | Stale/missing data, confusing or misleading advice, hard to summarize, safety ambiguity | Connect accounts, read Bevel, report safe summary | Record evaluation result in docs/handoff only | Bevel-first, Bevel-readiness-only, Garmin/Rack-first, or hybrid |
| sleep | Garmin primary when fresh; Oura fallback | Sleep interpretation candidate | Sleep duration, quality, HRV/RHR, wake notes, recency | Understandable sleep drivers and useful recovery context | Missing sleep, stale sleep, unclear drivers, conflicts with known lived experience | Verify sleep screen and safe summary | Compare reported summary against source policy | Decide whether Bevel can supersede Oura fallback |
| strain/training load | Garmin training/activity evidence | Strain/training interpretation candidate | Activity import, strain score, recent training pattern | Captures useful recent load and suggests sensible intensity | Misses activities, stale load, overconfident recommendations | Verify Garmin data appears in Bevel | Document candidate status only | Decide Bevel readiness/strain role |
| strength workout builder | Rack/Motra for planned/completed strength detail | Possible workout builder and session logger | Real or mock World Gym session using Strength Builder | Exercises, sets, reps, load, rest, notes, completion, and summary are usable | Exercise/template friction, poor load tracking, missing notes, bad completion flow | Run a live or mock Strength Builder session | Capture Todd-safe evaluation result | Decide whether Rack work resumes or Bevel becomes builder |
| completed strength detail | Rack/Motra completed set detail | Possible manual-summary source if Bevel output is usable | Post-workout summary detail and export/manual summary path | GPT Coach can receive enough completed detail without major burden | No useful export/summary, excessive screenshot/account babysitting | Review Bevel post-workout output | Define no-write packet shape only | Decide completed-strength authority |
| nutrition | Garmin Connect+ Nutrition | Candidate nutrition logger or supplement | Logging ease, calories/protein/macros, meal detail, daily closeout, GPT availability | Easier and more reliable than Garmin Nutrition, accessible daily summary, Todd prefers workflow | Higher burden, poor macro detail, inaccessible output, Todd dislikes it | Test Bevel nutrition logging | Record comparison and keep authority unchanged until decision | Keep Garmin, switch to Bevel, supplement, or continue trial |
| BP/safety | Doctor guidance and BP-specific policy | No authority; cannot infer BP | Explicit BP limitations and safety boundary | Bevel stays clearly subordinate to BP/medical safety | Any attempt to infer or override BP safety | Report any BP/safety concern manually | Preserve no-write and safety policy | BP remains separate safety-critical source |
| Apple Health data bus | Supporting evidence/data bus only | Sync support into Bevel | Permission scope and data freshness | Sync supports Bevel without changing production authority | Permission friction, stale data, unexpected authority confusion | Grant only comfortable permissions | Document supporting-only role | Keep supporting-only unless separately approved |
| Garmin raw device source | Garmin Fenix/Garmin Connect | Raw source behind Bevel views | Garmin sync path and recency | Garmin data appears reliably enough in Bevel | Sync fails or misses key data | Connect Garmin and verify Bevel display | Keep Garmin as raw/backup authority | Decide Bevel overlay role, not Garmin removal |
| GPT Coach memory/planning | Coach memory plus deterministic source policy | Consumer insight input only | Manual/export summary path into GPT Coach | Bevel insight can be summarized safely and used without replacing memory policy | Output is trapped, too private, too vague, or conflicts with source hierarchy | Provide Todd-safe summaries | Update docs/handoff; no runtime source registry change | Decide how GPT Coach consumes Bevel summaries |

## Pass/Fail Criteria

Bevel can become the primary readiness layer only if:

- Garmin plus Apple Health sync are reliable.
- Bevel data is fresh enough for morning coaching.
- Bevel Intelligence explanations are useful and not misleading.
- Manual summary burden is low.
- Safety and BP limitations are clear.

Bevel can become the strength builder only if:

- Todd can build and run a real World Gym workout comfortably.
- Sets, reps, load, rest, and timing are usable.
- Notes and coaching cues are visible enough.
- Post-workout summary can get back into GPT Coach without major friction.

Bevel can become nutrition authority only if:

- calories, protein, and macros are easier and more reliable than Garmin Nutrition.
- daily summaries are accessible enough for GPT Coach.
- Todd prefers the workflow.

## Todd-Safe Evidence Packet

Todd can paste this after testing:

```text
BEVEL_PRO_EVALUATION_PACKET

Date/time:
Bevel connections:
- Garmin Connect connected: yes/no
- Apple Health connected: yes/no
- Oura connected, if used: yes/no

Freshness:
- Sleep/recovery data fresh: yes/no
- Strain/activity data fresh: yes/no
- Nutrition data fresh: yes/no/not tested
- Strength data fresh: yes/no/not tested

Bevel readiness/recovery summary:
Bevel strain/training summary:
Bevel Intelligence useful answer:
Strength Builder test:
Nutrition test:
What worked:
What failed:
Manual burden:
Safety/BP concerns:
Should Bevel become primary readiness brain? yes/no/maybe
Should Bevel replace Rack for strength builder? yes/no/maybe
Should Bevel replace Garmin Nutrition? yes/no/maybe

Do not treat this as a production write.
Do not treat Bevel as medical authority.
```

## Stop Boundaries

- Bevel login, account, OAuth, payment, subscription, and security prompts are Todd-bound.
- Apple Health permissions are Todd-bound.
- Garmin Connect authorization is Todd-bound.
- Screenshots with account/private data are not required.
- Codex and GPT must not request or handle secrets or tokens.
- No production writes.
- No provider scraping or automation.
- No Supabase admin, migration, or schema-cache work.
- No production setting changes.
- No `HEALTH_DATABASE.json` changes.
