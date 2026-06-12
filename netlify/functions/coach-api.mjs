import {
  AppleHealthDailyValidationError,
  ingestAppleHealthDaily,
} from "./apple-health-daily.mjs";
import { buildWeeklyReviewV1 } from "../../lib/weekly-review-lib.mjs";
import {
  buildCoachToday,
  buildMotraDebriefTemplate,
  buildSyncStatus,
  compactDashboard,
  COACH_RESPONSE_VERSION,
  correctCoachObservation,
  createCoachObservation,
  createWorkoutDebrief,
  dashboardFromSupabase,
  getProfile,
  insertCoachMessage,
  json,
  listCoachObservations,
  listWorkoutDebriefs,
  preflight,
  requireCoachSecret,
  retireCoachObservation,
  runCoach,
  supabase,
  updateCoachStateFromFeedback,
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

function normalizeSourceFamily(source = "", fallback = "unknown") {
  const cleaned = String(source || fallback).trim().toLowerCase();
  if (!cleaned) return fallback;
  return cleaned
    .replace(/-[0-9a-f]{8,}$/i, "")
    .replace(/-\d{6,}$/i, "")
    .replace(/-(morning|evening|reading|daily)$/i, "");
}

function canonicalSource(type, source, fallback) {
  const cleaned = cleanSource(source, fallback);
  if (!cleaned.startsWith("vision-")) return cleaned;
  return `${normalizeSourceFamily(cleaned, fallback)}-daily`;
}

function statusForCoachApiError(err) {
  const message = err?.message || "";
  if ([
    "Observation text is required.",
    "A valid observation_id is required.",
    "corrected_observation is required.",
    "Workout debrief payload contains secret-like content.",
    "Motra template payload contains secret-like content.",
    "workout_date must be YYYY-MM-DD.",
    "completion_status is required.",
    "motra_text is required.",
    "session_rpe must be between 1 and 10.",
    "energy_before must be between 1 and 10.",
    "energy_after must be between 1 and 10.",
    "pain_severity must be between 0 and 10.",
  ].includes(message)) return 400;
  if (message === "Coach memory observation was not found.") return 404;
  return 500;
}

function sanitizeMetric(value, { allowNegative = false } = {}) {
  const n = asNumber(value);
  if (n === null) return null;
  if (!allowNegative && n < 0) return null;
  return n;
}

function sanitizeBodyWeightLbs(value) {
  const n = sanitizeMetric(value);
  if (n === null) return null;
  return n < 100 || n > 400 ? null : n;
}

function sanitizeBodyFatPct(value) {
  const n = sanitizeMetric(value);
  if (n === null) return null;
  return n < 2 || n > 60 ? null : n;
}

function normalizeNutritionTotals(row) {
  const protein = sanitizeMetric(row.protein_g);
  const carbs = sanitizeMetric(row.carbs_g);
  const fat = sanitizeMetric(row.fat_g);
  const minCalories = (protein || 0) * 4 + (carbs || 0) * 4 + (fat || 0) * 9;
  let calories = sanitizeMetric(row.calories_kcal);
  let notes = row.notes || null;
  if (calories !== null && minCalories > 0 && calories + 50 < minCalories) {
    calories = null;
    notes = `${notes || ""} Calories cleared because the parsed total was lower than the visible macro calories.`.trim();
  }
  return { ...row, calories_kcal: calories, protein_g: protein, carbs_g: carbs, fat_g: fat, notes };
}

function mergeRows(existing = {}, incoming = {}) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || value === null || value === "") continue;
    if (
      value
      && typeof value === "object"
      && !Array.isArray(value)
      && merged[key]
      && typeof merged[key] === "object"
      && !Array.isArray(merged[key])
    ) {
      merged[key] = mergeRows(merged[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function queryValue(value) {
  return encodeURIComponent(String(value));
}

function dateInTimeZone(date = new Date(), timeZone = "Asia/Taipei") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    iso: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday,
  };
}

function addIsoDays(isoDate, days) {
  const parsed = Date.parse(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed + days * 86400000).toISOString().slice(0, 10);
}

function weekStartForDate(date = new Date(), timeZone = "Asia/Taipei") {
  const { iso, weekday } = dateInTimeZone(date, timeZone);
  const weekdayIndex = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  }[weekday] ?? 0;
  return addIsoDays(iso, -weekdayIndex);
}

function buildWeeklyReviewInput(dashboard = {}, { weekStart, weekEnd, timezone, text = "" } = {}) {
  return {
    ...dashboard,
    week_start: weekStart,
    week_end: weekEnd,
    timezone,
    text,
    profile: dashboard.profile || {},
    nutrition_targets: dashboard.coach_state?.goals,
    strength_logs: dashboard.strength_logs || dashboard.strength_sessions || [],
    recovery_sleep: dashboard.recovery_sleep || dashboard.recovery || [],
    nutrition_log: dashboard.nutrition_log || dashboard.nutrition_days || [],
    apple_health_daily_summaries: dashboard.apple_health_daily_summaries || [],
    apple_health_sync_runs: dashboard.apple_health_sync_runs || [],
    coach_workout_debriefs: dashboard.coach_workout_debriefs || dashboard.workout_debriefs || [],
    coach_observations: dashboard.coach_observations || dashboard.coach_memory || [],
    blood_pressure: dashboard.blood_pressure || dashboard.blood_pressure_readings || [],
    doctor_notes: dashboard.doctor_notes || [],
    planned_sessions: dashboard.planned_sessions || [],
    weekly_session_plans: dashboard.weekly_session_plans || [],
  };
}

function buildWeeklyReviewApiResponse(dashboard = {}, options = {}) {
  const review = buildWeeklyReviewV1(buildWeeklyReviewInput(dashboard, options));
  return {
    ok: true,
    action: "weekly-review",
    status: "review_only",
    week_start: review.week_start,
    week_end: review.week_end,
    timezone: review.timezone,
    review,
    source_coverage: review.source_coverage,
    recommendations: review.recommended_next_week_changes,
    proposed_observations: review.proposed_observations_for_review,
    missing_or_stale_data_warnings: review.missing_or_stale_data_warnings,
    source_hierarchy_warning: review.source_hierarchy_warning,
    not_applied_automatically: true,
    data_lifecycle: {
      persistence: "none",
      supabase_writes: false,
      memory_promotion: "none",
      plan_application: "none",
      openai_call: false,
      external_service_calls: false,
    },
  };
}

async function fetchExisting(table, selectFields, filters = {}) {
  const query = Object.entries(filters)
    .map(([key, value]) => `${key}=eq.${queryValue(value)}`)
    .join("&");
  try {
    const rows = await supabase(`${table}?select=${selectFields}&${query}&limit=1`);
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;

  const url = new URL(req.url);
  const pathAction = url.pathname.split("/").filter(Boolean).pop();
  const action = url.searchParams.get("action")
    || (["ping", "dashboard", "sync-status", "coach-today", "weekly-review", "message", "feedback", "intake", "apple-health-daily", "brief", "workout", "nutrition-closeout", "post-workout", "workout-debrief", "workout-debriefs", "motra-template", "observations", "memory"].includes(pathAction) ? pathAction : null)
    || "dashboard";

  if (req.method === "GET" && action === "ping") {
    return json({
      ok: true,
      action: "ping",
      version: COACH_RESPONSE_VERSION,
    });
  }

  const authError = requireCoachSecret(req);
  if (authError) return json({ error: authError }, 401);

  try {
    if (req.method === "GET" && ["dashboard", "sync-status", "coach-today", "weekly-review"].includes(action)) {
      const dashboard = await dashboardFromSupabase({ readOnly: action === "weekly-review" });
      if (!dashboard) return json({ error: "No Supabase profile found. Run the importer first." }, 404);
      if (action === "sync-status") return json(buildSyncStatus(dashboard));
      if (action === "coach-today") return json(buildCoachToday(dashboard));
      if (action === "weekly-review") {
        const timezone = url.searchParams.get("timezone") || dashboard.profile?.timezone || "Asia/Taipei";
        const weekStart = url.searchParams.get("week_start") || url.searchParams.get("weekStart") || weekStartForDate(new Date(), timezone);
        return json(buildWeeklyReviewApiResponse(dashboard, {
          weekStart,
          weekEnd: url.searchParams.get("week_end") || url.searchParams.get("weekEnd") || null,
          timezone,
          text: url.searchParams.get("text") || "",
        }));
      }
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
      return json({ ok: true, reply: decision.reply, coach_memory_context: decision.coach_memory_context, workout_debrief_context: decision.workout_debrief_context, exercise_coaching_readout: decision.exercise_coaching_readout || [], decision });
    }

    if (req.method === "POST" && ["record-observation", "observations"].includes(action)) {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json().catch(() => ({}));
      const observation = await createCoachObservation(profile.id, body);
      return json({ ok: true, action: "record-observation", observation });
    }

    if (req.method === "GET" && ["list-memory", "memory"].includes(action)) {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const memories = await listCoachObservations(profile.id, {
        status: url.searchParams.get("status") || "active",
        category: url.searchParams.get("category") || "",
        limit: url.searchParams.get("limit") || 20,
        includeDataSync: url.searchParams.get("include_data_sync") === "1",
      });
      return json({ ok: true, action: "list-memory", count: memories.length, memories });
    }

    if (req.method === "POST" && action === "correct-memory") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json().catch(() => ({}));
      const observation = await correctCoachObservation(profile.id, body);
      return json({ ok: true, action: "correct-memory", observation });
    }

    if (req.method === "POST" && action === "retire-memory") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json().catch(() => ({}));
      const observation = await retireCoachObservation(profile.id, body);
      return json({ ok: true, action: "retire-memory", observation });
    }

    if (req.method === "POST" && action === "workout-debrief") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json().catch(() => ({}));
      const result = await createWorkoutDebrief(profile.id, body);
      return json({ action: "record-workout-debrief", ...result });
    }

    if (req.method === "GET" && action === "workout-debriefs") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const debriefs = await listWorkoutDebriefs(profile.id, {
        limit: url.searchParams.get("limit") || 10,
      });
      return json({ ok: true, action: "list-workout-debriefs", count: debriefs.length, debriefs });
    }

    if (req.method === "POST" && action === "motra-template") {
      const body = await req.json().catch(() => ({}));
      return json(buildMotraDebriefTemplate(body));
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
      return json({ ok: true, action, reply: decision.reply, coach_memory_context: decision.coach_memory_context, workout_debrief_context: decision.workout_debrief_context, exercise_coaching_readout: decision.exercise_coaching_readout || [], decision });
    }

    if (req.method === "POST" && action === "feedback") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json();
      const row = {
        profile_id: profile.id,
        session_date: body.date,
        rating_label: body.rating_label || body.rating || null,
        completed_minutes: asNumber(body.completed_minutes || body.minutes),
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
      if (inserted?.[0]) {
        await updateCoachStateFromFeedback(profile.id, inserted[0]);
      }
      return json({ ok: true, feedback: inserted?.[0] || null });
    }

    if (req.method === "POST" && action === "apple-health-daily") {
      const profile = await getProfile();
      if (!profile) return json({ error: "No Supabase profile found." }, 404);
      const body = await req.json().catch(() => ({}));
      try {
        return json(await ingestAppleHealthDaily(profile, body));
      } catch (err) {
        if (err instanceof AppleHealthDailyValidationError) {
          return json({
            ok: false,
            sync_run_id: err.syncRunId || null,
            error: err.message,
            errors: err.errors || [],
          }, 400);
        }
        throw err;
      }
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
        const row = {
          profile_id: profile.id,
          measured_date: date,
          measured_at: body.measured_at || now.toISOString(),
          systolic_mmhg: Math.round(systolic),
          diastolic_mmhg: Math.round(diastolic),
          heart_rate_bpm: asInteger(body.heart_rate),
          source: canonicalSource(type, body.source, "daily-bp"),
          doctor_review_flag: true,
          notes: body.notes || null,
          raw: body,
        };
        results.push({ blood_pressure: (await supabase("blood_pressure_readings", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null });
      } else if (type === "food") {
        const source = canonicalSource(type, body.source, "bevel-daily");
        const calories = sanitizeMetric(body.calories);
        const protein = sanitizeMetric(body.protein);
        const carbs = sanitizeMetric(body.carbs);
        const fat = sanitizeMetric(body.fat);
        let row = {
          profile_id: profile.id,
          log_date: date,
          source,
          completeness: body.completeness || "partial",
          calories_kcal: calories,
          protein_g: protein,
          carbs_g: carbs,
          fat_g: fat,
          fiber_g: sanitizeMetric(body.fiber),
          sodium_mg: sanitizeMetric(body.sodium),
          notes: calories === null && Number(body.calories) < 0
            ? `${body.notes || ""} Negative calorie intake was treated as invalid and cleared.`.trim()
            : body.notes || null,
          raw: body,
        };
        row = normalizeNutritionTotals(row);
        const existing = await fetchExisting("nutrition_days", "*", {
          profile_id: profile.id,
          log_date: date,
          source,
        });
        const mergedRow = mergeRows(existing || {}, row);
        const nutrition = (await supabase("nutrition_days?on_conflict=profile_id,log_date,source", {
          method: "POST",
          body: JSON.stringify([mergedRow]),
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
        const source = canonicalSource(type, body.source, body.method || "body-comp");
        const row = {
          profile_id: profile.id,
          measured_date: date,
          measured_time: body.measured_time || null,
          source,
          method: body.method || "bevel",
          confidence_tier: body.confidence_tier ? Math.round(Number(body.confidence_tier)) : 2,
          weight_lbs: sanitizeBodyWeightLbs(body.weight_lbs),
          body_fat_pct: sanitizeBodyFatPct(body.body_fat_pct),
          lean_mass_lbs: sanitizeMetric(body.lean_mass_lbs),
          visceral_fat_g: sanitizeMetric(body.visceral_fat_g),
          visceral_fat_level: sanitizeMetric(body.visceral_fat_level),
          skeletal_muscle_lbs: sanitizeMetric(body.skeletal_muscle_lbs),
          trunk_muscle_lbs: sanitizeMetric(body.trunk_muscle_lbs),
          body_water_pct: sanitizeMetric(body.body_water_pct),
          notes: body.notes || null,
          raw: body,
        };
        const existing = await fetchExisting("body_comp_measurements", "*", {
          profile_id: profile.id,
          measured_date: date,
          source,
        });
        const mergedRow = mergeRows(existing || {}, row);
        results.push({ body: (await supabase("body_comp_measurements?on_conflict=profile_id,measured_date,source", {
          method: "POST",
          body: JSON.stringify([mergedRow]),
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
        const feedback = (await supabase("session_feedback", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null;
        if (feedback) {
          await updateCoachStateFromFeedback(profile.id, feedback);
        }
        results.push({ feedback });
      } else if (type === "recovery") {
        const source = canonicalSource(type, body.source, "vision-recovery");
        const row = {
          profile_id: profile.id,
          measured_date: date,
          source,
          recovery_score_pct: sanitizeMetric(body.recovery_score_pct),
          sleep_score_pct: sanitizeMetric(body.sleep_score_pct),
          hrv_ms: sanitizeMetric(body.hrv_ms),
          resting_hr_bpm: sanitizeMetric(body.resting_hr_bpm),
          respiratory_rate_rpm: sanitizeMetric(body.respiratory_rate_rpm),
          spo2_pct: sanitizeMetric(body.spo2_pct),
          wrist_temp_f: sanitizeMetric(body.wrist_temp_f),
          total_sleep_min: asInteger(body.total_sleep_min),
          time_in_bed_min: asInteger(body.time_in_bed_min),
          sleep_efficiency_pct: sanitizeMetric(body.sleep_efficiency_pct),
          deep_sleep_min: asInteger(body.deep_sleep_min),
          rem_sleep_min: asInteger(body.rem_sleep_min),
          sleep_bank_min: asInteger(body.sleep_bank_min),
          readiness_tier: body.readiness_tier || null,
          notes: body.notes || null,
          raw: body,
        };
        const existing = await fetchExisting("recovery_sleep", "*", {
          profile_id: profile.id,
          measured_date: date,
          source,
        });
        const mergedRow = mergeRows(existing || {}, row);
        results.push({ recovery: (await supabase("recovery_sleep?on_conflict=profile_id,measured_date,source", {
          method: "POST",
          body: JSON.stringify([mergedRow]),
        }))?.[0] || null });
      } else if (type === "activity") {
        const row = {
          profile_id: profile.id,
          activity_date: date,
          source: canonicalSource(type, body.source, "vision-activity"),
          activity_type: body.activity_type || body.name || "Activity",
          start_time: body.start_time || null,
          duration_min: sanitizeMetric(body.duration_min),
          distance_mi: sanitizeMetric(body.distance_mi),
          avg_heart_rate_bpm: sanitizeMetric(body.avg_heart_rate_bpm || body.avg_hr_bpm),
          peak_heart_rate_bpm: sanitizeMetric(body.peak_heart_rate_bpm || body.max_hr_bpm),
          active_calories_kcal: sanitizeMetric(body.active_calories_kcal || body.calories_kcal),
          effort_level: body.effort_level || null,
          notes: body.notes || null,
          raw: body,
        };
        results.push({ activity: (await supabase("activity_sessions?on_conflict=profile_id,activity_date,source,activity_type,start_time", {
          method: "POST",
          body: JSON.stringify([row]),
        }))?.[0] || null });
      } else if (type === "strength") {
        const source = canonicalSource(type, body.source, "vision-strength");
        const row = {
          profile_id: profile.id,
          session_date: date,
          source,
          session_name: body.session_name || body.name || "Strength Training",
          session_type: body.session_type || "strength",
          start_time: body.start_time || null,
          duration_min: sanitizeMetric(body.duration_min),
          total_volume_kg: sanitizeMetric(body.total_volume_kg || body.volume_kg),
          total_reps: asInteger(body.total_reps),
          avg_hr_bpm: sanitizeMetric(body.avg_hr_bpm || body.average_hr_bpm),
          max_hr_bpm: sanitizeMetric(body.max_hr_bpm || body.peak_hr_bpm),
          calories_kcal: sanitizeMetric(body.calories_kcal),
          motra_url: body.motra_url || null,
          coaching_note: body.coaching_note || body.notes || null,
          raw: body,
        };
        const existing = await fetchExisting("strength_sessions", "*", {
          profile_id: profile.id,
          session_date: date,
          source,
          session_name: row.session_name,
        });
        const mergedRow = mergeRows(existing || {}, row);
        const session = (await supabase("strength_sessions?on_conflict=profile_id,session_date,source,session_name", {
          method: "POST",
          body: JSON.stringify([mergedRow]),
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
    const status = statusForCoachApiError(err);
    if (status >= 500) console.error(err);
    return json({ error: err.message || "Coach API error." }, status);
  }
}

export const config = {
  path: "/api/coach",
  method: ["GET", "POST", "OPTIONS"],
};
