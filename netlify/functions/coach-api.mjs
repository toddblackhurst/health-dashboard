import {
  coachReply,
  dashboardFromSupabase,
  getProfile,
  insertCoachMessage,
  json,
  preflight,
  requireCoachSecret,
  supabase,
} from "./_coach-lib.mjs";

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;

  const authError = requireCoachSecret(req);
  if (authError) return json({ error: authError }, 401);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "dashboard";

    if (req.method === "GET" && action === "dashboard") {
      const dashboard = await dashboardFromSupabase();
      if (!dashboard) return json({ error: "No Supabase profile found. Run the importer first." }, 404);
      return json({ dashboard, source: "supabase" });
    }

    if (req.method === "POST" && action === "message") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json();
      const text = String(body.text || "").trim();
      if (!text) return json({ error: "Message text is required." }, 400);
      await insertCoachMessage(profile.id, "user", text, body.channel || "web", body.raw || {});
      const dashboard = await dashboardFromSupabase();
      const reply = coachReply(text, dashboard || {});
      await insertCoachMessage(profile.id, "coach", reply, body.channel || "web", { in_reply_to: text });
      return json({ ok: true, reply });
    }

    if (req.method === "POST" && action === "feedback") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json();
      const row = {
        profile_id: profile.id,
        session_date: body.date,
        rating_label: body.rating_label || body.rating || null,
        completed_minutes: body.completed_minutes || body.minutes || null,
        best_movement: body.best_movement || null,
        worst_movement: body.worst_movement || null,
        pain_notes: body.pain_notes || null,
        difficulty: body.difficulty || body.rating_label || null,
        freeform_note: body.note || body.freeform_note || null,
        source: body.source || "web",
        raw: body,
      };
      if (!row.session_date) return json({ error: "Feedback date is required." }, 400);
      const inserted = await supabase("session_feedback", {
        method: "POST",
        body: JSON.stringify([row]),
      });
      return json({ ok: true, feedback: inserted?.[0] || null });
    }

    return json({ error: "Not found." }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: err.message || "Coach API error." }, 500);
  }
}

export const config = {
  path: "/api/coach",
  method: ["GET", "POST", "OPTIONS"],
};
