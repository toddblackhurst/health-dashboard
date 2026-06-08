import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_COACH_STATE,
  buildAppleHealthSupport,
  buildCoachDecision,
  buildCoachToday,
  buildNutritionCall,
  buildSyncStatus,
  buildWorkoutPlan,
  compactCoachHistory,
  compactDashboard,
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

  assert.equal(nutrition.source, "Garmin Connect+ Nutrition");
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
  assert.equal(decision.source_context.nutrition_primary, "Garmin Connect+ Nutrition");
  assert.equal(decision.source_context.workout_primary, "Garmin Connect Strength for set-level execution and physiology");
  assert.equal(decision.workout_plan.environment, "World Gym Taichung");
  assert.equal(decision.daily_summary.daily_call.color, "Green");
  assert.match(decision.daily_summary.todays_plan.primary_action, /World Gym plan/);
  assert.equal(decision.daily_summary.rack_motra_handoff.generated, true);
  assert.match(decision.daily_summary.rack_motra_handoff.execution_policy, /Garmin Connect Strength is primary/);
  assert.ok(decision.daily_summary.rack_motra_handoff.copy_friendly_order.some(block =>
    block.exercises.some(ex => ex.name === "Pull-Up" && ex.rack_motra_name === "Pull-Up")));
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
  assert.equal(readiness.source_order.at(-1), "Apple Health summary cross-checks only");
});

test("Apple Health does not override Oura readiness or double-count workout history", () => {
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
  assert.match(decision.daily_summary.confidence_data_quality.source_policy, /does not override readiness/);
  assert.ok(decision.daily_summary.why.some(item => /Apple Health supporting context/.test(item)));
  assert.equal(decision.source_context.readiness_primary, "Oura");
  assert.equal(decision.source_context.workout_primary, "Garmin Connect Strength for set-level execution and physiology");
  assert.equal(decision.source_context.supporting_evidence.apple_health.role, "supporting cross-check");
});
