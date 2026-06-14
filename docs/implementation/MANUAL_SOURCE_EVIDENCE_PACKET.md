# Manual Source Evidence Packet

Last updated: 2026-06-15 Asia/Taipei.

Purpose: give Todd a short, safe way to tell Coach what the missing daily sources say while Garmin, Rack/Motra, nutrition, BP, body composition, and provider integrations remain stale, manual, or write-held.

This packet is docs-only. It does not authorize protected route calls, production writes, Supabase changes, provider automation, account login, iPhone permission work, or edits to `HEALTH_DATABASE.json`.

Use this when Coach says source data is stale, before training, after training, or when Todd needs Coach to reason from current manual evidence without pretending the evidence has been imported.

## How To Use This Packet

Todd can paste or say the short packet. Coach should:

- Treat the information as reported/manual evidence unless Todd clearly says it came from an imported source.
- Label confidence and source quality.
- Ask only for missing safety-critical items before giving the plan.
- Keep the plan conservative when primary sources are stale, missing, or unreliable.
- Hold all write actions unless a separate write-readiness task is approved.

## Quick Pre-Workout Packet

```text
Coach, source data may be stale. Use low confidence and keep me safe.

Date/time:
Garmin sleep/recovery:
Energy:
Soreness/pain:
BP:
Nutrition:
Last Rack/Motra strength session:
Body/weight trend:
Oura fallback, only if Garmin is stale/unavailable:
Apple Health sync status:
Today's constraints:

Ask only for missing safety-critical items, then give a conservative plan.
Do not assume any stale data is fresh.
```

## Quick Post-Workout Packet

```text
Workout done. This is reported evidence, not a saved write.

Date/time:
Planned session:
Actual session:
Exercises, sets, reps, load, rest, or duration:
Top sets or main lifts:
RPE/energy:
Pain, symptoms, or form concerns:
What changed from the plan:
Recovery notes:
What Coach should remember next time:

Do not treat this as Rack/Motra-imported history unless I say it came from Rack/Motra.
Hold writes unless separately approved.
```

## Source Evidence Fields

| Source | Authority role | Why Coach needs it | Todd-safe evidence | Short prompt | Do not paste | Fresh enough | Coach should use it by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Garmin sleep/recovery | Primary readiness/recovery when fresh and reliably worn. | Sets readiness, recovery, HRV/resting-HR context, and training density. | Date, sleep hours/score, readiness/recovery, Body Battery if available, HRV, resting HR, watch worn yes/no. | `Garmin sleep was __ hours, readiness/recovery __, Body Battery __, HRV __, RHR __, watch worn yes/no.` | Garmin login pages, auth headers, raw exports, screenshots with account or device identifiers. | Same-day or previous-night for the target training date, with watch-worn reliability. | Treat as primary readiness unless stale/unreliable or overridden by safety/medical flags. |
| Blood pressure | Safety/medical override input. | Can downshift or block hard training even when other sources look good. | Date/time, systolic/diastolic, HR if available, symptoms, resting/repeat yes/no. | `BP today was __/__, measured at __, HR __, symptoms __, resting measurement yes/no.` | Medical-app screenshots, account pages, raw private exports, credential screens. | Same day for training decisions, or doctor-directed cadence. | Apply safety gates first; ask for BP only when safety-critical or already relevant. |
| Garmin Nutrition | Nutrition authority when usable. | Determines fueling, recovery, protein coverage, hydration/sodium context, and whether intensity should be adjusted. | Date, calories, protein, carbs, fat if available, hydration, alcohol/sodium/carb notes, completeness. | `Calories roughly __, protein __g, hydration __, alcohol/sodium/carbs notable __, completeness partial/full.` | Garmin account screens, food-log screenshots with private details, tokens, raw exports unless separately scoped. | Today for daily coaching; prior-day closeout for morning planning. | Use as nutrition authority when clearly Garmin Nutrition; otherwise label manual fallback. |
| Body comp/weight | Trend evidence only. | Helps trend load, recovery, and body-composition context without overreacting to one reading. | Date, weight, body fat if available, source, trend up/down/stable. | `Weight __, body fat __ if available, trend up/down/stable, source __.` | Scale-app account screens, raw private exports, sensitive screenshots. | Within 14 days for trend; same day only when weight trend is the topic. | Treat as trend context; never override same-day readiness or safety from one BIA reading. |
| Rack/Motra strength session | Completed strength-history authority. | Confirms what was actually trained and prevents repeated or badly progressed workouts. | Date, session name, completed yes/no, duration, main lifts, top sets, RPE, what felt good/bad. | `Last strength session was __, main lifts __, top sets __, RPE __, completed in Rack/Motra yes/no.` | Rack/Motra login/account screens, payment screens, raw exports unless separately reviewed. | Same day for a completed planned strength day; otherwise latest completed session. | Prefer this over memory, Apple Health workout counts, or debriefs for completed strength history. |
| Rack/Motra exercise detail | Completed set/rep/load authority. | Drives progression, exercise selection, load adjustments, and anti-repeat logic. | Exercise names, sets, reps, load, rest, carries/durations, RPE, pain/form notes. | `Exercise/load/reps/sets/rest notes: __.` | Screens requiring login, sensitive screenshots, raw unreviewed exports. | Same day for recent training; latest available for progression. | Use only what Todd reports or approved imports show; do not invent loads from memory. |
| Oura fallback | Sleep/recovery fallback only. | Gives a cautious backup when Garmin sleep/recovery is stale, missing, or unreliable. | Date, readiness, sleep score, HRV, RHR, total sleep, reason Garmin is unavailable. | `Use Oura only because Garmin sleep/recovery is stale/unavailable: readiness __, sleep __, HRV __, RHR __.` | Oura login/OAuth screens, token pages, raw API responses. | Same-day or previous-night and only when Garmin is stale/unavailable/unreliable. | Label as fallback and never override fresh reliable Garmin readiness. |
| Apple Health | Supporting evidence/data bus only. | Cross-checks activity, steps, exercise minutes, active calories, and local sync freshness. | Fresh/stale/missing, days written, sync error yes/no, steps/exercise minutes only as context. | `Apple Health sync is fresh/stale; days written __; treat as supporting evidence only.` | Health permission screens, Apple ID/account screens, private screenshots with excessive data. | Today or yesterday depending on time of day in Asia/Taipei. | Use as supporting context only; never count Apple Health workouts as Rack/Motra strength history. |
| Doctor/safety notes | Medical/safety override. | Can block or reshape training regardless of device data. | Restriction summary, date, affected movement/intensity, symptoms, follow-up instructions. | `Doctor/safety note: __. Restriction applies to __ until __. Symptoms __.` | Full medical records, portal screenshots, account pages, private identifiers unless separately scoped. | Current until cleared or replaced by updated medical guidance. | Override all device, memory, nutrition, and strength-history signals. |

## Do Not Paste

Never paste or ask Todd to paste:

- `x-coach-secret`, API keys, auth headers, passwords, tokens, JWTs, `sk-` keys, credential URLs, or payment details.
- Account login, 2FA, security, permission, device-trust, passcode, Face ID, or payment screens.
- Netlify, Supabase, OpenAI, GitHub, GPT Action, Garmin, Oura, Apple, Rack, Motra, or medical portal secret values.
- Screenshots that expose private account details, secret fields, raw credential text, or unrelated sensitive health data.
- Raw exports with excessive personal data unless a separate scoped import/review task says exactly what file is safe.

Short summaries are enough for coaching. If the next step requires a login, secret, permission, account-security, or physical-device prompt, Coach and Codex should stop and ask Todd to handle it.

## Do Not Overtrust

- Medical/safety flags beat every device and memory source.
- Garmin is primary for readiness/recovery/workout physiology only when fresh and reliably worn.
- Rack/Motra is the strength-log authority for completed sets, reps, loads, exercise names, performance history, and progression.
- Garmin Nutrition is the nutrition authority when usable.
- Oura is fallback sleep/recovery only when Garmin is stale, missing, or unreliable.
- Apple Health is supporting evidence/data bus only and cannot override Garmin, Rack/Motra, Garmin Nutrition, safety, or medical flags.
- Hume/Ocare/body-composition data is trend evidence only; do not overreact to one-day BIA swings.
- Coach Memory, workout debriefs, and manual notes can personalize and constrain coaching, but cannot replace current safety, Garmin, Rack/Motra, or nutrition evidence.

## Safety Stops And Downshifts

Coach should stop or downshift hard training when Todd reports:

- Chest pain, fainting, neurological symptoms, severe shortness of breath, severe illness, or concerning acute symptoms.
- High or symptomatic BP, or BP that conflicts with doctor guidance.
- Sharp, radiating, worsening, or unstable pain.
- Fresh reliable Garmin readiness/recovery that is clearly red or very poor.
- Severe fatigue, poor sleep, or high soreness when primary data is stale or missing.
- Any doctor restriction or medical instruction that conflicts with the proposed plan.

## How Coach Should Respond

When Todd gives this packet, Coach should:

1. Acknowledge which sources are primary, fallback, supporting, missing, or stale.
2. State confidence plainly: high, medium, low, or blocked.
3. Ask only for missing safety-critical information.
4. Build or adjust the plan using the source hierarchy.
5. Keep strength anchors when safe, but reduce density, finishers, load jumps, or conditioning when confidence is low.
6. Label manual evidence as reported and not saved.
7. Avoid write actions unless a separate write-readiness boundary explicitly approves them.

Example response style:

```text
Confidence: medium-low because Garmin Nutrition and Rack/Motra detail are stale, but BP and pain are acceptable.
Safety: no red flags reported.
Plan: keep the strength anchor, cap top sets at RPE 7, skip the dense finisher, and log the actual sets in Rack/Motra after training.
```

## How This Feeds Future Implementation

This packet creates acceptance criteria for later work:

- Manual Source Freshness Draft UI v1 should collect these fields locally as draft-only, redacted, and not saved.
- Sync Status Source Classification Improvements v1 should expose which source is primary, fallback, supporting, stale, manual/provider-bound, write-held, or not expected.
- Future write-readiness phases can use this field list for BP, recovery, nutrition, body, and strength intake only after idempotency, audit, rollback, source labeling, and tests are approved.
- Rack/Motra import work should not begin until Todd provides an approved export format or provider-approved integration path.

This packet does not authorize any write, import, protected route call, provider login, device permission change, Supabase action, Netlify setting change, or GPT Action secret change.
