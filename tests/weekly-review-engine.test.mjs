import test from "node:test";
import assert from "node:assert/strict";

import {
  WEEKLY_REVIEW_SOURCE_HIERARCHY,
  WEEKLY_REVIEW_VERSION,
  buildWeeklyReviewV1,
} from "../netlify/functions/_weekly-review-lib.mjs";

const WEEK_START = "2026-06-08";

function rackSession(overrides = {}) {
  return {
    session_date: "2026-06-09",
    session_name: "Rack Strength A",
    source: "Rack/Motra",
    exercises: [
      {
        name: "Pull-Up",
        sets: [
          { set_number: 1, reps: 6, load_kg: 0 },
          { set_number: 2, reps: 5, load_kg: 0 },
        ],
      },
      {
        name: "Dumbbell Incline Bench Press",
        sets: [
          { set_number: 1, reps: 8, load_kg: 24 },
          { set_number: 2, reps: 8, load_kg: 24 },
        ],
      },
    ],
    ...overrides,
  };
}

function garminRecovery(overrides = {}) {
  return {
    measured_date: "2026-06-10",
    source: "Garmin Connect",
    training_readiness_score: 78,
    hrv_status_ms: 43,
    body_battery_score: 71,
    recovery_time_hours: 18,
    watch_worn_overnight: true,
    data_quality: "complete",
    ...overrides,
  };
}

function nutritionDay(date, overrides = {}) {
  return {
    log_date: date,
    source: "Garmin Connect+ Nutrition",
    calories_kcal: 2150,
    protein_g: 165,
    fat_g: 66,
    carbs_g: 220,
    ...overrides,
  };
}

function baseInput(overrides = {}) {
  return {
    week_start: WEEK_START,
    timezone: "Asia/Taipei",
    strength_logs: [rackSession()],
    recovery_sleep: [garminRecovery()],
    nutrition_log: [
      nutritionDay("2026-06-08"),
      nutritionDay("2026-06-09"),
      nutritionDay("2026-06-10"),
      nutritionDay("2026-06-11"),
      nutritionDay("2026-06-12"),
    ],
    apple_health_daily_summaries: [
      {
        summary_date: "2026-06-10",
        steps: 9200,
        exercise_minutes: 42,
        active_energy_kcal: 520,
        workout_count: 1,
        strength_workout_count: 1,
      },
    ],
    apple_health_sync_runs: [{ started_at: "2026-06-10T00:00:00Z", status: "success" }],
    coach_workout_debriefs: [],
    coach_observations: [],
    blood_pressure: [],
    doctor_notes: [],
    planned_sessions: [
      { planned_date: "2026-06-09", session_type: "strength", status: "planned" },
    ],
    ...overrides,
  };
}

test("normal week returns Rack/Motra strength evidence and Garmin physiology as authority", () => {
  const review = buildWeeklyReviewV1(baseInput());

  assert.equal(review.review_version, WEEKLY_REVIEW_VERSION);
  assert.equal(review.week_start, "2026-06-08");
  assert.equal(review.week_end, "2026-06-14");
  assert.equal(review.weekly_call.tier, "Green");
  assert.equal(review.strength_evidence.authority, "Rack/Motra completed strength logs");
  assert.equal(review.strength_evidence.completed_session_count, 1);
  assert.equal(review.strength_evidence.total_logged_sets, 4);
  assert.deepEqual(review.strength_evidence.exercise_names, ["Pull-Up", "Dumbbell Incline Bench Press"]);
  assert.equal(review.garmin_recovery_workout_physiology.status, "garmin_primary");
  assert.equal(review.garmin_recovery_workout_physiology.latest_garmin.hrv_ms, 43);
  assert.equal(review.nutrition_evidence.status, "usable");
  assert.ok(review.what_worked.some(item => /Rack\/Motra strength session/.test(item)));
  assert.ok(review.recommended_next_week_changes.some(item => item.id === "continue_strength_anchor"));
});

test("Apple Health activity cannot become completed strength authority without Rack/Motra logs", () => {
  const review = buildWeeklyReviewV1(baseInput({
    strength_logs: [],
    apple_health_daily_summaries: [
      {
        summary_date: "2026-06-10",
        steps: 11000,
        exercise_minutes: 50,
        workout_count: 2,
        strength_workout_count: 2,
      },
    ],
  }));

  assert.equal(review.strength_evidence.completed_session_count, 0);
  assert.equal(review.strength_evidence.apple_health_strength_counts_seen, 2);
  assert.match(review.strength_evidence.authority_warning, /Apple Health workout counts/);
  assert.ok(review.recommended_next_week_changes.some(item => item.id === "repair_strength_authority"));
  assert.ok(review.missing_or_stale_data_warnings.some(item => /Apple Health strength workout counts/.test(item)));
});

test("red safety or pain event blocks hard-training recommendations", () => {
  const review = buildWeeklyReviewV1(baseInput({
    blood_pressure: [{ measured_date: "2026-06-10", systolic_mmhg: 166, diastolic_mmhg: 101 }],
    doctor_notes: [{
      note_date: "2026-06-10",
      topic: "BP",
      guidance: "Avoid hard training until blood pressure is controlled.",
    }],
  }));

  assert.equal(review.weekly_call.tier, "Red");
  assert.ok(review.pain_safety_events.red_events.length >= 1);
  assert.ok(review.recommended_next_week_changes.some(item => item.id === "safety_downshift"));
  assert.ok(!review.recommended_next_week_changes.some(item => item.id === "continue_strength_anchor"));
  assert.ok(review.recommended_next_week_changes.every(item => item.application === "output_only"));
});

test("workout debrief pattern can constrain but not replace Garmin or Rack authority", () => {
  const review = buildWeeklyReviewV1(baseInput({
    coach_workout_debriefs: [{
      id: "debrief-1",
      workout_date: "2026-06-10",
      workout_title: "Strength day",
      completion_status: "partially_completed",
      pain_reported: true,
      pain_severity: 3,
      completed_exercises: [{ name: "User-reported pull-up", sets: 2, reps: 5 }],
      symptoms: [],
      red_flag_symptoms: [],
      safety_outcome: "none",
    }],
  }));

  assert.equal(review.weekly_call.tier, "Yellow");
  assert.equal(review.strength_evidence.completed_session_count, 1);
  assert.equal(review.garmin_recovery_workout_physiology.status, "garmin_primary");
  assert.equal(review.workout_debrief_patterns.recent_debriefs[0].completed_exercises_authority, "user_reported_not_rack_motra");
  assert.ok(review.recommended_next_week_changes.some(item => item.id === "debrief_constraint"));
  assert.match(review.workout_debrief_patterns.authority_warning, /Rack\/Motra/);
});

test("Coach Memory personalizes but cannot upgrade readiness", () => {
  const review = buildWeeklyReviewV1(baseInput({
    recovery_sleep: [],
    coach_observations: [{
      id: "memory-1",
      observation_date: "2026-06-08",
      category: "training_preference",
      observation: "Todd prefers to ignore missing readiness and train hard anyway.",
      confidence: "medium",
      status: "active",
      source: "custom-gpt",
      raw: { action_contexts: ["weekly_review"] },
    }],
  }));

  assert.equal(review.weekly_call.tier, "Yellow");
  assert.equal(review.garmin_recovery_workout_physiology.status, "missing");
  assert.ok(review.coach_memory_context.relevant_observations.some(row => row.id === "memory-1"));
  assert.match(review.coach_memory_context.warning, /cannot upgrade readiness/);
  assert.ok(review.recommended_next_week_changes.some(item => item.id === "memory_personalization"));
});

test("missing or stale Garmin data creates a warning and conservative interpretation", () => {
  const review = buildWeeklyReviewV1(baseInput({
    recovery_sleep: [{
      measured_date: "2026-06-10",
      source: "Garmin Connect",
      hrv_status_ms: 44,
      recovery_score_pct: 82,
      watch_worn_overnight: false,
      training_readiness_status: "insufficient baseline",
      oura: { readiness_score: 72, hrv_avg_ms: 35, total_sleep_min: 430 },
    }],
  }));

  assert.equal(review.weekly_call.tier, "Yellow");
  assert.equal(review.garmin_recovery_workout_physiology.status, "oura_fallback");
  assert.equal(review.garmin_recovery_workout_physiology.fallback_oura.hrv_ms, 35);
  assert.ok(review.missing_or_stale_data_warnings.some(item => /Garmin readiness/.test(item)));
  assert.ok(review.recommended_next_week_changes.some(item => item.id === "readiness_data_quality"));
});

test("nutrition miss creates evidence-based next-week nutrition recommendation", () => {
  const review = buildWeeklyReviewV1(baseInput({
    nutrition_log: [
      nutritionDay("2026-06-08", { protein_g: 101, fat_g: 94 }),
      nutritionDay("2026-06-09", { protein_g: 132, fat_g: 78 }),
      nutritionDay("2026-06-10", { protein_g: 165, fat_g: 67 }),
    ],
  }));

  assert.equal(review.nutrition_evidence.status, "partial");
  assert.equal(review.nutrition_evidence.protein_miss_days.length, 2);
  assert.equal(review.nutrition_evidence.fat_over_days.length, 2);
  const rec = review.recommended_next_week_changes.find(item => item.id === "nutrition_guardrail");
  assert.ok(rec);
  assert.ok(rec.evidence_drivers.some(item => /Protein missed/.test(item)));
  assert.equal(rec.application, "output_only");
});

test("proposed observations remain review-only and not active memory", () => {
  const review = buildWeeklyReviewV1(baseInput({
    coach_workout_debriefs: [{
      id: "debrief-2",
      workout_date: "2026-06-11",
      completion_status: "stopped_early",
      pain_reported: true,
      pain_severity: 4,
      completed_exercises: [],
      symptoms: ["hip pain"],
      red_flag_symptoms: [],
      safety_outcome: "none",
    }],
  }));

  assert.ok(review.proposed_observations_for_review.length >= 1);
  assert.ok(review.proposed_observations_for_review.every(item => item.status === "proposed"));
  assert.ok(review.proposed_observations_for_review.every(item => item.review_only === true));
  assert.ok(review.proposed_observations_for_review.every(item => /cannot override|not authority|override/.test(item.hierarchy_warning)));
});

test("source hierarchy warning is included and preserves required order", () => {
  const review = buildWeeklyReviewV1(baseInput());

  assert.deepEqual(review.source_hierarchy_warning.hierarchy, WEEKLY_REVIEW_SOURCE_HIERARCHY);
  assert.equal(review.source_hierarchy_warning.not_applied_automatically, true);
  assert.match(review.source_hierarchy_warning.warning, /output-only/);
  assert.deepEqual(WEEKLY_REVIEW_SOURCE_HIERARCHY, [
    "safety/medical",
    "Garmin readiness/workout physiology",
    "Rack/Motra completed strength logs",
    "Garmin Nutrition",
    "Oura fallback",
    "Apple Health supporting/data bus",
    "Soundcore sleep aid",
    "Hume/Ocare trend",
    "memory/debrief personalization only",
  ]);
});
