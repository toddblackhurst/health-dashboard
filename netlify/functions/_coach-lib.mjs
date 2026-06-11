const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,x-coach-secret",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export const COACH_RESPONSE_VERSION = "coach-brain-v1";

const SOURCE_CONTEXT = {
  safety_override: "doctor guidance, BP thresholds, migraine, asthma flare, sharp/radiating/worsening pain, and subjective fatigue override all device data",
  readiness_primary: "Garmin Fenix 8 / Garmin training-recovery stack",
  readiness_condition: "primary when Todd is consistently wearing the Fenix 8 overnight and during training",
  readiness_fallback: "Oura sleep/recovery when Garmin data is stale, missing, or unreliable",
  readiness_supporting: "Apple Health supporting cross-check/data bus only",
  workout_physiology_primary: "Garmin Connect / Fenix 8",
  strength_log_primary: "Rack/Motra",
  apple_health_role: "supporting cross-check/data bus",
  oura_role: "secondary sleep/recovery fallback",
  soundcore_role: "sleep aid/noise/snore masking only; not recovery authority",
  nutrition_primary: "Garmin Connect+ Nutrition",
  body_composition_trend: "Hume/Ocare trend only",
  coach_memory_role: "durable Supabase observations for continuity, preferences, constraints, and reviewable coaching learning",
  workout_debrief_role: "Todd-reported subjective workout response event records",
  workout_debrief_not_authority: [
    "Rack/Motra completed strength sets/reps/load",
    "Garmin workout physiology and recovery cost",
    "current medical/safety flags",
    "Garmin readiness/recovery",
    "Apple Health authority",
  ],
  coach_memory_not_authority: [
    "current BP",
    "doctor guidance",
    "migraine/asthma/sharp pain flags",
    "Garmin readiness/recovery",
    "Rack/Motra completed strength logs",
    "Garmin Nutrition totals",
  ],
};

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
    safety_override: [
      "Doctor guidance / medical notes",
      "BP red/yellow thresholds",
      "Migraine",
      "Asthma flare",
      "Sharp/radiating/worsening pain",
      "Subjective pain/fatigue",
    ],
    readiness: [
      "Garmin Fenix 8 integrated recovery when fresh and consistently worn overnight and during training",
      "Oura sleep/recovery fallback when Garmin data is stale, missing, or unreliable",
      "Subjective pain/fatigue and medical flags override devices",
      "Apple Health summary cross-checks/data bus only",
    ],
    nutrition: "Garmin Connect+ Nutrition",
    workout_physiology: "Garmin Connect / Fenix 8 for training load, recovery time, HR, zones, Body Battery, and workout cost",
    workout_history: "Rack/Motra strength log for completed sets, exercise loads, performance history, and exercise names; Garmin supplies physiology/cost context.",
    sleep_environment: "Soundcore Sleep A30 supports sleep quality through noise/snore masking only; it is not recovery authority.",
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

async function quietSupabase(path, options = {}, fallback = null) {
  try {
    return await supabase(path, options);
  } catch {
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

function addDays(date, days) {
  return new Date(date.getTime() + (days * 86400000));
}

function weekdayName(timeZone = "Asia/Taipei", now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).formatToParts(now);
  return parts.find(p => p.type === "weekday")?.value || "";
}

function nextWeekdayDate(targetWeekday, timeZone = "Asia/Taipei", now = new Date(), { includeToday = true } = {}) {
  const order = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentIndex = order.indexOf(weekdayName(timeZone, now));
  const targetIndex = order.indexOf(targetWeekday);
  if (currentIndex < 0 || targetIndex < 0) return now;
  let daysAhead = (targetIndex - currentIndex + 7) % 7;
  if (!includeToday && daysAhead === 0) daysAhead = 7;
  return addDays(now, daysAhead);
}

function requestedWorkoutTarget({ text = "", dashboard = {}, payload = {}, intent = "general" } = {}) {
  const normalizedIntent = normalizeIntent(intent, text);
  const timeZone = payload?.timezone || dashboard.profile?.timezone || "Asia/Taipei";
  const baseNow = payload?.now ? new Date(payload.now) : dashboard.now ? new Date(dashboard.now) : new Date();
  if (normalizedIntent !== "build_workout") {
    return { now: baseNow, is_future_request: false };
  }

  const lower = String(text || "").toLowerCase();
  let targetNow = baseNow;
  let basis = "today";

  const requestedTargetDate = String(payload?.target_date || payload?.date || "").trim();
  const requestedTargetDay = String(payload?.target_day || payload?.target_weekday || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(requestedTargetDate)) {
    targetNow = new Date(`${requestedTargetDate}T00:00:00.000Z`);
    basis = "requested date";
  } else if (requestedTargetDay) {
    const normalizedDay = requestedTargetDay.slice(0, 1).toUpperCase() + requestedTargetDay.slice(1).toLowerCase();
    targetNow = nextWeekdayDate(normalizedDay, timeZone, baseNow);
    basis = "requested weekday";
  } else if (/\btomorrow(?:'s)?\b/.test(lower)) {
    targetNow = addDays(baseNow, 1);
    basis = "tomorrow";
  } else if (/\bnext\s+strength\s+day\b/.test(lower)) {
    const schedule = todaySchedule(timeZone, baseNow);
    targetNow = nextWeekdayDate(schedule.next_strength_day, timeZone, baseNow, { includeToday: false });
    basis = "next strength day";
  } else {
    const weekdayMatches = [
      ["Monday", /\bmon(?:day)?\b/],
      ["Tuesday", /\btue(?:sday)?\b/],
      ["Wednesday", /\bwed(?:nesday)?\b/],
      ["Thursday", /\bthu(?:rsday)?\b/],
      ["Friday", /\bfri(?:day)?\b/],
      ["Saturday", /\bsat(?:urday)?\b/],
      ["Sunday", /\bsun(?:day)?\b/],
    ];
    const requested = weekdayMatches.find(([, pattern]) => pattern.test(lower))?.[0] || null;
    if (requested) {
      targetNow = nextWeekdayDate(requested, timeZone, baseNow);
      basis = "upcoming";
    }
  }

  const targetDate = todayISO(timeZone, targetNow);
  const baseDate = todayISO(timeZone, baseNow);
  const targetWeekday = weekdayName(timeZone, targetNow);
  const isFutureRequest = targetDate !== baseDate;
  return {
    now: targetNow,
    is_future_request: isFutureRequest,
    requested_for_date: targetDate,
    requested_for_weekday: targetWeekday,
    planning_basis: isFutureRequest
      ? `Based on the ${basis} ${targetWeekday} plan for ${targetDate}, not today's schedule.`
      : `Based on today's ${targetWeekday} plan for ${targetDate}.`,
  };
}

function normalizeRequestedSessionType(value, text = "") {
  const raw = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (["strength", "lift", "lifting", "gym_strength"].includes(raw)) return "strength";
  if (["recovery", "safety", "mobility", "walk", "easy"].includes(raw)) return "recovery";
  if (["goal_support", "zone_2", "cardio", "conditioning"].includes(raw)) return "goal_support";

  const lower = String(text || "").toLowerCase();
  if (/\b(recovery|safety|mobility|easy)\s+(workout|session|plan)\b/.test(lower)) return "recovery";
  if (
    /\b(strength|lifting|lift)\s+(workout|session|plan)\b/.test(lower)
    || /\b(build|make|give me|create|need|want)\b.*\b(strength|lifting)\b/.test(lower)
    || /\b(strength|lifting)\b.*\b(today|now|workout|session|plan)\b/.test(lower)
  ) {
    return "strength";
  }
  if (/\b(zone\s*2|conditioning|goal[- ]support|cardio)\s+(workout|session|plan)\b/.test(lower)) return "goal_support";
  return "workout";
}

function classifyWorkoutRequest({ text = "", payload = {}, intent = "general" } = {}) {
  const normalizedIntent = normalizeIntent(intent, text);
  if (normalizedIntent !== "build_workout") {
    return {
      request_intent: "passive_today_check",
      requested_session_type: null,
      schedule_override: false,
      explicit_workout_request: false,
    };
  }

  const lower = String(text || "").toLowerCase();
  const requestedSessionType = normalizeRequestedSessionType(payload?.requested_session_type || payload?.session_type, text);
  const explicitOverride = boolFromValue(payload?.schedule_override) === true
    || /\b(override|ignore|skip|set aside)\s+(the\s+)?schedule\b/.test(lower)
    || /\b(even though|despite)\b.*\b(non[- ]?lift|off day|rest day|schedule)\b/.test(lower)
    || /\b(lift|train strength|do strength)\s+anyway\b/.test(lower);
  const explicitRecovery = requestedSessionType === "recovery";
  const explicitStrength = requestedSessionType === "strength";

  let requestIntent = "build_workout";
  if (explicitRecovery) requestIntent = "recovery_workout";
  else if (explicitOverride) requestIntent = "override_schedule";
  else if (explicitStrength) requestIntent = "build_strength";

  return {
    request_intent: requestIntent,
    requested_session_type: requestedSessionType,
    schedule_override: explicitOverride,
    explicit_workout_request: true,
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
  return first(row.date, row.summary_date, row.measured_date, row.log_date, row.session_date, row.created_at?.slice?.(0, 10)) || null;
}

function dateAgeDays(dateText, todayText) {
  if (!dateText || !todayText) return null;
  const [y1, m1, d1] = String(dateText).split("-").map(Number);
  const [y2, m2, d2] = String(todayText).split("-").map(Number);
  if (![y1, m1, d1, y2, m2, d2].every(Number.isFinite)) return null;
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
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

const COACH_MEMORY_DB_STATUSES = new Set(["active", "needs_review", "retired"]);
const COACH_MEMORY_LIFECYCLE_STATUSES = new Set(["proposed", "active", "needs_review", "retired", "superseded"]);
const COACH_MEMORY_CONFIDENCE = new Set(["low", "medium", "high"]);
const COACH_MEMORY_SAFETY_CATEGORIES = new Set(["pain_pattern", "safety_constraint", "recovery_pattern"]);
const COACH_MEMORY_SECRET_KEY = /(secret|token|password|authorization|api[_-]?key|x-coach-secret|cookie)/i;
const COACH_MEMORY_SECRET_VALUE = /\b(x-coach-secret|authorization)\b|bearer\s+[a-z0-9._~+/=-]+|(?:secret|token|password|api[_-]?key|coach_api_secret)\s*[:=]\s*\S+/i;
const WORKOUT_DEBRIEF_COMPLETION_STATUSES = new Set(["completed", "partially_completed", "skipped", "stopped_early"]);
const WORKOUT_DEBRIEF_TYPES = new Set(["strength", "cardio", "mobility", "recovery", "mixed", "unknown"]);
const WORKOUT_DEBRIEF_SOURCES = new Set(["custom_gpt", "ios_app", "shortcut", "manual", "web", "api"]);
const WORKOUT_DEBRIEF_RED_FLAG_TERMS = [
  { re: /\bchest\s+pain\b/i, label: "chest pain" },
  { re: /\b(severe|bad|significant)\s+short(ness)?\s+of\s+breath\b|\bshort(ness)?\s+of\s+breath\b|\bcan'?t\s+breathe\b/i, label: "shortness of breath" },
  { re: /\b(faint(ed|ing)?|syncope|passed\s+out|black(ed)?\s+out)\b/i, label: "fainting" },
  { re: /\b(neuro(logical)?|slurred\s+speech|one[- ]sided|numb(ness)?|weakness|vision\s+loss|confusion)\b/i, label: "neurological symptoms" },
  { re: /\bsharp\s+pain\b/i, label: "sharp pain" },
  { re: /\bradiat(ing|es|ed)\s+pain\b/i, label: "radiating pain" },
  { re: /\bworsen(ing|ed|s)?\s+pain\b|\bpain\s+(got|gets|is)\s+worse\b/i, label: "worsening pain" },
  { re: /\bsevere\s+migraine\b|\bmigraine\b/i, label: "migraine" },
  { re: /\basthma\s+(flare|attack|issue|problem)\b|\bwheez(ing|e)\b/i, label: "asthma issue" },
  { re: /\babnormal\s+blood\s+pressure\b|\bhigh\s+bp\b|\bbp\s*(?:>=|over|above)\s*(160|170|180)\b/i, label: "abnormal BP concern" },
];
const COACH_MEMORY_CONTEXT_TERMS = {
  build_workout: ["training", "exercise", "workout", "equipment", "floor", "schedule", "recovery", "pain", "safety", "style"],
  brief: ["training", "exercise", "workout", "nutrition", "recovery", "schedule", "pain", "safety", "style"],
  general: ["training", "exercise", "workout", "nutrition", "recovery", "schedule", "pain", "safety", "style"],
  nutrition_check: ["nutrition", "protein", "fat", "macros", "adherence", "meal", "food", "safety"],
  post_workout: ["workout", "exercise", "pain", "recovery", "training", "safety", "response"],
  travel_mode: ["equipment", "floor", "schedule", "training", "exercise", "safety"],
};

function queryValue(value) {
  return encodeURIComponent(String(value));
}

function compactId(value) {
  const text = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : "";
}

function normalizeCoachMemoryLifecycle(status = "active") {
  const normalized = String(status || "active").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return COACH_MEMORY_LIFECYCLE_STATUSES.has(normalized) ? normalized : "active";
}

function dbStatusForCoachMemory(status = "active") {
  const lifecycle = normalizeCoachMemoryLifecycle(status);
  if (lifecycle === "proposed") return "needs_review";
  if (lifecycle === "superseded") return "retired";
  return COACH_MEMORY_DB_STATUSES.has(lifecycle) ? lifecycle : "active";
}

function normalizeCoachMemoryConfidence(value = "medium") {
  const confidence = String(value || "medium").trim().toLowerCase();
  return COACH_MEMORY_CONFIDENCE.has(confidence) ? confidence : "medium";
}

function normalizeCoachMemoryCategory(value = "training_preference") {
  const category = String(value || "training_preference")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return truncate(category || "training_preference", 80);
}

function normalizeCoachMemoryDate(value, fallback = null) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return fallback;
}

function sanitizeCoachMemoryText(value, maxLength = 900) {
  const text = truncate(String(value || "").trim(), maxLength);
  if (!text) return "";
  return COACH_MEMORY_SECRET_VALUE.test(text) ? "[redacted secret-like text]" : text;
}

function sanitizeCoachMemoryPayload(value, depth = 0) {
  if (value === undefined) return undefined;
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return sanitizeCoachMemoryText(value, 900);
  if (depth >= 4) return "[truncated]";
  if (Array.isArray(value)) {
    return value
      .slice(0, 12)
      .map(item => sanitizeCoachMemoryPayload(item, depth + 1))
      .filter(item => item !== undefined);
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([key]) => !COACH_MEMORY_SECRET_KEY.test(key))
      .slice(0, 30)
      .map(([key, item]) => [truncate(key, 80), sanitizeCoachMemoryPayload(item, depth + 1)])
      .filter(([, item]) => item !== undefined);
    return Object.fromEntries(entries);
  }
  return null;
}

function hasSecretLikeText(value, depth = 0) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return COACH_MEMORY_SECRET_VALUE.test(value);
  if (typeof value === "number" || typeof value === "boolean") return false;
  if (depth >= 5) return false;
  if (Array.isArray(value)) return value.some(item => hasSecretLikeText(item, depth + 1));
  if (typeof value === "object") {
    return Object.entries(value).some(([key, item]) => COACH_MEMORY_SECRET_KEY.test(key) || hasSecretLikeText(item, depth + 1));
  }
  return false;
}

function normalizeCoachMemoryEvidence(value) {
  const evidence = Array.isArray(value) ? value : value ? [value] : [];
  return sanitizeCoachMemoryPayload(evidence, 0) || [];
}

function normalizeActionContexts(value, category = "") {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const contexts = raw
    .map(item => String(item || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"))
    .filter(Boolean);
  if (!contexts.length) {
    if (/nutrition/.test(category)) contexts.push("nutrition_check");
    else if (/workout|exercise|training|equipment|floor|pain|safety/.test(category)) contexts.push("build_workout");
    else if (/recovery|schedule|style/.test(category)) contexts.push("brief");
  }
  return [...new Set(contexts)].slice(0, 8);
}

function compactCoachMemoryObservation(row = {}) {
  const raw = row.raw && typeof row.raw === "object" ? row.raw : {};
  const lifecycleStatus = normalizeCoachMemoryLifecycle(raw.memory_lifecycle_status || raw.lifecycle_status || row.status || "active");
  const actionContexts = normalizeActionContexts(raw.action_contexts || raw.contexts, row.category);
  const supersedes = raw.supersedes_observation_id || raw.supersedes || null;
  const replacedBy = raw.replaced_by_observation_id || raw.replaced_by || null;
  return {
    id: row.id || null,
    observation_date: row.observation_date || null,
    category: row.category || null,
    observation: row.observation || null,
    evidence: Array.isArray(row.evidence) ? row.evidence : [],
    confidence: normalizeCoachMemoryConfidence(row.confidence),
    status: row.status || null,
    lifecycle_status: lifecycleStatus,
    action: row.action_taken || raw.action || null,
    action_taken: row.action_taken || null,
    review_date: row.review_date || null,
    source: row.source || null,
    action_contexts: actionContexts,
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 8) : [],
    last_used_at: raw.last_used_at || null,
    supersedes,
    replaced_by: replacedBy,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

function coachMemoryPriority(row = {}) {
  const category = String(row.category || "").toLowerCase();
  const text = `${row.observation || ""} ${row.action_taken || ""} ${JSON.stringify(row.raw || {})}`.toLowerCase();
  const isSafety = COACH_MEMORY_SAFETY_CATEGORIES.has(category)
    || /\b(safety|pain|hip|bp|blood pressure|migraine|asthma|sharp|radiating|worsening|doctor|medical)\b/.test(text);
  return isSafety ? "safety" : "context";
}

function coachMemoryRelevance(row = {}, intent = "general", text = "") {
  const normalizedIntent = normalizeIntent(intent, text);
  const terms = COACH_MEMORY_CONTEXT_TERMS[normalizedIntent] || COACH_MEMORY_CONTEXT_TERMS.general;
  const category = String(row.category || "").toLowerCase();
  const raw = row.raw && typeof row.raw === "object" ? row.raw : {};
  const contexts = normalizeActionContexts(raw.action_contexts || raw.contexts, category);
  const haystack = [
    category,
    row.observation,
    row.action_taken,
    row.source,
    ...(Array.isArray(raw.tags) ? raw.tags : []),
    ...contexts,
  ].filter(Boolean).join(" ").toLowerCase();
  const matches = terms.filter(term => haystack.includes(term));
  if (contexts.includes(normalizedIntent)) matches.push(normalizedIntent);
  if (normalizedIntent === "brief" && contexts.includes("coach_today")) matches.push("coach_today");
  return [...new Set(matches)];
}

function sortCoachMemoryRows(a, b, intent, text) {
  const safetyA = coachMemoryPriority(a) === "safety" ? 1 : 0;
  const safetyB = coachMemoryPriority(b) === "safety" ? 1 : 0;
  if (safetyA !== safetyB) return safetyB - safetyA;

  const relevanceA = coachMemoryRelevance(a, intent, text).length;
  const relevanceB = coachMemoryRelevance(b, intent, text).length;
  if (relevanceA !== relevanceB) return relevanceB - relevanceA;

  const confidenceScore = { high: 3, medium: 2, low: 1 };
  const confidenceA = confidenceScore[normalizeCoachMemoryConfidence(a.confidence)] || 0;
  const confidenceB = confidenceScore[normalizeCoachMemoryConfidence(b.confidence)] || 0;
  if (confidenceA !== confidenceB) return confidenceB - confidenceA;

  const dateA = Date.parse(a.updated_at || a.created_at || a.observation_date || 0) || 0;
  const dateB = Date.parse(b.updated_at || b.created_at || b.observation_date || 0) || 0;
  return dateB - dateA;
}

export async function createCoachObservation(profileId, input = {}) {
  const observation = sanitizeCoachMemoryText(input.observation || input.memory || "", 900);
  if (!profileId) throw new Error("Profile id is required.");
  if (!observation) throw new Error("Observation text is required.");
  const category = normalizeCoachMemoryCategory(input.category);
  const lifecycleStatus = normalizeCoachMemoryLifecycle(input.lifecycle_status || input.status || "active");
  const today = todayISO(input.timezone || "Asia/Taipei");
  const raw = sanitizeCoachMemoryPayload(input.raw || {}, 0) || {};
  const actionContexts = normalizeActionContexts(input.action_contexts || input.contexts || raw.action_contexts, category);
  const row = {
    profile_id: profileId,
    observation_date: normalizeCoachMemoryDate(input.observation_date || input.date, today),
    category,
    observation,
    evidence: normalizeCoachMemoryEvidence(input.evidence),
    confidence: normalizeCoachMemoryConfidence(input.confidence),
    action_taken: sanitizeCoachMemoryText(input.action_taken || input.action || "", 500) || null,
    review_date: normalizeCoachMemoryDate(input.review_date, null),
    status: dbStatusForCoachMemory(lifecycleStatus),
    source: sanitizeCoachMemoryText(input.source || "custom-gpt", 120) || "custom-gpt",
    raw: {
      ...raw,
      memory_lifecycle_status: lifecycleStatus,
      action_contexts: actionContexts,
      cannot_override: SOURCE_CONTEXT.coach_memory_not_authority,
      supersedes_observation_id: compactId(input.supersedes || input.supersedes_observation_id) || raw.supersedes_observation_id || null,
      replaced_by_observation_id: compactId(input.replaced_by || input.replaced_by_observation_id) || raw.replaced_by_observation_id || null,
      recorded_by: truncate(input.recorded_by || "coach-api", 80),
    },
  };
  const inserted = await supabase("coach_observations", { method: "POST", body: JSON.stringify([row]) });
  return compactCoachMemoryObservation(inserted?.[0] || row);
}

export async function listCoachObservations(profileId, {
  status = "active",
  category = "",
  limit = 20,
  includeDataSync = false,
} = {}) {
  if (!profileId) throw new Error("Profile id is required.");
  const safeLimit = Math.max(1, Math.min(100, Math.round(Number(limit) || 20)));
  const rows = await supabase(`coach_observations?profile_id=eq.${queryValue(profileId)}&select=*&order=observation_date.desc,updated_at.desc&limit=100`);
  const wantedStatus = String(status || "active").trim().toLowerCase();
  const wantedCategory = normalizeCoachMemoryCategory(category || "");
  return (rows || [])
    .filter(row => {
      if (!includeDataSync && row.category === "data_sync") return false;
      if (wantedStatus && wantedStatus !== "all") {
        if (row.status !== dbStatusForCoachMemory(wantedStatus)) return false;
        if (["proposed", "superseded"].includes(wantedStatus)) {
          const raw = row.raw && typeof row.raw === "object" ? row.raw : {};
          const lifecycleStatus = normalizeCoachMemoryLifecycle(raw.memory_lifecycle_status || raw.lifecycle_status || row.status || "active");
          if (lifecycleStatus !== wantedStatus) return false;
        }
      }
      if (category && row.category !== wantedCategory) return false;
      return true;
    })
    .slice(0, safeLimit)
    .map(compactCoachMemoryObservation);
}

async function getCoachObservation(profileId, observationId) {
  const id = compactId(observationId);
  if (!id) throw new Error("A valid observation_id is required.");
  const rows = await supabase(`coach_observations?profile_id=eq.${queryValue(profileId)}&id=eq.${queryValue(id)}&select=*&limit=1`);
  if (!rows?.[0]) throw new Error("Coach memory observation was not found.");
  return rows[0];
}

async function patchCoachObservation(profileId, observationId, patch = {}) {
  const id = compactId(observationId);
  if (!id) throw new Error("A valid observation_id is required.");
  const rows = await supabase(`coach_observations?profile_id=eq.${queryValue(profileId)}&id=eq.${queryValue(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return compactCoachMemoryObservation(rows?.[0] || patch);
}

export async function correctCoachObservation(profileId, input = {}) {
  const correctedObservation = sanitizeCoachMemoryText(input.corrected_observation || input.observation || "", 900);
  if (!correctedObservation) throw new Error("corrected_observation is required.");
  const existing = await getCoachObservation(profileId, input.observation_id || input.id);
  const raw = existing.raw && typeof existing.raw === "object" ? existing.raw : {};
  const existingLifecycleStatus = normalizeCoachMemoryLifecycle(raw.memory_lifecycle_status || raw.lifecycle_status || existing.status || "active");
  const lifecycleStatus = normalizeCoachMemoryLifecycle(input.lifecycle_status || input.status || existingLifecycleStatus);
  return patchCoachObservation(profileId, existing.id, {
    observation: correctedObservation,
    category: input.category ? normalizeCoachMemoryCategory(input.category) : existing.category,
    evidence: input.evidence ? normalizeCoachMemoryEvidence(input.evidence) : existing.evidence,
    confidence: normalizeCoachMemoryConfidence(input.confidence || existing.confidence),
    action_taken: sanitizeCoachMemoryText(input.action_taken || input.action || existing.action_taken || "", 500) || null,
    review_date: normalizeCoachMemoryDate(input.review_date, existing.review_date),
    status: dbStatusForCoachMemory(lifecycleStatus),
    source: sanitizeCoachMemoryText(input.source || existing.source || "custom-gpt", 120) || "custom-gpt",
    updated_at: new Date().toISOString(),
    raw: {
      ...raw,
      ...sanitizeCoachMemoryPayload(input.raw || {}, 0),
      memory_lifecycle_status: lifecycleStatus,
      corrected_at: new Date().toISOString(),
      correction_note: sanitizeCoachMemoryText(input.correction_note || input.reason || "", 500) || null,
      previous_observation: sanitizeCoachMemoryText(existing.observation || "", 900) || null,
      previous_action_taken: sanitizeCoachMemoryText(existing.action_taken || "", 500) || null,
      cannot_override: SOURCE_CONTEXT.coach_memory_not_authority,
    },
  });
}

export async function retireCoachObservation(profileId, input = {}) {
  const existing = await getCoachObservation(profileId, input.observation_id || input.id);
  const replacementId = compactId(input.replacement_observation_id || input.replaced_by);
  const raw = existing.raw && typeof existing.raw === "object" ? existing.raw : {};
  return patchCoachObservation(profileId, existing.id, {
    status: "retired",
    action_taken: existing.action_taken || "Retired from active coach memory.",
    updated_at: new Date().toISOString(),
    raw: {
      ...raw,
      ...sanitizeCoachMemoryPayload(input.raw || {}, 0),
      memory_lifecycle_status: replacementId ? "superseded" : "retired",
      retired_at: new Date().toISOString(),
      retirement_reason: sanitizeCoachMemoryText(input.reason || "Retired by Todd or Coach correction.", 500),
      replaced_by_observation_id: replacementId || raw.replaced_by_observation_id || null,
      cannot_override: SOURCE_CONTEXT.coach_memory_not_authority,
    },
  });
}

export function getRelevantCoachMemoryForContext(base = {}, { intent = "general", text = "", limit = 6 } = {}) {
  const rows = Array.isArray(base.coach_observations) ? base.coach_observations : [];
  const activeRows = rows.filter(row => row?.status === "active");
  const safetyRows = activeRows.filter(row => coachMemoryPriority(row) === "safety");
  const contextRows = activeRows.filter(row => coachMemoryPriority(row) === "safety" || coachMemoryRelevance(row, intent, text).length);
  const sorted = [...contextRows].sort((a, b) => sortCoachMemoryRows(a, b, intent, text));
  const safeLimit = Math.max(1, Math.min(12, Math.round(Number(limit) || 6)));
  const selected = [];
  for (const row of [...safetyRows.sort((a, b) => sortCoachMemoryRows(a, b, intent, text)), ...sorted]) {
    if (selected.some(item => item.id && item.id === row.id)) continue;
    if (selected.length >= safeLimit && coachMemoryPriority(row) !== "safety") continue;
    selected.push(row);
    if (selected.length >= safeLimit && selected.every(item => coachMemoryPriority(item) !== "safety")) break;
  }
  const relevant = selected.map(row => {
    const compact = compactCoachMemoryObservation(row);
    return {
      ...compact,
      priority: coachMemoryPriority(row),
      relevance: coachMemoryRelevance(row, intent, text),
      freshness_label: "memory",
      sensor_data: false,
    };
  });
  const lastUpdated = relevant
    .map(row => row.updated_at || row.created_at || row.observation_date)
    .filter(Boolean)
    .sort()
    .at(-1) || null;
  return {
    summary: "Coach memory is durable Supabase observation context. It is reviewable, correctable, and not fresh sensor data.",
    source: "coach_observations",
    relevant_observations: relevant,
    memory_warnings: [
      "Memory can constrain or personalize coaching, but current BP, doctor guidance, migraine, asthma, sharp/radiating/worsening pain, and fresh readiness data win.",
      "Retired or needs-review observations are excluded from active coach context.",
    ],
    policy: {
      role: SOURCE_CONTEXT.coach_memory_role,
      does_not_replace: SOURCE_CONTEXT.coach_memory_not_authority,
      safety_rule: "Memory can only constrain or inform training; it cannot turn Red or Yellow safety into harder training.",
    },
    retrieval: {
      intent: normalizeIntent(intent, text),
      target_limit: safeLimit,
      active_only: true,
      safety_observations_always_included: true,
      sort_order: ["safety_importance", "intent_relevance", "confidence", "recency"],
    },
    last_updated: lastUpdated,
  };
}

function normalizeDebriefText(value, maxLength = 1200) {
  return sanitizeCoachMemoryText(value, maxLength) || null;
}

function normalizeDebriefList(value, maxItems = 12, maxLength = 160) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw
    .map(item => typeof item === "string" ? item : JSON.stringify(item))
    .map(item => sanitizeCoachMemoryText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeDebriefObjectList(value, maxItems = 24) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw
    .map(item => sanitizeCoachMemoryPayload(item, 0))
    .filter(item => item && typeof item === "object")
    .slice(0, maxItems);
}

function normalizeDebriefDate(value, fallback = null) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return fallback;
}

function normalizeDebriefTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeDebriefEnum(value, allowed, fallback) {
  const normalized = String(value || fallback || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return allowed.has(normalized) ? normalized : fallback;
}

function numberInRange(value, min, max, field, { integer = true, nullable = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (nullable) return null;
    throw new Error(`${field} is required.`);
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${field} must be between ${min} and ${max}.`);
  return integer ? Math.round(n) : n;
}

function detectDebriefRedFlags(input = {}) {
  const explicit = normalizeDebriefList(input.red_flag_symptoms, 12, 160);
  const haystack = [
    ...normalizeDebriefList(input.symptoms, 20, 180),
    ...normalizeDebriefList(input.pain_quality, 12, 120),
    input.notes,
    input.coach_feedback,
    input.sleep_recovery_notes,
  ].filter(Boolean).join(" ");
  const detected = WORKOUT_DEBRIEF_RED_FLAG_TERMS
    .filter(({ re }) => re.test(haystack))
    .map(({ label }) => label);
  return [...new Set([...explicit, ...detected])].slice(0, 12);
}

function summarizeWorkoutDebrief(debrief = {}) {
  const parts = [
    debrief.workout_title || debrief.workout_type || "Workout",
    debrief.completion_status ? debrief.completion_status.replace(/_/g, " ") : null,
    debrief.session_rpe !== null && debrief.session_rpe !== undefined ? `RPE ${debrief.session_rpe}/10` : null,
    debrief.energy_after !== null && debrief.energy_after !== undefined ? `energy after ${debrief.energy_after}/10` : null,
    debrief.pain_reported ? `pain ${debrief.pain_severity ?? "reported"}/10` : null,
    debrief.modifications?.length ? `modified: ${debrief.modifications.slice(0, 2).join("; ")}` : null,
    debrief.skipped_exercises?.length ? `skipped: ${debrief.skipped_exercises.slice(0, 2).join("; ")}` : null,
  ].filter(Boolean);
  return truncate(parts.join(" | "), 500) || "Workout debrief recorded.";
}

function buildDebriefCoachTakeaways(debrief = {}) {
  const takeaways = [];
  if (debrief.safety_outcome === "red_flag") {
    takeaways.push("Treat this as a hard safety report until current symptoms and medical guidance clear training.");
  } else if (debrief.safety_outcome === "caution") {
    takeaways.push("Use this debrief to constrain the next recommendation before progressing load, density, or range.");
  }
  if (debrief.pain_reported) takeaways.push("Pain report should reduce or remove aggravating patterns in the next session.");
  if (debrief.completion_status === "stopped_early") takeaways.push("Stopped-early sessions should bias the next plan toward lower density and clearer exit ramps.");
  if (debrief.completion_status === "skipped") takeaways.push("Skipped sessions are adherence/recovery context, not proof of completed work.");
  if (debrief.completed_exercises?.length) takeaways.push("Completed exercises are Todd-reported only; Rack/Motra remains the completed-set authority.");
  if (debrief.modifications?.length) takeaways.push("Reuse successful modifications only if current safety and readiness still allow them.");
  return takeaways.slice(0, 6);
}

function buildDebriefConstraints(debrief = {}) {
  const constraints = [];
  if (debrief.safety_outcome === "red_flag") constraints.push("No hard training recommendation from this debrief; require current safety clearance first.");
  if (debrief.pain_reported) constraints.push("Reduce load/range/density for painful regions until symptoms settle.");
  for (const location of debrief.pain_locations || []) constraints.push(`Avoid aggravating ${location} work unless current symptoms are clear.`);
  for (const symptom of debrief.red_flag_symptoms || []) constraints.push(`Treat reported ${symptom} as a hard safety flag until resolved.`);
  if (debrief.completion_status === "stopped_early") constraints.push("Next plan should include an early-stop option and lower density.");
  return [...new Set(constraints)].slice(0, 8);
}

function buildDebriefMemoryCandidates(debrief = {}, input = {}) {
  const candidates = [];
  const explicitMemory = Boolean(input.save_memory_candidates || input.remember || input.save_as_memory_candidate);
  if (debrief.memory_candidate_summary) {
    candidates.push({
      summary: debrief.memory_candidate_summary,
      category: debrief.pain_reported ? "workout_response_pattern" : "training_preference",
      lifecycle_status: explicitMemory ? "proposed" : "needs_review",
      confidence: "low",
      source_debrief_id: debrief.id || null,
      note: "Single debrief only; do not promote to active memory without Todd confirmation.",
    });
  }
  if (explicitMemory && !candidates.length && (debrief.coach_feedback || debrief.modifications?.length || debrief.pain_reported)) {
    candidates.push({
      summary: debrief.coach_feedback || summarizeWorkoutDebrief(debrief),
      category: debrief.pain_reported ? "workout_response_pattern" : "training_preference",
      lifecycle_status: "proposed",
      confidence: "low",
      source_debrief_id: debrief.id || null,
      note: "Captured as proposed memory candidate only; no active Coach Memory observation was created.",
    });
  }
  return candidates.slice(0, 4);
}

function compactWorkoutDebrief(row = {}) {
  const raw = row.raw_payload && typeof row.raw_payload === "object" ? row.raw_payload : {};
  return {
    id: row.id || null,
    workout_date: row.workout_date || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    source: row.source || null,
    workout_title: row.workout_title || null,
    workout_type: row.workout_type || "unknown",
    completion_status: row.completion_status || null,
    session_rpe: asNumber(row.session_rpe),
    energy_before: asNumber(row.energy_before),
    energy_after: asNumber(row.energy_after),
    pain_reported: Boolean(row.pain_reported),
    pain_locations: Array.isArray(row.pain_locations) ? row.pain_locations : [],
    pain_severity: asNumber(row.pain_severity),
    symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
    red_flag_symptoms: Array.isArray(row.red_flag_symptoms) ? row.red_flag_symptoms : [],
    modifications: Array.isArray(row.modifications) ? row.modifications : [],
    skipped_exercises: Array.isArray(row.skipped_exercises) ? row.skipped_exercises : [],
    completed_exercises: Array.isArray(row.completed_exercises) ? row.completed_exercises : [],
    completed_exercises_authority: raw.completed_exercises_authority || "user_reported_not_rack_motra",
    notes: truncate(row.notes, 260),
    coach_feedback: truncate(row.coach_feedback, 260),
    follow_up_needed: Boolean(row.follow_up_needed),
    safety_outcome: row.safety_outcome || "none",
    memory_candidate_summary: row.memory_candidate_summary || null,
    summary: summarizeWorkoutDebrief(row),
  };
}

export async function createWorkoutDebrief(profileId, input = {}) {
  if (!profileId) throw new Error("Profile id is required.");
  if (hasSecretLikeText(input)) throw new Error("Workout debrief payload contains secret-like content.");
  const workoutDate = normalizeDebriefDate(input.workout_date || input.date, null);
  if (!workoutDate) throw new Error("workout_date must be YYYY-MM-DD.");
  const completionStatus = normalizeDebriefEnum(input.completion_status || input.status, WORKOUT_DEBRIEF_COMPLETION_STATUSES, "");
  if (!completionStatus) throw new Error("completion_status is required.");
  const workoutType = normalizeDebriefEnum(input.workout_type || input.type, WORKOUT_DEBRIEF_TYPES, "unknown");
  const redFlagSymptoms = detectDebriefRedFlags(input);
  const painReported = Boolean(input.pain_reported || input.pain || input.pain_severity || normalizeDebriefList(input.pain_locations).length || normalizeDebriefList(input.pain_quality).length);
  const painSeverity = numberInRange(input.pain_severity ?? input.pain_score, 0, 10, "pain_severity", { nullable: true });
  const symptoms = normalizeDebriefList(input.symptoms, 20, 180);
  const safetyOutcome = redFlagSymptoms.length
    ? "red_flag"
    : painReported || painSeverity >= 4 || symptoms.length || ["partially_completed", "stopped_early"].includes(completionStatus)
      ? "caution"
      : "none";
  const row = {
    profile_id: profileId,
    workout_date: workoutDate,
    workout_started_at: normalizeDebriefTimestamp(input.workout_started_at || input.started_at),
    workout_completed_at: normalizeDebriefTimestamp(input.workout_completed_at || input.completed_at),
    source: normalizeDebriefEnum(input.source, WORKOUT_DEBRIEF_SOURCES, "custom_gpt"),
    planned_workout_id: input.planned_workout_id ? truncate(String(input.planned_workout_id), 120) : null,
    workout_title: normalizeDebriefText(input.workout_title || input.title, 180),
    workout_type: workoutType,
    completion_status: completionStatus,
    session_rpe: numberInRange(input.session_rpe ?? input.rpe, 1, 10, "session_rpe", { nullable: true }),
    energy_before: numberInRange(input.energy_before, 1, 10, "energy_before", { nullable: true }),
    energy_after: numberInRange(input.energy_after, 1, 10, "energy_after", { nullable: true }),
    pain_reported: painReported,
    pain_locations: normalizeDebriefList(input.pain_locations, 12, 120),
    pain_severity: painSeverity,
    pain_quality: normalizeDebriefList(input.pain_quality, 12, 120),
    symptoms,
    red_flag_symptoms: redFlagSymptoms,
    modifications: normalizeDebriefList(input.modifications, 20, 240),
    skipped_exercises: normalizeDebriefList(input.skipped_exercises, 20, 160),
    completed_exercises: normalizeDebriefObjectList(input.completed_exercises, 30),
    notes: normalizeDebriefText(input.notes || input.summary, 1200),
    coach_feedback: normalizeDebriefText(input.coach_feedback, 900),
    nutrition_notes: normalizeDebriefText(input.nutrition_notes, 600),
    sleep_recovery_notes: normalizeDebriefText(input.sleep_recovery_notes, 600),
    safety_outcome: safetyOutcome,
    follow_up_needed: Boolean(input.follow_up_needed || safetyOutcome !== "none"),
    memory_candidate_summary: normalizeDebriefText(input.memory_candidate_summary, 500),
    linked_observation_ids: normalizeDebriefList(input.linked_observation_ids, 12, 80).filter(compactId),
    raw_payload: {
      ...sanitizeCoachMemoryPayload(input.raw || {}, 0),
      request_fields: sanitizeCoachMemoryPayload(input, 0),
      completed_exercises_authority: "user_reported_not_rack_motra",
      source_policy: {
        role: SOURCE_CONTEXT.workout_debrief_role,
        does_not_replace: SOURCE_CONTEXT.workout_debrief_not_authority,
        safety_rule: "Debriefs can constrain future coaching but cannot make Red safety less conservative.",
      },
    },
  };
  const inserted = await supabase("coach_workout_debriefs", { method: "POST", body: JSON.stringify([row]) });
  const debrief = compactWorkoutDebrief(inserted?.[0] || row);
  const memoryCandidates = buildDebriefMemoryCandidates(debrief, input);
  return {
    ok: true,
    debrief_id: debrief.id,
    safety_outcome: debrief.safety_outcome,
    debrief_summary: debrief.summary,
    coach_takeaways: buildDebriefCoachTakeaways(debrief),
    memory_candidates: memoryCandidates,
    next_recommendation_constraints: buildDebriefConstraints(debrief),
    requires_follow_up: debrief.follow_up_needed,
    warnings: [
      "Workout debriefs are Todd-reported subjective feedback, not Rack/Motra completed-set authority.",
      "Debrief context can constrain or inform future coaching but cannot override current hard safety flags.",
      ...(debrief.safety_outcome === "red_flag" ? ["Red flag debrief cannot produce a hard-training recommendation."] : []),
    ],
    last_updated: debrief.updated_at || debrief.created_at || new Date().toISOString(),
    debrief,
  };
}

export async function listWorkoutDebriefs(profileId, { limit = 10 } = {}) {
  if (!profileId) throw new Error("Profile id is required.");
  const safeLimit = Math.max(1, Math.min(30, Math.round(Number(limit) || 10)));
  const rows = await supabase(`coach_workout_debriefs?profile_id=eq.${queryValue(profileId)}&select=*&order=workout_date.desc,created_at.desc&limit=${safeLimit}`);
  return (rows || []).map(compactWorkoutDebrief);
}

export function getWorkoutDebriefContext(base = {}, { limit = 5 } = {}) {
  const rows = Array.isArray(base.coach_workout_debriefs) ? base.coach_workout_debriefs : [];
  const safeLimit = Math.max(1, Math.min(10, Math.round(Number(limit) || 5)));
  const compactRows = [...rows]
    .sort((a, b) => String(b.workout_date || b.created_at || "").localeCompare(String(a.workout_date || a.created_at || "")))
    .slice(0, safeLimit)
    .map(compactWorkoutDebrief);
  const redRows = compactRows.filter(row => row.safety_outcome === "red_flag");
  const cautionRows = compactRows.filter(row => row.safety_outcome === "caution");
  const responsePatterns = [];
  for (const row of compactRows) {
    if (row.pain_reported) responsePatterns.push(`Pain after ${row.workout_title || row.workout_type || row.workout_date}: ${row.pain_locations.join(", ") || "location unspecified"} ${row.pain_severity ?? "reported"}/10.`);
    if (row.modifications.length) responsePatterns.push(`Useful modification from ${row.workout_date}: ${row.modifications.slice(0, 2).join("; ")}.`);
    if (row.completion_status === "stopped_early") responsePatterns.push(`Stopped early on ${row.workout_date}; lower next-session density until context is clear.`);
  }
  const safetyWarnings = [
    ...redRows.map(row => `Red flag debrief on ${row.workout_date}: ${row.red_flag_symptoms.join(", ") || "hard safety symptom reported"}. Do not recommend hard training from this context.`),
    ...cautionRows.map(row => `Caution debrief on ${row.workout_date}: use pain/symptom response to constrain the next plan.`),
  ];
  const lastUpdated = compactRows
    .map(row => row.updated_at || row.created_at || row.workout_date)
    .filter(Boolean)
    .sort()
    .at(-1) || null;
  return {
    summary: compactRows.length
      ? "Recent workout debriefs are Todd-reported subjective response data. They can constrain and personalize future coaching."
      : "No recent workout debrief records are available.",
    source: "coach_workout_debriefs",
    recent_debriefs: compactRows,
    response_patterns: [...new Set(responsePatterns)].slice(0, 8),
    safety_warnings: [...new Set(safetyWarnings)].slice(0, 8),
    policy: {
      role: SOURCE_CONTEXT.workout_debrief_role,
      does_not_replace: SOURCE_CONTEXT.workout_debrief_not_authority,
      safety_rule: "Red safety and hard medical flags override all debriefs; debriefs can only make coaching more conservative.",
    },
    last_updated: lastUpdated,
  };
}

function parseMotraExerciseNames(text = "") {
  const seen = new Set();
  const names = [];
  const skip = /\b(duration|workout|total|volume|calories|heart rate|avg|average|max|started|ended|date|notes?|summary|sets?|reps?|weight|rest|personal record)\b/i;
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine
      .trim()
      .replace(/^[\-*•\d.)\s]+/, "")
      .replace(/\s{2,}/g, " ");
    if (!line || line.length < 3 || line.length > 90) continue;
    if (!/[a-z]/i.test(line) || skip.test(line)) continue;
    const name = line
      .replace(/\s+(?:x|×)\s*\d+.*$/i, "")
      .replace(/\s+\d+\s*(?:kg|lbs?|reps?|sec|seconds?|min|minutes?)\b.*$/i, "")
      .replace(/\s+\([^)]*\)\s*$/i, "")
      .trim();
    if (!name || name.length < 3 || skip.test(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length >= 24) break;
  }
  return names;
}

export function buildMotraDebriefTemplate(input = {}) {
  if (hasSecretLikeText(input)) throw new Error("Motra template payload contains secret-like content.");
  const motraText = String(input.motra_text || input.text || "").trim();
  if (!motraText) throw new Error("motra_text is required.");
  const exercises = parseMotraExerciseNames(motraText);
  const fallbackLines = [
    "Overall RPE:",
    "Pain/symptoms:",
    "Best movement:",
    "Worst movement:",
    "Changes for next time:",
  ];
  const exerciseLines = exercises.length
    ? exercises.map(name => `- ${name}: completed? notes / pain / load comments:`)
    : ["- Exercise notes: paste any movements Motra listed and add completion, pain, and load comments:"];
  return {
    ok: true,
    action: "motra-template",
    debrief_template: [
      "Workout debrief",
      ...fallbackLines,
      "",
      "Exercise notes",
      ...exerciseLines,
    ].join("\n"),
    parsed_motra: {
      exercise_count: exercises.length,
      exercises,
      source: "motra_export_text",
      authority_boundary: "Template parsing is convenience only. Rack/Motra remains completed strength-log authority after Todd submits the final debrief/log.",
    },
  };
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
  const garmin = sleep.garmin || {};
  const sourceLabel = String(first(sleep.source, garmin.source, "")).toLowerCase();
  const sourceIsGarmin = Boolean(
    sourceLabel.includes("garmin") ||
    sleep.garmin ||
    sleep.garmin_hrv_ms ||
    sleep.hrv_status_ms ||
    sleep.training_readiness_score ||
    sleep.body_battery_score ||
    sleep.recovery_time_hours ||
    garmin.hrv_ms ||
    garmin.hrv_status_ms ||
    garmin.training_readiness_score ||
    garmin.body_battery_score
  );
  return {
    row: sleep,
    date: sleep.date || sleep.measured_date || null,
    source: sleep.source || null,
    garmin_readiness: asNumber(first(garmin.training_readiness_score, garmin.readiness_score, sleep.training_readiness_score, sleep.garmin_readiness_score, sourceIsGarmin ? sleep.recovery_score_pct : null)),
    garmin_hrv: asNumber(first(garmin.hrv_status_ms, garmin.hrv_ms, sleep.garmin_hrv_ms, sleep.hrv_status_ms, sourceIsGarmin ? sleep.hrv_ms : null)),
    garmin_rhr: asNumber(first(garmin.resting_hr_bpm, garmin.rhr_bpm, sleep.garmin_resting_hr_bpm, sourceIsGarmin ? sleep.resting_hr_bpm : null)),
    garmin_sleep_min: asNumber(first(garmin.total_sleep_min, sleep.garmin_total_sleep_min, sourceIsGarmin ? sleep.total_sleep_min : null)),
    oura_readiness: asNumber(first(oura.readiness_score, sleep.oura_readiness_score)),
    oura_hrv: asNumber(first(oura.hrv_avg_ms, sleep.oura_hrv_ms, sourceIsGarmin ? null : sleep.hrv_ms)),
    oura_rhr: asNumber(first(oura.rhr_bpm_avg, sourceIsGarmin ? null : sleep.resting_hr_bpm)),
    oura_sleep_min: asNumber(first(oura.total_sleep_min, sourceIsGarmin ? null : sleep.total_sleep_min)),
    bevel_recovery: asNumber(first(bevel.recovery_pct, sourceIsGarmin ? null : sleep.recovery_score_pct)),
    bevel_hrv: asNumber(first(bevel.hrv_ms, sourceIsGarmin ? null : sleep.hrv_ms)),
    sleep_min: asNumber(first(garmin.total_sleep_min, sleep.garmin_total_sleep_min, sourceIsGarmin ? sleep.total_sleep_min : null, bevel.time_asleep_min, oura.total_sleep_min, sleep.total_sleep_min)),
    garmin_wear_reliable: garminWearReliable(sleep, garmin),
  };
}

function boolFromValue(value) {
  if (value === true || value === false) return value;
  if (typeof value === "number") return value > 0;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "yes", "y", "worn", "reliable", "stable", "good", "complete", "consistent", "sufficient"].includes(normalized)) return true;
  if (["false", "no", "n", "not worn", "unreliable", "unstable", "poor", "incomplete", "inconsistent", "insufficient"].includes(normalized)) return false;
  return null;
}

function garminWearReliable(sleep = {}, garmin = {}) {
  const qualityText = [
    sleep.garmin_data_quality,
    sleep.data_quality,
    sleep.wear_quality,
    sleep.device_wear,
    sleep.hrv_status,
    sleep.training_readiness_status,
    garmin.data_quality,
    garmin.wear_quality,
    garmin.device_wear,
    garmin.hrv_status,
    garmin.training_readiness_status,
  ].filter(Boolean).join(" ").toLowerCase();

  if (/\b(not worn|not enough data|insufficient|inconsistent|unreliable|no baseline|reset period|baseline building|poor wear)\b/.test(qualityText)) return false;
  if (/\b(consistent|reliable|stable baseline|worn overnight|complete)\b/.test(qualityText)) return true;

  const explicitFlags = [
    sleep.garmin_consistently_worn,
    sleep.consistently_worn,
    sleep.watch_worn,
    sleep.watch_worn_overnight,
    sleep.overnight_worn,
    sleep.worn_overnight,
    sleep.worn_during_training,
    sleep.garmin_worn_during_training,
    sleep.garmin_baseline_stable,
    sleep.baseline_stable,
    garmin.consistently_worn,
    garmin.watch_worn,
    garmin.watch_worn_overnight,
    garmin.overnight_worn,
    garmin.worn_overnight,
    garmin.worn_during_training,
    garmin.baseline_stable,
  ].map(boolFromValue).filter(value => value !== null);

  if (explicitFlags.some(value => value === false)) return false;
  if (explicitFlags.some(value => value === true)) return true;
  return null;
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

function latestDoctorGuidance(dashboard = {}) {
  const notes = Array.isArray(dashboard.doctor_notes) ? dashboard.doctor_notes : [];
  const note = latest(notes) || dashboard.current?.doctor_note || null;
  if (!note || typeof note !== "object") return null;
  const text = [
    note.topic,
    note.guidance,
    note.training_impact,
    note.notes,
    note.summary,
  ].filter(Boolean).join(" ");
  const lower = text.toLowerCase();
  const blocksTraining = /\b(no|avoid|hold|stop|pause|skip)\s+(?:hard\s+)?(?:training|exercise|workouts?|lifting|conditioning|intensity)\b/.test(lower)
    || /\b(rest|medical hold|do not train|no intensity|no hard training)\b/.test(lower);
  const modifiesTraining = /\b(modify|modified|downshift|light only|easy only|caution|limit|reduced intensity|no heavy)\b/.test(lower);
  return {
    row: note,
    date: note.date || note.note_date || note.created_at || null,
    topic: note.topic || note.summary || "Doctor guidance",
    guidance: note.guidance || note.notes || note.training_impact || null,
    training_impact: note.training_impact || null,
    severity: blocksTraining ? "red" : modifiesTraining ? "yellow" : null,
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

function compactAppleHealthSummary(row = {}) {
  if (!row || typeof row !== "object") return null;
  return {
    date: row.summary_date || row.date || null,
    source: "Apple Health / HealthKit daily summary",
    role: "supporting cross-check",
    source_app: row.source_app || "Apple Health",
    source_device: row.source_device || null,
    timezone: row.timezone || null,
    steps: asNumber(row.steps),
    exercise_minutes: asNumber(row.exercise_minutes),
    active_energy_kcal: asNumber(row.active_energy_kcal),
    workout_count: asNumber(row.workout_count),
    strength_workout_count: asNumber(row.strength_workout_count),
    cardio_workout_count: asNumber(row.cardio_workout_count),
    sleep_minutes: asNumber(row.sleep_minutes),
    resting_hr_bpm: asNumber(row.resting_hr_bpm),
    hrv_sdnn_ms: asNumber(row.hrv_sdnn_ms),
    hrv_sample_count: asNumber(row.hrv_sample_count),
    duplicate_policy_flags: row.duplicate_policy_flags || {},
    metric_quality: row.metric_quality || {},
    updated_at: row.updated_at || null,
  };
}

function compactAppleHealthSyncRun(row = {}) {
  if (!row || typeof row !== "object") return null;
  return {
    status: row.status || null,
    days_requested: asNumber(row.days_requested),
    days_written: asNumber(row.days_written),
    timezone: row.timezone || null,
    started_at: row.started_at || null,
    completed_at: row.completed_at || null,
    errors: Array.isArray(row.errors) ? row.errors : [],
  };
}

function sumAppleHealthMetric(rows = [], field) {
  return rows.reduce((total, row) => total + (asNumber(row?.[field]) || 0), 0);
}

function formatMetric(value, suffix = "") {
  const n = asNumber(value);
  return n === null ? "unknown" : `${Math.round(n)}${suffix}`;
}

function hasAppleHealthDuplicateFlag(row = {}) {
  const flags = row.duplicate_policy_flags || row.raw_summary?.duplicate_policy_flags || {};
  return Object.values(flags).some(value => value === true || String(value).toLowerCase() === "true");
}

export function buildAppleHealthSupport(base = {}) {
  const timezone = base.profile?.timezone || "Asia/Taipei";
  const now = base.now || new Date();
  const today = todayISO(timezone, now);
  const summaries = Array.isArray(base.apple_health_daily_summaries)
    ? base.apple_health_daily_summaries
    : Array.isArray(base.recent?.apple_health_daily_summaries)
      ? base.recent.apple_health_daily_summaries
      : base.current?.apple_health_daily_summary
        ? [base.current.apple_health_daily_summary]
        : [];
  const syncRuns = Array.isArray(base.apple_health_sync_runs) ? base.apple_health_sync_runs : [];
  const latestSummary = latest(summaries);
  const latestSync = latest(syncRuns);
  const latestDate = rowDate(latestSummary);
  const ageDays = dateAgeDays(latestDate, today);
  const recentRows = summaries.filter(row => {
    const age = dateAgeDays(rowDate(row), today);
    return age !== null && age >= 0 && age <= 6;
  });
  const compactLatest = compactAppleHealthSummary(latestSummary);
  const sync = compactAppleHealthSyncRun(latestSync);
  const isPartial = Boolean(sync) && (
    sync.status === "partial"
    || Boolean(sync.errors?.length)
    || (sync.days_requested !== null && sync.days_written !== null && sync.days_written < sync.days_requested)
  );
  const freshness = !latestSummary
    ? "missing"
    : isPartial
      ? "partial"
      : ageDays !== null && ageDays <= 1
        ? "current"
        : "stale";
  const warnings = [];
  if (!latestSummary) warnings.push("No Apple Health daily summaries are available. This is a diagnostic gap only.");
  if (latestSummary && freshness === "stale") warnings.push("Latest Apple Health summary is older than yesterday in Asia/Taipei.");
  if (isPartial) warnings.push("Latest Apple Health sync is partial; unrelated coach sources remain usable.");
  if (latestSummary && (asNumber(latestSummary.workout_count) || asNumber(latestSummary.strength_workout_count))) {
    warnings.push("Apple Health workout counts are detected activity context only and are not added to Garmin/Rack/Motra completed strength totals.");
  }

  return {
    source: "Apple Health / HealthKit daily summary",
    role: "supporting cross-check",
    status: freshness,
    latest_summary_date: latestDate,
    latest_sync_date: sync?.completed_at?.slice?.(0, 10) || sync?.started_at?.slice?.(0, 10) || null,
    timezone: compactLatest?.timezone || sync?.timezone || timezone,
    days_available_last_7: recentRows.length,
    latest_summary: compactLatest,
    latest_sync: sync,
    last_7_days: {
      count: recentRows.length,
      steps: sumAppleHealthMetric(recentRows, "steps"),
      exercise_minutes: sumAppleHealthMetric(recentRows, "exercise_minutes"),
      active_energy_kcal: sumAppleHealthMetric(recentRows, "active_energy_kcal"),
      workout_count: sumAppleHealthMetric(recentRows, "workout_count"),
      strength_workout_count: sumAppleHealthMetric(recentRows, "strength_workout_count"),
      cardio_workout_count: sumAppleHealthMetric(recentRows, "cardio_workout_count"),
    },
    duplicate_policy: {
      garmin_mirror_possible: summaries.some(hasAppleHealthDuplicateFlag),
      warning: "Do not count Apple Health workout_count as completed Garmin/Rack/Motra strength history.",
    },
    policy: {
      role: SOURCE_CONTEXT.apple_health_role,
      does_not_override: ["Garmin readiness/recovery", "subjective symptoms", "medical safety flags", "Garmin workout physiology", "Rack/Motra strength history"],
    },
    warnings,
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
  const appleHealth = buildAppleHealthSupport(base);
  const workoutDebriefContext = getWorkoutDebriefContext(base, { limit: 5 });
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
      label: "Garmin Nutrition",
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
      label: "Rack/Motra strength session",
      status: schedule.strength_planned ? (strengthToday ? "current" : "pending") : "not_expected",
      required: Boolean(schedule.strength_planned),
      latest_date: rowDate(latestStrength),
    },
    {
      id: "strength_exercises",
      label: "Rack/Motra strength exercise detail",
      status: schedule.strength_planned ? (detailedStrengthToday ? "current" : "pending") : "not_expected",
      required: Boolean(schedule.strength_planned),
      latest_date: rowDate(latestDetailedStrength),
    },
    {
      id: "workout_feedback",
      label: "Workout feedback",
      status: strengthToday ? (feedbackToday || workoutDebriefContext.recent_debriefs.some(row => row.workout_date === today) ? "current" : "missing_after_training") : "not_expected",
      required: Boolean(strengthToday),
      latest_date: feedbackToday ? rowDate(feedbackToday) : workoutDebriefContext.last_updated?.slice?.(0, 10) || rowDate(latest(base.session_feedback)),
    },
    {
      id: "apple_health_daily_summary",
      label: "Apple Health daily summary",
      status: appleHealth.status,
      required: false,
      latest_date: appleHealth.latest_summary_date,
      source: appleHealth.source,
      role: appleHealth.role,
      days_available_last_7: appleHealth.days_available_last_7,
      warning: appleHealth.warnings[0] || null,
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
    supporting_evidence: {
      apple_health: appleHealth,
      workout_debriefs: workoutDebriefContext,
    },
  };
}

function parseSubjective(text = "", payload = {}) {
  const t = String(text || `${payload.notes || ""} ${payload.summary || ""}`).toLowerCase();
  const hipMatch = t.match(/\bhip(?:\s+(?:pain|score|rating|level|feels|felt|is|was)){0,3}\s*[:=]?\s*(\d(?:\.\d+)?)(?:\s*\/\s*10)?\b/);
  const painMatch = t.match(/\bpain(?:\s+(?:score|rating|level|is|was)){0,3}\s*[:=]?\s*(\d(?:\.\d+)?)(?:\s*\/\s*10)?\b/);
  const dangerPain = Boolean(
    payload.sharp_pain ||
    payload.radiating_pain ||
    payload.worsening_pain ||
    /\b(sharp|radiating|worsening)\s+pain\b/.test(t) ||
    /\bpain\s+(?:is\s+)?(?:sharp|radiating|worsening)\b/.test(t)
  );
  return {
    hip_pain: asNumber(payload.hip_pain ?? payload.hip_pain_score ?? hipMatch?.[1]),
    pain: asNumber(payload.pain ?? payload.pain_score ?? painMatch?.[1]),
    danger_pain: dangerPain,
    asthma_flare: Boolean(payload.asthma_flare || t.includes("asthma flare") || t.includes("wheezing")),
    migraine: Boolean(payload.migraine || t.includes("migraine")),
    fatigue_high: Boolean(payload.fatigue_high || t.includes("exhausted") || t.includes("wiped out")),
  };
}

export function evaluateReadiness(dashboard = {}, state = DEFAULT_COACH_STATE, context = {}) {
  const sleep = latestSleepValues(dashboard);
  const bp = latestBpValues(dashboard);
  const doctorGuidance = latestDoctorGuidance(dashboard);
  const subjective = parseSubjective(context.text, context.payload || {});
  const workoutDebriefContext = getWorkoutDebriefContext(dashboard, { limit: 5 });
  const timezone = dashboard.profile?.timezone || "Asia/Taipei";
  const now = context.now || new Date();
  const today = todayISO(timezone, now);
  const schedule = todaySchedule(timezone, now);
  const hrvBaseline = asNumber(dashboard.profile?.oura_biology_baselines?.hrv_baseline_ms) || 32.5;
  const sleepAgeDays = dateAgeDays(sleep.date, today);
  const garminHasRecoveryData = [
    sleep.garmin_readiness,
    sleep.garmin_hrv,
    sleep.garmin_rhr,
    sleep.garmin_sleep_min,
  ].some(value => value !== null);
  const garminWearReliableFlag = sleep.garmin_wear_reliable;
  const garminFresh = garminHasRecoveryData && sleepAgeDays !== null && sleepAgeDays >= 0 && sleepAgeDays <= 1;
  const garminUsable = garminFresh && garminWearReliableFlag !== false;
  const garminStale = garminHasRecoveryData && !garminFresh;
  const garminWearUnreliable = garminHasRecoveryData && garminFresh && garminWearReliableFlag === false;
  const garminHrv = garminUsable ? sleep.garmin_hrv : null;
  const garminRecovery = garminUsable ? sleep.garmin_readiness : null;
  const primaryHrv = asNumber(first(garminHrv, sleep.oura_hrv, sleep.bevel_hrv));
  const primaryHrvSource = garminHrv !== null ? "Garmin" : sleep.oura_hrv !== null ? "Oura fallback" : sleep.bevel_hrv !== null ? "legacy Bevel fallback" : null;
  const primaryRecovery = asNumber(first(garminRecovery, sleep.oura_readiness, sleep.bevel_recovery));
  const primaryRecoverySource = garminRecovery !== null ? "Garmin" : sleep.oura_readiness !== null ? "Oura fallback" : sleep.bevel_recovery !== null ? "legacy Bevel fallback" : null;
  const fallbackRecovery = garminRecovery !== null
    ? asNumber(first(sleep.oura_readiness, sleep.bevel_recovery))
    : sleep.oura_readiness !== null
      ? sleep.bevel_recovery
      : null;
  const risks = [];
  const evidence = [];
  let tier = "Green";
  let trainingCall = "Train. Use the planned strength/athletic session.";

  if (sleep.date) {
    evidence.push(`Readiness data ${sleep.date}: ${primaryHrvSource || "no primary"} HRV ${primaryHrv ?? "unknown"}ms, ${primaryRecoverySource || "no primary"} recovery/readiness ${primaryRecovery ?? "unknown"}.`);
  }
  if (doctorGuidance?.date || doctorGuidance?.guidance) {
    evidence.push(`Doctor guidance${doctorGuidance.date ? ` ${doctorGuidance.date}` : ""}: ${doctorGuidance.training_impact || doctorGuidance.guidance || doctorGuidance.topic}.`);
  }
  if (bp.date) evidence.push(`Latest BP ${bp.date}: ${bp.systolic ?? "?"}/${bp.diastolic ?? "?"}.`);
  evidence.push(`Schedule gate: ${schedule.label}.`);
  if (workoutDebriefContext.last_updated && workoutDebriefContext.recent_debriefs.length) {
    evidence.push(`Recent workout debrief context through ${workoutDebriefContext.last_updated}: ${workoutDebriefContext.summary}`);
  }

  if (doctorGuidance?.severity === "red") risks.push({ code: "doctor_guidance", severity: "red", text: "Doctor guidance currently blocks or holds training. Devices do not clear training." });
  if (doctorGuidance?.severity === "yellow") risks.push({ code: "doctor_guidance", severity: "yellow", text: "Doctor guidance calls for modified or limited training." });
  if (subjective.migraine) risks.push({ code: "migraine", severity: "red", text: "Migraine reported. Training is rest or major downgrade." });
  if (subjective.asthma_flare) risks.push({ code: "asthma", severity: "red", text: "Asthma flare reported. No intensity until breathing is settled." });
  if (subjective.danger_pain) risks.push({ code: "danger_pain", severity: "red", text: "Sharp, radiating, or worsening pain reported. Devices do not clear training." });
  if ((subjective.hip_pain ?? subjective.pain ?? 0) >= 4) risks.push({ code: "pain", severity: "red", text: "Pain is above the training threshold. Remove aggravating loaded patterns." });
  if (bp.diastolic >= 100 || bp.systolic >= 160) risks.push({ code: "bp_red", severity: "red", text: `BP ${bp.systolic}/${bp.diastolic} is a hard downshift signal.` });
  if (bp.diastolic >= 90 || bp.systolic >= 140) risks.push({ code: "bp_watch", severity: "yellow", text: `BP ${bp.systolic}/${bp.diastolic} stays on the watchlist.` });
  if (garminStale) risks.push({ code: "stale_garmin_readiness", severity: "yellow", text: "Latest Garmin readiness/recovery data is stale. Use Oura or legacy recovery fallback if available." });
  if (garminWearUnreliable) risks.push({ code: "unreliable_garmin_wear", severity: "yellow", text: "Garmin readiness/recovery data is fresh but wear quality or baseline reliability is not sufficient. Use Oura or legacy recovery fallback if available." });
  if (primaryHrv !== null && primaryHrv < Math.min(25, hrvBaseline * 0.8)) risks.push({ code: "low_hrv", severity: "red", text: `HRV ${primaryHrv}ms is materially below baseline ${hrvBaseline}ms.` });
  if (primaryRecovery !== null && primaryRecovery < 35) risks.push({ code: "low_recovery", severity: "red", text: `${primaryRecoverySource || "Recovery"} ${primaryRecovery}% is low-autonomic-reserve territory.` });
  if (garminRecovery === null && fallbackRecovery !== null && fallbackRecovery < 35) {
    risks.push({ code: "low_recovery", severity: "red", text: `Fallback recovery ${fallbackRecovery}% is low-autonomic-reserve territory.` });
  }
  if (primaryRecovery >= 80 && fallbackRecovery !== null && fallbackRecovery < 40) {
    risks.push({ code: "app_conflict", severity: "yellow", text: "Primary recovery looks green while fallback physiology is red. Treat physiology conflict conservatively." });
  }
  if (workoutDebriefContext.recent_debriefs.some(row => row.safety_outcome === "red_flag")) {
    risks.push({ code: "workout_debrief_red_flag", severity: "red", text: "Recent workout debrief reported red flag symptoms. Do not use devices or debrief optimism to clear hard training." });
  } else if (workoutDebriefContext.recent_debriefs.some(row => row.safety_outcome === "caution")) {
    risks.push({ code: "workout_debrief_caution", severity: "yellow", text: "Recent workout debrief reported pain, symptoms, stopped-early, or partial completion. Constrain the next plan." });
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
  if (!schedule.strength_planned && !red && !yellow) {
    trainingCall = schedule.non_lift_call;
  }

  return {
    tier,
    training_call: trainingCall,
    schedule,
    hrv_ms: primaryHrv,
    hrv_baseline_ms: hrvBaseline,
    hrv_source: primaryHrvSource,
    recovery_source: primaryRecoverySource,
    garmin_readiness: garminRecovery,
    oura_readiness: sleep.oura_readiness,
    bevel_recovery: sleep.bevel_recovery,
    doctor_guidance: doctorGuidance,
    risk_flags: risks,
    evidence,
    source_order: state.source_hierarchy.readiness,
  };
}

export function buildNutritionCall(dashboard = {}, state = DEFAULT_COACH_STATE) {
  const n = latestNutritionValues(dashboard);
  const nutritionSource = state.source_hierarchy?.nutrition || DEFAULT_COACH_STATE.source_hierarchy.nutrition;
  const proteinTarget = state.goals.protein_floor_g || n.protein_target_g || 150;
  const fatTarget = state.goals.fat_budget_g || n.fat_target_g || 70;
  const proteinGap = n.protein_g === null ? null : Math.max(0, Math.round(proteinTarget - n.protein_g));
  const fatOver = n.fat_g === null ? null : Math.max(0, Math.round(n.fat_g - fatTarget));
  let call = `No complete ${nutritionSource} total yet. Log Garmin Nutrition totals, then close protein first and fat second.`;
  const actions = [`Use ${nutritionSource} as primary when daily totals are usable.`, "Close the day with lean protein if totals are incomplete."];

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
    source: nutritionSource,
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
  return {
    id: "PREHAB",
    label: "Floor 3 - Hip-Safe Prehab",
    floor: "Floor 3",
    estimated_min: modified ? 12 : 10,
    exercises: [
      plannedExercise({
        name: "Bodyweight Glute Bridge",
        motra_name: "Bodyweight Glute Bridge",
        floor: "Floor 3",
        equipment: "Floor 3 open mat space",
        sets: 2,
        reps: modified ? "8 with 2-second hold" : "10 with 2-second hold",
        load: "bodyweight",
        rest: "30-45 sec",
        note: "Start easy, pause at the top, and stop before the front of the hip grabs.",
        pro_coaching: [
          "Start flat on the mat with feet planted and pressure through your heels.",
          "Lift smoothly, pause for two seconds, then lower with control.",
          "Keep each rep quiet and repeatable.",
        ],
        feel: [
          "This should feel like smooth work through the back of your hips, not a pinch in the front.",
          "You should feel steady and warmed up, not strained.",
        ],
        avoid: [
          "No rushing the hold.",
          "No pushing into a hip pinch.",
        ],
        safety_modification: "Shorten the range or skip it if the front of the hip grabs.",
      }),
      plannedExercise({
        name: "Cable Pallof Hold",
        motra_name: state.gym_profile.motra_names.pallof_hold,
        floor: "Floor 3",
        equipment: "Floor 3 Matrix functional trainer",
        sets: 2,
        reps: "20-30 sec/side",
        load: "light cable load you can hold without turning",
        rest: "30-45 sec",
        note: "Stand tall and keep the handle still in front of you.",
        pro_coaching: [
          "Stand tall before the timer starts.",
          "Press the handle straight out and keep your body from turning.",
          "Breathe normally while the cable tries to pull you sideways.",
        ],
        feel: [
          "This should feel like steady pressure through your hands and middle.",
          "You should feel calm control, not shaking panic.",
        ],
        avoid: [
          "No leaning into the cable.",
          "No holding your breath.",
        ],
        safety_modification: "Step closer to the cable stack or reduce the load if you cannot stay still.",
      }),
      plannedExercise({
        name: "Cable Hip Abduction",
        motra_name: "Cable Hip Abduction",
        floor: "Floor 3",
        equipment: "Floor 3 Matrix functional trainer with ankle strap if available",
        sets: 2,
        reps: "8-10/side, left first",
        load: "light cable load",
        rest: "30-45 sec",
        note: "Move only as far as you can control without hip pinch.",
        pro_coaching: [
          "Stand tall with one hand lightly on the station.",
          "Move the working leg out slowly, pause, then bring it back under control.",
          "Keep the range small enough that the rest of your body stays quiet.",
        ],
        feel: [
          "This should feel controlled on the outside of the working hip.",
          "You should feel balanced and deliberate, not twisted.",
        ],
        avoid: [
          "No leaning away from the cable.",
          "No snapping the leg back.",
        ],
        safety_modification: "Reduce load, shorten the range, or switch to side steps if the hip pinches.",
      }),
    ],
  };
}

function formatPrescription({ sets, reps, load, rest } = {}) {
  const pieces = [];
  if (sets !== undefined && sets !== null && reps) pieces.push(`${sets} x ${reps}`);
  else if (reps) pieces.push(String(reps));
  if (load) pieces.push(String(load));
  const core = pieces.join(" x ");
  return rest ? `${core}; rest ${rest}` : core;
}

function plannedExercise({
  name,
  motra_name,
  rack_name,
  floor,
  equipment,
  sets,
  reps,
  load,
  rest,
  note,
  pro_coaching = [],
  feel = [],
  avoid = [],
  safety_modification = "",
} = {}) {
  const prescription = { sets, reps, load, rest };
  const prescriptionText = formatPrescription(prescription);
  const appEntryName = rack_name || motra_name || name || null;
  return {
    name,
    rack_name: appEntryName,
    motra_name: motra_name || null,
    app_entry_name: appEntryName,
    tracking_app: "Rack",
    equipment: equipment || "Use the machine/cable station available on the assigned floor.",
    floor: floor || "Unknown",
    prescription,
    prescription_text: prescriptionText,
    sets,
    reps,
    load,
    rest,
    note: note || pro_coaching[0] || null,
    pro_coaching,
    feel,
    avoid,
    safety_modification,
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

export function buildWorkoutPlan(dashboard = {}, state = DEFAULT_COACH_STATE, readiness = evaluateReadiness(dashboard, state), requestContext = {}) {
  const travelMode = Boolean(state.gym_profile.travel_mode);
  const wantsStrength = requestContext.requested_session_type === "strength" || requestContext.schedule_override === true;
  const scheduleOverrideApplied = Boolean(wantsStrength && !readiness.schedule?.strength_planned && readiness.tier !== "Red");
  const wantsRecovery = requestContext.requested_session_type === "recovery";
  if (readiness.tier === "Red") {
    return {
      environment: "Safety-first recovery day",
      requires_inventory: false,
      top_line: readiness.training_call,
      session_type: "Recovery / Medical caution",
      request_intent: requestContext.request_intent || "build_workout",
      requested_session_type: "recovery",
      schedule_override: Boolean(requestContext.schedule_override),
      schedule_override_applied: false,
      floor_plan: "No strength, Zone 2, or conditioning prescription while red safety flags are active.",
      target_minutes: 15,
      time_range_min: [10, 30],
      guardrails: [
        "Doctor guidance, BP, migraine, asthma, sharp/radiating/worsening pain, and high pain signals stay above device readiness.",
        "Skip strength, Zone 2, and conditioning until the red safety flag clears.",
        "Gentle walking or mobility is optional only if symptoms allow.",
      ],
      blocks: [
        {
          name: "Safety check",
          target: "Follow doctor guidance and re-check BP/symptoms before any training decision.",
        },
        {
          name: "Optional easy movement",
          target: "10-20 minutes gentle walk or breathing mobility only if symptoms are calm.",
        },
      ],
    };
  }
  if (wantsRecovery) {
    return {
      environment: "Safety-first recovery day",
      requires_inventory: false,
      top_line: "Recovery workout: keep it easy enough to improve the day without borrowing from the next strength session.",
      session_type: "Recovery / Mobility / Easy Walk",
      request_intent: requestContext.request_intent || "recovery_workout",
      requested_session_type: "recovery",
      schedule_override: Boolean(requestContext.schedule_override),
      schedule_override_applied: false,
      floor_plan: "No World Gym strength floor routing for this recovery request.",
      target_minutes: 25,
      time_range_min: [15, 35],
      guardrails: [
        "Keep breathing conversational.",
        "Stop if pain, asthma, migraine, or BP symptoms appear.",
        "Do not add strength work unless a separate explicit request and safety check supports it.",
      ],
      blocks: [
        {
          name: "Easy walk",
          target: "10-25 minutes relaxed pace; shorten if symptoms drift.",
        },
        {
          name: "Mobility and breathing",
          target: "8-12 minutes hips, T-spine, neck stacking, and nasal breathing.",
        },
      ],
    };
  }
  if (!readiness.schedule?.strength_planned && !scheduleOverrideApplied) {
    const weekday = readiness.schedule?.weekday;
    const isGoalSupport = readiness.schedule?.day_type === "goal_support";
    const isThursday = weekday === "Thursday";
    if (readiness.tier === "Yellow") {
      return {
        environment: "Safety-modified non-lift day",
        requires_inventory: false,
        top_line: readiness.training_call,
        session_type: "Easy Walk + Mobility",
        request_intent: requestContext.request_intent || "build_workout",
        requested_session_type: requestContext.requested_session_type || "workout",
        schedule_override: Boolean(requestContext.schedule_override),
        schedule_override_applied: false,
        floor_plan: "No World Gym strength floor routing today.",
        target_minutes: isGoalSupport ? 30 : 25,
        time_range_min: [20, 40],
        guardrails: [
          "Keep effort easy and symptom-led while yellow safety flags are active.",
          "Skip conditioning if BP, HRV, pain, asthma, migraine, or fatigue is trending the wrong direction.",
          "Protect the next planned strength day.",
        ],
        blocks: [
          {
            name: "Easy walk",
            target: "15-30 minutes conversational pace; shorten if symptoms drift.",
          },
          {
            name: "Mobility and breathing",
            target: "8-12 minutes hips, T-spine, neck stacking, and easy breathing.",
          },
        ],
      };
    }
    return {
      environment: isGoalSupport ? "Coach-planned goal support day" : "Weekend rest / daily walk",
      requires_inventory: false,
      top_line: readiness.schedule?.non_lift_call || "No strength today. Follow the non-lift schedule.",
      session_type: isGoalSupport ? "Daily Walk + Zone 2 + Mobility" : "Daily Walk / Rest / Mobility",
      request_intent: requestContext.request_intent || "build_workout",
      requested_session_type: requestContext.requested_session_type || "workout",
      schedule_override: Boolean(requestContext.schedule_override),
      schedule_override_applied: false,
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
      request_intent: requestContext.request_intent || "build_workout",
      requested_session_type: requestContext.requested_session_type || "strength",
      schedule_override: Boolean(requestContext.schedule_override),
      schedule_override_applied: false,
      reason: state.gym_profile.travel_rule,
      questions: ["Is there a cable station?", "What dumbbells/kettlebells are available?", "Any bench, pull-up bar, treadmill, or bike?"],
      blocks: [],
    };
  }

  const finisherAllowed = readiness.tier === "Green" && !scheduleOverrideApplied;
  const modified = readiness.tier !== "Green" || scheduleOverrideApplied;
  const preferredCap = Number(state.adaptations?.preferred_session_cap_min);
  const targetMinutes = scheduleOverrideApplied
    ? 55
    : Number.isFinite(preferredCap)
    ? Math.max(60, Math.min(72, preferredCap + 6))
    : state.training_model.default_session_target_min;
  const coachLearning = activeAdjustmentNotes(state);
  return {
    environment: "World Gym Taichung",
    requires_inventory: false,
    top_line: modified
      ? scheduleOverrideApplied
        ? "Schedule override: controlled strength option today; anchors stay, density drops, and the hybrid close is out."
        : "World Gym plan, modified: anchors stay, density drops, hybrid close is conditional."
      : "World Gym plan: athletic Floor 3 primer, Floor 2 strength anchors, Floor 3 trunk/hybrid close.",
    session_type: scheduleOverrideApplied ? "Modified World Gym Strength (Schedule Override)" : "World Gym Strength + Athletic Functional",
    request_intent: requestContext.request_intent || "build_workout",
    requested_session_type: "strength",
    schedule_override: Boolean(requestContext.schedule_override),
    schedule_override_applied: scheduleOverrideApplied,
    floor_plan: "Floor 3 prehab/primer -> Floor 2 anchors -> Floor 3 trunk/hybrid close",
    target_minutes: targetMinutes,
    time_range_min: scheduleOverrideApplied ? [40, 60] : state.training_model.session_range_min,
    guardrails: [
      ...(scheduleOverrideApplied ? [`This overrides the default ${readiness.schedule?.label || "non-strength day"}; keep it controlled and protect ${readiness.schedule?.next_strength_day || "the next strength day"}.`] : []),
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
          plannedExercise({
            name: "Lateral Step-to-Stick",
            motra_name: "Custom: Lateral Step-to-Stick",
            floor: "Floor 3",
            equipment: "Floor 3 open turf or soft plyo area",
            sets: modified ? "1-2" : 2,
            reps: "5/side",
            load: "bodyweight",
            rest: "30-45 sec",
            note: "Quiet landing, two-second freeze, control before speed.",
            pro_coaching: [
              "Start tall and step sideways with control.",
              "Land softly, freeze for two seconds, then reset before the next rep.",
              "Lead with the left side and make every landing look the same.",
            ],
            feel: [
              "This should feel athletic but calm.",
              "You should feel balanced at the landing before you move again.",
            ],
            avoid: [
              "No bouncing out of the landing.",
              "No knee cave or rushed reset.",
            ],
            safety_modification: "Make the step smaller or skip it if the hip, knee, or balance feels sketchy.",
          }),
          plannedExercise({
            name: "Cable Chop High to Low",
            motra_name: state.gym_profile.motra_names.cable_chop_high_low,
            floor: "Floor 3",
            equipment: "Floor 3 Matrix functional trainer",
            sets: 2,
            reps: "8/side",
            load: "light to moderate cable load",
            rest: "45-60 sec",
            note: "Move the handle on a clean diagonal without letting the cable pull you around.",
            pro_coaching: [
              "Set your feet before the first rep.",
              "Pull the handle down and across your body in one smooth line.",
              "Finish tall, then return slowly to the start.",
            ],
            feel: [
              "This should feel like controlled pressure through your hands and middle.",
              "You should feel strong and steady, not twisted.",
            ],
            avoid: [
              "No yanking the first rep.",
              "No letting the cable spin you.",
            ],
            safety_modification: "Lower the weight or shorten the range if you cannot control the return.",
          }),
        ],
      },
      {
        id: "A",
        label: "Floor 2 - Strength Anchors",
        floor: "Floor 2",
        estimated_min: 28,
        exercises: [
          plannedExercise({
            name: "Pull-Up",
            motra_name: state.gym_profile.motra_names.pull_up,
            floor: "Floor 2",
            equipment: "Floor 2 pull-up station; Floor 3 Matrix trainer if available",
            sets: modified ? 3 : 4,
            reps: modified ? "4-6, leave 2 reps in reserve" : "6 / 5 / 5 / 4",
            load: "bodyweight or assistance that leaves 1-2 clean reps in reserve",
            rest: "75-120 sec after paired movement",
            note: "Start still, pull smoothly, pause for one beat, and own the lowering part.",
            pro_coaching: [
              "Start from a still hang before every rep.",
              "Pull yourself up like you are trying to bring your chest toward the bar.",
              "Pause for one beat at the top if the rep is clean.",
              "Own the lowering part. Don't just drop.",
            ],
            feel: [
              "This should feel like a strong, controlled pull through your upper back and arms.",
              "You should feel in control at the top and during the lowering part.",
            ],
            avoid: [
              "No swinging.",
              "No neck reaching.",
              "No grinding reps.",
            ],
            safety_modification: "Use assistance or stop the set if your body starts twisting, kicking, or your shoulder shrugs up.",
          }),
          plannedExercise({
            name: "Machine Hip Thrust (Glute Bridge)",
            motra_name: state.gym_profile.motra_names.hip_thrust,
            floor: "Floor 2",
            equipment: "Floor 2 Matrix glute trainer / hip thrust machine",
            sets: modified ? 3 : 4,
            reps: modified ? "8-10" : "10",
            load: modified ? "moderate machine load" : "working load you can control for all reps",
            rest: "75-120 sec",
            note: "Drive through your heels, pause cleanly at the top, and do not chase extra range.",
            pro_coaching: [
              "Set your feet before you start and keep pressure through the whole foot.",
              "Lift smoothly, pause for one clear beat at the top, then lower under control.",
              "Keep the last rep looking like the first rep.",
            ],
            feel: [
              "This should feel strong through the back of your hips.",
              "You should feel a firm top position without pinching the front of the hip.",
            ],
            avoid: [
              "No bouncing off the bottom.",
              "No leaning back to fake a higher finish.",
            ],
            safety_modification: "Lower the load, shorten the range, or swap to bodyweight bridges if the front of the hip pinches.",
          }),
          plannedExercise({
            name: "Dumbbell Incline Bench Press",
            motra_name: state.gym_profile.motra_names.incline_press,
            floor: "Floor 2",
            equipment: "Floor 2 dumbbells and adjustable bench",
            sets: modified ? "2-3" : 3,
            reps: modified ? "8 smooth" : "8-10",
            load: "dumbbells you can press without shoulder shrugging",
            rest: "75-120 sec after paired movement",
            note: "Press smoothly and stop before the shoulders start taking over.",
            pro_coaching: [
              "Set the bench and dumbbells before you lie back.",
              "Start each rep under control, then press up smoothly.",
              "Lower with the same control you used to press.",
            ],
            feel: [
              "This should feel smooth and strong through the press.",
              "You should feel steady on the bench with no shoulder pinch.",
            ],
            avoid: [
              "No bouncing the dumbbells.",
              "No shrugging at the top.",
              "No twisting to finish reps.",
            ],
            safety_modification: "Use lighter dumbbells or stop the set if either shoulder pinches or the reps stop matching.",
          }),
        ],
      },
      {
        id: "B",
        label: "Floor 3 - Trunk / Posture",
        floor: "Floor 3",
        estimated_min: 16,
        exercises: [
          plannedExercise({
            name: "Rope Cable Face Pull to W",
            motra_name: state.gym_profile.motra_names.face_pull_w,
            floor: "Floor 3",
            equipment: "Floor 3 Matrix functional trainer with rope attachment",
            sets: modified ? 2 : "2-3",
            reps: "12",
            load: "light cable load",
            rest: "45-60 sec",
            note: "Pull to face height, open cleanly to a W, and keep your neck relaxed.",
            pro_coaching: [
              "Stand tall before you pull.",
              "Pull the rope toward face height, then open into a clean W shape.",
              "Control the return instead of letting the cable snap back.",
            ],
            feel: [
              "This should feel like smooth control across your upper back and shoulders.",
              "Your neck should stay relaxed.",
            ],
            avoid: [
              "No leaning back.",
              "No shrugging toward your ears.",
              "No heavy, ugly reps.",
            ],
            safety_modification: "Lower the cable load or switch to a simpler face pull if the neck or shoulder gets cranky.",
          }),
          plannedExercise({
            name: "Kettlebell Suitcase Carry",
            motra_name: state.gym_profile.motra_names.suitcase_carry,
            floor: "Floor 3",
            equipment: "Floor 3 kettlebells 4-24 kg",
            sets: 2,
            reps: "20-30 m/side, left first",
            load: "single kettlebell you can carry without leaning",
            rest: "45-75 sec",
            note: "Walk tall; posture beats distance.",
            pro_coaching: [
              "Pick up the kettlebell with control and stand tall before walking.",
              "Walk slowly enough that your shoulders stay level.",
              "Set the bell down cleanly before switching sides.",
            ],
            feel: [
              "This should feel like steady pressure through your whole hand and a tall walk.",
              "You should feel balanced from step to step.",
            ],
            avoid: [
              "No leaning away from the kettlebell.",
              "No speed-walking to finish faster.",
            ],
            safety_modification: "Use a lighter kettlebell or shorten the walk if posture changes.",
          }),
        ],
      },
      {
        id: "HYBRID",
        label: "Floor 3 - Hybrid Close",
        floor: "Floor 3",
        estimated_min: finisherAllowed ? 6 : 0,
        status: finisherAllowed ? "planned" : "conditional_skip",
        exercises: finisherAllowed ? [
          plannedExercise({
            name: "Kettlebell Swing",
            motra_name: state.gym_profile.motra_names.kettlebell_swing,
            floor: "Floor 3",
            equipment: "Floor 3 kettlebells 4-24 kg",
            sets: 2,
            reps: "10",
            load: "16-20 kg",
            rest: "60-90 sec",
            note: "Snap, float, park. Stop if it turns into a shoulder lift.",
            pro_coaching: [
              "Start with the bell slightly in front of you.",
              "Hike it back, stand tall fast, and let the bell float.",
              "Park the bell cleanly when the set is done.",
            ],
            feel: [
              "This should feel crisp and athletic, not like a slow lift.",
              "You should feel power without losing control.",
            ],
            avoid: [
              "No squatting every rep.",
              "No lifting the bell with your shoulders.",
              "No chasing fatigue.",
            ],
            safety_modification: "Skip swings if the hip pinches, breathing drifts, or the movement stops feeling crisp.",
          }),
          plannedExercise({
            name: "Kettlebell Front-Rack Carry",
            motra_name: state.gym_profile.motra_names.front_rack_carry,
            floor: "Floor 3",
            equipment: "Floor 3 kettlebells 4-24 kg",
            sets: 2,
            reps: "20 m/side, left first",
            load: "single kettlebell you can hold without leaning back",
            rest: "60-90 sec",
            note: "Walk tall, breathe normally, and stop before posture changes.",
            pro_coaching: [
              "Clean the kettlebell into position without rushing.",
              "Stand tall, breathe normally, and walk with slow, even steps.",
              "Switch sides before the hold turns sloppy.",
            ],
            feel: [
              "This should feel like steady pressure through the hand, arm, and middle.",
              "You should feel tall and organized, not folded backward.",
            ],
            avoid: [
              "No leaning back.",
              "No holding your breath through the whole walk.",
            ],
            safety_modification: "Use a lighter kettlebell, shorten the carry, or skip it if breathing or posture falls apart.",
          }),
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

function planTypeForSchedule(schedule = {}, workout = {}) {
  if (workout.requires_inventory) return "travel day";
  if (workout.schedule_override_applied) return "strength override";
  if (/strength/i.test(String(workout.session_type || ""))) return "strength day";
  if (schedule.strength_planned) return "strength day";
  if (schedule.day_type === "goal_support") return "goal-support day";
  if (schedule.day_type === "weekend_rest") return "recovery day";
  return "off day";
}

function intensityRuleForTier(tier) {
  if (tier === "Red") return "Recovery-only or heavily modified; symptoms and hard safety flags decide.";
  if (tier === "Yellow") return "Modified effort; reduce density and skip the hybrid close if HR or symptoms drift.";
  return "Normal planned effort with the usual HR, hip, and pain caps.";
}

function buildAppleHealthEvidenceText(appleHealth = {}) {
  const latest = appleHealth.latest_summary;
  if (!latest) return `Apple Health: ${appleHealth.status || "missing"} supporting context only; it does not change readiness authority.`;
  return [
    `Apple Health supporting context ${latest.date || appleHealth.latest_summary_date || "latest"}:`,
    `${formatMetric(latest.steps)} steps`,
    `${formatMetric(latest.exercise_minutes, " min")} exercise`,
    `${formatMetric(latest.active_energy_kcal, " kcal")} active energy`,
    `status ${appleHealth.status || "unknown"}.`,
  ].join(" ");
}

function buildWorkoutHandoff(workout = null) {
  if (!workout || !Array.isArray(workout.blocks) || !workout.blocks.length) {
    return {
      generated: false,
      note: "No strength workout generated in this response.",
    };
  }

  let order = 1;
  const blocks = workout.blocks.map(block => ({
    id: block.id || null,
    label: block.label || block.name || null,
    floor: block.floor || null,
    estimated_min: asNumber(block.estimated_min),
    status: block.status || "planned",
    exercises: Array.isArray(block.exercises)
      ? block.exercises.map(exercise => {
          const exerciseOrder = order++;
          const prescriptionText = exercise.prescription_text
            || (typeof exercise.prescription === "string" ? exercise.prescription : formatPrescription(exercise.prescription))
            || null;
          const equipment = exercise.equipment || "Use the machine/cable station available on the assigned floor.";
          const entryName = exercise.rack_name || exercise.motra_name || exercise.name || "Unknown exercise";
          return {
            order: exerciseOrder,
            name: exercise.name || null,
            rack_name: exercise.rack_name || entryName,
            motra_name: exercise.motra_name || null,
            rack_motra_name: entryName,
            app_entry_name: exercise.app_entry_name || entryName,
            tracking_app: exercise.tracking_app || "Rack",
            equipment,
            floor: exercise.floor || block.floor || null,
            prescription: exercise.prescription || null,
            prescription_text: prescriptionText,
            sets: exercise.sets ?? exercise.prescription?.sets ?? null,
            reps: exercise.reps ?? exercise.prescription?.reps ?? null,
            load: exercise.load ?? exercise.prescription?.load ?? null,
            rest: exercise.rest ?? exercise.prescription?.rest ?? null,
            rack_entry_line: `${entryName} | ${equipment} | ${prescriptionText || "coach-prescribed work"}`,
            note: exercise.note || null,
            pro_coaching: exercise.pro_coaching || [],
            feel: exercise.feel || [],
            avoid: exercise.avoid || [],
            safety_modification: exercise.safety_modification || null,
          };
        })
      : [],
  }));

  return {
    generated: true,
    execution_policy: "Rack is the current strength-log app for completed sets, exercise loads, and exercise history. Motra names are preserved for legacy/history continuity. Garmin Connect/Fenix remains primary for workout physiology, training load, and recovery time.",
    rack_entry_format: "Exercise | Equipment | Sets x Reps x Load",
    rack_entry_lines: blocks.flatMap(block => block.exercises.map(exercise => exercise.rack_entry_line)),
    copy_friendly_order: blocks,
  };
}

function compactText(value, fallback = null) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function cueAt(value, index, fallback = null) {
  return Array.isArray(value) ? compactText(value[index], fallback) : fallback;
}

function exerciseProgressionTarget(exercise = {}) {
  const entryName = exercise.rack_name || exercise.app_entry_name || exercise.motra_name || exercise.name || "this exercise";
  return `Progress ${entryName} only when all prescribed sets are clean, pain stays below 4/10, and the last reps remain repeatable.`;
}

function exerciseLoggingNote(exercise = {}) {
  const entryName = exercise.rack_name || exercise.app_entry_name || exercise.motra_name || exercise.name || "this exercise";
  const app = exercise.tracking_app || "Rack";
  return `Log in ${app} as ${entryName}; record completed sets, reps, load, rest, RPE, and any pain/form note.`;
}

export function buildExerciseCoachingReadout(workout = null) {
  if (!workout || !Array.isArray(workout.blocks) || !workout.blocks.length) return [];

  let order = 1;
  return workout.blocks.flatMap(block => {
    if (!Array.isArray(block.exercises)) return [];
    return block.exercises.map(exercise => {
      const entryName = exercise.rack_name || exercise.app_entry_name || exercise.motra_name || exercise.name || "Unknown exercise";
      const prescriptionText = exercise.prescription_text
        || (typeof exercise.prescription === "string" ? exercise.prescription : formatPrescription(exercise.prescription))
        || "coach-prescribed work";
      const equipment = exercise.equipment || "Use the machine/cable station available on the assigned floor.";
      return {
        order: order++,
        block: block.label || block.name || block.id || null,
        exercise_name: exercise.name || entryName,
        rack_motra_entry_name: entryName,
        tracking_app: exercise.tracking_app || "Rack",
        floor: exercise.floor || block.floor || "Unknown",
        equipment,
        prescription: prescriptionText,
        purpose: compactText(exercise.note, "Do this for today's planned movement quality and training effect."),
        setup_cue: cueAt(exercise.pro_coaching, 0, "Set up deliberately before the first rep."),
        execution_cue: cueAt(exercise.pro_coaching, 1, "Move smoothly and keep each rep repeatable."),
        feel_cue: cueAt(exercise.feel, 0, "The movement should feel controlled, not forced."),
        safety_modification: compactText(exercise.safety_modification, cueAt(exercise.avoid, 0, "Reduce load, range, or skip if symptoms rise.")),
        progression_target: compactText(exercise.progression_target, exerciseProgressionTarget(exercise)),
        logging_note: compactText(exercise.logging_note, exerciseLoggingNote(exercise)),
      };
    });
  });
}

function enrichWorkoutPlan(workout = {}, readiness = {}, requestContext = {}, workoutTarget = {}) {
  if (!workout || typeof workout !== "object") return workout;
  const requestedSessionType = workout.requested_session_type
    || requestContext.requested_session_type
    || (/strength/i.test(String(workout.session_type || "")) ? "strength" : "workout");
  const scheduleOverrideApplied = Boolean(workout.schedule_override_applied);
  const schedule = readiness.schedule || {};
  const why = [
    workoutTarget.planning_basis,
    scheduleOverrideApplied
      ? `Todd explicitly requested strength on ${schedule.label || "a non-strength day"}, so Coach built the safest controlled option instead of stopping at the schedule.`
      : null,
    readiness.training_call,
    ...(readiness.evidence || []).slice(0, 2),
  ].filter(Boolean).slice(0, 5);
  const isStrength = requestedSessionType === "strength" || /strength/i.test(String(workout.session_type || ""));
  const whatToTrack = [
    "BP reading and any migraine/asthma symptoms before training.",
    "Pain score before, during, and after the session.",
    isStrength ? "Completed Rack sets/reps/loads and Garmin Connect workout completion." : "Walk, Zone 2, mobility, and symptom response.",
    "Garmin Nutrition closeout: calories, protein, carbs, fat.",
    "Post-workout RPE plus best movement, worst movement, and any adjustment needed next time.",
  ];

  return {
    ...workout,
    request_intent: workout.request_intent || requestContext.request_intent || "build_workout",
    requested_session_type: requestedSessionType,
    schedule_override: Boolean(workout.schedule_override || requestContext.schedule_override),
    schedule_override_applied: scheduleOverrideApplied,
    why_this_workout: why,
    what_to_track: whatToTrack,
    post_workout_debrief_prompt: "After the session, send duration, completed blocks, RPE, best movement, worst movement, pain score, and any Garmin/Rack notes.",
    exercise_coaching_readout: buildExerciseCoachingReadout(workout),
  };
}

function buildDailyCoachSummary({ base = {}, state = DEFAULT_COACH_STATE, readiness, nutrition, workout = null, includeWorkout = false } = {}) {
  const resolvedReadiness = readiness || evaluateReadiness(base, state);
  const resolvedNutrition = nutrition || buildNutritionCall(base, state);
  const resolvedWorkout = workout || buildWorkoutPlan(base, state, resolvedReadiness);
  const dataCompleteness = buildDataCompleteness(base);
  const appleHealth = buildAppleHealthSupport(base);
  const workoutDebriefContext = getWorkoutDebriefContext(base, { limit: 5 });
  const schedule = resolvedReadiness.schedule || dataCompleteness.schedule || todaySchedule(base.profile?.timezone || "Asia/Taipei", base.now || new Date());
  const risks = Array.isArray(resolvedReadiness.risk_flags) ? resolvedReadiness.risk_flags : [];
  const missingRequired = dataCompleteness.checks
    .filter(check => check.required && !["current", "not_expected"].includes(check.status))
    .map(check => `${check.label}: ${check.status}`);
  const staleOptional = dataCompleteness.checks
    .filter(check => !check.required && ["missing", "stale", "partial"].includes(check.status))
    .map(check => `${check.label}: ${check.status}`);
  const sourceWarnings = [
    ...missingRequired.slice(0, 4),
    ...staleOptional,
    ...(appleHealth.warnings || []),
    ...(workoutDebriefContext.safety_warnings || []),
  ].slice(0, 8);

  const why = [
    ...(resolvedReadiness.evidence || []).slice(0, 2),
    risks.length
      ? `Safety flags: ${risks.slice(0, 2).map(flag => flag.text).join(" ")}`
      : "Safety: no hard stop from pain, migraine, asthma, or BP in the available data.",
    buildAppleHealthEvidenceText(appleHealth),
    workoutDebriefContext.response_patterns?.[0],
    `Plan context: ${schedule.label || "today's schedule"}${schedule.next_strength_day ? `; next strength day ${schedule.next_strength_day}` : ""}.`,
  ].filter(Boolean).slice(0, 6);

  const isStrengthWorkout = resolvedWorkout.requested_session_type === "strength" || /strength/i.test(String(resolvedWorkout.session_type || ""));
  const track = [
    "BP reading and any migraine/asthma symptoms.",
    "Pain score, especially right hip response.",
    isStrengthWorkout ? "Workout completion in Garmin Connect Strength, plus any post-workout pain/RPE note." : "Daily walk/conditioning completion and any symptom drift.",
    "Garmin Nutrition closeout: calories, protein, carbs, fat.",
  ];
  if (appleHealth.status !== "current") track.push("Apple Health sync freshness if the iPhone summary remains missing or stale.");

  const planType = planTypeForSchedule(schedule, resolvedWorkout);
  const dailySummary = {
    daily_call: {
      color: resolvedReadiness.tier,
      readiness_tier: resolvedReadiness.tier,
      decision: resolvedReadiness.training_call,
    },
    why,
    todays_plan: {
      type: planType,
      primary_action: resolvedWorkout.top_line || resolvedReadiness.training_call,
      recommendation: resolvedWorkout.session_type || schedule.label || null,
      time_cap_min: asNumber(resolvedWorkout.target_minutes) || DEFAULT_COACH_STATE.training_model.default_session_target_min,
      intensity: intensityRuleForTier(resolvedReadiness.tier),
      nutrition_focus: resolvedNutrition.call,
    },
    safety_guardrails: [
      "Pain >=4/10, migraine, asthma flare, or BP >=160/100 means downshift to recovery or stop.",
      "BP >=140/90, low HRV, or high fatigue means modified density and no forced finisher.",
      "Avoid deep loaded hip flexion and stop any movement that creates anterior hip pinching.",
      "Apple Health activity counts never override Garmin readiness, medical/symptom gates, or Rack/Motra strength history.",
      "Workout debrief pain or red-flag symptoms can only make training more conservative; they never clear hard training.",
    ],
    what_to_track_today: track.slice(0, 5),
    rack_motra_handoff: includeWorkout ? buildWorkoutHandoff(resolvedWorkout) : {
      generated: false,
      note: "Call the workout action to generate copy-friendly exercise order, sets, reps, rests, and notes.",
    },
    confidence_data_quality: {
      confidence: missingRequired.length ? "low" : sourceWarnings.length ? "medium" : "high",
      missing_or_stale: sourceWarnings,
      data_completeness_score_pct: dataCompleteness.score_pct,
      source_policy: "Apple Health is supporting evidence only; it does not override Garmin readiness, safety, Garmin workout physiology, or Rack/Motra strength history.",
      workout_debrief_policy: "Workout debriefs are subjective response records; Rack/Motra remains completed-set authority.",
    },
  };

  return dailySummary;
}

export function buildCoachDecision({ text = "", intent = "general", dashboard = {}, state = DEFAULT_COACH_STATE, payload = {} } = {}) {
  const normalizedIntent = normalizeIntent(intent, text);
  const workoutTarget = requestedWorkoutTarget({ text, dashboard, payload, intent: normalizedIntent });
  const workoutRequest = normalizedIntent === "build_workout"
    ? { ...workoutTarget, ...classifyWorkoutRequest({ text, payload, intent: normalizedIntent }) }
    : null;
  const now = workoutTarget.now;
  const decisionDashboard = now ? { ...dashboard, now } : dashboard;
  const readiness = evaluateReadiness(decisionDashboard, state, { text, payload, now });
  const nutrition = buildNutritionCall(decisionDashboard, state);
  const baseWorkout = buildWorkoutPlan(decisionDashboard, state, readiness, workoutRequest || {});
  const workoutWithTarget = normalizedIntent === "build_workout" && workoutTarget.requested_for_date
    ? {
        ...baseWorkout,
        requested_for_date: workoutTarget.requested_for_date,
        requested_for_weekday: workoutTarget.requested_for_weekday,
        planning_basis: workoutTarget.planning_basis,
      }
    : baseWorkout;
  const workout = normalizedIntent === "build_workout"
    ? enrichWorkoutPlan(workoutWithTarget, readiness, workoutRequest || {}, workoutTarget)
    : workoutWithTarget;
  const topLine = topLineForIntent(normalizedIntent, readiness, nutrition, workout);
  const riskFlags = readiness.risk_flags.map(r => r.text);
  const recentConversation = compactCoachHistory(decisionDashboard);
  const coachMemoryContext = getRelevantCoachMemoryForContext(decisionDashboard, {
    intent: normalizedIntent,
    text,
    limit: 6,
  });
  const workoutDebriefContext = getWorkoutDebriefContext(decisionDashboard, { limit: 5 });
  const includeWorkout = ["build_workout", "travel_mode"].includes(normalizedIntent);
  const summaryBase = decisionDashboard;
  const appleHealth = buildAppleHealthSupport(summaryBase);
  const dailySummary = buildDailyCoachSummary({
    base: summaryBase,
    state,
    readiness,
    nutrition,
    workout,
    includeWorkout,
  });
  const nextActions = [];

  if (normalizedIntent === "build_workout") {
    if (workoutTarget.is_future_request) {
      nextActions.push(workoutTarget.planning_basis);
    }
    if (readiness.tier === "Red") {
      nextActions.push("Keep today recovery-only unless symptoms and doctor guidance clear training.");
    } else if (workout.requires_inventory) {
      nextActions.push("Send hotel-gym inventory before lifting.");
    } else if (workoutDebriefContext.safety_warnings.length) {
      nextActions.push("Apply recent debrief pain/symptom constraints before progressing the plan.");
    } else if (workout.schedule_override_applied) {
      nextActions.push("Use the controlled strength override below; keep volume and density capped.");
    } else if (!readiness.schedule?.strength_planned) {
      nextActions.push("Use the non-lift day guardrails below and keep the next strength day protected.");
    } else {
      nextActions.push("Use the World Gym floor-aware workout plan below.");
    }
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
    date: todayISO(decisionDashboard.profile?.timezone || "Asia/Taipei", now || new Date()),
    intent: normalizedIntent,
    top_line_call: topLine,
    reply: replyParts.join("\n"),
    readiness,
    risk_flags: riskFlags,
    evidence: readiness.evidence,
    next_actions: nextActions.slice(0, 4),
    daily_summary: dailySummary,
    nutrition_call: nutrition,
    workout_plan: includeWorkout ? workout : null,
    exercise_coaching_readout: includeWorkout ? (workout.exercise_coaching_readout || []) : [],
    workout_request: workoutRequest,
    coach_memory_context: coachMemoryContext,
    workout_debrief_context: workoutDebriefContext,
    source_context: {
      data_store: "supabase",
      default_gym: state.gym_profile.default_environment,
      travel_mode: Boolean(state.gym_profile.travel_mode),
      active_adjustments: activeAdjustmentNotes(state),
      safety_override: SOURCE_CONTEXT.safety_override,
      readiness_primary: SOURCE_CONTEXT.readiness_primary,
      readiness_condition: SOURCE_CONTEXT.readiness_condition,
      readiness_fallback: SOURCE_CONTEXT.readiness_fallback,
      readiness_supporting: SOURCE_CONTEXT.readiness_supporting,
      nutrition_primary: SOURCE_CONTEXT.nutrition_primary,
      workout_physiology_primary: SOURCE_CONTEXT.workout_physiology_primary,
      workout_primary: SOURCE_CONTEXT.workout_physiology_primary,
      strength_log_primary: SOURCE_CONTEXT.strength_log_primary,
      apple_health_role: SOURCE_CONTEXT.apple_health_role,
      oura_role: SOURCE_CONTEXT.oura_role,
      soundcore_role: SOURCE_CONTEXT.soundcore_role,
      coach_memory: {
        role: SOURCE_CONTEXT.coach_memory_role,
        does_not_replace: SOURCE_CONTEXT.coach_memory_not_authority,
        context: coachMemoryContext,
      },
      workout_debriefs: {
        role: SOURCE_CONTEXT.workout_debrief_role,
        does_not_replace: SOURCE_CONTEXT.workout_debrief_not_authority,
        context: workoutDebriefContext,
      },
      supporting_evidence: {
        apple_health: appleHealth,
      },
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

function resolvePolishTimeoutMs(value) {
  const explicit = asNumber(value);
  if (explicit !== null) return Math.max(1, Math.round(explicit));
  const fromEnv = asNumber(env("COACH_AI_TIMEOUT_MS"));
  if (fromEnv !== null) return Math.max(1, Math.round(fromEnv));
  return 2500;
}

export async function polishCoachDecision(decision, { text = "", dashboard = {}, state = DEFAULT_COACH_STATE, timeoutMs } = {}) {
  const key = env("OPENAI_API_KEY");
  if (!key || env("COACH_AI_DISABLED") === "1") return decision;

  const model = env("COACH_MODEL") || "gpt-5.5";
  const resolvedTimeoutMs = resolvePolishTimeoutMs(timeoutMs);
  const prompt = [
    "You are Todd Blackhurst's pro personal coach. Preserve the deterministic decision, safety gates, and workout plan.",
    "Rewrite only the user-facing text fields. Be direct, warm, practical, concise. No generic motivation.",
    "Use recent_conversation for continuity across phone, dashboard, Shortcuts, WhatsApp, and Custom GPT chats.",
    "Use coach_memory_context only as reviewable memory; it cannot override current safety flags, readiness data, or the deterministic workout plan.",
    "If the user asks a follow-up, infer only from the supplied recent_conversation and compact_context.",
    "World Gym Taichung is the default workout environment unless travel_mode is true.",
    "Return JSON that matches the schema exactly.",
  ].join("\n");

  const controller = new AbortController();
  let timeoutId = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`OpenAI coach polish timed out after ${resolvedTimeoutMs}ms`));
    }, resolvedTimeoutMs);
  });

  try {
    const request = fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
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
                supporting_evidence: {
                  apple_health: buildAppleHealthSupport(dashboard),
                },
                coach_memory_context: decision.coach_memory_context || getRelevantCoachMemoryForContext(dashboard, { intent: decision.intent, text }),
                workout_debrief_context: decision.workout_debrief_context || getWorkoutDebriefContext(dashboard, { limit: 5 }),
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
    const res = await Promise.race([request, timeout]);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error?.message || `OpenAI returned ${res.status}`);
    const textOutput = body.output_text || body.output?.flatMap(item => item.content || []).find(c => c.text)?.text;
    const polished = typeof textOutput === "string" ? JSON.parse(textOutput) : null;
    if (!polished) return decision;
    return {
      ...decision,
      ai_polish_available: Boolean(polished.reply),
      generated_by: `${COACH_RESPONSE_VERSION}+${model}-guarded`,
    };
  } catch (err) {
    console.warn(`OpenAI coach polish skipped: ${err.message}`);
    return {
      ...decision,
      ai_warning: err.message,
      generated_by: `${COACH_RESPONSE_VERSION}+deterministic-fallback`,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function runCoach({ profileId, text = "", intent = "general", dashboard = {}, payload = {}, channel = "web" } = {}) {
  const state = await getCoachState(profileId);
  const deterministic = buildCoachDecision({ text, intent, dashboard, state, payload });
  const decision = await polishCoachDecision(deterministic, {
    text,
    dashboard,
    state,
    timeoutMs: deterministic.intent === "build_workout" ? 1200 : undefined,
  });
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
  const workout = buildWorkoutPlan(base, state, readiness);
  const dailySummary = buildDailyCoachSummary({ base, state, readiness, nutrition, workout });
  const appleHealth = buildAppleHealthSupport(base);
  const coachMemoryContext = getRelevantCoachMemoryForContext(base, { intent: "brief", text: "coach-today", limit: 6 });
  const workoutDebriefContext = getWorkoutDebriefContext(base, { limit: 5 });
  const schedule = readiness.schedule || todaySchedule(base.profile?.timezone || "Asia/Taipei");
  const upcoming = base.upcoming_session || nextPlannedSession(base);
  return {
    readiness_tier: readiness.tier,
    recovery_pct: readiness.bevel_recovery || null,
    call: readiness.training_call,
    daily_call: dailySummary.daily_call,
    why: dailySummary.why,
    todays_plan: dailySummary.todays_plan,
    safety_guardrails: dailySummary.safety_guardrails,
    what_to_track_today: dailySummary.what_to_track_today,
    confidence_data_quality: dailySummary.confidence_data_quality,
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
    supporting_evidence: {
      apple_health: appleHealth,
    },
    coach_memory_context: coachMemoryContext,
    workout_debrief_context: workoutDebriefContext,
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
  const latestAppleHealth = latest(base.apple_health_daily_summaries);
  const detailedStrengthLogs = Array.isArray(base.strength_logs) ? base.strength_logs.filter(hasExerciseDetail) : [];
  const latestStrengthWithExercises = latest(detailedStrengthLogs);
  const recentRecovery = latest(base.recovery_sleep, 5).map(compactRecoveryRow).filter(Boolean);
  const recentBp = latest(base.blood_pressure, 5).map(compactBpRow).filter(Boolean);
  const recentNutrition = latest(base.nutrition_log, 3).map(compactNutritionRow).filter(Boolean);
  const recentStrength = latest(base.strength_logs, 3).map(compactStrengthRow).filter(Boolean);
  const recentStrengthWithExercises = latest(detailedStrengthLogs, 3).map(compactStrengthRow).filter(Boolean);
  const recentAppleHealth = latest(base.apple_health_daily_summaries, 7).map(compactAppleHealthSummary).filter(Boolean);
  const recentCoachMessages = compactCoachHistory(base, 10);
  const coachMemoryContext = getRelevantCoachMemoryForContext(base, { intent: "brief", text: "dashboard", limit: 6 });
  const workoutDebriefContext = getWorkoutDebriefContext(base, { limit: 5 });
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
      nutrition_source: "Garmin Connect+ Nutrition when daily totals are usable; manual Coach macro closeouts are fallback.",
      readiness_source: "Garmin Fenix 8 / Garmin training-recovery stack is primary when fresh and consistently worn; Oura is fallback.",
      workout_source: "Garmin Connect / Fenix 8 is primary for workout physiology and recovery cost; Rack/Motra are primary for strength logs and completed set/load history.",
    },
    current: {
      blood_pressure: compactBpRow(latestBp),
      recovery_sleep: compactRecoveryRow(latestSleep),
      body_composition: compactBodyRow(latestBody),
      nutrition: compactNutritionRow(latestNutrition),
      strength_session: compactStrengthRow(latestStrength),
      strength_session_with_exercises: compactStrengthRow(latestStrengthWithExercises),
      apple_health_daily_summary: compactAppleHealthSummary(latestAppleHealth),
      data_completeness: dataCompleteness,
    },
    recent: {
      recovery_sleep: recentRecovery,
      blood_pressure: recentBp,
      nutrition: recentNutrition,
      strength_sessions: recentStrength,
      strength_sessions_with_exercises: recentStrengthWithExercises,
      apple_health_daily_summaries: recentAppleHealth,
      workout_feedback: recentFeedback,
      workout_debriefs: workoutDebriefContext.recent_debriefs,
    },
    supporting_evidence: {
      apple_health: buildAppleHealthSupport(base),
    },
    coach_memory_context: coachMemoryContext,
    workout_debrief_context: workoutDebriefContext,
  };
}

export function buildSyncStatus(base = {}) {
  const dataCompleteness = buildDataCompleteness(base);
  return {
    ok: true,
    date: dataCompleteness.date,
    schedule: dataCompleteness.schedule,
    score_pct: dataCompleteness.score_pct,
    missing_required: dataCompleteness.missing_required,
    checks: dataCompleteness.checks,
    apple_health: dataCompleteness.supporting_evidence.apple_health,
    source_policy: {
      apple_health_role: SOURCE_CONTEXT.apple_health_role,
      does_not_override: ["Garmin readiness/recovery", "subjective symptoms", "medical safety flags", "Garmin workout physiology", "Rack/Motra strength history"],
    },
  };
}

export function buildCoachToday(base = {}) {
  const compact = compactDashboard(base);
  const state = base.coach_state || DEFAULT_COACH_STATE;
  const readiness = evaluateReadiness(base, state);
  const nutrition = buildNutritionCall(base, state);
  const workout = buildWorkoutPlan(base, state, readiness);
  const dailySummary = buildDailyCoachSummary({ base, state, readiness, nutrition, workout });
  const coachMemoryContext = getRelevantCoachMemoryForContext(base, { intent: "brief", text: "coach-today", limit: 6 });
  const workoutDebriefContext = getWorkoutDebriefContext(base, { limit: 5 });
  return {
    ok: true,
    date: compact.coaching_brief?.data_completeness?.date || todayISO(base.profile?.timezone || "Asia/Taipei", base.now || new Date()),
    daily_call: dailySummary.daily_call,
    why: dailySummary.why,
    todays_plan: dailySummary.todays_plan,
    safety_guardrails: dailySummary.safety_guardrails,
    what_to_track_today: dailySummary.what_to_track_today,
    rack_motra_handoff: dailySummary.rack_motra_handoff,
    confidence_data_quality: dailySummary.confidence_data_quality,
    daily_summary: dailySummary,
    brief: compact.coaching_brief,
    current: compact.current,
    recent: compact.recent,
    supporting_evidence: compact.supporting_evidence,
    coach_memory_context: coachMemoryContext,
    workout_debrief_context: workoutDebriefContext,
    source_context: {
      safety_override: SOURCE_CONTEXT.safety_override,
      readiness_primary: SOURCE_CONTEXT.readiness_primary,
      readiness_condition: SOURCE_CONTEXT.readiness_condition,
      readiness_fallback: SOURCE_CONTEXT.readiness_fallback,
      readiness_supporting: SOURCE_CONTEXT.readiness_supporting,
      nutrition_primary: SOURCE_CONTEXT.nutrition_primary,
      workout_physiology_primary: SOURCE_CONTEXT.workout_physiology_primary,
      workout_primary: SOURCE_CONTEXT.workout_physiology_primary,
      strength_log_primary: SOURCE_CONTEXT.strength_log_primary,
      apple_health_role: SOURCE_CONTEXT.apple_health_role,
      oura_role: SOURCE_CONTEXT.oura_role,
      soundcore_role: SOURCE_CONTEXT.soundcore_role,
      apple_health_workout_counts: "detected activity context only; not completed strength-log authority",
      coach_memory: {
        role: SOURCE_CONTEXT.coach_memory_role,
        does_not_replace: SOURCE_CONTEXT.coach_memory_not_authority,
        context: coachMemoryContext,
      },
      workout_debriefs: {
        role: SOURCE_CONTEXT.workout_debrief_role,
        does_not_replace: SOURCE_CONTEXT.workout_debrief_not_authority,
        context: workoutDebriefContext,
      },
    },
  };
}

export async function dashboardFromSupabase() {
  const profile = await getProfile();
  if (!profile) return null;
  const profileId = profile.id;
  const [rawImports, recovery, bp, body, nutrition, strength, feedback, messages, weeklyPlans, plannedSessions, appleHealthSummaries, appleHealthSyncRuns, doctorNotes, coachObservations, workoutDebriefs] = await Promise.all([
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
    safeSupabase(`apple_health_daily_summaries?profile_id=eq.${profileId}&select=*&order=summary_date.desc&limit=30`, {}, []),
    safeSupabase(`apple_health_sync_runs?profile_id=eq.${profileId}&select=*&order=started_at.desc&limit=10`, {}, []),
    safeSupabase(`doctor_notes?profile_id=eq.${profileId}&select=*&order=note_date.desc&limit=10`, {}, []),
    safeSupabase(`coach_observations?profile_id=eq.${profileId}&status=eq.active&select=*&order=observation_date.desc,updated_at.desc&limit=50`, {}, []),
    quietSupabase(`coach_workout_debriefs?profile_id=eq.${profileId}&select=*&order=workout_date.desc,created_at.desc&limit=20`, {}, []),
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
  base.apple_health_daily_summaries = dedupeRows((appleHealthSummaries || []).map(r => ({
    ...r,
    date: r.summary_date,
    source: r.source_app || "Apple Health",
  })), "apple_health");
  base.apple_health_sync_runs = [...(appleHealthSyncRuns || [])]
    .sort((a, b) => String(a.started_at || "").localeCompare(String(b.started_at || "")));
  base.doctor_notes = dedupeRows((doctorNotes || []).map(r => ({ ...r, date: r.note_date })), "doctor_notes");
  base.coach_observations = coachObservations || [];
  base.coach_workout_debriefs = workoutDebriefs || [];
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
