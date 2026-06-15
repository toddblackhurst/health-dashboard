import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_COACH_STATE,
  buildAppleHealthSupport,
  buildCoachDecision,
  buildCoachToday,
  buildExerciseCoachingReadout,
  buildNutritionCall,
  buildSyncStatus,
  buildWorkoutPlan,
  compactCoachHistory,
  compactDashboard,
  evaluateReadiness,
  polishCoachDecision,
} from "../netlify/functions/_coach-lib.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const MONDAY_TAIPEI = "2026-05-11T02:00:00.000Z";
const TUESDAY_TAIPEI = "2026-06-09T02:00:00.000Z";
const WEDNESDAY_TAIPEI = "2026-06-10T02:00:00.000Z";
const MONDAY_SCHEDULE = {
  weekday: "Monday",
  day_type: "strength",
  strength_planned: true,
  daily_walk_planned: true,
  label: "Monday strength day",
  next_strength_day: "Monday",
  non_lift_call: null,
};

function workoutExercises(workout) {
  return (workout.blocks || []).flatMap(block => block.exercises || []);
}

function assertPlannedExerciseShape(exercise) {
  assert.ok(exercise.name, "exercise name is required");
  assert.equal(exercise.tracking_app, "Rack", `${exercise.name} should be Rack-first`);
  assert.ok(exercise.rack_name || exercise.app_entry_name, `${exercise.name} needs a Rack entry name`);
  assert.ok(exercise.equipment || exercise.floor, `${exercise.name} needs equipment or floor`);
  assert.ok(exercise.prescription || (exercise.sets && exercise.reps && exercise.load), `${exercise.name} needs prescription`);
  assert.ok(Array.isArray(exercise.pro_coaching) && exercise.pro_coaching.length >= 2, `${exercise.name} needs coaching`);
  assert.ok(Array.isArray(exercise.feel) && exercise.feel.length >= 1, `${exercise.name} needs feel target`);
  assert.ok(exercise.safety_modification || (Array.isArray(exercise.avoid) && exercise.avoid.length), `${exercise.name} needs safety notes`);
}

function assertExerciseCoachingReadoutShape(exercise) {
  const requiredFields = [
    "exercise_name",
    "rack_motra_entry_name",
    "tracking_app",
    "floor",
    "equipment",
    "prescription",
    "purpose",
    "setup_cue",
    "execution_cue",
    "feel_cue",
    "safety_modification",
    "progression_target",
    "logging_note",
  ];

  for (const field of requiredFields) {
    assert.ok(exercise[field], `${exercise.rack_motra_entry_name || "exercise"} missing ${field}`);
  }
  assert.equal(exercise.tracking_app, "Rack");
  assert.ok(exercise.exercise_name);
  assert.match(exercise.progression_target, /pain stays below 4\/10/);
  assert.match(exercise.logging_note, /Log in Rack/);
}

test("BP red gate downshifts training", () => {
  const readiness = evaluateReadiness({
    blood_pressure: [
      { date: "2026-05-03", systolic_mmhg: 162, diastolic_mmhg: 101 },
    ],
  }, DEFAULT_COACH_STATE, { now: new Date(MONDAY_TAIPEI) });

  assert.equal(readiness.tier, "Red");
  assert.ok(readiness.risk_flags.some(flag => flag.code === "bp_red"));
  assert.match(readiness.training_call, /Downshift/);
});

test("subjective asthma, migraine, and hip pain override app scores", () => {
  const dashboard = {
    recovery_sleep: [
      {
        date: "2026-05-03",
        oura: { readiness_score: 91, hrv_avg_ms: 39 },
        bevel: { recovery_pct: 82 },
      },
    ],
  };

  const readiness = evaluateReadiness(dashboard, DEFAULT_COACH_STATE, {
    text: "Migraine this morning, asthma flare, hip pain 5/10.",
    now: new Date(MONDAY_TAIPEI),
  });

  assert.equal(readiness.tier, "Red");
  assert.ok(readiness.risk_flags.some(flag => flag.code === "migraine"));
  assert.ok(readiness.risk_flags.some(flag => flag.code === "asthma"));
  assert.ok(readiness.risk_flags.some(flag => flag.code === "pain"));
});

test("sharp radiating or worsening pain overrides device data", () => {
  const readiness = evaluateReadiness({
    recovery_sleep: [
      {
        date: "2026-05-03",
        oura: { readiness_score: 91, hrv_avg_ms: 39 },
        bevel: { recovery_pct: 82 },
      },
    ],
  }, DEFAULT_COACH_STATE, {
    text: "Garmin looks good, but I have sharp radiating pain today.",
    now: new Date(MONDAY_TAIPEI),
  });

  assert.equal(readiness.tier, "Red");
  assert.ok(readiness.risk_flags.some(flag => flag.code === "danger_pain"));
});

test("OpenAI polish cannot override deterministic safety decision", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalDisabled = process.env.COACH_AI_DISABLED;
  process.env.OPENAI_API_KEY = "test-key";
  delete process.env.COACH_AI_DISABLED;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        output_text: JSON.stringify({
          reply: "Green light. Push intensity hard today.",
          top_line_call: "Green enough for normal training.",
          risk_flags: ["No safety concerns."],
          evidence: ["Model says readiness is fine."],
          next_actions: ["Do the full finisher."],
        }),
      };
    },
  });

  try {
    const deterministic = buildCoachDecision({
      text: "Migraine this morning, asthma flare, hip pain 5/10.",
      intent: "build_workout",
      dashboard: {},
      payload: { now: MONDAY_TAIPEI },
    });
    const polished = await polishCoachDecision(deterministic, { text: "Can I train hard today?" });

    assert.equal(polished.readiness.tier, "Red");
    assert.equal(polished.reply, deterministic.reply);
    assert.equal(polished.top_line_call, deterministic.top_line_call);
    assert.deepEqual(polished.risk_flags, deterministic.risk_flags);
    assert.deepEqual(polished.evidence, deterministic.evidence);
    assert.deepEqual(polished.next_actions, deterministic.next_actions);
    assert.deepEqual(polished.workout_plan, deterministic.workout_plan);
    assert.deepEqual(polished.daily_summary.safety_guardrails, deterministic.daily_summary.safety_guardrails);
    assert.equal(polished.ai_polish_available, true);
    assert.match(polished.generated_by, /\+gpt-5\.5-guarded$/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalKey;
    }
    if (originalDisabled === undefined) {
      delete process.env.COACH_AI_DISABLED;
    } else {
      process.env.COACH_AI_DISABLED = originalDisabled;
    }
  }
});

test("workout build returns deterministic output without requiring OpenAI polish", () => {
  const decision = buildCoachDecision({
    text: "Build today's workout",
    intent: "build_workout",
    dashboard: {},
    payload: { now: MONDAY_TAIPEI },
  });

  assert.equal(decision.intent, "build_workout");
  assert.equal(decision.generated_by, "coach-brain-v1");
  assert.equal(decision.readiness.schedule.weekday, "Monday");
  assert.equal(decision.workout_plan.session_type, "World Gym Strength + Athletic Functional");
  assert.equal(decision.daily_summary.daily_call.color, "Green");
  assert.equal(decision.daily_summary.rack_motra_handoff.generated, true);
  assert.ok(decision.daily_summary.safety_guardrails.some(item => /Pain >=4\/10/.test(item)));
});

test("OpenAI polish timeout still returns valid deterministic workout response", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalDisabled = process.env.COACH_AI_DISABLED;
  process.env.OPENAI_API_KEY = "test-key";
  delete process.env.COACH_AI_DISABLED;
  let aborted = false;
  globalThis.fetch = (_url, options = {}) => new Promise(() => {
    options.signal?.addEventListener("abort", () => {
      aborted = true;
    });
  });

  try {
    const deterministic = buildCoachDecision({
      text: "Build today's workout",
      intent: "build_workout",
      dashboard: {},
      payload: { now: MONDAY_TAIPEI },
    });
    const started = Date.now();
    const polished = await polishCoachDecision(deterministic, {
      text: "Build today's workout",
      timeoutMs: 20,
    });
    const elapsedMs = Date.now() - started;

    assert.ok(elapsedMs < 500, `polish timeout took ${elapsedMs}ms`);
    assert.equal(aborted, true);
    assert.equal(polished.readiness.tier, deterministic.readiness.tier);
    assert.equal(polished.top_line_call, deterministic.top_line_call);
    assert.deepEqual(polished.workout_plan, deterministic.workout_plan);
    assert.deepEqual(polished.daily_summary.rack_motra_handoff, deterministic.daily_summary.rack_motra_handoff);
    assert.match(polished.ai_warning, /timed out/);
    assert.match(polished.generated_by, /\+deterministic-fallback$/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalKey;
    }
    if (originalDisabled === undefined) {
      delete process.env.COACH_AI_DISABLED;
    } else {
      process.env.COACH_AI_DISABLED = originalDisabled;
    }
  }
});

test("May 3 mixed readiness treats Oura and Bevel conflict conservatively", () => {
  const readiness = evaluateReadiness({
    profile: { oura_biology_baselines: { hrv_baseline_ms: 32.5 } },
    recovery_sleep: [
      {
        measured_date: "2026-05-03",
        oura_readiness_score: 89,
        hrv_ms: 20,
        recovery_score_pct: 25,
      },
    ],
  }, DEFAULT_COACH_STATE, { now: new Date(MONDAY_TAIPEI) });

  assert.equal(readiness.tier, "Red");
  assert.ok(readiness.risk_flags.some(flag => flag.code === "low_hrv"));
  assert.ok(readiness.risk_flags.some(flag => flag.code === "low_recovery"));
  assert.ok(readiness.risk_flags.some(flag => flag.code === "app_conflict"));
});

test("Garmin recovery row is primary over stale fallback app signals", () => {
  const readiness = evaluateReadiness({
    profile: { oura_biology_baselines: { hrv_baseline_ms: 32.5 } },
    recovery_sleep: [
      {
        measured_date: "2026-06-09",
        source: "Garmin Connect",
        hrv_ms: 43,
        recovery_score_pct: 86,
        oura: { readiness_score: 29, hrv_avg_ms: 19 },
      },
    ],
  }, DEFAULT_COACH_STATE, { now: new Date(TUESDAY_TAIPEI) });

  assert.equal(readiness.tier, "Yellow");
  assert.equal(readiness.hrv_ms, 43);
  assert.equal(readiness.hrv_source, "Garmin");
  assert.equal(readiness.garmin_readiness, 86);
  assert.equal(readiness.recovery_source, "Garmin");
  assert.ok(!readiness.risk_flags.some(flag => flag.code === "low_recovery"));
  assert.ok(readiness.risk_flags.some(flag => flag.code === "app_conflict"));
  assert.ok(!readiness.risk_flags.some(flag => flag.code === "low_hrv"));
  assert.ok(readiness.evidence.some(item => /Garmin HRV 43ms/.test(item)));
});

test("stale Garmin recovery row falls back instead of staying primary", () => {
  const readiness = evaluateReadiness({
    profile: { oura_biology_baselines: { hrv_baseline_ms: 32.5 } },
    recovery_sleep: [
      {
        measured_date: "2026-06-05",
        source: "Garmin Connect",
        hrv_ms: 43,
        recovery_score_pct: 86,
        oura: { readiness_score: 72, hrv_avg_ms: 34 },
      },
    ],
  }, DEFAULT_COACH_STATE, { now: new Date(TUESDAY_TAIPEI) });

  assert.equal(readiness.hrv_ms, 34);
  assert.equal(readiness.hrv_source, "Oura fallback");
  assert.equal(readiness.recovery_source, "Oura fallback");
  assert.equal(readiness.garmin_readiness, null);
  assert.ok(readiness.risk_flags.some(flag => flag.code === "stale_garmin_readiness"));
});

test("fresh Garmin recovery row with unreliable wear quality falls back", () => {
  const readiness = evaluateReadiness({
    profile: { oura_biology_baselines: { hrv_baseline_ms: 32.5 } },
    recovery_sleep: [
      {
        measured_date: "2026-06-09",
        source: "Garmin Connect",
        hrv_ms: 44,
        recovery_score_pct: 88,
        watch_worn_overnight: false,
        training_readiness_status: "insufficient baseline",
        oura: { readiness_score: 74, hrv_avg_ms: 35 },
      },
    ],
  }, DEFAULT_COACH_STATE, { now: new Date(TUESDAY_TAIPEI) });

  assert.equal(readiness.hrv_ms, 35);
  assert.equal(readiness.hrv_source, "Oura fallback");
  assert.equal(readiness.recovery_source, "Oura fallback");
  assert.equal(readiness.garmin_readiness, null);
  assert.ok(readiness.risk_flags.some(flag => flag.code === "unreliable_garmin_wear"));
});

test("nutrition closeout catches fat over budget and protein short", () => {
  const nutrition = buildNutritionCall({
    nutrition_log: [
      {
        date: "2026-05-03",
        source: "Bevel",
        totals: { kcal: 1950, protein_g: 101, carbs_g: 180, fat_g: 94 },
      },
    ],
  });

  assert.equal(nutrition.source, "Garmin Connect+ Nutrition");
  assert.equal(nutrition.protein_gap_g, 49);
  assert.equal(nutrition.fat_over_g, 24);
  assert.match(nutrition.call, /^Fat is the constraint/);
});

test("normal World Gym workout is floor-aware and Motra-ready", () => {
  const workout = buildWorkoutPlan({}, DEFAULT_COACH_STATE, { tier: "Green", schedule: MONDAY_SCHEDULE });
  const exercises = workoutExercises(workout);

  assert.equal(workout.environment, "World Gym Taichung");
  assert.equal(workout.requires_inventory, false);
  assert.match(workout.floor_plan, /Floor 3 prehab\/primer -> Floor 2 anchors -> Floor 3 trunk/);
  assert.equal(workout.blocks[0].id, "PREHAB");
  assert.ok(workout.blocks.some(block => block.floor === "Floor 3"));
  assert.ok(workout.blocks.some(block => block.floor === "Floor 2"));
  assert.ok(exercises.some(ex => ex.motra_name === "Pull-Up"));
  assert.ok(workout.guardrails.includes("No cross-floor supersets."));
  for (const exercise of exercises) assertPlannedExerciseShape(exercise);
});

test("workout exercise coaching stays plain-language and anatomy-light", () => {
  const workout = buildWorkoutPlan({}, DEFAULT_COACH_STATE, { tier: "Green", schedule: MONDAY_SCHEDULE });
  const coreText = workoutExercises(workout)
    .flatMap(exercise => [...(exercise.pro_coaching || []), ...(exercise.feel || [])])
    .join(" ");

  assert.doesNotMatch(coreText, /\b(latissimus|scapula|scapular|humerus|posterior chain|glute medius|posterior tilt|externally rotate|eccentrically load|activate the)\b/i);
  assert.match(coreText, /Start|Pull|Walk|Stand|Lift|Press/);
});

test("Rack/Motra handoff includes equipment and entry-ready prescription lines", () => {
  const decision = buildCoachDecision({
    text: "Build today's workout",
    intent: "build_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: MONDAY_TAIPEI },
  });
  const handoff = decision.daily_summary.rack_motra_handoff;
  const handoffExercises = handoff.copy_friendly_order.flatMap(block => block.exercises);
  const pullUp = handoffExercises.find(exercise => exercise.rack_motra_name === "Pull-Up");

  assert.equal(handoff.generated, true);
  assert.equal(handoff.rack_entry_format, "Exercise | Equipment | Sets x Reps x Load");
  assert.ok(pullUp);
  assert.equal(pullUp.tracking_app, "Rack");
  assert.equal(pullUp.rack_name, "Pull-Up");
  assert.match(pullUp.rack_entry_line, /^Pull-Up \| Floor 2 pull-up station/);
  assert.match(pullUp.rack_entry_line, /4 x 6 \/ 5 \/ 5 \/ 4 x bodyweight/);
  assert.ok(Array.isArray(pullUp.pro_coaching) && pullUp.pro_coaching.some(note => /lowering/.test(note)));
  assert.ok(handoff.rack_entry_lines.some(line => /Dumbbell Incline Bench Press \| Floor 2 dumbbells/.test(line)));
});

test("workout response exposes full exercise coaching readout for GPT Actions", () => {
  const decision = buildCoachDecision({
    text: "Build today's strength workout.",
    intent: "build_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: WEDNESDAY_TAIPEI },
  });
  const plannedExercises = workoutExercises(decision.workout_plan);
  const readout = decision.exercise_coaching_readout;
  const nestedReadout = decision.workout_plan.exercise_coaching_readout;
  const pullUp = readout.find(exercise => exercise.rack_motra_entry_name === "Pull-Up");

  assert.equal(readout.length, plannedExercises.length);
  assert.deepEqual(readout, nestedReadout);
  for (const exercise of readout) assertExerciseCoachingReadoutShape(exercise);
  assert.ok(pullUp);
  assert.equal(pullUp.floor, "Floor 2");
  assert.match(pullUp.equipment, /pull-up station/);
  assert.match(pullUp.prescription, /bodyweight/);
  assert.match(pullUp.setup_cue, /still hang/);
  assert.match(pullUp.execution_cue, /Pull yourself up/);
  assert.match(pullUp.feel_cue, /controlled pull/);
  assert.match(pullUp.safety_modification, /assistance/);
});

test("exercise coaching readout handles missing exercise fields with safe fallbacks", () => {
  const readout = buildExerciseCoachingReadout({
    blocks: [
      {
        name: "Fallback block",
        exercises: [{}],
      },
    ],
  });

  assert.equal(readout.length, 1);
  assert.deepEqual(readout[0], {
    order: 1,
    block: "Fallback block",
    exercise_name: "Unknown exercise",
    rack_motra_entry_name: "Unknown exercise",
    tracking_app: "Rack",
    floor: "Unknown",
    equipment: "Use the machine/cable station available on the assigned floor.",
    prescription: "coach-prescribed work",
    purpose: "Do this for today's planned movement quality and training effect.",
    setup_cue: "Set up deliberately before the first rep.",
    execution_cue: "Move smoothly and keep each rep repeatable.",
    feel_cue: "The movement should feel controlled, not forced.",
    safety_modification: "Reduce load, range, or skip if symptoms rise.",
    progression_target: "Progress this exercise only when all prescribed sets are clean, pain stays below 4/10, and the last reps remain repeatable.",
    logging_note: "Log in Rack as this exercise; record completed sets, reps, load, rest, RPE, and any pain/form note.",
  });
});

test("Kuala Lumpur travel mode asks for inventory and disables World Gym routing", () => {
  const state = clone(DEFAULT_COACH_STATE);
  state.gym_profile.travel_mode = true;

  const workout = buildWorkoutPlan({}, state, { tier: "Green", schedule: MONDAY_SCHEDULE });

  assert.equal(workout.environment, "Travel / hotel gym");
  assert.equal(workout.requires_inventory, true);
  assert.match(workout.reason, /hotel-gym inventory/);
  assert.deepEqual(workout.blocks, []);
});

test("build_workout intent returns structured workout plan and source context", () => {
  const decision = buildCoachDecision({
    text: "Build today's workout",
    intent: "build_workout",
    dashboard: {},
    payload: { now: MONDAY_TAIPEI },
  });

  assert.equal(decision.intent, "build_workout");
  assert.equal(decision.source_context.default_gym, "World Gym Taichung");
  assert.match(decision.source_context.safety_override, /doctor guidance/);
  assert.equal(decision.source_context.readiness_primary, "Garmin Fenix 8 / Garmin training-recovery stack");
  assert.match(decision.source_context.readiness_condition, /overnight and during training/);
  assert.match(decision.source_context.readiness_fallback, /Oura sleep\/recovery/);
  assert.equal(decision.source_context.nutrition_primary, "Garmin Connect+ Nutrition");
  assert.equal(decision.source_context.workout_physiology_primary, "Garmin Connect / Fenix 8");
  assert.equal(decision.source_context.workout_primary, "Garmin Connect / Fenix 8");
  assert.equal(decision.source_context.strength_log_primary, "Rack/Motra");
  assert.equal(decision.source_context.apple_health_role, "supporting cross-check/data bus");
  assert.equal(decision.source_context.oura_role, "secondary sleep/recovery fallback");
  assert.match(decision.source_context.soundcore_role, /not recovery authority/);
  assert.equal(decision.workout_plan.environment, "World Gym Taichung");
  assert.equal(decision.daily_summary.daily_call.color, "Green");
  assert.match(decision.daily_summary.todays_plan.primary_action, /World Gym plan/);
  assert.equal(decision.daily_summary.rack_motra_handoff.generated, true);
  assert.match(decision.daily_summary.rack_motra_handoff.execution_policy, /Rack is the current strength-log app/);
  assert.ok(decision.daily_summary.rack_motra_handoff.copy_friendly_order.some(block =>
    block.exercises.some(ex => ex.name === "Pull-Up" && ex.rack_motra_name === "Pull-Up")));
});

test("source authority context preserves Garmin, Rack/Motra, Oura, Apple Health, and Soundcore roles", () => {
  const dashboard = {
    now: new Date("2026-06-08T02:00:00.000Z"),
    profile: { timezone: "Asia/Taipei" },
    apple_health_daily_summaries: [{
      summary_date: "2026-06-08",
      source_app: "Apple Health",
      steps: 8421,
      workout_count: 2,
      strength_workout_count: 1,
      hrv_sdnn_ms: 82,
    }],
  };

  const decision = buildCoachDecision({
    text: "Build today's workout",
    intent: "build_workout",
    dashboard,
    payload: { now: "2026-06-08T02:00:00.000Z" },
  });
  const coachToday = buildCoachToday(dashboard);
  const syncStatus = buildSyncStatus(dashboard);

  assert.equal(decision.source_context.readiness_primary, "Garmin Fenix 8 / Garmin training-recovery stack");
  assert.equal(coachToday.source_context.readiness_primary, "Garmin Fenix 8 / Garmin training-recovery stack");
  assert.equal(decision.source_context.workout_physiology_primary, "Garmin Connect / Fenix 8");
  assert.equal(coachToday.source_context.workout_physiology_primary, "Garmin Connect / Fenix 8");
  assert.equal(decision.source_context.workout_primary, "Garmin Connect / Fenix 8");
  assert.equal(decision.source_context.strength_log_primary, "Rack/Motra");
  assert.equal(coachToday.source_context.strength_log_primary, "Rack/Motra");
  assert.match(decision.daily_summary.rack_motra_handoff.execution_policy, /Rack is the current strength-log app/);
  assert.equal(decision.source_context.apple_health_role, "supporting cross-check/data bus");
  assert.equal(coachToday.source_context.apple_health_role, "supporting cross-check/data bus");
  assert.equal(decision.source_context.supporting_evidence.apple_health.role, "supporting cross-check");
  assert.match(coachToday.source_context.apple_health_workout_counts, /not completed strength-log authority/);
  assert.match(decision.source_context.readiness_fallback, /Oura sleep\/recovery/);
  assert.equal(decision.source_context.oura_role, "secondary sleep/recovery fallback");
  assert.equal(coachToday.source_context.oura_role, "secondary sleep/recovery fallback");
  assert.match(DEFAULT_COACH_STATE.source_hierarchy.readiness.join(" "), /Oura sleep\/recovery fallback/);
  assert.match(decision.source_context.soundcore_role, /not recovery authority/);
  assert.match(DEFAULT_COACH_STATE.source_hierarchy.sleep_environment, /not recovery authority/);
  assert.deepEqual(syncStatus.source_policy.does_not_override, [
    "Garmin readiness/recovery",
    "subjective symptoms",
    "medical safety flags",
    "Garmin workout physiology",
    "Rack/Motra strength history",
  ]);
});

test("sync-status classifies stale, manual-bound, fallback, supporting, and read-only source states", () => {
  const dashboard = {
    now: new Date("2026-06-08T02:00:00.000Z"),
    profile: { timezone: "Asia/Taipei", oura_biology_baselines: { hrv_baseline_ms: 32.5 } },
    recovery_sleep: [{
      date: "2026-06-05",
      source: "Garmin",
      training_readiness_score: 82,
      hrv_status_ms: 44,
      oura: { readiness_score: 71, hrv_avg_ms: 35 },
    }],
    blood_pressure: [{ date: "2026-06-05", systolic_mmhg: 124, diastolic_mmhg: 78 }],
    body_composition: [{ measured_date: "2026-05-23", weight_kg: 87 }],
    apple_health_daily_summaries: [{ summary_date: "2026-06-08", steps: 8421 }],
  };

  const syncStatus = buildSyncStatus(dashboard);
  const byId = Object.fromEntries(syncStatus.checks.map(check => [check.id, check]));

  assert.equal(syncStatus.protected_read_only_status.source_state, "verified_read_only");
  assert.equal(syncStatus.protected_read_only_status.write_status, "no_write");

  assert.equal(byId.sleep_recovery.source_state, "manual_provider_bound");
  assert.equal(byId.sleep_recovery.freshness_status, "stale");
  assert.equal(byId.sleep_recovery.authority_role, "primary_readiness");
  assert.match(byId.sleep_recovery.next_action, /Garmin sleep\/recovery/);

  assert.equal(byId.blood_pressure.source_state, "write_held");
  assert.equal(byId.blood_pressure.freshness_status, "stale");
  assert.equal(byId.blood_pressure.authority_role, "safety_override");

  assert.equal(byId.nutrition.source_state, "manual_provider_bound");
  assert.equal(byId.nutrition.freshness_status, "missing");
  assert.match(byId.nutrition.next_action, /do not use Apple Health calories/);

  assert.equal(byId.strength_session.status, "pending");
  assert.equal(byId.strength_session.source_state, "manual_provider_bound");
  assert.equal(byId.strength_session.freshness_status, "missing");
  assert.match(byId.strength_session.next_action, /do not count Apple Health workouts/);

  assert.equal(byId.strength_exercises.source_state, "manual_provider_bound");
  assert.equal(byId.strength_exercises.confidence_effect, "low_for_progression");

  assert.equal(byId.oura_fallback.source_state, "fallback_only");
  assert.equal(byId.oura_fallback.freshness_status, "stale");
  assert.match(byId.oura_fallback.next_action, /fallback/);

  assert.equal(byId.apple_health_daily_summary.source_state, "supporting_only");
  assert.equal(byId.apple_health_daily_summary.freshness_status, "fresh");
  assert.equal(byId.apple_health_daily_summary.confidence_effect, "supporting_only");
});

test("sync-status keeps Oura current data fallback-only when Garmin sleep is missing", () => {
  const syncStatus = buildSyncStatus({
    now: new Date(MONDAY_TAIPEI),
    profile: { timezone: "Asia/Taipei" },
    recovery_sleep: [{
      date: "2026-05-11",
      source: "Oura",
      oura: { readiness_score: 84, hrv_avg_ms: 38, total_sleep_min: 435 },
    }],
  });
  const byId = Object.fromEntries(syncStatus.checks.map(check => [check.id, check]));

  assert.equal(byId.sleep_recovery.status, "missing");
  assert.equal(byId.sleep_recovery.source_state, "manual_provider_bound");
  assert.equal(byId.sleep_recovery.freshness_status, "missing");
  assert.ok(syncStatus.missing_required.includes("sleep_recovery"));
  assert.equal(byId.oura_fallback.status, "current");
  assert.equal(byId.oura_fallback.source_state, "fallback_only");
  assert.equal(byId.oura_fallback.freshness_status, "fresh");
});

test("sync-status marks Rack/Motra strength sources not expected on non-strength days", () => {
  const syncStatus = buildSyncStatus({
    now: new Date(TUESDAY_TAIPEI),
    profile: { timezone: "Asia/Taipei" },
  });
  const byId = Object.fromEntries(syncStatus.checks.map(check => [check.id, check]));

  assert.equal(byId.strength_session.status, "not_expected");
  assert.equal(byId.strength_session.source_state, "not_expected_today");
  assert.equal(byId.strength_session.freshness_status, "not_expected_today");
  assert.equal(byId.strength_exercises.status, "not_expected");
  assert.equal(byId.strength_exercises.source_state, "not_expected_today");
  assert.ok(!syncStatus.missing_required.includes("strength_session"));
  assert.ok(!syncStatus.missing_required.includes("strength_exercises"));
});

test("medical and safety flags override optimistic device data across workout decisions", () => {
  const dashboard = {
    now: new Date(MONDAY_TAIPEI),
    profile: { timezone: "Asia/Taipei", oura_biology_baselines: { hrv_baseline_ms: 32.5 } },
    recovery_sleep: [{
      measured_date: "2026-05-11",
      oura_readiness_score: 95,
      hrv_ms: 52,
      recovery_score_pct: 96,
    }],
    blood_pressure: [{
      date: "2026-05-11",
      systolic_mmhg: 165,
      diastolic_mmhg: 101,
    }],
    apple_health_daily_summaries: [{
      summary_date: "2026-05-11",
      steps: 12000,
      exercise_minutes: 90,
      hrv_sdnn_ms: 95,
      workout_count: 3,
      strength_workout_count: 2,
    }],
  };

  const text = "Garmin says I am ready, but migraine and asthma flare today.";
  const readiness = evaluateReadiness(dashboard, DEFAULT_COACH_STATE, { text, now: new Date(MONDAY_TAIPEI) });
  const decision = buildCoachDecision({
    text,
    intent: "build_workout",
    dashboard,
    payload: { now: MONDAY_TAIPEI },
  });

  assert.equal(readiness.tier, "Red");
  assert.ok(readiness.risk_flags.some(flag => flag.code === "migraine"));
  assert.ok(readiness.risk_flags.some(flag => flag.code === "asthma"));
  assert.ok(readiness.risk_flags.some(flag => flag.code === "bp_red"));
  assert.match(readiness.training_call, /Downshift/);
  assert.equal(decision.readiness.tier, "Red");
  assert.equal(decision.daily_summary.daily_call.color, "Red");
  assert.match(decision.source_context.safety_override, /override all device data/);
  assert.match(decision.daily_summary.confidence_data_quality.source_policy, /does not override Garmin readiness/);
  assert.ok(decision.daily_summary.safety_guardrails.some(item => /Apple Health activity counts never override/.test(item)));
  assert.ok(decision.daily_summary.why.some(item => /Apple Health supporting context/.test(item)));
});

test("doctor guidance overrides optimistic device data", () => {
  const dashboard = {
    now: new Date(MONDAY_TAIPEI),
    profile: { timezone: "Asia/Taipei", oura_biology_baselines: { hrv_baseline_ms: 32.5 } },
    recovery_sleep: [{
      measured_date: "2026-05-11",
      source: "Garmin Connect",
      hrv_ms: 52,
      recovery_score_pct: 96,
    }],
    doctor_notes: [{
      note_date: "2026-05-11",
      topic: "BP follow-up",
      guidance: "Hold hard training this week.",
      training_impact: "No hard training until doctor clears intensity.",
    }],
  };

  const decision = buildCoachDecision({
    text: "Garmin says I am ready. Build today's workout.",
    intent: "build_workout",
    dashboard,
    payload: { now: MONDAY_TAIPEI },
  });

  assert.equal(decision.readiness.tier, "Red");
  assert.ok(decision.readiness.risk_flags.some(flag => flag.code === "doctor_guidance"));
  assert.match(decision.top_line_call, /Downshift/);
  assert.ok(decision.readiness.evidence.some(item => /Doctor guidance/.test(item)));
});

test("red safety gates are not overwritten by explicit Tuesday strength request", () => {
  const dashboard = {
    now: new Date(TUESDAY_TAIPEI),
    profile: { timezone: "Asia/Taipei" },
    blood_pressure: [{
      date: "2026-06-09",
      systolic_mmhg: 165,
      diastolic_mmhg: 101,
    }],
  };

  const decision = buildCoachDecision({
    text: "Override the schedule and build today's strength workout.",
    intent: "build_workout",
    dashboard,
    payload: { now: TUESDAY_TAIPEI },
  });

  assert.equal(decision.readiness.tier, "Red");
  assert.equal(decision.workout_request.request_intent, "override_schedule");
  assert.match(decision.top_line_call, /Downshift/);
  assert.equal(decision.workout_plan.session_type, "Recovery / Medical caution");
  assert.match(decision.workout_plan.top_line, /Downshift/);
  assert.match(decision.workout_plan.floor_plan, /No strength, Zone 2, or conditioning/);
  assert.equal(workoutExercises(decision.workout_plan).length, 0);
  assert.ok(!decision.workout_plan.blocks.some(block => /Zone 2|conditioning/i.test(`${block.name} ${block.target}`)));
  assert.ok(decision.next_actions.some(action => /recovery-only/.test(action)));
});

test("tomorrow Wednesday workout request builds the upcoming strength plan", () => {
  const started = Date.now();
  const decision = buildCoachDecision({
    text: "Build tomorrow's Wednesday strength workout. Hip clear. Feeling good. Going to sleep soon.",
    intent: "build_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: TUESDAY_TAIPEI },
  });
  const elapsedMs = Date.now() - started;

  assert.ok(elapsedMs < 250, `deterministic workout took ${elapsedMs}ms`);
  assert.equal(decision.date, "2026-06-10");
  assert.equal(decision.readiness.schedule.weekday, "Wednesday");
  assert.equal(decision.readiness.schedule.strength_planned, true);
  assert.equal(decision.workout_request.requested_for_weekday, "Wednesday");
  assert.match(decision.workout_request.planning_basis, /not today's schedule/);
  assert.equal(decision.workout_plan.requested_for_date, "2026-06-10");
  assert.equal(decision.workout_plan.session_type, "World Gym Strength + Athletic Functional");
  assert.equal(decision.daily_summary.rack_motra_handoff.generated, true);
  assert.match(decision.next_actions[0], /Wednesday plan/);
});

test("general intent still routes tomorrow workout text to the workout planner", () => {
  const decision = buildCoachDecision({
    text: "What is tomorrow's workout?",
    intent: "general",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: TUESDAY_TAIPEI },
  });

  assert.equal(decision.intent, "build_workout");
  assert.equal(decision.date, "2026-06-10");
  assert.equal(decision.readiness.schedule.weekday, "Wednesday");
  assert.equal(decision.readiness.schedule.strength_planned, true);
  assert.equal(decision.workout_request.requested_for_weekday, "Wednesday");
  assert.match(decision.workout_request.planning_basis, /not today's schedule/);
  assert.equal(decision.workout_plan.requested_for_date, "2026-06-10");
  assert.equal(decision.workout_plan.session_type, "World Gym Strength + Athletic Functional");
  assert.match(decision.next_actions[0], /Wednesday plan/);
});

test("next strength day request resolves without forcing today's non-lift day", () => {
  const decision = buildCoachDecision({
    text: "Build my next strength day workout",
    intent: "build_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: TUESDAY_TAIPEI },
  });

  assert.equal(decision.date, "2026-06-10");
  assert.equal(decision.readiness.schedule.weekday, "Wednesday");
  assert.equal(decision.readiness.schedule.strength_planned, true);
  assert.equal(decision.workout_request.requested_for_weekday, "Wednesday");
  assert.match(decision.workout_request.planning_basis, /next strength day Wednesday plan/);
  assert.equal(decision.workout_plan.session_type, "World Gym Strength + Athletic Functional");
});

test("passive Tuesday check remains goal-support and does not generate a workout handoff", () => {
  const decision = buildCoachDecision({
    text: "What should I do today?",
    intent: "general",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: TUESDAY_TAIPEI },
  });

  assert.equal(decision.workout_plan, null);
  assert.equal(decision.daily_summary.todays_plan.type, "goal-support day");
  assert.equal(decision.daily_summary.todays_plan.recommendation, "Daily Walk + Zone 2 + Mobility");
  assert.match(decision.daily_summary.todays_plan.primary_action, /No strength today/);
  assert.equal(decision.daily_summary.rack_motra_handoff.generated, false);
});

test("explicit build workout Tuesday returns goal-support workout", () => {
  const decision = buildCoachDecision({
    text: "Build today's workout",
    intent: "build_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: TUESDAY_TAIPEI },
  });

  assert.equal(decision.date, "2026-06-09");
  assert.equal(decision.intent, "build_workout");
  assert.equal(decision.readiness.schedule.weekday, "Tuesday");
  assert.equal(decision.readiness.schedule.strength_planned, false);
  assert.equal(decision.workout_request.is_future_request, false);
  assert.equal(decision.workout_request.request_intent, "build_workout");
  assert.equal(decision.workout_plan.session_type, "Daily Walk + Zone 2 + Mobility");
  assert.equal(decision.workout_plan.floor_plan, "No World Gym strength floor routing today.");
  assert.deepEqual(decision.workout_plan.blocks.map(block => block.name), ["Daily walk", "Zone 2 conditioning", "Mobility and core"]);
  assert.equal(workoutExercises(decision.workout_plan).length, 0);
  assert.ok(decision.workout_plan.guardrails.some(item => /Do not convert a non-lift day/.test(item)));
  assert.ok(decision.next_actions.some(action => /non-lift day guardrails/.test(action)));
});

test("explicit strength request Tuesday returns controlled modified strength when safe", () => {
  const decision = buildCoachDecision({
    text: "I explicitly want a safe modified strength workout today. Hip clear and breathing clear.",
    intent: "build_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: TUESDAY_TAIPEI },
  });
  const exercises = workoutExercises(decision.workout_plan);

  assert.equal(decision.date, "2026-06-09");
  assert.equal(decision.readiness.tier, "Green");
  assert.equal(decision.workout_request.request_intent, "build_strength");
  assert.equal(decision.workout_request.requested_session_type, "strength");
  assert.equal(decision.workout_plan.schedule_override_applied, true);
  assert.equal(decision.workout_plan.session_type, "Modified World Gym Strength (Schedule Override)");
  assert.match(decision.workout_plan.top_line, /Schedule override: controlled strength option/);
  assert.ok(decision.workout_plan.guardrails.some(item => /overrides the default Tuesday/.test(item)));
  assert.ok(decision.next_actions.some(action => /controlled strength override/.test(action)));
  assert.ok(exercises.length > 0);
  for (const exercise of exercises) assertPlannedExerciseShape(exercise);
  assert.ok(decision.workout_plan.what_to_track.some(item => /Rack sets\/reps\/loads/.test(item)));
  assert.match(decision.workout_plan.post_workout_debrief_prompt, /duration, completed blocks, RPE/);
});

test("explicit override schedule Tuesday returns controlled strength metadata", () => {
  const decision = buildCoachDecision({
    text: "Override the schedule and build strength today.",
    intent: "build_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: TUESDAY_TAIPEI },
  });

  assert.equal(decision.workout_request.request_intent, "override_schedule");
  assert.equal(decision.workout_request.schedule_override, true);
  assert.equal(decision.workout_plan.schedule_override, true);
  assert.equal(decision.workout_plan.schedule_override_applied, true);
  assert.equal(decision.daily_summary.todays_plan.type, "strength override");
  assert.match(decision.daily_summary.todays_plan.primary_action, /Schedule override/);
});

test("yellow strength day returns modified workout", () => {
  const decision = buildCoachDecision({
    text: "Build today's strength workout.",
    intent: "build_workout",
    dashboard: {
      profile: { timezone: "Asia/Taipei" },
      blood_pressure: [{
        date: "2026-05-11",
        systolic_mmhg: 145,
        diastolic_mmhg: 92,
      }],
    },
    payload: { now: MONDAY_TAIPEI },
  });

  assert.equal(decision.readiness.tier, "Yellow");
  assert.equal(decision.workout_plan.session_type, "World Gym Strength + Athletic Functional");
  assert.match(decision.workout_plan.top_line, /modified/);
  assert.ok(decision.workout_plan.guardrails.some(item => /Skip the hybrid close/.test(item)));
  for (const exercise of workoutExercises(decision.workout_plan)) assertPlannedExerciseShape(exercise);
});

test("Wednesday current-day strength request builds strength workout", () => {
  const decision = buildCoachDecision({
    text: "Build today's strength workout.",
    intent: "build_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: WEDNESDAY_TAIPEI },
  });

  assert.equal(decision.date, "2026-06-10");
  assert.equal(decision.readiness.schedule.weekday, "Wednesday");
  assert.equal(decision.readiness.schedule.strength_planned, true);
  assert.equal(decision.workout_plan.session_type, "World Gym Strength + Athletic Functional");
  assert.equal(decision.daily_summary.rack_motra_handoff.generated, true);
});

test("workout output includes tracking and post-workout debrief prompts", () => {
  const decision = buildCoachDecision({
    text: "Build today's strength workout.",
    intent: "build_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: WEDNESDAY_TAIPEI },
  });
  const postWorkout = buildCoachDecision({
    text: "Finished workout.",
    intent: "post_workout",
    dashboard: { profile: { timezone: "Asia/Taipei" } },
    payload: { now: WEDNESDAY_TAIPEI },
  });

  assert.ok(decision.daily_summary.what_to_track_today.some(item => /Garmin Connect Strength/.test(item)));
  assert.ok(decision.daily_summary.what_to_track_today.some(item => /Garmin Nutrition closeout/.test(item)));
  assert.ok(decision.workout_plan.what_to_track.some(item => /Post-workout RPE/.test(item)));
  assert.match(decision.workout_plan.post_workout_debrief_prompt, /best movement, worst movement, pain score/);
  assert.match(postWorkout.top_line_call, /duration, best movement, worst movement, pain, and RPE/);
});

test("coach decisions include compact Supabase conversation history for phone continuity", () => {
  const dashboard = {
    coach_chat_notes: [
      { role: "user", text: "My left hip is tight and I only have 45 minutes.", at: "2026-05-04T06:00:00+08:00", channel: "chatgpt-gpt" },
      { role: "coach", text: "Keep the anchors, cut optional accessories, and avoid deep loaded hip flexion.", at: "2026-05-04T06:00:10+08:00", channel: "api" },
    ],
  };

  const history = compactCoachHistory(dashboard);
  const decision = buildCoachDecision({ text: "What should I do with that?", dashboard, payload: { now: MONDAY_TAIPEI } });

  assert.equal(history.length, 2);
  assert.match(history[0].text, /left hip is tight/);
  assert.deepEqual(decision.source_context.recent_conversation, history);
});

test("Apple Health summaries appear as supporting diagnostics when present", () => {
  const dashboard = {
    now: new Date("2026-06-08T02:00:00.000Z"),
    profile: { timezone: "Asia/Taipei" },
    apple_health_sync_runs: [{
      status: "success",
      days_requested: 7,
      days_written: 7,
      timezone: "Asia/Taipei",
      started_at: "2026-06-08T00:00:00.000Z",
      completed_at: "2026-06-08T00:01:00.000Z",
      errors: [],
    }],
    apple_health_daily_summaries: [
      { summary_date: "2026-06-02", timezone: "Asia/Taipei", steps: 6000, exercise_minutes: 20, active_energy_kcal: 320 },
      { summary_date: "2026-06-03", timezone: "Asia/Taipei", steps: 7000, exercise_minutes: 25, active_energy_kcal: 350 },
      { summary_date: "2026-06-04", timezone: "Asia/Taipei", steps: 8000, exercise_minutes: 30, active_energy_kcal: 410 },
      { summary_date: "2026-06-05", timezone: "Asia/Taipei", steps: 9000, exercise_minutes: 35, active_energy_kcal: 460 },
      { summary_date: "2026-06-06", timezone: "Asia/Taipei", steps: 10000, exercise_minutes: 40, active_energy_kcal: 500 },
      { summary_date: "2026-06-07", timezone: "Asia/Taipei", steps: 11000, exercise_minutes: 45, active_energy_kcal: 540 },
      {
        summary_date: "2026-06-08",
        timezone: "Asia/Taipei",
        source_app: "Apple Health",
        source_device: "Todd iPhone",
        steps: 8421,
        exercise_minutes: 42,
        active_energy_kcal: 610,
        workout_count: 1,
        strength_workout_count: 0,
        cardio_workout_count: 1,
        sleep_minutes: 450,
        resting_hr_bpm: 57,
        hrv_sdnn_ms: 41,
        duplicate_policy_flags: { garmin_mirror_possible: true },
      },
    ],
  };

  const compact = compactDashboard(dashboard);
  const syncStatus = buildSyncStatus(dashboard);
  const coachToday = buildCoachToday(dashboard);

  assert.equal(compact.current.apple_health_daily_summary.source, "Apple Health / HealthKit daily summary");
  assert.equal(compact.current.apple_health_daily_summary.role, "supporting cross-check");
  assert.equal(compact.current.apple_health_daily_summary.steps, 8421);
  assert.equal(compact.recent.apple_health_daily_summaries.length, 7);
  assert.equal(syncStatus.apple_health.status, "current");
  assert.equal(syncStatus.apple_health.days_available_last_7, 7);
  assert.equal(syncStatus.apple_health.latest_summary_date, "2026-06-08");
  assert.equal(coachToday.supporting_evidence.apple_health.status, "current");
  assert.equal(coachToday.supporting_evidence.apple_health.role, "supporting cross-check");
  assert.match(coachToday.source_context.apple_health_workout_counts, /not completed strength-log authority/);
  assert.equal(coachToday.daily_call.color, "Green");
  assert.match(coachToday.daily_call.decision, /Train|strength|No strength/);
  assert.ok(coachToday.why.length >= 3);
  assert.ok(coachToday.why.some(item => /Apple Health supporting context/.test(item)));
  assert.ok(coachToday.why.some(item => /Plan context/.test(item)));
  assert.ok(coachToday.safety_guardrails.some(item => /Pain >=4\/10/.test(item)));
  assert.ok(coachToday.what_to_track_today.some(item => /Garmin Nutrition closeout/.test(item)));
  assert.equal(coachToday.rack_motra_handoff.generated, false);
  assert.match(coachToday.confidence_data_quality.source_policy, /Apple Health is supporting evidence only/);
  assert.equal(coachToday.brief.daily_call.color, coachToday.daily_call.color);
  assert.equal(coachToday.current.data_completeness.supporting_evidence.apple_health.role, "supporting cross-check");
});

test("missing Apple Health summaries do not break daily coach output", () => {
  const dashboard = {
    now: new Date("2026-06-08T02:00:00.000Z"),
    profile: { timezone: "Asia/Taipei" },
  };

  const compact = compactDashboard(dashboard);
  const syncStatus = buildSyncStatus(dashboard);

  assert.equal(compact.current.apple_health_daily_summary, null);
  assert.equal(syncStatus.apple_health.status, "missing");
  assert.equal(syncStatus.apple_health.days_available_last_7, 0);
  assert.ok(syncStatus.checks.some(check => check.id === "apple_health_daily_summary" && check.required === false));
  const coachToday = buildCoachToday(dashboard);
  assert.equal(coachToday.supporting_evidence.apple_health.status, "missing");
  assert.ok(coachToday.daily_call.decision);
  assert.ok(coachToday.why.some(item => /Apple Health: missing supporting context only/.test(item)));
  assert.ok(coachToday.confidence_data_quality.missing_or_stale.some(item => /Apple Health daily summary: missing/.test(item)));
  assert.ok(coachToday.what_to_track_today.some(item => /Apple Health sync freshness/.test(item)));
});

test("stale Apple Health summaries are marked stale without readiness penalty", () => {
  const dashboard = {
    now: new Date("2026-06-08T02:00:00.000Z"),
    profile: { timezone: "Asia/Taipei" },
    recovery_sleep: [
      {
        date: "2026-06-08",
        oura: { readiness_score: 91, hrv_avg_ms: 39 },
        bevel: { recovery_pct: 82 },
      },
    ],
    apple_health_daily_summaries: [
      { summary_date: "2026-06-05", timezone: "Asia/Taipei", steps: 12000, hrv_sdnn_ms: 10 },
    ],
  };

  const support = buildAppleHealthSupport(dashboard);
  const readiness = evaluateReadiness(dashboard, DEFAULT_COACH_STATE, { now: new Date("2026-06-08T02:00:00.000Z") });

  assert.equal(support.status, "stale");
  assert.equal(readiness.tier, "Green");
  assert.equal(readiness.source_order.at(-1), "Apple Health summary cross-checks/data bus only");
});

test("Apple Health does not override Garmin readiness or double-count workout history", () => {
  const dashboard = {
    now: new Date("2026-06-08T02:00:00.000Z"),
    profile: { timezone: "Asia/Taipei", oura_biology_baselines: { hrv_baseline_ms: 32.5 } },
    recovery_sleep: [
      {
        measured_date: "2026-06-08",
        oura_readiness_score: 89,
        hrv_ms: 20,
        recovery_score_pct: 25,
      },
    ],
    strength_logs: [
      {
        date: "2026-06-08",
        session_name: "Garmin Strength",
        exercises: [{ name: "Pull-Up", sets: [{ reps: 5 }] }],
      },
    ],
    apple_health_daily_summaries: [
      {
        summary_date: "2026-06-08",
        hrv_sdnn_ms: 90,
        workout_count: 4,
        strength_workout_count: 4,
      },
    ],
  };

  const readiness = evaluateReadiness(dashboard, DEFAULT_COACH_STATE, { now: new Date("2026-06-08T02:00:00.000Z") });
  const compact = compactDashboard(dashboard);
  const decision = buildCoachDecision({
    text: "Build today's workout",
    intent: "build_workout",
    dashboard,
    payload: { now: "2026-06-08T02:00:00.000Z" },
  });

  assert.equal(readiness.tier, "Red");
  assert.ok(readiness.risk_flags.some(flag => flag.code === "low_hrv"));
  assert.equal(compact.recent.strength_sessions.length, 1);
  assert.equal(compact.supporting_evidence.apple_health.last_7_days.strength_workout_count, 4);
  assert.match(compact.supporting_evidence.apple_health.duplicate_policy.warning, /Do not count Apple Health workout_count/);
  assert.equal(decision.daily_summary.daily_call.color, "Red");
  assert.match(decision.daily_summary.confidence_data_quality.source_policy, /does not override Garmin readiness/);
  assert.ok(decision.daily_summary.why.some(item => /Apple Health supporting context/.test(item)));
  assert.equal(decision.source_context.readiness_primary, "Garmin Fenix 8 / Garmin training-recovery stack");
  assert.equal(decision.source_context.workout_primary, "Garmin Connect / Fenix 8");
  assert.equal(decision.source_context.strength_log_primary, "Rack/Motra");
  assert.match(decision.source_context.readiness_fallback, /Oura/);
  assert.match(decision.source_context.soundcore_role, /not recovery authority/);
  assert.equal(decision.source_context.supporting_evidence.apple_health.role, "supporting cross-check");
});
