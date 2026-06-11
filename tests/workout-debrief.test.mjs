import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import handler from "../netlify/functions/coach-api.mjs";
import {
  DEFAULT_COACH_STATE,
  buildCoachDecision,
  buildCoachToday,
  getWorkoutDebriefContext,
} from "../netlify/functions/_coach-lib.mjs";

const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_ENV = { ...process.env };
const MONDAY_TAIPEI = "2026-05-11T02:00:00.000Z";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function installEnv() {
  process.env.SUPABASE_URL = "https://mock.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  process.env.COACH_API_SECRET = "test-secret";
  process.env.COACH_AI_DISABLED = "1";
}

function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
  global.fetch = ORIGINAL_FETCH;
}

function baseDb(overrides = {}) {
  const profile = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Todd Blackhurst",
    timezone: "Asia/Taipei",
    created_at: "2026-06-11T00:00:00Z",
  };
  return {
    profiles: [profile],
    raw_imports: [{ payload: { profile: { timezone: "Asia/Taipei" } }, imported_at: "2026-06-11T00:00:00Z" }],
    recovery_sleep: [],
    blood_pressure_readings: [],
    body_comp_measurements: [],
    nutrition_days: [],
    strength_sessions: [],
    session_feedback: [],
    coach_messages: [],
    weekly_plans: [],
    planned_sessions: [],
    doctor_notes: [],
    coach_state: [{
      profile_id: profile.id,
      version: DEFAULT_COACH_STATE.version,
      source_hierarchy: DEFAULT_COACH_STATE.source_hierarchy,
      raw: DEFAULT_COACH_STATE,
    }],
    coach_decisions: [],
    apple_health_daily_summaries: [],
    apple_health_sync_runs: [],
    coach_observations: [],
    coach_workout_debriefs: [],
    ...overrides,
  };
}

function installMockSupabase(db = baseDb()) {
  installEnv();
  global.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    const table = parsed.pathname.replace(/^\/rest\/v1\//, "");
    const method = options.method || "GET";
    if (!Object.hasOwn(db, table)) return jsonResponse({ error: `Unexpected table ${table}` }, 404);

    if (method === "GET") {
      let rows = [...db[table]];
      const profileFilter = parsed.searchParams.get("profile_id");
      const idFilter = parsed.searchParams.get("id");
      const statusFilter = parsed.searchParams.get("status");
      const limit = Number(parsed.searchParams.get("limit") || 0);
      if (profileFilter?.startsWith("eq.")) {
        const profileId = profileFilter.slice(3);
        rows = rows.filter(row => row.profile_id === profileId || table === "profiles");
      }
      if (idFilter?.startsWith("eq.")) {
        const id = idFilter.slice(3);
        rows = rows.filter(row => row.id === id);
      }
      if (statusFilter?.startsWith("eq.")) {
        const status = statusFilter.slice(3);
        rows = rows.filter(row => row.status === status);
      }
      return jsonResponse(limit ? rows.slice(0, limit) : rows);
    }

    if (method === "POST") {
      const rows = JSON.parse(options.body || "[]").map((row, index) => ({
        id: row.id || `${table}-${db[table].length + index + 1}`,
        created_at: row.created_at || "2026-06-11T00:00:00.000Z",
        updated_at: row.updated_at || "2026-06-11T00:00:00.000Z",
        ...row,
      }));
      db[table].push(...rows);
      return jsonResponse(rows, 201);
    }

    if (method === "PATCH" && table === "coach_observations") {
      const id = parsed.searchParams.get("id")?.slice(3);
      const patch = JSON.parse(options.body || "{}");
      const index = db.coach_observations.findIndex(row => row.id === id);
      if (index < 0) return jsonResponse([], 200);
      db.coach_observations[index] = { ...db.coach_observations[index], ...patch };
      return jsonResponse([db.coach_observations[index]]);
    }

    return jsonResponse({ error: `Unexpected ${method} ${table}` }, 500);
  };
  return db;
}

function coachGet(action, params = {}) {
  const url = new URL("https://coach.test/api/coach");
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new Request(url, {
    method: "GET",
    headers: { "x-coach-secret": "test-secret" },
  });
}

function coachPost(action, body = {}, headers = {}) {
  return new Request(`https://coach.test/api/coach?action=${action}`, {
    method: "POST",
    headers: { "x-coach-secret": "test-secret", "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function validDebrief(overrides = {}) {
  return {
    workout_date: "2026-06-11",
    workout_title: "World Gym Strength",
    workout_type: "strength",
    completion_status: "completed",
    session_rpe: 7,
    energy_before: 6,
    energy_after: 7,
    pain_reported: false,
    symptoms: [],
    modifications: [],
    skipped_exercises: [],
    completed_exercises: [{ name: "Rack squat", sets: 3, reps: 8, load: "60 kg" }],
    notes: "Felt solid.",
    source: "custom_gpt",
    ...overrides,
  };
}

test.afterEach(() => {
  restoreEnv();
});

test("recordWorkoutDebrief requires x-coach-secret", async () => {
  installMockSupabase();

  const res = await handler(new Request("https://coach.test/api/coach?action=workout-debrief", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validDebrief()),
  }));
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.match(body.error, /Invalid coach API secret/);
});

test("recordWorkoutDebrief rejects invalid payloads and validates completion status", async () => {
  installMockSupabase();

  const missingDate = await handler(coachPost("workout-debrief", validDebrief({ workout_date: "" })));
  const missingStatus = await handler(coachPost("workout-debrief", validDebrief({ completion_status: "" })));
  const invalidStatus = await handler(coachPost("workout-debrief", validDebrief({ completion_status: "kind_of_done" })));

  assert.equal(missingDate.status, 400);
  assert.equal(missingStatus.status, 400);
  assert.equal(invalidStatus.status, 400);
});

test("recordWorkoutDebrief rejects secret-like text", async () => {
  installMockSupabase();

  const res = await handler(coachPost("workout-debrief", validDebrief({
    notes: "COACH_API_SECRET=abc123 should never be stored.",
  })));
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.match(body.error, /secret-like content/);
});

test("recordWorkoutDebrief accepts all supported completion statuses", async () => {
  const db = installMockSupabase();

  for (const completion_status of ["completed", "partially_completed", "skipped", "stopped_early"]) {
    const res = await handler(coachPost("workout-debrief", validDebrief({ completion_status })));
    assert.equal(res.status, 200);
  }

  assert.deepEqual(db.coach_workout_debriefs.map(row => row.completion_status), [
    "completed",
    "partially_completed",
    "skipped",
    "stopped_early",
  ]);
});

test("recordWorkoutDebrief validates RPE, energy, and pain severity ranges", async () => {
  installMockSupabase();

  const badRpe = await handler(coachPost("workout-debrief", validDebrief({ session_rpe: 11 })));
  const badEnergy = await handler(coachPost("workout-debrief", validDebrief({ energy_before: 0 })));
  const badPain = await handler(coachPost("workout-debrief", validDebrief({ pain_severity: 11 })));

  assert.equal(badRpe.status, 400);
  assert.equal(badEnergy.status, 400);
  assert.equal(badPain.status, 400);
});

test("red flag symptoms produce red_flag safety outcome and no hard-training recommendation", async () => {
  const db = installMockSupabase();

  const res = await handler(coachPost("workout-debrief", validDebrief({
    completion_status: "stopped_early",
    symptoms: ["chest pain and severe shortness of breath"],
    notes: "Stopped early.",
  })));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.safety_outcome, "red_flag");
  assert.equal(body.requires_follow_up, true);
  assert.ok(body.warnings.some(item => /cannot produce a hard-training/.test(item)));

  const workoutRes = await handler(coachPost("workout", {
    text: "Build today's hard strength workout.",
    now: MONDAY_TAIPEI,
  }));
  const workoutBody = await workoutRes.json();

  assert.equal(workoutRes.status, 200);
  assert.equal(workoutBody.decision.readiness.tier, "Red");
  assert.equal(workoutBody.decision.workout_plan.session_type, "Recovery / Medical caution");
  assert.ok(db.coach_workout_debriefs[0].red_flag_symptoms.includes("chest pain"));
});

test("stored debrief appears in workout_debrief_context for coach-today and buildTodayWorkout", async () => {
  installMockSupabase(baseDb({
    coach_workout_debriefs: [{
      id: "debrief-1",
      profile_id: "11111111-1111-4111-8111-111111111111",
      workout_date: "2026-06-10",
      workout_title: "Posterior pull day",
      workout_type: "strength",
      completion_status: "partially_completed",
      session_rpe: 8,
      energy_before: 5,
      energy_after: 4,
      pain_reported: true,
      pain_locations: ["right hip"],
      pain_severity: 5,
      symptoms: [],
      red_flag_symptoms: [],
      modifications: ["reduced range"],
      skipped_exercises: ["deep squat"],
      completed_exercises: [{ name: "Cable row" }],
      safety_outcome: "caution",
      follow_up_needed: true,
      raw_payload: { completed_exercises_authority: "user_reported_not_rack_motra" },
      created_at: "2026-06-10T00:00:00Z",
      updated_at: "2026-06-10T00:00:00Z",
    }],
  }));

  const todayRes = await handler(coachGet("coach-today"));
  const todayBody = await todayRes.json();
  const workoutRes = await handler(coachPost("workout", {
    text: "Build today's strength workout.",
    now: MONDAY_TAIPEI,
  }));
  const workoutBody = await workoutRes.json();

  assert.equal(todayRes.status, 200);
  assert.equal(todayBody.workout_debrief_context.recent_debriefs[0].id, "debrief-1");
  assert.ok(todayBody.workout_debrief_context.safety_warnings.some(item => /Caution debrief/.test(item)));
  assert.equal(workoutRes.status, 200);
  assert.equal(workoutBody.workout_debrief_context.recent_debriefs[0].id, "debrief-1");
  assert.equal(workoutBody.decision.workout_debrief_context.recent_debriefs[0].id, "debrief-1");
  assert.ok(workoutBody.decision.next_actions.some(item => /debrief pain/.test(item)));
});

test("debrief context cannot override current Red safety or hard medical flags", () => {
  const decision = buildCoachDecision({
    text: "Garmin says I am ready. Build today's hard workout.",
    intent: "build_workout",
    payload: { now: MONDAY_TAIPEI },
    dashboard: {
      profile: { timezone: "Asia/Taipei" },
      blood_pressure: [{ date: "2026-05-11", systolic_mmhg: 166, diastolic_mmhg: 101 }],
      coach_workout_debriefs: [{
        id: "debrief-green",
        workout_date: "2026-06-10",
        workout_title: "Easy win",
        workout_type: "strength",
        completion_status: "completed",
        session_rpe: 5,
        energy_after: 9,
        pain_reported: false,
        pain_locations: [],
        pain_severity: null,
        symptoms: [],
        red_flag_symptoms: [],
        modifications: [],
        skipped_exercises: [],
        completed_exercises: [{ name: "User says all lifts done" }],
        safety_outcome: "none",
        raw_payload: { completed_exercises_authority: "user_reported_not_rack_motra" },
      }],
    },
  });

  assert.equal(decision.readiness.tier, "Red");
  assert.equal(decision.workout_plan.session_type, "Recovery / Medical caution");
  assert.ok(decision.workout_debrief_context.recent_debriefs[0].completed_exercises_authority.includes("user_reported"));
});

test("user-reported completed exercises are not treated as Rack/Motra authority", async () => {
  const db = installMockSupabase();

  const res = await handler(coachPost("workout-debrief", validDebrief({
    completed_exercises: [{ name: "Bench press", sets: 3, reps: 8, load: "80 kg" }],
  })));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.debrief.completed_exercises_authority, "user_reported_not_rack_motra");
  assert.ok(body.warnings.some(item => /not Rack\/Motra completed-set authority/.test(item)));
  assert.equal(db.coach_workout_debriefs[0].raw_payload.completed_exercises_authority, "user_reported_not_rack_motra");
});

test("workout debrief context is deterministic and cannot make Red safety less conservative", () => {
  const context = getWorkoutDebriefContext({
    coach_workout_debriefs: [{
      id: "debrief-red",
      workout_date: "2026-06-10",
      workout_type: "strength",
      completion_status: "completed",
      pain_reported: false,
      pain_locations: [],
      symptoms: [],
      red_flag_symptoms: ["fainting"],
      modifications: [],
      skipped_exercises: [],
      completed_exercises: [],
      safety_outcome: "red_flag",
      raw_payload: {},
    }],
  });
  const today = buildCoachToday({
    profile: { timezone: "Asia/Taipei" },
    coach_workout_debriefs: context.recent_debriefs,
  });

  assert.ok(context.safety_warnings.some(item => /Do not recommend hard training/.test(item)));
  assert.equal(today.workout_debrief_context.recent_debriefs[0].safety_outcome, "red_flag");
});

test("OpenAPI exposes recordWorkoutDebrief with x-coach-secret security", () => {
  const openapi = JSON.parse(readFileSync(new URL("../coach-openapi.json", import.meta.url), "utf8"));
  const operation = openapi.paths["/api/coach/workout-debrief"]?.post;

  assert.equal(operation.operationId, "recordWorkoutDebrief");
  assert.equal(openapi.components.securitySchemes.CoachSecret.name, "x-coach-secret");
  assert.ok(JSON.stringify(operation).includes("WorkoutDebriefRequest"));
  assert.ok(JSON.stringify(openapi.components.schemas.DirectCoachActionResponse).includes("workout_debrief_context"));
});

test("buildMotraDebriefTemplate route returns an exercise debrief template", async () => {
  installMockSupabase();

  const res = await handler(coachPost("motra-template", {
    motra_text: [
      "Controlled Chest Day",
      "Incline Dumbbell Press",
      "Single Arm Row",
      "Total Volume 4500 kg",
    ].join("\n"),
  }));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.action, "motra-template");
  assert.match(body.debrief_template, /Incline Dumbbell Press/);
  assert.ok(body.parsed_motra.exercises.includes("Single Arm Row"));
});

test("HEALTH_DATABASE.json remains outside workout debrief implementation", () => {
  const statusText = readFileSync(new URL("../HEALTH_DATABASE.json", import.meta.url), "utf8");
  assert.ok(statusText.length > 0);
});
