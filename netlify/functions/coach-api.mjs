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
    const pathAction = url.pathname.split("/").filter(Boolean).pop();
    const action = url.searchParams.get("action")
      || (["dashboard", "message", "feedback", "intake"].includes(pathAction) ? pathAction : null)
      || "dashboard";

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

    if (req.method === "POST" && action === "intake") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json();
      const type = String(body.type || "note").trim().toLowerCase();
      const date = body.date || new Date().toISOString().slice(0, 10);
      const now = new Date();
      const results = [];

      if (type === "bp") {
        const systolic = Number(body.systolic);
        const diastolic = Number(body.diastolic);
        if (!systolic || !diastolic) return json({ error: "BP requires systolic and diastolic." }, 400);
        const slot = String(body.slot || "reading").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const suffix = now.toISOString().slice(11, 19).replace(/:/g, "");
        const row = {
          profile_id: profile.id,
          measured_date: date,
          measured_at: body.measured_at || now.toISOString(),
          systolic_mmhg: Math.round(systolic),
          diastolic_mmhg: Math.round(diastolic),
          heart_rate_bpm: body.heart_rate ? Math.round(Number(body.heart_rate)) : null,
          source: `mobile-intake-${slot}-${suffix}`,
          doctor_review_flag: true,
          notes: body.notes || null,
          raw: body,
        };
        results.push({ blood_pressure: (await supabase("blood_pressure_readings", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null });
      } else if (type === "food") {
        const row = {
          profile_id: profile.id,
          log_date: date,
          source: "bevel-mobile",
          completeness: body.completeness || "partial",
          calories_kcal: body.calories ? Number(body.calories) : null,
          protein_g: body.protein ? Number(body.protein) : null,
          carbs_g: body.carbs ? Number(body.carbs) : null,
          fat_g: body.fat ? Number(body.fat) : null,
          fiber_g: body.fiber ? Number(body.fiber) : null,
          sodium_mg: body.sodium ? Number(body.sodium) : null,
          notes: body.notes || null,
          raw: body,
        };
        results.push({ nutrition: (await supabase("nutrition_days?on_conflict=profile_id,log_date,source", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null });
      } else if (type === "body") {
        const row = {
          profile_id: profile.id,
          measured_date: date,
          source: "bevel-mobile",
          method: "bevel",
          confidence_tier: 2,
          weight_lbs: body.weight_lbs ? Number(body.weight_lbs) : null,
          body_fat_pct: body.body_fat_pct ? Number(body.body_fat_pct) : null,
          lean_mass_lbs: body.lean_mass_lbs ? Number(body.lean_mass_lbs) : null,
          visceral_fat_level: body.visceral_fat_level ? Number(body.visceral_fat_level) : null,
          notes: body.notes || null,
          raw: body,
        };
        results.push({ body: (await supabase("body_comp_measurements?on_conflict=profile_id,measured_date,source", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null });
      } else if (type === "workout") {
        const row = {
          profile_id: profile.id,
          session_date: date,
          rating_label: body.rating_label || null,
          completed_minutes: body.completed_minutes ? Number(body.completed_minutes) : null,
          best_movement: body.best_movement || null,
          worst_movement: body.worst_movement || null,
          pain_notes: body.pain_notes || null,
          difficulty: body.difficulty || body.rating_label || null,
          freeform_note: body.notes || null,
          source: "mobile-intake",
          raw: body,
        };
        results.push({ feedback: (await supabase("session_feedback", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null });
      }

      const summary = body.summary || body.notes || `${type} intake submitted for ${date}`;
      await insertCoachMessage(profile.id, "user", summary, `mobile-${type}`, { intake: body, results });
      return json({ ok: true, type, results });
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
