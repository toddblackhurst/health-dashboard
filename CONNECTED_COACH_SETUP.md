# Connected Coach Setup

This project now has three layers:

1. `index.html` - the mobile coach dashboard.
2. Supabase Postgres - canonical private coaching data, `coach_state`, and `coach_decisions`.
3. Netlify Functions - secure API, deterministic coach engine, OpenAI polish layer, dashboard bridge, Shortcuts actions, and WhatsApp webhook.

## Environment Variables

Set these in Netlify, not in committed files:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
COACH_API_SECRET=make-a-long-random-secret
OPENAI_API_KEY=sk-proj-your-openai-api-key
COACH_MODEL=gpt-5.5
COACH_REASONING_EFFORT=medium
COACH_AI_DISABLED=0
WHATSAPP_VERIFY_TOKEN=make-a-second-random-token
WHATSAPP_ACCESS_TOKEN=meta-system-user-access-token
WHATSAPP_PHONE_NUMBER_ID=meta-phone-number-id
WHATSAPP_ALLOWED_FROM=your-whatsapp-number-with-country-code
WHATSAPP_GRAPH_VERSION=meta-graph-api-version
```

The first three are required for the web coach API. `OPENAI_API_KEY` enables polished structured coach replies; without it, the deterministic coach brain still works. The WhatsApp variables are required for WhatsApp.

## Supabase

Run the SQL migrations in order:

```text
supabase/migrations/001_connected_coach_schema.sql
supabase/migrations/002_connected_coach_idempotency.sql
supabase/migrations/003_coach_brain_state.sql
```

Then import the current local database:

```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
python3 bin/import_health_database.py
```

Dry-run first:

```bash
python3 bin/import_health_database.py --dry-run
```

## Dashboard Connection

Open the dashboard, tap the gear, and enter:

- Coach API base: your Netlify site URL, for example `https://todd-coach.netlify.app`
- Coach API secret: the same value as `COACH_API_SECRET`

The dashboard will then read from Supabase through `/api/coach` and write chat/workout feedback there.

## Coach API Actions

Private Custom GPT Actions and iPhone Shortcuts should use:

- `GET /api/coach/dashboard`
- `POST /api/coach/message`
- `POST /api/coach/brief`
- `POST /api/coach/workout`
- `POST /api/coach/nutrition-closeout`
- `POST /api/coach/post-workout`
- `POST /api/coach/intake`

Every action requires the `x-coach-secret` header. `POST /api/coach/message` accepts `intent`: `general`, `build_workout`, `evaluate_data`, `nutrition_check`, `post_workout`, or `travel_mode`.

The coach always loads `coach_state`; World Gym Taichung is the default workout environment unless `travel_mode` is active.

## WhatsApp

In Meta's WhatsApp Cloud API setup, configure the webhook callback URL:

```text
https://your-netlify-site.netlify.app/api/whatsapp
```

Use `WHATSAPP_VERIFY_TOKEN` as the webhook verify token and subscribe to messages.

Meta's Cloud API sends incoming messages to the webhook and sends outgoing text through:

```text
https://graph.facebook.com/{version}/{phone-number-id}/messages
```

The webhook stores both sides of the conversation in `coach_messages`.
