import test from "node:test";
import assert from "node:assert/strict";

import handler from "../netlify/functions/coach-api.mjs";
import { DEFAULT_COACH_STATE } from "../netlify/functions/_coach-lib.mjs";

const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_ENV = { ...process.env };

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

function installMockDashboardSupabase({ appleHealthRows = [], appleHealthSyncRuns = [] } = {}) {
  installEnv();
  const profile = {
    id: "profile-1",
    name: "Todd Blackhurst",
    timezone: "Asia/Taipei",
    created_at: "2026-06-08T00:00:00Z",
  };
  const db = {
    profiles: [profile],
    raw_imports: [{ payload: { profile: { timezone: "Asia/Taipei" } }, imported_at: "2026-06-08T00:00:00Z" }],
    recovery_sleep: [{
      profile_id: profile.id,
      measured_date: "2026-06-08",
      hrv_ms: 39,
      oura_readiness_score: 91,
      recovery_score_pct: 82,
      raw: {},
    }],
    blood_pressure_readings: [],
    body_comp_measurements: [],
    nutrition_days: [],
    strength_sessions: [],
    session_feedback: [],
    coach_messages: [],
    weekly_plans: [],
    planned_sessions: [],
    coach_state: [{
      profile_id: profile.id,
      version: DEFAULT_COACH_STATE.version,
      source_hierarchy: DEFAULT_COACH_STATE.source_hierarchy,
      raw: DEFAULT_COACH_STATE,
    }],
    coach_decisions: [],
    apple_health_daily_summaries: appleHealthRows,
    apple_health_sync_runs: appleHealthSyncRuns,
  };

  global.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    const table = parsed.pathname.replace(/^\/rest\/v1\//, "");
    const method = options.method || "GET";
    if (!Object.hasOwn(db, table)) return jsonResponse({ error: `Unexpected table ${table}` }, 404);
    if (method === "GET") return jsonResponse(db[table]);
    return jsonResponse({ error: `Unexpected ${method} ${table}` }, 500);
  };
}

function coachGet(action) {
  return new Request(`https://coach.test/api/coach?action=${action}`, {
    method: "GET",
    headers: { "x-coach-secret": "test-secret" },
  });
}

test.afterEach(() => {
  restoreEnv();
});

test("dashboard, sync-status, and coach-today expose Apple Health supporting evidence from Supabase", async () => {
  installMockDashboardSupabase({
    appleHealthRows: [{
      profile_id: "profile-1",
      summary_date: "2026-06-08",
      source_app: "Apple Health",
      source_device: "Todd iPhone",
      timezone: "Asia/Taipei",
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
      metric_quality: { hrv: "direct_sample" },
      updated_at: "2026-06-08T00:01:00Z",
    }],
    appleHealthSyncRuns: [{
      profile_id: "profile-1",
      status: "success",
      timezone: "Asia/Taipei",
      days_requested: 7,
      days_written: 7,
      errors: [],
      started_at: "2026-06-08T00:00:00Z",
      completed_at: "2026-06-08T00:01:00Z",
    }],
  });

  const dashboardRes = await handler(coachGet("dashboard"));
  const dashboardBody = await dashboardRes.json();
  const syncRes = await handler(coachGet("sync-status"));
  const syncBody = await syncRes.json();
  const coachTodayRes = await handler(coachGet("coach-today"));
  const coachTodayBody = await coachTodayRes.json();

  assert.equal(dashboardRes.status, 200);
  assert.equal(dashboardBody.dashboard.current.apple_health_daily_summary.steps, 8421);
  assert.equal(dashboardBody.dashboard.current.apple_health_daily_summary.role, "supporting cross-check");
  assert.equal(syncRes.status, 200);
  assert.equal(syncBody.apple_health.latest_summary_date, "2026-06-08");
  assert.equal(syncBody.apple_health.latest_sync.days_written, 7);
  assert.equal(syncBody.apple_health.role, "supporting cross-check");
  assert.equal(coachTodayRes.status, 200);
  assert.equal(coachTodayBody.supporting_evidence.apple_health.source, "Apple Health / HealthKit daily summary");
  assert.match(coachTodayBody.source_context.apple_health_workout_counts, /not completed strength-log authority/);
});

test("sync-status and coach-today tolerate missing Apple Health rows", async () => {
  installMockDashboardSupabase();

  const syncRes = await handler(coachGet("sync-status"));
  const syncBody = await syncRes.json();
  const coachTodayRes = await handler(coachGet("coach-today"));
  const coachTodayBody = await coachTodayRes.json();

  assert.equal(syncRes.status, 200);
  assert.equal(syncBody.apple_health.status, "missing");
  assert.equal(syncBody.apple_health.days_available_last_7, 0);
  assert.equal(coachTodayRes.status, 200);
  assert.equal(coachTodayBody.current.apple_health_daily_summary, null);
  assert.equal(coachTodayBody.supporting_evidence.apple_health.status, "missing");
});
