# Connected Coach Setup

This project now has three layers:

1. `index.html` - the mobile coach dashboard.
2. Supabase Postgres - private coaching data and logs.
3. Netlify Functions - secure API, dashboard bridge, and WhatsApp webhook.

## Environment Variables

Set these in Netlify, not in committed files:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
COACH_API_SECRET=make-a-long-random-secret
WHATSAPP_VERIFY_TOKEN=make-a-second-random-token
WHATSAPP_ACCESS_TOKEN=meta-system-user-access-token
WHATSAPP_PHONE_NUMBER_ID=meta-phone-number-id
WHATSAPP_ALLOWED_FROM=your-whatsapp-number-with-country-code
WHATSAPP_GRAPH_VERSION=meta-graph-api-version
```

Only the first three are required for the web coach API. The WhatsApp variables are required for WhatsApp.

## Supabase

Run the SQL migrations in order:

```text
supabase/migrations/001_connected_coach_schema.sql
supabase/migrations/002_connected_coach_idempotency.sql
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
