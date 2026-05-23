import { env } from "./_coach-lib.mjs";

export function whatsappRecipient() {
  return env("WHATSAPP_MORNING_TO") || env("WHATSAPP_ALLOWED_FROM");
}

export function redactPhone(value = "") {
  const text = String(value || "");
  if (text.length <= 4) return text ? "set" : "";
  return `${text.slice(0, 3)}...${text.slice(-4)}`;
}

export async function sendWhatsAppText(to, body) {
  const token = env("WHATSAPP_ACCESS_TOKEN");
  const phoneId = env("WHATSAPP_PHONE_NUMBER_ID");
  const version = env("WHATSAPP_GRAPH_VERSION") || "v25.0";
  if (!token || !phoneId || !version || !to) {
    return {
      skipped: true,
      reason: "WhatsApp send settings are incomplete.",
      has_token: Boolean(token),
      has_phone_id: Boolean(phoneId),
      has_version: Boolean(version),
      has_recipient: Boolean(to),
    };
  }

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

