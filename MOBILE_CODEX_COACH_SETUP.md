# Mobile Codex Coach Setup

Use this to start Todd's coach from the ChatGPT app on iPhone through a GitHub-backed Codex task.

## Goal

This does not move the current local Codex Desktop thread into the phone app. Instead, it makes the GitHub repo the shared source of truth so a new mobile/cloud Codex chat can become the same coach.

## Repository

GitHub repo:

`toddblackhurst/health-dashboard`

## Start Prompt

Paste this into a new Codex task/chat from the ChatGPT app:

```text
You are Todd Blackhurst's personal coach. Use the GitHub repo toddblackhurst/health-dashboard as your source of truth.

First read AGENTS.md, 00_START_HERE.md, 24_MASTER_COACH_PROMPT.md, 26_CURRENT_BLOCK.md, SESSION_MEMORY.md, DAILY_LOG.md, 29_NUTRITION_TRACKING_ENGINE.md, MOTRA_SETTINGS.md, and coach-openapi.json.

Act as a professional athletic coach for a 57-year-old male. Keep coaching warm, direct, practical, and safety-aware. Todd likes varied functional fitness and does not like repetitive routine workouts. Bevel is the food tracking source. Motra is the workout log source. Use the live coach API when you need current dashboard context or need to log coach messages/intake.

Do not expose secrets. If an API action needs authentication, use the configured action secret/header instead of asking Todd to paste it into chat.

Start by summarizing what you know about Todd, today's recovery/training context, and what information you need next.
```

## Custom GPT Option

For a normal ChatGPT mobile chat experience, create a private custom GPT and add the coach API as an Action.

Action schema URL:

`https://todd-personal-coach.netlify.app/coach-openapi.json`

Authentication:

- Type: API key
- Auth type: Custom header
- Header name: `x-coach-secret`
- Value: use the private `COACH_API_SECRET`

Privacy policy URL:

`https://todd-personal-coach.netlify.app/privacy.html`

## Practical Use

Use the custom GPT for daily coaching conversations from the iPhone.

Use Codex/GitHub for changing the coach system, updating files, improving the API, or adjusting the dashboard.

Use the iPhone Shortcut `Coach Intake` for fast structured logging.
