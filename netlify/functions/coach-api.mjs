import {
  compactDashboard,
  dashboardFromSupabase,
  getProfile,
  insertCoachMessage,
  json,
  parseMotraText,
  preflight,
  requireCoachSecret,
  runCoach,
  supabase,
} from "./_coach-lib.mjs";

function asNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asInteger(value) {
  const n = asNumber(value);
  return n === null ? null : Math.round(n);
}

function cleanSource(value, fallback) {
  return String(value || fallback || "mobile-intake").trim().slice(0, 120);
}

async function storeMotraDebrief(profileId, body = {}) {
  if (!body.motra_text) return {};
  const parsed = parseMotraText(body.motra_text);
  const source = cleanSource(body.source, "motra-shortcut");
  const sessionRow = {
    profile_id: profileId,
    session_date: body.date || parsed.session_date,
    source,
    session_name: parsed.session_name,
    session_type: body.session_type || "strength",
    duration_min: asNumber(body.completed_minutes) || parsed.duration_min,
    total_volume_kg: parsed.total_volume_kg,
    calories_kcal: parsed.calories_kcal,
    motra_url: parsed.motra_url,
    coaching_note: body.debrief_notes || body.notes || null,
    raw: { ...parsed, shortcut_payload: body },
  };
  const session = (await supabase("strength_sessions?on_conflict=profile_id,session_date,source,session_name", {
    method: "POST",
    body: JSON.stringify([sessionRow]),
  }))?.[0] || null;

  let exercises = [];
  if (session?.id && parsed.exercises.length) {
    await supabase(`strength_exercises?strength_session_id=eq.${session.id}`, { method: "DELETE" });
    exercises = await supabase("strength_exercises", {
      method: "POST",
      body: JSON.stringify(parsed.exercises.map((exercise, index) => ({
        strength_session_id: session.id,
        exercise_order: index + 1,
        name: exercise.name,
        notes: (body.exercise_feedback || []).find(item => item.name === exercise.name)?.note || null,
        raw: exercise,
      }))),
    });
  }

  const feedback = (await supabase("session_feedback", {
    method: "POST",
    body: JSON.stringify([{
      profile_id: profileId,
      session_date: body.date || parsed.session_date,
      rating_label: body.rating_label || null,
      completed_minutes: asNumber(body.completed_minutes) || parsed.duration_min,
      best_movement: body.best_movement || null,
      worst_movement: body.worst_movement || null,
      pain_notes: body.pain_notes || null,
      difficulty: body.difficulty || null,
      freeform_note: body.debrief_notes || body.notes || null,
      source,
      raw: { parsed_motra: parsed, exercise_feedback: body.exercise_feedback || [], payload: body },
    }]),
  }))?.[0] || null;

  return { parsed_motra: parsed, strength_session: session, strength_exercises: exercises, feedback };
}

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;

  const authError = requireCoachSecret(req);
  if (authError) return json({ error: authError }, 401);

  try {
    const url = new URL(req.url);
    const pathAction = url.pathname.split("/").filter(Boolean).pop();
    const action = url.searchParams.get("action")
      || (["dashboard", "message", "feedback", "intake", "brief", "workout", "nutrition-closeout", "post-workout"].includes(pathAction) ? pathAction : null)
      || "dashboard";

    if (req.method === "GET" && action === "dashboard") {
      const dashboard = await dashboardFromSupabase();
      if (!dashboard) return json({ error: "No Supabase profile found. Run the importer first." }, 404);
      const isFull = url.searchParams.get("full") === "1";
      return json({
        dashboard: isFull ? dashboard : compactDashboard(dashboard),
        source: "supabase",
        mode: isFull ? "full" : "compact",
      });
    }

    if (req.method === "POST" && action === "message") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json();
      const text = String(body.text || "").trim();
      if (!text) return json({ error: "Message text is required." }, 400);
      await insertCoachMessage(profile.id, "user", text, body.channel || "web", body.raw || {});
      const dashboard = await dashboardFromSupabase();
      const decision = await runCoach({
        profileId: profile.id,
        text,
        intent: body.intent || "general",
        dashboard: dashboard || {},
        payload: body,
        channel: body.channel || "web",
      });
      await insertCoachMessage(profile.id, "coach", decision.reply, body.channel || "web", { in_reply_to: text, decision });
      return json({ ok: true, reply: decision.reply, decision });
    }

    if (req.method === "POST" && ["brief", "workout", "nutrition-closeout", "post-workout"].includes(action)) {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json().catch(() => ({}));
      const dashboard = await dashboardFromSupabase();
      const intentMap = {
        brief: "brief",
        workout: "build_workout",
        "nutrition-closeout": "nutrition_check",
        "post-workout": "post_workout",
      };
      const text = String(body.text || body.summary || action).trim();
      const stored = action === "post-workout" ? await storeMotraDebrief(profile.id, body) : {};
      await insertCoachMessage(profile.id, "user", text, body.channel || `api-${action}`, body.raw || body);
      const decision = await runCoach({
        profileId: profile.id,
        text,
        intent: body.intent || intentMap[action],
        dashboard: dashboard || {},
        payload: body,
        channel: body.channel || `api-${action}`,
      });
      await insertCoachMessage(profile.id, "coach", decision.reply, body.channel || `api-${action}`, { in_reply_to: text, decision });
      return json({ ok: true, action, reply: decision.reply, decision, stored });
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
          heart_rate_bpm: asInteger(body.heart_rate),
          source: cleanSource(body.source, `mobile-intake-${slot}-${suffix}`),
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
          source: cleanSource(body.source, "bevel-mobile"),
          completeness: body.completeness || "partial",
          calories_kcal: asNumber(body.calories),
          protein_g: asNumber(body.protein),
          carbs_g: asNumber(body.carbs),
          fat_g: asNumber(body.fat),
          fiber_g: asNumber(body.fiber),
          sodium_mg: asNumber(body.sodium),
          notes: body.notes || null,
          raw: body,
        };
        const nutrition = (await supabase("nutrition_days?on_conflict=profile_id,log_date,source", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null;
        results.push({ nutrition });
        if (nutrition?.id && Array.isArray(body.meals) && body.meals.length) {
          const meals = body.meals.map(meal => ({
            nutrition_day_id: nutrition.id,
            meal_time: meal.meal_time || null,
            name: meal.name || meal.meal_name || "Meal",
            calories_kcal: asNumber(meal.calories || meal.calories_kcal),
            protein_g: asNumber(meal.protein || meal.protein_g),
            carbs_g: asNumber(meal.carbs || meal.carbs_g),
            fat_g: asNumber(meal.fat || meal.fat_g),
            source: cleanSource(meal.source || body.source, "bevel-mobile"),
            coach_callout: meal.coach_callout || null,
            raw: meal,
          }));
          results.push({ meals: await supabase("meals", {
            method: "POST",
            body: JSON.stringify(meals),
          }) });
        }
      } else if (type === "body") {
        const row = {
          profile_id: profile.id,
          measured_date: date,
          measured_time: body.measured_time || null,
          source: cleanSource(body.source, "bevel-mobile"),
          method: body.method || "bevel",
          confidence_tier: body.confidence_tier ? Math.round(Number(body.confidence_tier)) : 2,
          weight_lbs: asNumber(body.weight_lbs),
          body_fat_pct: asNumber(body.body_fat_pct),
          lean_mass_lbs: asNumber(body.lean_mass_lbs),
          visceral_fat_g: asNumber(body.visceral_fat_g),
          visceral_fat_level: asNumber(body.visceral_fat_level),
          skeletal_muscle_lbs: asNumber(body.skeletal_muscle_lbs),
          trunk_muscle_lbs: asNumber(body.trunk_muscle_lbs),
          body_water_pct: asNumber(body.body_water_pct),
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
          completed_minutes: asNumber(body.completed_minutes),
          best_movement: body.best_movement || null,
          worst_movement: body.worst_movement || null,
          pain_notes: body.pain_notes || null,
          difficulty: body.difficulty || body.rating_label || null,
          freeform_note: body.notes || null,
          source: cleanSource(body.source, "mobile-intake"),
          raw: body,
        };
        results.push({ feedback: (await supabase("session_feedback", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null });
      } else if (type === "recovery") {
        const row = {
          profile_id: profile.id,
          measured_date: date,
          source: cleanSource(body.source, "vision-recovery"),
          recovery_score_pct: asNumber(body.recovery_score_pct),
          sleep_score_pct: asNumber(body.sleep_score_pct),
          hrv_ms: asNumber(body.hrv_ms),
          resting_hr_bpm: asNumber(body.resting_hr_bpm),
          respiratory_rate_rpm: asNumber(body.respiratory_rate_rpm),
          spo2_pct: asNumber(body.spo2_pct),
          wrist_temp_f: asNumber(body.wrist_temp_f),
          total_sleep_min: asInteger(body.total_sleep_min),
          time_in_bed_min: asInteger(body.time_in_bed_min),
          sleep_efficiency_pct: asNumber(body.sleep_efficiency_pct),
          deep_sleep_min: asInteger(body.deep_sleep_min),
          rem_sleep_min: asInteger(body.rem_sleep_min),
          sleep_bank_min: asInteger(body.sleep_bank_min),
          readiness_tier: body.readiness_tier || null,
          notes: body.notes || null,
          raw: body,
        };
        results.push({ recovery: (await supabase("recovery_sleep?on_conflict=profile_id,measured_date,source", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null });
      } else if (type === "activity") {
        const row = {
          profile_id: profile.id,
          activity_date: date,
          source: cleanSource(body.source, "vision-activity"),
          activity_type: body.activity_type || body.name || "Activity",
          start_time: body.start_time || null,
          duration_min: asNumber(body.duration_min),
          distance_mi: asNumber(body.distance_mi),
          avg_heart_rate_bpm: asNumber(body.avg_heart_rate_bpm || body.avg_hr_bpm),
          peak_heart_rate_bpm: asNumber(body.peak_heart_rate_bpm || body.max_hr_bpm),
          active_calories_kcal: asNumber(body.active_calories_kcal || body.calories_kcal),
          effort_level: body.effort_level || null,
          notes: body.notes || null,
          raw: body,
        };
        results.push({ activity: (await supabase("activity_sessions?on_conflict=profile_id,activity_date,source,activity_type,start_time", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null });
      } else if (type === "strength") {
        const row = {
          profile_id: profile.id,
          session_date: date,
          source: cleanSource(body.source, "vision-strength"),
          session_name: body.session_name || body.name || "Strength Training",
          session_type: body.session_type || "strength",
          start_time: body.start_time || null,
          duration_min: asNumber(body.duration_min),
          total_volume_kg: asNumber(body.total_volume_kg || body.volume_kg),
          total_reps: asInteger(body.total_reps),
          avg_hr_bpm: asNumber(body.avg_hr_bpm || body.average_hr_bpm),
          max_hr_bpm: asNumber(body.max_hr_bpm || body.peak_hr_bpm),
          calories_kcal: asNumber(body.calories_kcal),
          motra_url: body.motra_url || null,
          coaching_note: body.coaching_note || body.notes || null,
          raw: body,
        };
        const session = (await supabase("strength_sessions?on_conflict=profile_id,session_date,source,session_name", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null;
        results.push({ strength: session });
        if (session?.id && Array.isArray(body.exercises) && body.exercises.length) {
          const exercises = body.exercises.map((exercise, index) => ({
            strength_session_id: session.id,
            exercise_order: asInteger(exercise.exercise_order) || index + 1,
            name: exercise.name || "Exercise",
            category: exercise.category || null,
            notes: exercise.notes || null,
            raw: exercise,
          }));
          const insertedExercises = await supabase("strength_exercises", {
            method: "POST",
            body: JSON.stringify(exercises),
          });
          results.push({ exercises: insertedExercises });
        }
      } else if (type === "doctor") {
        const row = {
          profile_id: profile.id,
          note_date: date,
          topic: body.topic || body.summary || "Medical note",
          guidance: body.guidance || body.notes || null,
          training_impact: body.training_impact || null,
          raw: body,
        };
        results.push({ doctor_note: (await supabase("doctor_notes", {
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
