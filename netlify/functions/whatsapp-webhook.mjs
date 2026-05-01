import {
  coachReply,
  dashboardFromSupabase,
  env,
  getProfile,
  insertCoachMessage,
  json,
  preflight,
} from "./_coach-lib.mjs";

async function sendWhatsAppText(to, body) {
  const token = env("WHATSAPP_ACCESS_TOKEN");
  const phoneId = env("WHATSAPP_PHONE_NUMBER_ID");
  const version = env("WHATSAPP_GRAPH_VERSION") || "v22.0";
  if (!token || !phoneId || !to) return { skipped: true };

  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`WhatsApp send failed: ${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

function extractMessages(payload) {
  const out = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const msg of value.messages || []) {
        if (msg.type === "text" && msg.text?.body) {
          out.push({
            from: msg.from,
            id: msg.id,
            timestamp: msg.timestamp,
            text: msg.text.body,
            raw: msg,
          });
        }
      }
    }
  }
  return out;
}

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;

  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === env("WHATSAPP_VERIFY_TOKEN")) {
      return new Response(challenge || "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const profile = await getProfile();
    if (!profile) return json({ error: "No Supabase profile found." }, 404);

    const payload = await req.json();
    const allowedFrom = env("WHATSAPP_ALLOWED_FROM");
    const messages = extractMessages(payload).filter(m => !allowedFrom || m.from === allowedFrom);
    const dashboard = await dashboardFromSupabase();
    const results = [];

    for (const message of messages) {
      await insertCoachMessage(profile.id, "user", message.text, "whatsapp", message.raw);
      const reply = coachReply(message.text, dashboard || {});
      await insertCoachMessage(profile.id, "coach", reply, "whatsapp", { in_reply_to: message.id });
      results.push({ from: message.from, reply, sent: await sendWhatsAppText(message.from, reply) });
    }

    return json({ ok: true, processed: results.length, results });
  } catch (err) {
    console.error(err);
    return json({ error: err.message || "WhatsApp webhook error." }, 500);
  }
}

export const config = {
  path: "/api/whatsapp",
  method: ["GET", "POST", "OPTIONS"],
};
