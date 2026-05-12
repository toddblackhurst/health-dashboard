const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,x-coach-secret",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export const COACH_RESPONSE_VERSION = "coach-brain-v1";

export const DEFAULT_COACH_STATE = {
  version: "2026-05-12-pro-coach-v2",
  goals: {
    priority_order: ["VAT loss", "muscle retention/gain", "conditioning", "mobility", "aesthetics"],
    ninety_day_win: "Belly/waist shrinks by 1-2 inches by about 2026-08-01.",
    protein_floor_g: 150,
    training_day_protein_range_g: [160, 180],
    fat_budget_g: 70,
  },
  source_hierarchy: {
    readiness: ["Oura overnight physiology", "subjective pain/fatigue", "Bevel Apple-derived recovery", "Apple Fitness workload"],
    nutrition: "Bevel",
    workout_history: "Motra",
    body_composition: "Hume/Ocare trend only; do not overreact to one-day BIA body-fat swings.",
  },
  training_model: {
    weekly_bias: "60% strength / 40% athletic-functional",
    default_session_target_min: 68,
    session_range_min: [60, 75],
    strength_hr_cap_bpm: 122,
    weekly_shape: {
      monday: "Full-body strength + power",
      wednesday: "Posterior/pull + unilateral correction",
      friday: "Athletic hybrid + compound strength",
      tue_thu_sat: "Walking/cycling zone-2 base; intervals only on green readiness",
      sunday: "Formal training off",
    },
    non_negotiables: [
      "Left side leads unilateral work.",
      "Hip-safe alternatives are pre-wired.",
      "No cross-floor supersets.",
      "Every gym workout has an obvious athletic/functional element.",
      "Every gym workout includes trunk/carry or anti-rotation work.",
      "Use exact Motra exercise names when known.",
    ],
  },
  gym_profile: {
    default_environment: "World Gym Taichung",
    travel_mode: false,
    travel_rule: "When travel_mode is true, ask for hotel-gym inventory before building a strength session and ignore World Gym floor routing.",
    preferred_floor: "Floor 3 functional floor",
    floors: {
      "Floor 1": {
        role: "Machines + cardio / low-fatigue accessory and cool-down zone",
        equipment: ["Cybex selectorized machines", "Matrix 8-station multi-gym", "treadmills", "upright bikes", "recumbent bikes"],
      },
      "Floor 2": {
        role: "Primary strength floor",
        equipment: [
          "Hammer Strength plate-loaded chest/back/shoulder/lower machines",
          "Matrix power rack",
          "Matrix squat rack",
          "Smith machine",
          "landmine attachment",
          "Matrix glute trainer",
          "full dumbbell set",
          "adjustable benches",
          "pull-up station",
        ],
      },
      "Floor 3": {
        role: "Functional + athletic + cable zone",
        equipment: [
          "Matrix functional trainer",
          "Hoist ROC-IT machines",
          "kettlebells 4-24 kg",
          "ViPR tubes",
          "medicine/slam balls",
          "soft plyo boxes",
          "BOSU",
          "TRX attachment with sliding-anchor caution",
        ],
      },
    },
    avoid_items: [
      "TRX Row to T because the Floor 3 anchor slides under load; use Rope Cable Face Pull to W.",
      "KB Sumo Deadlift unless Todd explicitly requests it.",
      "Landmine Reverse Lunge unless Todd explicitly requests it.",
      "Deep loaded hip flexion.",
      "Punishment circuits, AMRAP finishers, and session creep.",
    ],
    motra_names: {
      pull_up: "Pull-Up",
      chest_supported_row: "Dumbbell Chest-Supported Row",
      hip_thrust: "Machine Hip Thrust (Glute Bridge)",
      cable_chop_high_low: "Cable Chop High to Low",
      face_pull_w: "Rope Cable Face Pull to W",
      suitcase_carry: "Kettlebell Suitcase Carry",
      front_rack_carry: "Kettlebell Front-Rack Carry",
      kettlebell_swing: "Kettlebell Swing",
      med_ball_slam: "Medicine Ball Slam",
      incline_press: "Dumbbell Incline Bench Press",
      pallof_hold: "Cable Pallof Hold",
    },
  },
  active_medical: {
    hip: "Right hip impingement / possible labral involvement pending imaging. Avoid deep loaded hip flexion and anterior hip pinching.",
    bp: "Doctor requested 7 days of home BP; currently stable enough to keep training unless readings or symptoms worsen.",
    asthma: "No recent flare; Relvar daily and rescue inhaler access matter before intensity.",
    migraine: "Migraine day is rest or major downgrade.",
  },
  coaching_style: {
    voice: "Direct, practical, warm, no filler motivation.",
    correction_rule: "Correct once with the fix attached, then move on.",
  },
  adaptations: {
    updated_at: null,
    preferred_session_cap_min: 60,
    active_rules: [
      "Every strength day starts with 8-12 minutes of hip-safe prehab before the main work.",
      "Cut optional accessories or the finisher before cutting prehab.",
    ],
    exercise_adjustments: {},
  },
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export function env(name) {
  return globalThis.Netlify?.env?.get(name) || process.env[name] || "";
}

export function preflight(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  return null;
}

export function requireCoachSecret(req) {
  const expected = env("COACH_API_SECRET");
  if (!expected) return "COACH_API_SECRET is not configured.";
  const supplied = req.headers.get("x-coach-secret") || "";
  if (supplied !== expected) return "Invalid coach API secret.";
  return "";
}

export async function supabase(path, options = {}) {
  const url = env("SUPABASE_URL").replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${text}`);
  return body;
}

async function safeSupabase(path, options = {}, fallback = null) {
  try {
    return await supabase(path, options);
  } catch (err) {
    console.warn(`Optional Supabase call skipped: ${err.message}`);
    return fallback;
  }
}

function cloneJson(value, fallback = null) {
  if (value === undefined || value === null) return fallback;
  return JSON.parse(JSON.stringify(value));
}

function mergeObjects(base = {}, patch = {}) {
  if (Array.isArray(base) || Array.isArray(patch)) return cloneJson(patch, patch);
  const out = { ...(base || {}) };
  for (const [key, value] of Object.entries(patch || {})) {
    if (value === undefined) continue;
    if (
      value
      && typeof value === "object"
      && !Array.isArray(value)
      && out[key]
      && typeof out[key] === "object"
      && !Array.isArray(out[key])
    ) {
      out[key] = mergeObjects(out[key], value);
    } else {
      out[key] = cloneJson(value, value);
    }
  }
  return out;
}

function normalizeSourceFamily(source = "", fallback = "unknown") {
  const cleaned = String(source || fallback).trim().toLowerCase();
  if (!cleaned) return fallback;
  return cleaned
    .replace(/-[0-9a-f]{8,}$/i, "")
    .replace(/-\d{6,}$/i, "")
    .replace(/-(morning|evening|reading|daily)$/i, "");
}

function valueScore(value) {
  if (value === undefined || value === null || value === "") return 0;
  if (Array.isArray(value)) return value.length ? 2 : 0;
  if (typeof value === "object") return Object.keys(value).length ? 2 : 0;
  if (typeof value === "string") return value.trim() ? 1 : 0;
  return 1;
}

function rowCompleteness(row = {}) {
  return Object.values(row).reduce((score, value) => score + valueScore(value), 0);
}

function mergePreferDefined(base = {}, patch = {}) {
  const merged = { ...(base || {}) };
  for (const [key, value] of Object.entries(patch || {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      merged[key] = value.length ? value : merged[key];
      continue;
    }
    if (
      value
      && typeof value === "object"
      && merged[key]
      && typeof merged[key] === "object"
      && !Array.isArray(merged[key])
    ) {
      merged[key] = mergePreferDefined(merged[key], value);
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

function normalizeExerciseKey(name = "") {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sentenceList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(v => String(v).trim()).filter(Boolean);
  return String(value || "")
    .split(/[\n;]+/)
    .map(part => part.trim())
    .filter(Boolean);
}

function nextPlannedSession(base = {}, today = todayISO(base.profile?.timezone || "Asia/Taipei")) {
  const sessions = Array.isArray(base.planned_sessions) ? base.planned_sessions : [];
  return sessions.find(session => String(session.planned_date || "") >= today) || sessions[sessions.length - 1] || null;
}

export async function getProfile() {
  const rows = await supabase("profiles?select=*&order=created_at.asc&limit=1");
  return rows?.[0] || null;
}

export async function insertCoachMessage(profileId, role, body, channel = "web", raw = {}) {
  const rows = await supabase("coach_messages", {
    method: "POST",
    body: JSON.stringify([{ profile_id: profileId, role, body, channel, raw }]),
  });
  return rows?.[0] || null;
}

export async function getCoachState(profileId) {
  const rows = await safeSupabase(`coach_state?profile_id=eq.${profileId}&select=*&limit=1`, {}, []);
  if (rows?.[0]) return hydrateCoachState(rows[0]);

  const row = {
    profile_id: profileId,
    version: DEFAULT_COACH_STATE.version,
    goals: DEFAULT_COACH_STATE.goals,
    constraints: {
      active_medical: DEFAULT_COACH_STATE.active_medical,
      training_model: DEFAULT_COACH_STATE.training_model,
    },
    gym_profile: DEFAULT_COACH_STATE.gym_profile,
    source_hierarchy: DEFAULT_COACH_STATE.source_hierarchy,
    avoid_list: DEFAULT_COACH_STATE.gym_profile.avoid_items,
    travel_mode: false,
    active_medical_loops: DEFAULT_COACH_STATE.active_medical,
    raw: DEFAULT_COACH_STATE,
  };
  const inserted = await safeSupabase("coach_state", { method: "POST", body: JSON.stringify([row]) }, null);
  return hydrateCoachState(inserted?.[0] || row);
}

function hydrateCoachState(row = {}) {
  const raw = row.raw && typeof row.raw === "object" ? row.raw : {};
  const constraints = row.constraints || raw.constraints || {};
  return {
    ...DEFAULT_COACH_STATE,
    ...raw,
    version: row.version || raw.version || DEFAULT_COACH_STATE.version,
    goals: { ...DEFAULT_COACH_STATE.goals, ...(row.goals || raw.goals || {}) },
    source_hierarchy: { ...DEFAULT_COACH_STATE.source_hierarchy, ...(row.source_hierarchy || raw.source_hierarchy || {}) },
    training_model: { ...DEFAULT_COACH_STATE.training_model, ...(constraints.training_model || raw.training_model || {}) },
    gym_profile: {
      ...DEFAULT_COACH_STATE.gym_profile,
      ...(row.gym_profile || raw.gym_profile || {}),
      travel_mode: Boolean(row.travel_mode ?? row.gym_profile?.travel_mode ?? raw.gym_profile?.travel_mode ?? false),
    },
    active_medical: { ...DEFAULT_COACH_STATE.active_medical, ...(row.active_medical_loops || raw.active_medical || {}) },
    adaptations: mergeObjects(DEFAULT_COACH_STATE.adaptations, raw.adaptations || {}),
    db_row: row.id ? row : null,
  };
}

export async function saveCoachState(profileId, state) {
  const current = await getCoachState(profileId);
  const { db_row: _currentDbRow, ...currentClean } = current;
  const { db_row: _stateDbRow, ...stateClean } = state;
  const row = {
    profile_id: profileId,
    version: state.version || current.version || DEFAULT_COACH_STATE.version,
    goals: state.goals || current.goals || DEFAULT_COACH_STATE.goals,
    constraints: {
      active_medical: state.active_medical || current.active_medical || DEFAULT_COACH_STATE.active_medical,
      training_model: state.training_model || current.training_model || DEFAULT_COACH_STATE.training_model,
    },
    gym_profile: state.gym_profile || current.gym_profile || DEFAULT_COACH_STATE.gym_profile,
    source_hierarchy: state.source_hierarchy || current.source_hierarchy || DEFAULT_COACH_STATE.source_hierarchy,
    avoid_list: state.gym_profile?.avoid_items || current.gym_profile?.avoid_items || DEFAULT_COACH_STATE.gym_profile.avoid_items,
    travel_mode: Boolean(state.gym_profile?.travel_mode ?? current.gym_profile?.travel_mode ?? false),
    active_medical_loops: state.active_medical || current.active_medical || DEFAULT_COACH_STATE.active_medical,
    raw: {
      ...currentClean,
      ...stateClean,
      active_medical: state.active_medical || current.active_medical || DEFAULT_COACH_STATE.active_medical,
      training_model: state.training_model || current.training_model || DEFAULT_COACH_STATE.training_model,
      adaptations: mergeObjects(current.adaptations || DEFAULT_COACH_STATE.adaptations, state.adaptations || {}),
    },
  };
  const inserted = await supabase("coach_state?on_conflict=profile_id", {
    method: "POST",
    body: JSON.stringify([row]),
  });
  return hydrateCoachState(inserted?.[0] || row);
}

function buildFeedbackAdaptations(feedback = {}, state = DEFAULT_COACH_STATE) {
  const current = mergeObjects(DEFAULT_COACH_STATE.adaptations, state.adaptations || {});
  const next = mergeObjects({}, current);
  next.updated_at = feedback.created_at || feedback.timestamp || new Date().toISOString();
  next.last_feedback_date = feedback.session_date || feedback.date || current.last_feedback_date || null;

  const completedMinutes = Number(feedback.completed_minutes);
  if (Number.isFinite(completedMinutes) && completedMinutes >= 35 && completedMinutes <= 80) {
    next.preferred_session_cap_min = Math.round(completedMinutes);
  }

  const rules = new Set(current.active_rules || []);
  const noteText = [
    feedback.best_movement,
    feedback.worst_movement,
    feedback.pain_notes,
    feedback.freeform_note,
    feedback.raw?.transcript,
    feedback.raw?.extracted?.summary,
    ...(feedback.raw?.extracted?.next_adjustments || []),
  ]
    .filter(Boolean)
    .join(" ");
  const lower = noteText.toLowerCase();

  if (lower.includes("right side") || lower.includes("body shift") || lower.includes("balance")) {
    rules.add("Right-side balance issues need supported, slower unilateral lower-body work before load progression.");
  }
  if (lower.includes("hip")) {
    rules.add("If the hip pinches or the body has to shift to finish the rep, regress immediately.");
  }
  if (feedback.rating_label === "repeat") {
    rules.add("When a session is marked repeat, keep the structure and progress load only if mechanics stay clean.");
  }
  if (feedback.rating_label === "retire") {
    rules.add("Retire movements that repeatedly feel wrong or force compensation even when the day is otherwise green.");
  }

  const adjustments = mergeObjects({}, current.exercise_adjustments || {});
  const exerciseFeedback = Array.isArray(feedback.raw?.extracted?.exercise_feedback)
    ? feedback.raw.extracted.exercise_feedback
    : [];
  for (const item of exerciseFeedback) {
    const key = normalizeExerciseKey(item.exercise);
    if (!key) continue;
    adjustments[key] = {
      exercise: item.exercise,
      action: item.action || "watch",
      sentiment: item.sentiment || "neutral",
      note: item.note || null,
      updated_at: next.updated_at,
      source_date: next.last_feedback_date,
    };
  }
  if (feedback.worst_movement) {
    const key = normalizeExerciseKey(feedback.worst_movement);
    adjustments[key] = {
      exercise: feedback.worst_movement,
      action: /retire/i.test(feedback.rating_label || "") ? "replace" : "modify",
      sentiment: "negative",
      note: feedback.pain_notes || feedback.freeform_note || null,
      updated_at: next.updated_at,
      source_date: next.last_feedback_date,
    };
  }
  if (feedback.best_movement) {
    const key = normalizeExerciseKey(feedback.best_movement);
    adjustments[key] = {
      exercise: feedback.best_movement,
      action: /easy/i.test(feedback.rating_label || "") ? "progress" : "keep",
      sentiment: "positive",
      note: feedback.freeform_note || null,
      updated_at: next.updated_at,
      source_date: next.last_feedback_date,
    };
  }

  next.active_rules = [...rules].slice(-8);
  next.exercise_adjustments = adjustments;
  next.next_adjustments = sentenceList(feedback.raw?.extracted?.next_adjustments || []);
  return next;
}

export async function updateCoachStateFromFeedback(profileId, feedback = {}) {
  const state = await getCoachState(profileId);
  const adaptations = buildFeedbackAdaptations(feedback, state);
  return saveCoachState(profileId, { ...state, adaptations });
}

export async function insertCoachDecision(profileId, decision) {
  const row = {
    profile_id: profileId,
    decision_date: decision.date || todayISO(),
    intent: decision.intent || "general",
    readiness_tier: decision.readiness?.tier || null,
    top_line_call: decision.top_line_call || decision.reply || null,
    risk_flags: decision.risk_flags || [],
    evidence: decision.evidence || [],
    next_actions: decision.next_actions || [],
    response: decision,
    model: decision.generated_by || COACH_RESPONSE_VERSION,
    raw: decision.raw || {},
  };
  const inserted = await safeSupabase("coach_decisions", { method: "POST", body: JSON.stringify([row]) }, null);
  return inserted?.[0] || null;
}

export function todayISO(timeZone = "Asia/Taipei", now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

export function todaySchedule(timeZone = "Asia/Taipei", now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).formatToParts(now);
  const weekday = parts.find(p => p.type === "weekday")?.value || "";
  const strengthDays = ["Monday", "Wednesday", "Friday"];
  const index = strengthDays.indexOf(weekday);
  const nextStrengthDay = index >= 0 ? weekday : strengthDays.find(day => {
    const order = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return order.indexOf(day) > order.indexOf(weekday);
  }) || "Monday";

  if (strengthDays.includes(weekday)) {
    return {
      weekday,
      day_type: "strength",
      strength_planned: true,
      daily_walk_planned: true,
      label: `${weekday} strength day`,
      next_strength_day: weekday,
      non_lift_call: null,
    };
  }

  if (weekday === "Tuesday") {
    return {
      weekday,
      day_type: "goal_support",
      strength_planned: false,
      daily_walk_planned: true,
      label: "Tuesday coach-planned goal-support day",
      next_strength_day: nextStrengthDay,
      non_lift_call: `No strength today. Tuesday is coach-planned goal support: daily walk plus Zone 2 conditioning and mobility/core so fat loss, conditioning, and recovery move forward without stealing from ${nextStrengthDay} strength.`,
    };
  }

  if (weekday === "Thursday") {
    return {
      weekday,
      day_type: "goal_support",
      strength_planned: false,
      daily_walk_planned: true,
      label: "Thursday coach-planned goal-support day",
      next_strength_day: nextStrengthDay,
      non_lift_call: `No strength today. Thursday is coach-planned goal support: daily walk plus easy Zone 2 and mobility/prehab so you arrive fresh for ${nextStrengthDay} strength.`,
    };
  }

  if (weekday === "Saturday") {
    return {
      weekday,
      day_type: "weekend_rest",
      strength_planned: false,
      daily_walk_planned: true,
      label: "Saturday rest option",
      next_strength_day: nextStrengthDay,
      non_lift_call: "No strength today. Saturday is a rest option: keep the daily walk, add only gentle mobility if useful, and do not add conditioning unless Coach explicitly plans it.",
    };
  }

  return {
    weekday,
    day_type: "weekend_rest",
    strength_planned: false,
    daily_walk_planned: true,
    label: "Sunday formal training off",
    next_strength_day: nextStrengthDay,
    non_lift_call: `No strength today. ${weekday || "Today"} is a rest option; keep the daily walk easy and reset for ${nextStrengthDay}.`,
  };
}

function first(...values) {
  return values.find(v => v !== undefined && v !== null && v !== "");
}

function latest(items, count = 1) {
  if (!Array.isArray(items) || !items.length) return count === 1 ? null : [];
  const slice = items.slice(-count);
  return count === 1 ? slice[0] : slice;
}

function rowDate(row = {}) {
  if (!row || typeof row !== "object") return null;
  return first(row.date, row.measured_date, row.log_date, row.session_date, row.created_at?.slice?.(0, 10)) || null;
}

function hasExerciseDetail(row = {}) {
  return Array.isArray(row.exercises) && row.exercises.length > 0;
}

function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  return Object.fromEntries(keys.filter(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== "").map(k => [k, obj[k]]));
}

function truncate(value, max = 220) {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function compactCoachHistory(dashboard = {}, limit = 12) {
  const notes = Array.isArray(dashboard.coach_chat_notes) ? dashboard.coach_chat_notes : [];
  return notes
    .slice(-Math.max(1, limit))
    .map(note => ({
      role: ["coach", "user", "system"].includes(note.role) ? note.role : "user",
      channel: truncate(note.channel || "unknown", 40),
      at: note.at || note.message_at || note.submitted_at || null,
      text: truncate(note.text || note.body || note.summary || "", 420),
    }))
    .filter(note => note.text);
}

function asNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeIntent(intent, text = "") {
  const i = String(intent || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  if (["build_workout", "workout", "brief", "nutrition_check", "post_workout", "evaluate_data", "travel_mode", "general"].includes(i)) {
    if (i === "workout") return "build_workout";
    if (i === "brief") return "brief";
    return i;
  }
  const t = String(text || "").toLowerCase();
  if (t.includes("workout") || t.includes("train today") || t.includes("build")) return "build_workout";
  if (t.includes("nutrition") || t.includes("protein") || t.includes("fat") || t.includes("bevel")) return "nutrition_check";
  if (t.includes("post-workout") || t.includes("done training") || t.includes("finished workout")) return "post_workout";
  if (t.includes("travel") || t.includes("hotel gym") || t.includes("kuala lumpur")) return "travel_mode";
  if (t.includes("evaluate") || t.includes("data") || t.includes("readiness")) return "evaluate_data";
  return "general";
}

function latestSleepValues(dashboard = {}) {
  const sleep = latest(dashboard.recovery_sleep) || dashboard.current?.recovery_sleep || {};
  const bevel = sleep.bevel || {};
  const oura = sleep.oura || {};
  return {
    row: sleep,
    date: sleep.date || sleep.measured_date || null,
    oura_readiness: asNumber(first(oura.readiness_score, sleep.oura_readiness_score)),
    oura_hrv: asNumber(first(oura.hrv_avg_ms, sleep.oura_hrv_ms, sleep.hrv_ms)),
    oura_rhr: asNumber(first(oura.rhr_bpm_avg, sleep.resting_hr_bpm)),
    oura_sleep_min: asNumber(first(oura.total_sleep_min, sleep.total_sleep_min)),
    bevel_recovery: asNumber(first(bevel.recovery_pct, sleep.recovery_score_pct)),
    bevel_hrv: asNumber(first(bevel.hrv_ms, sleep.hrv_ms)),
    sleep_min: asNumber(first(bevel.time_asleep_min, oura.total_sleep_min, sleep.total_sleep_min)),
  };
}

function latestNutritionValues(dashboard = {}) {
  const n = latest(dashboard.nutrition_log) || dashboard.current?.nutrition || {};
  const totals = n.totals || n.daily_totals || {};
  const targets = n.targets || dashboard.profile?.nutrition_targets || DEFAULT_COACH_STATE.goals;
  return {
    row: n,
    date: n.date || n.log_date || null,
    kcal: asNumber(first(totals.kcal, totals.calories_kcal, n.calories_kcal)),
    protein_g: asNumber(first(totals.protein_g, n.protein_g)),
    fat_g: asNumber(first(totals.fat_g, n.fat_g)),
    carbs_g: asNumber(first(totals.carbs_g, n.carbs_g)),
    protein_target_g: asNumber(first(targets.protein_g, DEFAULT_COACH_STATE.goals.protein_floor_g)) || 150,
    fat_target_g: asNumber(first(targets.fat_g, DEFAULT_COACH_STATE.goals.fat_budget_g)) || 70,
    calorie_target_kcal: asNumber(first(targets.kcal, targets.calories_kcal, 2000)) || 2000,
  };
}

function latestBpValues(dashboard = {}) {
  const bp = latest(dashboard.blood_pressure) || dashboard.current?.blood_pressure || {};
  return {
    row: bp,
    date: bp.date || bp.measured_date || null,
    systolic: asNumber(bp.systolic_mmhg),
    diastolic: asNumber(bp.diastolic_mmhg),
    heart_rate: asNumber(bp.heart_rate_bpm),
  };
}

function compactRecoveryRow(row = {}) {
  if (!row || typeof row !== "object") return null;
  const bevel = row.bevel || {};
  const oura = row.oura || {};
  return {
    date: row.date || row.measured_date || null,
    source: row.source || null,
    readiness_tier: row.readiness_tier || null,
    recovery_score_pct: asNumber(first(row.recovery_score_pct, bevel.recovery_pct, oura.readiness_score)),
    sleep_score_pct: asNumber(first(row.sleep_score_pct, bevel.sleep_quality_pct, oura.sleep_score)),
    hrv_ms: asNumber(first(row.hrv_ms, bevel.hrv_ms, oura.hrv_avg_ms)),
    resting_hr_bpm: asNumber(first(row.resting_hr_bpm, bevel.rhr_bpm, oura.rhr_bpm_avg, oura.rhr_bpm_lowest)),
    respiratory_rate_rpm: asNumber(first(row.respiratory_rate_rpm, bevel.respiratory_rate_rpm)),
    spo2_pct: asNumber(first(row.spo2_pct, bevel.spo2_pct, oura.spo2_avg_pct)),
    wrist_temp_f: asNumber(first(row.wrist_temp_f, bevel.wrist_temp_f)),
    total_sleep_min: asNumber(first(row.total_sleep_min, bevel.time_asleep_min, oura.total_sleep_min)),
    time_in_bed_min: asNumber(first(row.time_in_bed_min, bevel.time_in_bed_min, oura.time_in_bed_min)),
    sleep_efficiency_pct: asNumber(first(row.sleep_efficiency_pct, bevel.sleep_efficiency_pct, oura.sleep_efficiency_pct)),
    deep_sleep_min: asNumber(first(row.deep_sleep_min, bevel.deep_sleep_min, oura.deep_sleep_min)),
    rem_sleep_min: asNumber(first(row.rem_sleep_min, bevel.rem_sleep_min, oura.rem_sleep_min)),
    awake_min: asNumber(first(row.awake_min, oura.awake_min)),
    sleep_bank_min: asNumber(first(row.sleep_bank_min, bevel.sleep_bank_min, oura.sleep_debt_min)),
    notes: truncate(first(row.summary, row.notes, bevel.notes, oura.notes), 260),
  };
}

function compactBpRow(row = {}) {
  if (!row || typeof row !== "object") return null;
  return {
    date: row.date || row.measured_date || null,
    systolic_mmhg: asNumber(row.systolic_mmhg),
    diastolic_mmhg: asNumber(row.diastolic_mmhg),
    heart_rate_bpm: asNumber(row.heart_rate_bpm),
    notes: truncate(row.notes, 180),
  };
}

function compactBodyRow(row = {}) {
  if (!row || typeof row !== "object") return null;
  return {
    date: row.date || row.measured_date || null,
    weight_lbs: asNumber(row.weight_lbs),
    body_fat_pct: asNumber(row.body_fat_pct),
    lean_mass_lbs: asNumber(row.lean_mass_lbs),
    skeletal_muscle_lbs: asNumber(first(row.skeletal_muscle_lbs, row.hume_skeletal_muscle_lbs)),
    visceral_fat_level: asNumber(row.visceral_fat_level),
    body_water_pct: asNumber(row.body_water_pct),
    notes: truncate(row.notes, 200),
  };
}

function compactNutritionRow(row = {}) {
  if (!row || typeof row !== "object") return null;
  const totals = row.totals || {};
  return {
    date: row.date || row.log_date || null,
    source: row.source || null,
    kcal: asNumber(first(totals.kcal, row.calories_kcal)),
    protein_g: asNumber(first(totals.protein_g, row.protein_g)),
    carbs_g: asNumber(first(totals.carbs_g, row.carbs_g)),
    fat_g: asNumber(first(totals.fat_g, row.fat_g)),
    notes: truncate(row.notes, 160),
  };
}

function compactStrengthRow(row = {}) {
  if (!row || typeof row !== "object") return null;
  const exercises = Array.isArray(row.exercises)
    ? row.exercises.slice(0, 8).map(ex => ex?.name).filter(Boolean)
    : [];
  return {
    date: row.date || row.session_date || null,
    title: row.title || row.name || row.session_name || row.workout_name || row.session_type || "Strength session",
    duration_min: asNumber(first(row.duration_min, row.duration_minutes, row.completed_minutes)),
    volume_kg: asNumber(first(row.volume_kg, row.total_volume_kg)),
    avg_hr_bpm: asNumber(row.avg_hr_bpm),
    exercise_count: Array.isArray(row.exercises) ? row.exercises.length : null,
    exercises: exercises.length ? exercises : null,
    notes: truncate(first(row.notes, row.summary, row.coaching_note), 220),
  };
}

function dedupeRows(rows = [], domain = "generic") {
  const groups = new Map();
  for (const row of rows || []) {
    const dateKey = rowDate(row) || "unknown-date";
    const sourceKey = normalizeSourceFamily(row.source || row.raw?.source || domain, domain);
    const groupKey = `${dateKey}|${sourceKey}`;
    const current = groups.get(groupKey);
    if (!current) {
      groups.set(groupKey, cloneJson(row, row));
      continue;
    }
    const candidate = rowCompleteness(row) >= rowCompleteness(current)
      ? mergePreferDefined(current, row)
      : mergePreferDefined(row, current);
    groups.set(groupKey, candidate);
  }
  return [...groups.values()].sort((a, b) => String(rowDate(a)).localeCompare(String(rowDate(b))));
}

function compactCoachState(state = {}) {
  const source = state?.db_row || state || {};
  return {
    version: state.version || source.version || DEFAULT_COACH_STATE.version,
    travel_mode: Boolean(state.gym_profile?.travel_mode ?? source.travel_mode ?? false),
    goals: {
      priority_order: state.goals?.priority_order || DEFAULT_COACH_STATE.goals.priority_order,
      protein_floor_g: state.goals?.protein_floor_g || DEFAULT_COACH_STATE.goals.protein_floor_g,
      fat_budget_g: state.goals?.fat_budget_g || DEFAULT_COACH_STATE.goals.fat_budget_g,
    },
    guardrails: {
      strength_hr_cap_bpm: state.training_model?.strength_hr_cap_bpm || DEFAULT_COACH_STATE.training_model.strength_hr_cap_bpm,
      session_range_min: state.training_model?.session_range_min || DEFAULT_COACH_STATE.training_model.session_range_min,
      gym: state.gym_profile?.default_environment || DEFAULT_COACH_STATE.gym_profile.default_environment,
      hip: "Avoid deep loaded hip flexion and anterior hip pinching.",
      bp: "Doctor requested one week of home BP readings; train unless readings/symptoms worsen.",
    },
    adaptations: {
      preferred_session_cap_min: state.adaptations?.preferred_session_cap_min || DEFAULT_COACH_STATE.adaptations.preferred_session_cap_min,
      active_rules: (state.adaptations?.active_rules || []).slice(0, 4),
    },
  };
}

function buildDataCompleteness(base = {}) {
  const timezone = base.profile?.timezone || "Asia/Taipei";
  const now = base.now || new Date();
  const today = todayISO(timezone, now);
  const schedule = todaySchedule(timezone, now);
  const latestSleep = latest(base.recovery_sleep);
  const latestBp = latest(base.blood_pressure);
  const latestBody = latest(base.body_composition);
  const latestNutrition = latest(base.nutrition_log);
  const latestStrength = latest(base.strength_logs);
  const detailedStrengthLogs = Array.isArray(base.strength_logs) ? base.strength_logs.filter(hasExerciseDetail) : [];
  const latestDetailedStrength = latest(detailedStrengthLogs);
  const feedbackToday = Array.isArray(base.session_feedback)
    ? base.session_feedback.find(row => rowDate(row) === today)
    : null;

  const bodyAgeDays = latestBody?.date || latestBody?.measured_date
    ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${rowDate(latestBody)}T00:00:00Z`)) / 86400000)
    : null;
  const strengthToday = rowDate(latestStrength) === today;
  const detailedStrengthToday = rowDate(latestDetailedStrength) === today;

  const checks = [
    {
      id: "sleep_recovery",
      label: "Sleep/recovery",
      status: rowDate(latestSleep) === today ? "current" : "missing",
      required: true,
      latest_date: rowDate(latestSleep),
    },
    {
      id: "blood_pressure",
      label: "Blood pressure",
      status: rowDate(latestBp) === today ? "current" : "missing",
      required: true,
      latest_date: rowDate(latestBp),
    },
    {
      id: "nutrition",
      label: "Bevel nutrition",
      status: rowDate(latestNutrition) === today ? "current" : "missing",
      required: true,
      latest_date: rowDate(latestNutrition),
    },
    {
      id: "body_composition",
      label: "Body composition",
      status: bodyAgeDays !== null && bodyAgeDays <= 14 ? "current" : "stale",
      required: false,
      latest_date: rowDate(latestBody),
    },
    {
      id: "strength_session",
      label: "Motra strength session",
      status: schedule.strength_planned ? (strengthToday ? "current" : "pending") : "not_expected",
      required: Boolean(schedule.strength_planned),
      latest_date: rowDate(latestStrength),
    },
    {
      id: "strength_exercises",
      label: "Motra exercise detail",
      status: schedule.strength_planned ? (detailedStrengthToday ? "current" : "pending") : "not_expected",
      required: Boolean(schedule.strength_planned),
      latest_date: rowDate(latestDetailedStrength),
    },
    {
      id: "workout_feedback",
      label: "Workout feedback",
      status: strengthToday ? (feedbackToday ? "current" : "missing_after_training") : "not_expected",
      required: Boolean(strengthToday),
      latest_date: feedbackToday ? rowDate(feedbackToday) : rowDate(latest(base.session_feedback)),
    },
  ];

  const requiredChecks = checks.filter(check => check.required);
  const missingRequired = requiredChecks
    .filter(check => !["current", "not_expected"].includes(check.status))
    .map(check => check.id);
  const currentRequired = requiredChecks.length - missingRequired.length;

  return {
    date: today,
    schedule,
    score_pct: requiredChecks.length ? Math.round((currentRequired / requiredChecks.length) * 100) : 100,
    missing_required: missingRequired,
    checks,
  };
}

function parseSubjective(text = "", payload = {}) {
  const t = String(text || `${payload.notes || ""} ${payload.summary || ""}`).toLowerCase();
  const hipMatch = t.match(/\bhip(?:\s+(?:pain|score|rating|level|feels|felt|is|was)){0,3}\s*[:=]?\s*(\d(?:\.\d+)?)(?:\s*\/\s*10)?\b/);
  const painMatch = t.match(/\bpain(?:\s+(?:score|rating|level|is|was)){0,3}\s*[:=]?\s*(\d(?:\.\d+)?)(?:\s*\/\s*10)?\b/);
  return {
    hip_pain: asNumber(payload.hip_pain ?? payload.hip_pain_score ?? hipMatch?.[1]),
    pain: asNumber(payload.pain ?? payload.pain_score ?? painMatch?.[1]),
    asthma_flare: Boolean(payload.asthma_flare || t.includes("asthma flare") || t.includes("wheezing")),
    migraine: Boolean(payload.migraine || t.includes("migraine")),
    fatigue_high: Boolean(payload.fatigue_high || t.includes("exhausted") || t.includes("wiped out")),
  };
}

export function evaluateReadiness(dashboard = {}, state = DEFAULT_COACH_STATE, context = {}) {
  const sleep = latestSleepValues(dashboard);
  const bp = latestBpValues(dashboard);
  const subjective = parseSubjective(context.text, context.payload || {});
  const schedule = todaySchedule(dashboard.profile?.timezone || "Asia/Taipei", context.now || new Date());
  const hrvBaseline = asNumber(dashboard.profile?.oura_biology_baselines?.hrv_baseline_ms) || 32.5;
  const primaryHrv = asNumber(first(sleep.oura_hrv, sleep.bevel_hrv));
  const risks = [];
  const evidence = [];
  let tier = "Green";
  let trainingCall = "Train. Use the planned strength/athletic session.";

  if (sleep.date) evidence.push(`Readiness data ${sleep.date}: Oura HRV ${sleep.oura_hrv ?? "unknown"}ms, Bevel recovery ${sleep.bevel_recovery ?? "unknown"}%.`);
  if (bp.date) evidence.push(`Latest BP ${bp.date}: ${bp.systolic ?? "?"}/${bp.diastolic ?? "?"}.`);
  evidence.push(`Schedule gate: ${schedule.label}.`);

  if (subjective.migraine) risks.push({ code: "migraine", severity: "red", text: "Migraine reported. Training is rest or major downgrade." });
  if (subjective.asthma_flare) risks.push({ code: "asthma", severity: "red", text: "Asthma flare reported. No intensity until breathing is settled." });
  if ((subjective.hip_pain ?? subjective.pain ?? 0) >= 4) risks.push({ code: "pain", severity: "red", text: "Pain is above the training threshold. Remove aggravating loaded patterns." });
  if (bp.diastolic >= 100 || bp.systolic >= 160) risks.push({ code: "bp_red", severity: "red", text: `BP ${bp.systolic}/${bp.diastolic} is a hard downshift signal.` });
  if (bp.diastolic >= 90 || bp.systolic >= 140) risks.push({ code: "bp_watch", severity: "yellow", text: `BP ${bp.systolic}/${bp.diastolic} stays on the watchlist.` });
  if (primaryHrv !== null && primaryHrv < Math.min(25, hrvBaseline * 0.8)) risks.push({ code: "low_hrv", severity: "red", text: `HRV ${primaryHrv}ms is materially below baseline ${hrvBaseline}ms.` });
  if (sleep.bevel_recovery !== null && sleep.bevel_recovery < 35) risks.push({ code: "low_recovery", severity: "red", text: `Bevel recovery ${sleep.bevel_recovery}% is low-autonomic-reserve territory.` });
  if (sleep.oura_readiness >= 80 && sleep.bevel_recovery !== null && sleep.bevel_recovery < 40) {
    risks.push({ code: "app_conflict", severity: "yellow", text: "Oura looks green while Bevel/HRV is red. Treat physiology conflict conservatively." });
  }

  const red = risks.some(r => r.severity === "red");
  const yellow = risks.some(r => r.severity === "yellow");
  if (red) {
    tier = "Red";
    trainingCall = "Downshift. Recovery, walk, mobility, or a heavily modified session only.";
  } else if (yellow || subjective.fatigue_high || (primaryHrv !== null && primaryHrv < hrvBaseline)) {
    tier = "Yellow";
    trainingCall = "Train modified. Keep the plan, reduce density, and skip the hybrid close if HR or symptoms drift.";
  }
  if (!schedule.strength_planned) {
    trainingCall = schedule.non_lift_call;
  }

  return {
    tier,
    training_call: trainingCall,
    schedule,
    hrv_ms: primaryHrv,
    hrv_baseline_ms: hrvBaseline,
    oura_readiness: sleep.oura_readiness,
    bevel_recovery: sleep.bevel_recovery,
    risk_flags: risks,
    evidence,
    source_order: state.source_hierarchy.readiness,
  };
}

export function buildNutritionCall(dashboard = {}, state = DEFAULT_COACH_STATE) {
  const n = latestNutritionValues(dashboard);
  const proteinTarget = state.goals.protein_floor_g || n.protein_target_g || 150;
  const fatTarget = state.goals.fat_budget_g || n.fat_target_g || 70;
  const proteinGap = n.protein_g === null ? null : Math.max(0, Math.round(proteinTarget - n.protein_g));
  const fatOver = n.fat_g === null ? null : Math.max(0, Math.round(n.fat_g - fatTarget));
  let call = "No complete Bevel nutrition total yet. Log Bevel totals, then close protein first and fat second.";
  const actions = ["Use Bevel as the source of truth.", "Close the day with lean protein if totals are incomplete."];

  if (proteinGap !== null && fatOver !== null) {
    if (fatOver > 0) {
      call = `Fat is the constraint: ${Math.round(n.fat_g)}g against a ${fatTarget}g budget. Remaining food should be lean protein plus clean carbs.`;
      actions.unshift("Choose chicken, white fish, whey, nonfat Greek yogurt, or egg whites for the next protein hit.");
    } else if (proteinGap > 0) {
      call = `Protein is short by ${proteinGap}g. Fix that before any sweets or added fats.`;
      actions.unshift(`Hit at least ${Math.min(60, proteinGap)}g protein at the next feeding.`);
    } else {
      call = `Protein floor is handled at ${Math.round(n.protein_g)}g and fat is inside budget. Hold the line.`;
      actions.unshift("Do not spend the remaining day on added oils, nuts, or fried add-ons.");
    }
  }

  return {
    date: n.date,
    source: "Bevel",
    protein_target_g: proteinTarget,
    fat_budget_g: fatTarget,
    current: { kcal: n.kcal, protein_g: n.protein_g, fat_g: n.fat_g, carbs_g: n.carbs_g },
    protein_gap_g: proteinGap,
    fat_over_g: fatOver,
    call,
    next_actions: actions.slice(0, 3),
  };
}

function buildPrehabBlock(state, modified) {
  const activeHipModel = state.active_medical?.hip || DEFAULT_COACH_STATE.active_medical.hip;
  return {
    id: "PREHAB",
    label: "Floor 3 - Hip-Safe Prehab",
    floor: "Floor 3",
    estimated_min: modified ? 12 : 10,
    exercises: [
      {
        name: "Bodyweight Glute Bridge",
        motra_name: "Bodyweight Glute Bridge",
        prescription: modified ? "2x8 with 2-second hold" : "2x10 with 2-second hold",
        note: "Posterior tilt first, stop before the front of the hip grabs.",
      },
      {
        name: "Cable Pallof Hold",
        motra_name: state.gym_profile.motra_names.pallof_hold,
        prescription: "2x20-30 sec/side",
        note: "Quiet ribs, no rotation leak, breathe behind the brace.",
      },
      {
        name: "Cable Hip Abduction",
        motra_name: "Cable Hip Abduction",
        prescription: "2x8-10/side, left first",
        note: `Stack pelvis and own the range. ${activeHipModel}`,
      },
    ],
  };
}

function activeAdjustmentNotes(state = DEFAULT_COACH_STATE) {
  const adaptations = mergeObjects(DEFAULT_COACH_STATE.adaptations, state.adaptations || {});
  const notes = [...(adaptations.active_rules || [])];
  for (const value of Object.values(adaptations.exercise_adjustments || {})) {
    if (!value?.exercise || !value?.action) continue;
    const rawNote = String(value.note || "").trim();
    const compactNote = rawNote && !/transcript|structured extraction/i.test(rawNote)
      ? truncate(rawNote, 120)
      : null;
    notes.push(`${value.exercise}: ${value.action}${compactNote ? ` - ${compactNote}` : ""}`);
  }
  return notes.slice(0, 6);
}

export function buildWorkoutPlan(dashboard = {}, state = DEFAULT_COACH_STATE, readiness = evaluateReadiness(dashboard, state)) {
  const travelMode = Boolean(state.gym_profile.travel_mode);
  if (!readiness.schedule?.strength_planned) {
    const weekday = readiness.schedule?.weekday;
    const isGoalSupport = readiness.schedule?.day_type === "goal_support";
    const isThursday = weekday === "Thursday";
    return {
      environment: isGoalSupport ? "Coach-planned goal support day" : "Weekend rest / daily walk",
      requires_inventory: false,
      top_line: readiness.schedule?.non_lift_call || "No strength today. Follow the non-lift schedule.",
      session_type: isGoalSupport ? "Daily Walk + Zone 2 + Mobility" : "Daily Walk / Rest / Mobility",
      floor_plan: "No World Gym strength floor routing today.",
      target_minutes: isGoalSupport ? (isThursday ? 40 : 50) : 25,
      time_range_min: isGoalSupport ? (isThursday ? [30, 50] : [40, 60]) : [20, 45],
      guardrails: [
        "Do not convert a non-lift day into a modified strength session unless Todd explicitly overrides the schedule.",
        isGoalSupport ? "Conditioning should support VAT loss and aerobic base without creating leg fatigue for strength." : "Rest days are allowed to stay very easy after the daily walk.",
        "Use today to protect the next planned strength day.",
      ],
      blocks: isGoalSupport
        ? [
            {
              name: "Daily walk",
              target: "20-35 minutes easy, nasal-breathing pace if available.",
            },
            {
              name: isThursday ? "Easy Zone 2" : "Zone 2 conditioning",
              target: isThursday ? "15-25 minutes easy bike, incline walk, or row." : "25-35 minutes bike, incline walk, or row.",
            },
            {
              name: isThursday ? "Mobility and prehab" : "Mobility and core",
              target: isThursday ? "10-15 minutes hips, T-spine, neck stacking, and breathing." : "8-12 minutes dead bug, Pallof, hip mobility, and T-spine work.",
            },
          ]
        : [
            {
              name: "Daily walk",
              target: "20-45 minutes easy; shorter is fine if you need a true rest day.",
            },
          ],
    };
  }
  if (travelMode) {
    return {
      environment: "Travel / hotel gym",
      requires_inventory: true,
      top_line: "Send the hotel gym inventory before I build the session.",
      reason: state.gym_profile.travel_rule,
      questions: ["Is there a cable station?", "What dumbbells/kettlebells are available?", "Any bench, pull-up bar, treadmill, or bike?"],
      blocks: [],
    };
  }

  const finisherAllowed = readiness.tier === "Green";
  const modified = readiness.tier !== "Green";
  const preferredCap = Number(state.adaptations?.preferred_session_cap_min);
  const targetMinutes = Number.isFinite(preferredCap)
    ? Math.max(60, Math.min(72, preferredCap + 6))
    : state.training_model.default_session_target_min;
  const coachLearning = activeAdjustmentNotes(state);
  return {
    environment: "World Gym Taichung",
    requires_inventory: false,
    top_line: modified
      ? "World Gym plan, modified: anchors stay, density drops, hybrid close is conditional."
      : "World Gym plan: athletic Floor 3 primer, Floor 2 strength anchors, Floor 3 trunk/hybrid close.",
    session_type: "World Gym Strength + Athletic Functional",
    floor_plan: "Floor 3 prehab/primer -> Floor 2 anchors -> Floor 3 trunk/hybrid close",
    target_minutes: targetMinutes,
    time_range_min: state.training_model.session_range_min,
    guardrails: [
      "No cross-floor supersets.",
      "Left side leads unilateral work.",
      "Stay near the 122 bpm strength HR cap.",
      "No deep loaded hip flexion.",
      "Prehab stays in unless safety or time pressure forces a cut elsewhere first.",
      "Skip the hybrid close if readiness is yellow/red, HR drifts, hip symptoms rise, or grip is cooked.",
    ],
    coach_learning: coachLearning,
    blocks: [
      buildPrehabBlock(state, modified),
      {
        id: "PREP",
        label: "Floor 3 - Functional Primer",
        floor: "Floor 3",
        estimated_min: 10,
        exercises: [
          {
            name: "Lateral Step-to-Stick",
            motra_name: "Custom: Lateral Step-to-Stick",
            prescription: modified ? "1-2x5/side" : "2x5/side",
            note: "Quiet landing, two-second freeze, control before speed.",
          },
          {
            name: "Cable Chop High to Low",
            motra_name: state.gym_profile.motra_names.cable_chop_high_low,
            prescription: "2x8/side",
            note: "Strong diagonal brace; posture stays stacked.",
          },
        ],
      },
      {
        id: "A",
        label: "Floor 2 - Strength Anchors",
        floor: "Floor 2",
        estimated_min: 28,
        exercises: [
          {
            name: "Pull-Up",
            motra_name: state.gym_profile.motra_names.pull_up,
            prescription: modified ? "3 sets, leave 2 reps in reserve" : "4 sets: 6 / 5 / 5 / 4",
            note: "Settled hang, elbows down, one-beat top hold, controlled lower.",
          },
          {
            name: "Machine Hip Thrust (Glute Bridge)",
            motra_name: state.gym_profile.motra_names.hip_thrust,
            prescription: modified ? "3x8-10 moderate" : "4x10",
            note: "Heel drive, crisp one-second lockout, no overarch.",
          },
          {
            name: "Dumbbell Incline Bench Press",
            motra_name: state.gym_profile.motra_names.incline_press,
            prescription: modified ? "2-3x8 smooth" : "3x8-10",
            note: "Chest gets the work; shoulders stay quiet.",
          },
        ],
      },
      {
        id: "B",
        label: "Floor 3 - Trunk / Posture",
        floor: "Floor 3",
        estimated_min: 16,
        exercises: [
          {
            name: "Rope Cable Face Pull to W",
            motra_name: state.gym_profile.motra_names.face_pull_w,
            prescription: "2-3x12",
            note: "Pull to face height, open cleanly to W, quiet neck.",
          },
          {
            name: "Kettlebell Suitcase Carry",
            motra_name: state.gym_profile.motra_names.suitcase_carry,
            prescription: "2x20-30 m/side, left first",
            note: "Walk tall; posture beats distance.",
          },
        ],
      },
      {
        id: "HYBRID",
        label: "Floor 3 - Hybrid Close",
        floor: "Floor 3",
        estimated_min: finisherAllowed ? 6 : 0,
        status: finisherAllowed ? "planned" : "conditional_skip",
        exercises: finisherAllowed ? [
          {
            name: "Kettlebell Swing",
            motra_name: state.gym_profile.motra_names.kettlebell_swing,
            prescription: "2x10 @ 16-20 kg",
            note: "Snap, float, park. Stop if it turns into a shoulder lift.",
          },
          {
            name: "Kettlebell Front-Rack Carry",
            motra_name: state.gym_profile.motra_names.front_rack_carry,
            prescription: "2x20 m/side, left first",
            note: "Ribs down, walk tall, breathe behind the brace.",
          },
        ] : [],
      },
    ],
  };
}

function topLineForIntent(intent, readiness, nutrition, workout) {
  if (intent === "build_workout" || intent === "workout") return workout.top_line;
  if (intent === "nutrition_check") return nutrition.call;
  if (intent === "post_workout") return "Log what changed: duration, best movement, worst movement, pain, and RPE. That becomes the next-session adjustment.";
  if (intent === "travel_mode") return workout.top_line;
  if (intent === "evaluate_data" || intent === "brief") return readiness.training_call;
  return readiness.tier === "Green" ? "Green enough to train with the planned World Gym structure." : readiness.training_call;
}

export function buildCoachDecision({ text = "", intent = "general", dashboard = {}, state = DEFAULT_COACH_STATE, payload = {} } = {}) {
  const normalizedIntent = normalizeIntent(intent, text);
  const now = payload?.now ? new Date(payload.now) : undefined;
  const readiness = evaluateReadiness(dashboard, state, { text, payload, now });
  const nutrition = buildNutritionCall(dashboard, state);
  const workout = buildWorkoutPlan(dashboard, state, readiness);
  const topLine = topLineForIntent(normalizedIntent, readiness, nutrition, workout);
  const riskFlags = readiness.risk_flags.map(r => r.text);
  const recentConversation = compactCoachHistory(dashboard);
  const nextActions = [];

  if (normalizedIntent === "build_workout") {
    nextActions.push(workout.requires_inventory ? "Send hotel-gym inventory before lifting." : "Use the World Gym floor-aware workout plan below.");
  }
  if (normalizedIntent === "nutrition_check" || nutrition.protein_gap_g > 0 || nutrition.fat_over_g > 0) {
    nextActions.push(...nutrition.next_actions);
  }
  if (!nextActions.length) {
    nextActions.push(readiness.tier === "Red" ? "Keep today recovery-only unless symptoms and doctor guidance clear training." : "Ask for a workout, nutrition check, or data evaluation when ready.");
  }

  const replyParts = [
    topLine,
    riskFlags.length ? `Watch: ${riskFlags.slice(0, 2).join(" ")}` : "No hard safety stop from the available data.",
    nutrition.call,
  ];

  return {
    ok: true,
    version: COACH_RESPONSE_VERSION,
    date: todayISO(dashboard.profile?.timezone || "Asia/Taipei", now || new Date()),
    intent: normalizedIntent,
    top_line_call: topLine,
    reply: replyParts.join("\n"),
    readiness,
    risk_flags: riskFlags,
    evidence: readiness.evidence,
    next_actions: nextActions.slice(0, 4),
    nutrition_call: nutrition,
    workout_plan: ["build_workout", "travel_mode"].includes(normalizedIntent) ? workout : null,
    source_context: {
      data_store: "supabase",
      default_gym: state.gym_profile.default_environment,
      travel_mode: Boolean(state.gym_profile.travel_mode),
      active_adjustments: activeAdjustmentNotes(state),
      readiness_primary: "Oura",
      nutrition_primary: "Bevel",
      workout_primary: "Motra",
      recent_conversation: recentConversation,
    },
    generated_by: COACH_RESPONSE_VERSION,
  };
}

function coachPolishSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["reply", "top_line_call", "risk_flags", "evidence", "next_actions"],
    properties: {
      reply: { type: "string" },
      top_line_call: { type: "string" },
      risk_flags: { type: "array", items: { type: "string" } },
      evidence: { type: "array", items: { type: "string" } },
      next_actions: { type: "array", items: { type: "string" } },
    },
  };
}

export async function polishCoachDecision(decision, { text = "", dashboard = {}, state = DEFAULT_COACH_STATE } = {}) {
  const key = env("OPENAI_API_KEY");
  if (!key || env("COACH_AI_DISABLED") === "1") return decision;

  const model = env("COACH_MODEL") || "gpt-5.5";
  const prompt = [
    "You are Todd Blackhurst's pro personal coach. Preserve the deterministic decision, safety gates, and workout plan.",
    "Rewrite only the user-facing text fields. Be direct, warm, practical, concise. No generic motivation.",
    "Use recent_conversation for continuity across phone, dashboard, Shortcuts, WhatsApp, and Custom GPT chats.",
    "If the user asks a follow-up, infer only from the supplied recent_conversation and compact_context.",
    "World Gym Taichung is the default workout environment unless travel_mode is true.",
    "Return JSON that matches the schema exactly.",
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: env("COACH_REASONING_EFFORT") || "medium" },
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "coach_text_polish",
            strict: true,
            schema: coachPolishSchema(),
          },
        },
        input: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: JSON.stringify({
              user_text: text,
              deterministic_decision: decision,
              compact_context: {
                latest_sleep: latestSleepValues(dashboard),
                latest_bp: latestBpValues(dashboard),
                latest_nutrition: latestNutritionValues(dashboard),
                coach_state: {
                  goals: state.goals,
                  gym_profile: {
                    default_environment: state.gym_profile.default_environment,
                    travel_mode: state.gym_profile.travel_mode,
                    preferred_floor: state.gym_profile.preferred_floor,
                  },
                },
                recent_conversation: compactCoachHistory(dashboard),
              },
            }),
          },
        ],
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error?.message || `OpenAI returned ${res.status}`);
    const textOutput = body.output_text || body.output?.flatMap(item => item.content || []).find(c => c.text)?.text;
    const polished = typeof textOutput === "string" ? JSON.parse(textOutput) : null;
    if (!polished) return decision;
    return {
      ...decision,
      ...polished,
      risk_flags: polished.risk_flags?.length ? polished.risk_flags : decision.risk_flags,
      evidence: polished.evidence?.length ? polished.evidence : decision.evidence,
      next_actions: polished.next_actions?.length ? polished.next_actions : decision.next_actions,
      generated_by: `${COACH_RESPONSE_VERSION}+${model}`,
    };
  } catch (err) {
    console.warn(`OpenAI coach polish skipped: ${err.message}`);
    return {
      ...decision,
      ai_warning: err.message,
      generated_by: `${COACH_RESPONSE_VERSION}+deterministic-fallback`,
    };
  }
}

export async function runCoach({ profileId, text = "", intent = "general", dashboard = {}, payload = {}, channel = "web" } = {}) {
  const state = await getCoachState(profileId);
  const deterministic = buildCoachDecision({ text, intent, dashboard, state, payload });
  const decision = await polishCoachDecision(deterministic, { text, dashboard, state });
  await insertCoachDecision(profileId, { ...decision, raw: { text, payload, channel } });
  return decision;
}

// Backward-compatible string reply for older callers.
export function coachReply(text, dashboard = {}) {
  return buildCoachDecision({ text, dashboard }).reply;
}

export function buildBrief(base) {
  const state = base.coach_state || DEFAULT_COACH_STATE;
  const readiness = evaluateReadiness(base, state);
  const nutrition = buildNutritionCall(base, state);
  const schedule = readiness.schedule || todaySchedule(base.profile?.timezone || "Asia/Taipei");
  const upcoming = base.upcoming_session || nextPlannedSession(base);
  return {
    readiness_tier: readiness.tier,
    recovery_pct: readiness.bevel_recovery || null,
    call: readiness.training_call,
    session_type: upcoming?.session_type || (!schedule.strength_planned || readiness.tier === "Red"
      ? (schedule.day_type === "goal_support" ? "Daily Walk + Zone 2 + Mobility" : "Daily Walk / Rest / Mobility")
      : "World Gym strength + athletic-functional"),
    time_cap_min: DEFAULT_COACH_STATE.training_model.default_session_target_min,
    goal_summary: {
      protein_target_g: nutrition.protein_target_g,
      fat_budget_g: nutrition.fat_budget_g,
    },
    active_adjustments: activeAdjustmentNotes(state),
    data_completeness: buildDataCompleteness(base),
    source_hierarchy: DEFAULT_COACH_STATE.source_hierarchy,
  };
}

export function compactDashboard(base) {
  const profile = base.profile || {};
  const latestBp = latest(base.blood_pressure);
  const latestSleep = latest(base.recovery_sleep);
  const latestBody = latest(base.body_composition);
  const latestNutrition = latest(base.nutrition_log);
  const latestStrength = latest(base.strength_logs);
  const detailedStrengthLogs = Array.isArray(base.strength_logs) ? base.strength_logs.filter(hasExerciseDetail) : [];
  const latestStrengthWithExercises = latest(detailedStrengthLogs);
  const recentRecovery = latest(base.recovery_sleep, 5).map(compactRecoveryRow).filter(Boolean);
  const recentBp = latest(base.blood_pressure, 5).map(compactBpRow).filter(Boolean);
  const recentNutrition = latest(base.nutrition_log, 3).map(compactNutritionRow).filter(Boolean);
  const recentStrength = latest(base.strength_logs, 3).map(compactStrengthRow).filter(Boolean);
  const recentStrengthWithExercises = latest(detailedStrengthLogs, 3).map(compactStrengthRow).filter(Boolean);
  const recentCoachMessages = compactCoachHistory(base, 10);
  const recentFeedback = latest(base.session_feedback, 3).map(f => ({
    date: f.date || f.session_date || null,
    rating_label: f.rating_label || null,
    completed_minutes: asNumber(f.completed_minutes),
    note: truncate(first(f.note, f.freeform_note, f.pain_notes), 180),
  }));
  const dataCompleteness = buildDataCompleteness(base);

  return {
    last_updated: base.last_updated,
    payload: "compact-v2",
    coaching_brief: base.coaching_brief || buildBrief(base),
    coach_state: compactCoachState(base.coach_state || DEFAULT_COACH_STATE),
    coach_chat_notes: recentCoachMessages,
    profile: pick(profile, ["name", "age", "sex", "location", "timezone", "training_gym", "primary_goals", "gym"]),
    constraints: {
      schedule: "Strength M/W/F; walk every day; Tue/Thu are coach-planned goal-support days; Saturday and/or Sunday are rest options.",
      gym: "World Gym Taichung unless travel mode is active.",
      hip: "Right hip impingement / labral-risk pattern requires caution; avoid forced deep loaded flexion.",
      asthma: "Controlled with daily Relvar and emergency inhaler.",
      bp: "Doctor requested one week of consistent BP readings before determining concern.",
      nutrition_source: "Bevel food tracking",
      workout_source: "Motra workout logs",
    },
    current: {
      blood_pressure: compactBpRow(latestBp),
      recovery_sleep: compactRecoveryRow(latestSleep),
      body_composition: compactBodyRow(latestBody),
      nutrition: compactNutritionRow(latestNutrition),
      strength_session: compactStrengthRow(latestStrength),
      strength_session_with_exercises: compactStrengthRow(latestStrengthWithExercises),
      data_completeness: dataCompleteness,
    },
    recent: {
      recovery_sleep: recentRecovery,
      blood_pressure: recentBp,
      nutrition: recentNutrition,
      strength_sessions: recentStrength,
      strength_sessions_with_exercises: recentStrengthWithExercises,
      workout_feedback: recentFeedback,
    },
  };
}

export async function dashboardFromSupabase() {
  const profile = await getProfile();
  if (!profile) return null;
  const profileId = profile.id;
  const [rawImports, recovery, bp, body, nutrition, strength, feedback, messages, weeklyPlans, plannedSessions] = await Promise.all([
    supabase(`raw_imports?profile_id=eq.${profileId}&select=payload,imported_at&order=imported_at.desc&limit=1`),
    supabase(`recovery_sleep?profile_id=eq.${profileId}&select=*&order=measured_date.asc`),
    supabase(`blood_pressure_readings?profile_id=eq.${profileId}&select=*&order=measured_date.asc`),
    supabase(`body_comp_measurements?profile_id=eq.${profileId}&select=*&order=measured_date.asc`),
    supabase(`nutrition_days?profile_id=eq.${profileId}&select=*&order=log_date.asc`),
    supabase(`strength_sessions?profile_id=eq.${profileId}&select=*,strength_exercises(*,strength_sets(*))&order=session_date.asc`),
    supabase(`session_feedback?profile_id=eq.${profileId}&select=*&order=created_at.asc`),
    supabase(`coach_messages?profile_id=eq.${profileId}&select=*&order=message_at.desc&limit=30`),
    safeSupabase(`weekly_plans?profile_id=eq.${profileId}&select=*&order=week_start.desc&limit=3`, {}, []),
    safeSupabase(`planned_sessions?select=*,weekly_plans!inner(profile_id,week_start,label,status)&weekly_plans.profile_id=eq.${profileId}&order=planned_date.asc`, {}, []),
  ]);

  const base = rawImports?.[0]?.payload || {};
  base.profile = { ...(base.profile || {}), ...profile };
  base.recovery_sleep = dedupeRows(recovery.map(r => ({ ...(r.raw || {}), ...r, date: r.measured_date })), "recovery_sleep");
  base.blood_pressure = dedupeRows(bp.map(r => ({ ...(r.raw || {}), ...r, date: r.measured_date })), "blood_pressure");
  base.body_composition = dedupeRows(body.map(r => ({ ...(r.raw || {}), ...r, date: r.measured_date })), "body_comp");
  base.nutrition_log = dedupeRows(nutrition.map(r => ({
    ...(r.raw || {}),
    date: r.log_date,
    source: r.source,
    totals: { kcal: r.calories_kcal, protein_g: r.protein_g, carbs_g: r.carbs_g, fat_g: r.fat_g },
    notes: r.notes,
  })), "nutrition");
  base.strength_logs = dedupeRows(strength.map(r => {
    const exercises = [...(r.strength_exercises || [])]
      .sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0))
      .map(ex => ({
        name: ex.name,
        exercise_order: ex.exercise_order,
        category: ex.category,
        notes: ex.notes,
        sets: [...(ex.strength_sets || [])]
          .sort((a, b) => (a.set_number || 0) - (b.set_number || 0))
          .map(set => ({
            set_number: set.set_number,
            reps: set.reps,
            load_kg: set.load_kg,
            duration_sec: set.duration_sec,
            distance_ft: set.distance_ft,
          })),
      }));
    return { ...(r.raw || {}), ...r, exercises, date: r.session_date };
  }), "strength");
  base.session_feedback = dedupeRows(feedback.map(r => ({ ...r, date: r.session_date, timestamp: r.created_at, note: r.freeform_note })), "feedback");
  base.coach_chat_notes = messages.reverse().map(m => ({ role: m.role, text: m.body, at: m.message_at, channel: m.channel }));
  base.coach_state = await getCoachState(profileId);
  base.weekly_plans = weeklyPlans;
  base.planned_sessions = (plannedSessions || []).map(row => ({
    ...row,
    week_start: row.weekly_plans?.week_start || null,
    week_label: row.weekly_plans?.label || null,
    week_status: row.weekly_plans?.status || null,
  }));
  if (!base.weekly_session_plans && base.planned_sessions.length) {
    const latestPlan = weeklyPlans?.[0];
    const sessions = {};
    for (const planned of base.planned_sessions) {
      const dateText = String(planned.planned_date || "");
      const dayIdx = planned.day_index || (dateText ? new Date(`${dateText}T12:00:00`).getDay() : null);
      const key = String(dayIdx === 0 ? 7 : dayIdx || "");
      if (!key) continue;
      sessions[key] = {
        date: planned.planned_date,
        day: dateText ? new Date(`${dateText}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", timeZone: profile.timezone || "Asia/Taipei" }) : null,
        session_type: planned.session_type,
        theme: planned.session_goal,
        floor_plan: planned.floor_plan,
        time_cap_min: planned.time_cap_min,
        status: planned.status,
        blocks: planned.blocks || [],
        session_notes: planned.raw?.session_notes || null,
      };
    }
    base.weekly_session_plans = {
      week_start: latestPlan?.week_start || null,
      week_label: latestPlan?.label || null,
      planned_on: latestPlan?.planned_at?.slice?.(0, 10) || null,
      sessions,
    };
  }
  const upcomingFromPlan = nextPlannedSession(base);
  if (upcomingFromPlan) {
    base.upcoming_session = {
      planned_date: upcomingFromPlan.planned_date,
      day_label: upcomingFromPlan.planned_date
        ? new Date(`${upcomingFromPlan.planned_date}T12:00:00`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            timeZone: profile.timezone || "Asia/Taipei",
          })
        : null,
      session_type: upcomingFromPlan.session_type,
      floor_plan: upcomingFromPlan.floor_plan,
      time_cap_min: upcomingFromPlan.time_cap_min,
      blocks: upcomingFromPlan.blocks || [],
      coach_note: upcomingFromPlan.raw?.coach_note || null,
      why: upcomingFromPlan.raw?.why || null,
      status: upcomingFromPlan.status,
    };
  }
  base.coach_decisions = await safeSupabase(`coach_decisions?profile_id=eq.${profileId}&select=*&order=created_at.desc&limit=10`, {}, []);
  base.coaching_brief = buildBrief(base);
  base.last_updated = new Date().toISOString();
  return base;
}
