const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,x-coach-secret",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export const COACH_RESPONSE_VERSION = "coach-brain-v1";

export const DEFAULT_COACH_STATE = {
  version: "2026-05-03-pro-coach-v1",
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
    hip: "Mild hip OA. Pain 1-2/10 currently; avoid deep loaded hip flexion.",
    bp: "Doctor requested 7 days of home BP; currently stable enough to keep training unless readings or symptoms worsen.",
    asthma: "No recent flare; Relvar daily and rescue inhaler access matter before intensity.",
    migraine: "Migraine day is rest or major downgrade.",
  },
  coaching_style: {
    voice: "Direct, practical, warm, no filler motivation.",
    correction_rule: "Correct once with the fix attached, then move on.",
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
  return {
    ...DEFAULT_COACH_STATE,
    ...raw,
    version: row.version || raw.version || DEFAULT_COACH_STATE.version,
    goals: { ...DEFAULT_COACH_STATE.goals, ...(row.goals || raw.goals || {}) },
    source_hierarchy: { ...DEFAULT_COACH_STATE.source_hierarchy, ...(row.source_hierarchy || raw.source_hierarchy || {}) },
    gym_profile: {
      ...DEFAULT_COACH_STATE.gym_profile,
      ...(row.gym_profile || raw.gym_profile || {}),
      travel_mode: Boolean(row.travel_mode ?? row.gym_profile?.travel_mode ?? raw.gym_profile?.travel_mode ?? false),
    },
    active_medical: { ...DEFAULT_COACH_STATE.active_medical, ...(row.active_medical_loops || raw.active_medical || {}) },
    db_row: row.id ? row : null,
  };
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

export function todayISO(timeZone = "Asia/Taipei") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function first(...values) {
  return values.find(v => v !== undefined && v !== null && v !== "");
}

function latest(items, count = 1) {
  if (!Array.isArray(items) || !items.length) return count === 1 ? null : [];
  const slice = items.slice(-count);
  return count === 1 ? slice[0] : slice;
}

function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  return Object.fromEntries(keys.filter(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== "").map(k => [k, obj[k]]));
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

function parseSubjective(text = "", payload = {}) {
  const t = String(text || `${payload.notes || ""} ${payload.summary || ""}`).toLowerCase();
  const hipMatch = t.match(/hip[^0-9]*(\d+(?:\.\d+)?)/);
  const painMatch = t.match(/pain[^0-9]*(\d+(?:\.\d+)?)/);
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
  const hrvBaseline = asNumber(dashboard.profile?.oura_biology_baselines?.hrv_baseline_ms) || 32.5;
  const primaryHrv = asNumber(first(sleep.oura_hrv, sleep.bevel_hrv));
  const risks = [];
  const evidence = [];
  let tier = "Green";
  let trainingCall = "Train. Use the planned strength/athletic session.";

  if (sleep.date) evidence.push(`Readiness data ${sleep.date}: Oura HRV ${sleep.oura_hrv ?? "unknown"}ms, Bevel recovery ${sleep.bevel_recovery ?? "unknown"}%.`);
  if (bp.date) evidence.push(`Latest BP ${bp.date}: ${bp.systolic ?? "?"}/${bp.diastolic ?? "?"}.`);

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

  return {
    tier,
    training_call: trainingCall,
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

export function buildWorkoutPlan(dashboard = {}, state = DEFAULT_COACH_STATE, readiness = evaluateReadiness(dashboard, state)) {
  const travelMode = Boolean(state.gym_profile.travel_mode);
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
  return {
    environment: "World Gym Taichung",
    requires_inventory: false,
    top_line: modified
      ? "World Gym plan, modified: anchors stay, density drops, hybrid close is conditional."
      : "World Gym plan: athletic Floor 3 primer, Floor 2 strength anchors, Floor 3 trunk/hybrid close.",
    session_type: "World Gym Strength + Athletic Functional",
    floor_plan: "Floor 3 primer -> Floor 2 anchors -> Floor 3 trunk/hybrid close",
    target_minutes: state.training_model.default_session_target_min,
    time_range_min: state.training_model.session_range_min,
    guardrails: [
      "No cross-floor supersets.",
      "Left side leads unilateral work.",
      "Stay near the 122 bpm strength HR cap.",
      "No deep loaded hip flexion.",
      "Skip the hybrid close if readiness is yellow/red, HR drifts, hip symptoms rise, or grip is cooked.",
    ],
    blocks: [
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
  const readiness = evaluateReadiness(dashboard, state, { text, payload });
  const nutrition = buildNutritionCall(dashboard, state);
  const workout = buildWorkoutPlan(dashboard, state, readiness);
  const topLine = topLineForIntent(normalizedIntent, readiness, nutrition, workout);
  const riskFlags = readiness.risk_flags.map(r => r.text);
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
    date: todayISO(),
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
      readiness_primary: "Oura",
      nutrition_primary: "Bevel",
      workout_primary: "Motra",
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
  const readiness = evaluateReadiness(base, DEFAULT_COACH_STATE);
  const nutrition = buildNutritionCall(base, DEFAULT_COACH_STATE);
  return {
    readiness_tier: readiness.tier,
    recovery_pct: readiness.bevel_recovery || null,
    call: readiness.training_call,
    session_type: readiness.tier === "Red" ? "Recovery / Walk / Mobility" : "World Gym strength + athletic-functional",
    time_cap_min: DEFAULT_COACH_STATE.training_model.default_session_target_min,
    goal_summary: {
      protein_target_g: nutrition.protein_target_g,
      fat_budget_g: nutrition.fat_budget_g,
    },
    source_hierarchy: DEFAULT_COACH_STATE.source_hierarchy,
  };
}

export function compactDashboard(base) {
  const profile = base.profile || {};
  const latestBp = latest(base.blood_pressure);
  const recentBp = latest(base.blood_pressure, 7).map(bp => pick(bp, [
    "date",
    "measured_at",
    "systolic_mmhg",
    "diastolic_mmhg",
    "heart_rate_bpm",
    "notes",
  ]));
  const latestSleep = latest(base.recovery_sleep);
  const latestBody = latest(base.body_composition);
  const latestNutrition = latest(base.nutrition_log);
  const recentNutrition = latest(base.nutrition_log, 5).map(day => ({
    date: day.date,
    source: day.source,
    totals: day.totals || null,
    notes: day.notes || null,
  }));
  const recentStrength = latest(base.strength_logs, 6).map(session => ({
    date: session.date || session.session_date,
    title: session.title || session.name || session.session_name || session.workout_name || "Strength session",
    duration_min: session.duration_min || session.duration_minutes || session.completed_minutes || null,
    volume: session.volume || session.total_volume || session.total_volume_kg || null,
    notes: session.notes || session.summary || null,
  }));
  const recentFeedback = latest(base.session_feedback, 6).map(f => pick(f, [
    "date",
    "rating_label",
    "completed_minutes",
    "best_movement",
    "worst_movement",
    "pain_notes",
    "difficulty",
    "note",
  ]));
  const recentCoachNotes = latest(base.coach_chat_notes, 10).map(m => ({
    role: m.role,
    text: String(m.text || "").slice(0, 500),
    at: m.at,
    channel: m.channel,
  }));

  return {
    last_updated: base.last_updated,
    coaching_brief: base.coaching_brief || buildBrief(base),
    coach_state: base.coach_state || DEFAULT_COACH_STATE,
    profile: pick(profile, ["name", "age", "sex", "location", "timezone", "training_gym", "primary_goals", "gym"]),
    constraints: {
      schedule: "Walk most mornings; strength training usually Mon/Wed/Fri mornings; cycling on off days; weekends off formal training.",
      gym: "World Gym Taichung unless travel mode is active.",
      hip: "Hip OA/deep hip positions require caution; avoid forced deep loaded flexion.",
      asthma: "Controlled with daily Relvar and emergency inhaler.",
      bp: "Doctor requested one week of consistent BP readings before determining concern.",
      nutrition_source: "Bevel food tracking",
      workout_source: "Motra workout logs",
    },
    current: {
      blood_pressure: latestBp ? pick(latestBp, ["date", "measured_at", "systolic_mmhg", "diastolic_mmhg", "heart_rate_bpm", "notes"]) : null,
      recovery_sleep: latestSleep ? pick(latestSleep, ["date", "recovery_score_pct", "hrv_ms", "resting_hr_bpm", "sleep_score_pct", "sleep_duration_min", "bevel", "oura"]) : null,
      body_composition: latestBody ? pick(latestBody, ["date", "weight_lbs", "body_fat_pct", "lean_mass_lbs", "visceral_fat_level", "notes"]) : null,
      nutrition: latestNutrition ? {
        date: latestNutrition.date,
        source: latestNutrition.source,
        totals: latestNutrition.totals || null,
        notes: latestNutrition.notes || null,
      } : null,
    },
    recent: {
      blood_pressure: recentBp,
      nutrition: recentNutrition,
      strength_sessions: recentStrength,
      workout_feedback: recentFeedback,
      coach_notes: recentCoachNotes,
      coach_decisions: base.coach_decisions || [],
    },
  };
}

export async function dashboardFromSupabase() {
  const profile = await getProfile();
  if (!profile) return null;
  const profileId = profile.id;
  const [rawImports, recovery, bp, body, nutrition, strength, feedback, messages] = await Promise.all([
    supabase(`raw_imports?profile_id=eq.${profileId}&select=payload,imported_at&order=imported_at.desc&limit=1`),
    supabase(`recovery_sleep?profile_id=eq.${profileId}&select=*&order=measured_date.asc`),
    supabase(`blood_pressure_readings?profile_id=eq.${profileId}&select=*&order=measured_date.asc`),
    supabase(`body_comp_measurements?profile_id=eq.${profileId}&select=*&order=measured_date.asc`),
    supabase(`nutrition_days?profile_id=eq.${profileId}&select=*&order=log_date.asc`),
    supabase(`strength_sessions?profile_id=eq.${profileId}&select=*&order=session_date.asc`),
    supabase(`session_feedback?profile_id=eq.${profileId}&select=*&order=created_at.asc`),
    supabase(`coach_messages?profile_id=eq.${profileId}&select=*&order=message_at.desc&limit=30`),
  ]);

  const base = rawImports?.[0]?.payload || {};
  base.profile = { ...(base.profile || {}), ...profile };
  base.recovery_sleep = recovery.map(r => ({ ...(r.raw || {}), ...r, date: r.measured_date }));
  base.blood_pressure = bp.map(r => ({ ...(r.raw || {}), ...r, date: r.measured_date }));
  base.body_composition = body.map(r => ({ ...(r.raw || {}), ...r, date: r.measured_date }));
  base.nutrition_log = nutrition.map(r => ({
    ...(r.raw || {}),
    date: r.log_date,
    source: r.source,
    totals: { kcal: r.calories_kcal, protein_g: r.protein_g, carbs_g: r.carbs_g, fat_g: r.fat_g },
    notes: r.notes,
  }));
  base.strength_logs = strength.map(r => ({ ...(r.raw || {}), ...r, date: r.session_date }));
  base.session_feedback = feedback.map(r => ({ ...r, date: r.session_date, timestamp: r.created_at, note: r.freeform_note }));
  base.coach_chat_notes = messages.reverse().map(m => ({ role: m.role, text: m.body, at: m.message_at, channel: m.channel }));
  base.coach_state = await getCoachState(profileId);
  base.coach_decisions = await safeSupabase(`coach_decisions?profile_id=eq.${profileId}&select=*&order=created_at.desc&limit=10`, {}, []);
  base.coaching_brief = buildBrief(base);
  base.last_updated = new Date().toISOString();
  return base;
}
