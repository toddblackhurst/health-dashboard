import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_COACH_STATE,
  buildCoachDecision,
  buildMotraDebriefTemplate,
  buildNutritionCall,
  buildWorkoutPlan,
  determineWorkoutSequence,
  evaluateReadiness,
  parseMotraText,
} from "../netlify/functions/_coach-lib.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("BP red gate downshifts training", () => {
  const readiness = evaluateReadiness({
    blood_pressure: [
      { date: "2026-05-03", systolic_mmhg: 162, diastolic_mmhg: 101 },
    ],
  });

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
  });

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
  const workout = buildWorkoutPlan({}, DEFAULT_COACH_STATE, { tier: "Green" });

  assert.equal(workout.environment, "World Gym Taichung");
  assert.equal(workout.requires_inventory, false);
  assert.match(workout.floor_plan, /Floor 3 primer -> Floor 2 anchors -> Floor 3 trunk/);
  assert.ok(workout.blocks.some(block => block.floor === "Floor 3"));
  assert.ok(workout.blocks.some(block => block.floor === "Floor 2"));
  assert.ok(workout.blocks.flatMap(block => block.exercises).some(ex => ex.motra_name === "Pull-Up"));
  assert.ok(workout.guardrails.some(rule => /Floor 3 Matrix trainer for pull-ups/i.test(rule)));
  assert.ok(workout.guardrails.some(rule => /Dumbbell \+ bench movements/i.test(rule)));
  assert.match(workout.athletic_functional_standard, /multi-plane movement/);
  assert.ok(workout.guardrails.includes("No cross-floor supersets."));
});

test("Kuala Lumpur travel mode asks for inventory and disables World Gym routing", () => {
  const state = clone(DEFAULT_COACH_STATE);
  state.gym_profile.travel_mode = true;

  const workout = buildWorkoutPlan({}, state, { tier: "Green" });

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
  });

  assert.equal(decision.intent, "build_workout");
  assert.equal(decision.source_context.default_gym, "World Gym Taichung");
  assert.equal(decision.source_context.nutrition_primary, "Bevel");
  assert.equal(decision.source_context.workout_primary, "Motra");
  assert.equal(decision.workout_plan.environment, "World Gym Taichung");
  assert.equal(decision.workout_plan.sequence_context.programming_bias, "60% strength / 40% athletic-functional");
});

test("Motra text parses into exercise-level debrief template", () => {
  const motra = parseMotraText(`
My workout:

20260410 Friday
Apr 10, 2026 at 7:57 AM

Duration: 1h 16m
Volume: 6.8K kg
Calories: 484 cal
Exercises: 2

Pull-Up
1: 5 reps x BW
2: 5 reps x BW

Machine Hip Thrust (Glute Bridge)
1: 12 reps x 47.7 kg

Tracked with Motra.
https://motra.com/share/workout/abc
`);

  assert.equal(motra.session_date, "2026-04-10");
  assert.equal(motra.duration_min, 76);
  assert.equal(motra.total_volume_kg, 6800);
  assert.equal(motra.exercises.length, 2);
  assert.equal(motra.exercises[0].name, "Pull-Up");
  assert.match(buildMotraDebriefTemplate(motra), /Machine Hip Thrust/);
});

test("workout sequence uses recent Motra history", () => {
  const sequence = determineWorkoutSequence({
    strength_logs: [
      { date: "2026-05-01", session_name: "Friday athletic lift" },
      { date: "2026-05-03", session_name: "Sunday recovery lift" },
    ],
  });

  assert.equal(sequence.programming_bias, "60% strength / 40% athletic-functional");
  assert.ok(sequence.recent_strength_sessions.length >= 2);
  assert.match(sequence.sequencing_call, /Last strength session/);
});
