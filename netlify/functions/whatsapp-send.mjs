import { json, preflight, requireCoachSecret } from "./_coach-lib.mjs";
import { redactPhone, sendWhatsAppText, whatsappRecipient } from "./whatsapp-client.mjs";

const MAX_CHUNK_LENGTH = 3800;

export function chunkWhatsAppText(text, maxLength = MAX_CHUNK_LENGTH) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= maxLength) return [normalized];

  const chunks = [];
  let remaining = normalized;
  while (remaining.length > maxLength) {
    const window = remaining.slice(0, maxLength + 1);
    let splitAt = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"));
    if (splitAt < Math.floor(maxLength * 0.6)) splitAt = window.lastIndexOf(". ");
    if (splitAt < Math.floor(maxLength * 0.6)) splitAt = maxLength;

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function buildMessage({ title = "", text = "" } = {}) {
  const cleanTitle = String(title || "").trim();
  const cleanText = String(text || "").trim();
  if (!cleanTitle) return cleanText;
  if (!cleanText) return cleanTitle;
  return `${cleanTitle}\n\n${cleanText}`;
}

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authError = requireCoachSecret(req);
  if (authError) return json({ error: authError }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const message = buildMessage(body);
    if (!message) return json({ ok: false, error: "Message text is required." }, 400);

    const to = whatsappRecipient();
    if (!to) return json({ ok: false, error: "WHATSAPP_MORNING_TO or WHATSAPP_ALLOWED_FROM is required." }, 500);

    const chunks = chunkWhatsAppText(message);
    const dryRun = body.dry_run === true;
    const sent = [];
    for (const [index, chunk] of chunks.entries()) {
      const chunkBody = chunks.length === 1 ? chunk : `(${index + 1}/${chunks.length})\n${chunk}`;
      sent.push(dryRun ? { skipped: true, reason: "dry_run" } : await sendWhatsAppText(to, chunkBody));
    }

    return json({
      ok: true,
      dry_run: dryRun,
      recipient: redactPhone(to),
      chunk_count: chunks.length,
      sent,
    });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: err.message || "WhatsApp send failed." }, 500);
  }
}

