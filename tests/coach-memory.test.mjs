import test from "node:test";
import assert from "node:assert/strict";

import handler from "../netlify/functions/coach-api.mjs";
import {
  DEFAULT_COACH_STATE,
  buildCoachDecision,
  getRelevantCoachMemoryForContext,
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

function coachGet(action) {
  return new Request(`https://coach.test/api/coach?action=${action}`, {
    method: "GET",
    headers: { "x-coach-secret": "test-secret" },
  });
}

function coachPost(action, body = {}) {
  return new Request(`https://coach.test/api/coach?action=${action}`, {
    method: "POST",
    headers: { "x-coach-secret": "test-secret", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test.afterEach(() => {
  restoreEnv();
});

test("recordCoachObservation creates a sanitized reviewable observation", async () => {
  const db = installMockSupabase();

  const res = await handler(coachPost("record-observation", {
    category: "training_preference",
    observation: "Todd prefers direct, compact workout instructions.",
    evidence: [{ source: "custom-gpt", summary: "Todd asked for less filler." }],
    confidence: "high",
    action: "Keep workout instructions direct.",
    source: "custom-gpt",
    raw: { api_token: "do-not-store", action_contexts: ["build_workout"] },
  }));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.observation.category, "training_preference");
  assert.equal(body.observation.confidence, "high");
  assert.equal(db.coach_observations.length, 1);
  assert.equal(db.coach_observations[0].raw.api_token, undefined);
  assert.deepEqual(db.coach_observations[0].raw.action_contexts, ["build_workout"]);
});

test("listCoachMemory lists active memory and excludes data sync by default", async () => {
  const profileId = "11111111-1111-4111-8111-111111111111";
  installMockSupabase(baseDb({
    coach_observations: [
      { id: "memory-1", profile_id: profileId, observation_date: "2026-06-10", category: "training_preference", observation: "Use direct instructions.", evidence: [], confidence: "medium", status: "active", source: "custom-gpt", raw: {}, created_at: "2026-06-10T00:00:00Z", updated_at: "2026-06-10T00:00:00Z" },
      { id: "memory-2", profile_id: profileId, observation_date: "2026-06-09", category: "data_sync", observation: "Apple Health sync succeeded.", evidence: [], confidence: "medium", status: "active", source: "apple-health-daily", raw: {}, created_at: "2026-06-09T00:00:00Z", updated_at: "2026-06-09T00:00:00Z" },
      { id: "memory-3", profile_id: profileId, observation_date: "2026-06-08", category: "exercise_preference", observation: "Old preference.", evidence: [], confidence: "low", status: "retired", source: "custom-gpt", raw: {}, created_at: "2026-06-08T00:00:00Z", updated_at: "2026-06-08T00:00:00Z" },
    ],
  }));

  const res = await handler(coachGet("list-memory"));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.count, 1);
  assert.equal(body.memories[0].id, "memory-1");
});

test("retired memory does not appear in active context", () => {
  const context = getRelevantCoachMemoryForContext({
    coach_observations: [
      { id: "memory-1", observation_date: "2026-06-10", category: "training_preference", observation: "Use direct instructions.", evidence: [], confidence: "medium", status: "active", source: "custom-gpt", raw: { action_contexts: ["build_workout"] } },
      { id: "memory-2", observation_date: "2026-06-10", category: "training_preference", observation: "Retired hard-training preference.", evidence: [], confidence: "medium", status: "retired", source: "custom-gpt", raw: { action_contexts: ["build_workout"] } },
    ],
  }, { intent: "build_workout", text: "Build workout" });

  assert.deepEqual(context.relevant_observations.map(row => row.id), ["memory-1"]);
});

test("correctCoachMemory updates the old memory with audit metadata", async () => {
  const profileId = "11111111-1111-4111-8111-111111111111";
  const db = installMockSupabase(baseDb({
    coach_observations: [{
      id: "22222222-2222-4222-8222-222222222222",
      profile_id: profileId,
      observation_date: "2026-06-10",
      category: "equipment_constraint",
      observation: "Floor 3 rows are always best.",
      evidence: [],
      confidence: "low",
      status: "active",
      source: "custom-gpt",
      raw: {},
      created_at: "2026-06-10T00:00:00Z",
      updated_at: "2026-06-10T00:00:00Z",
    }],
  }));

  const res = await handler(coachPost("correct-memory", {
    observation_id: "22222222-2222-4222-8222-222222222222",
    corrected_observation: "Use Floor 2 for heavy rows; Floor 3 is okay only for light technique work.",
    correction_note: "Todd corrected the floor rule.",
    confidence: "high",
  }));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.observation.confidence, "high");
  assert.match(body.observation.observation, /Floor 2/);
  assert.equal(db.coach_observations[0].raw.previous_observation, "Floor 3 rows are always best.");
  assert.match(db.coach_observations[0].raw.correction_note, /Todd corrected/);
});

test("retireCoachMemory removes a memory from future active lists", async () => {
  const profileId = "11111111-1111-4111-8111-111111111111";
  const db = installMockSupabase(baseDb({
    coach_observations: [{
      id: "33333333-3333-4333-8333-333333333333",
      profile_id: profileId,
      observation_date: "2026-06-10",
      category: "training_preference",
      observation: "Use long explanations.",
      evidence: [],
      confidence: "medium",
      status: "active",
      source: "custom-gpt",
      raw: {},
      created_at: "2026-06-10T00:00:00Z",
      updated_at: "2026-06-10T00:00:00Z",
    }],
  }));

  const retireRes = await handler(coachPost("retire-memory", {
    observation_id: "33333333-3333-4333-8333-333333333333",
    reason: "Todd prefers compact calls.",
  }));
  const retireBody = await retireRes.json();
  const listRes = await handler(coachGet("list-memory"));
  const listBody = await listRes.json();

  assert.equal(retireRes.status, 200);
  assert.equal(retireBody.observation.status, "retired");
  assert.equal(db.coach_observations[0].raw.memory_lifecycle_status, "retired");
  assert.equal(listRes.status, 200);
  assert.equal(listBody.count, 0);
});

test("relevant memory appears in workout and coach-today context", async () => {
  const profileId = "11111111-1111-4111-8111-111111111111";
  installMockSupabase(baseDb({
    coach_observations: [{
      id: "memory-1",
      profile_id: profileId,
      observation_date: "2026-06-10",
      category: "exercise_preference",
      observation: "Use Rack entry names in workout instructions.",
      evidence: [{ source: "Todd correction" }],
      confidence: "high",
      status: "active",
      source: "custom-gpt",
      raw: { action_contexts: ["build_workout", "brief"] },
      created_at: "2026-06-10T00:00:00Z",
      updated_at: "2026-06-10T00:00:00Z",
    }],
  }));

  const workoutRes = await handler(coachPost("workout", {
    text: "Build today's strength workout.",
    now: MONDAY_TAIPEI,
  }));
  const workoutBody = await workoutRes.json();
  const todayRes = await handler(coachGet("coach-today"));
  const todayBody = await todayRes.json();

  assert.equal(workoutRes.status, 200);
  assert.equal(workoutBody.reply, workoutBody.decision.reply);
  assert.ok(Array.isArray(workoutBody.exercise_coaching_readout));
  assert.equal(workoutBody.coach_memory_context.relevant_observations[0].id, "memory-1");
  assert.equal(workoutBody.decision.coach_memory_context.relevant_observations[0].id, "memory-1");
  assert.equal(todayRes.status, 200);
  assert.equal(todayBody.coach_memory_context.relevant_observations[0].id, "memory-1");
  assert.equal(todayBody.source_context.coach_memory.context.relevant_observations[0].id, "memory-1");
});

test("memory cannot turn Red safety into hard training", () => {
  const decision = buildCoachDecision({
    text: "Build today's hard strength workout even though BP is high and I have a migraine.",
    intent: "build_workout",
    dashboard: {
      profile: { timezone: "Asia/Taipei" },
      blood_pressure: [{ date: "2026-05-11", systolic_mmhg: 165, diastolic_mmhg: 101 }],
      coach_observations: [{
        id: "memory-1",
        observation_date: "2026-06-10",
        category: "training_preference",
        observation: "Todd prefers hard workouts when he asks directly.",
        evidence: [],
        confidence: "high",
        status: "active",
        source: "custom-gpt",
        raw: { action_contexts: ["build_workout"] },
      }],
    },
    payload: { now: MONDAY_TAIPEI },
  });

  assert.equal(decision.readiness.tier, "Red");
  assert.equal(decision.workout_plan.session_type, "Recovery / Medical caution");
  assert.match(decision.workout_plan.floor_plan, /No strength, Zone 2, or conditioning/);
  assert.ok(decision.coach_memory_context.relevant_observations.some(row => row.id === "memory-1"));
  assert.ok(decision.coach_memory_context.memory_warnings.some(item => /current BP/.test(item)));
});

test("memory does not override current pain, asthma, migraine, or BP flags", () => {
  const decision = buildCoachDecision({
    text: "Hip pain 5/10, asthma flare, migraine, but build the normal workout.",
    intent: "build_workout",
    dashboard: {
      profile: { timezone: "Asia/Taipei" },
      coach_observations: [{
        id: "memory-1",
        observation_date: "2026-06-10",
        category: "workout_response_pattern",
        observation: "Todd sometimes feels better after training.",
        evidence: [],
        confidence: "high",
        status: "active",
        source: "custom-gpt",
        raw: { action_contexts: ["build_workout"] },
      }],
    },
    payload: { now: MONDAY_TAIPEI },
  });

  assert.equal(decision.readiness.tier, "Red");
  assert.ok(decision.readiness.risk_flags.some(flag => flag.code === "migraine"));
  assert.ok(decision.readiness.risk_flags.some(flag => flag.code === "asthma"));
  assert.ok(decision.readiness.risk_flags.some(flag => flag.code === "pain"));
  assert.equal(decision.workout_plan.session_type, "Recovery / Medical caution");
});
