import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_COACH_STATE,
  buildCoachDecision,
  buildNutritionCall,
  buildWorkoutPlan,
  compactCoachHistory,
  evaluateReadiness,
} from "../netlify/functions/_coach-lib.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const MONDAY_TAIPEI = "2026-05-11T02:00:00.000Z";
const MONDAY_SCHEDULE = {
  weekday: "Monday",
  day_type: "strength",
  strength_planned: true,
  daily_walk_planned: true,
  label: "Monday strength day",
  next_strength_day: "Monday",
  non_lift_call: null,
};

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

  assert.equal(nutrition.source, "Bevel");
  assert.equal(nutrition.protein_gap_g, 49);
  assert.equal(nutrition.fat_over_g, 24);
  assert.match(nutrition.call, /^Fat is the constraint/);
});

test("normal World Gym workout is floor-aware and Motra-ready", () => {
  const workout = buildWorkoutPlan({}, DEFAULT_COACH_STATE, { tier: "Green", schedule: MONDAY_SCHEDULE });

  assert.equal(workout.environment, "World Gym Taichung");
  assert.equal(workout.requires_inventory, false);
  assert.match(workout.floor_plan, /Floor 3 prehab\/primer -> Floor 2 anchors -> Floor 3 trunk/);
  assert.equal(workout.blocks[0].id, "PREHAB");
  assert.ok(workout.blocks.some(block => block.floor === "Floor 3"));
  assert.ok(workout.blocks.some(block => block.floor === "Floor 2"));
  assert.ok(workout.blocks.flatMap(block => block.exercises).some(ex => ex.motra_name === "Pull-Up"));
  assert.ok(workout.guardrails.includes("No cross-floor supersets."));
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
  assert.equal(decision.source_context.nutrition_primary, "Bevel");
  assert.equal(decision.source_context.workout_primary, "Motra");
  assert.equal(decision.workout_plan.environment, "World Gym Taichung");
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
