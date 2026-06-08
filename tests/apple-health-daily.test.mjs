import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import handler from "../netlify/functions/coach-api.mjs";
import {
  DEFAULT_COACH_STATE,
  buildCoachDecision,
} from "../netlify/functions/_coach-lib.mjs";

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

function installMockSupabase({ failSummaryDate = "", failObservationInsert = false } = {}) {
  installEnv();
  let id = 1;
  const db = {
    profiles: [{
      id: "profile-1",
      name: "Todd Blackhurst",
      timezone: "Asia/Taipei",
      created_at: "2026-06-08T00:00:00Z",
    }],
    apple_health_sync_runs: [],
    apple_health_daily_summaries: [],
    coach_observations: [],
    coach_messages: [],
  };
  const coachObservationColumns = new Set([
    "profile_id",
    "observation_date",
    "category",
    "observation",
    "evidence",
    "confidence",
    "action_taken",
    "review_date",
    "status",
    "source",
    "raw",
    "created_at",
    "updated_at",
  ]);

  function nextId(table) {
    return `${table}-${id++}`;
  }

  function insertRows(table, rows) {
    return rows.map(row => {
      if (table === "coach_observations") {
        for (const column of Object.keys(row)) {
          if (!coachObservationColumns.has(column)) {
            throw new Error(`coach_observations column ${column} is not in migration 005 schema`);
          }
        }
      }
      const inserted = {
        id: row.id || nextId(table),
        created_at: row.created_at || "2026-06-08T00:00:00Z",
        ...row,
      };
      db[table].push(inserted);
      return inserted;
    });
  }

  function upsertAppleHealthSummary(rows) {
    return rows.map(row => {
      if (row.summary_date === failSummaryDate) {
        throw new Error("simulated apple health summary write failure");
      }
      const existing = db.apple_health_daily_summaries.find(item =>
        item.profile_id === row.profile_id
        && item.summary_date === row.summary_date
        && item.source_app === row.source_app
        && item.source_device === row.source_device);
      if (existing) {
        Object.assign(existing, row);
        return existing;
      }
      const inserted = {
        id: row.id || nextId("apple_health_daily_summaries"),
        created_at: "2026-06-08T00:00:00Z",
        ...row,
      };
      db.apple_health_daily_summaries.push(inserted);
      return inserted;
    });
  }

  global.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    const table = parsed.pathname.replace(/^\/rest\/v1\//, "");
    const method = options.method || "GET";
    const body = options.body ? JSON.parse(options.body) : null;

    if (!Object.hasOwn(db, table)) return jsonResponse({ error: `Unexpected table ${table}` }, 404);

    if (method === "GET" && table === "profiles") return jsonResponse(db.profiles);

    if (method === "POST" && table === "apple_health_daily_summaries") {
      try {
        return jsonResponse(upsertAppleHealthSummary(body || []));
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    if (method === "POST" && table === "coach_observations" && failObservationInsert) {
      return jsonResponse({ error: "simulated coach observation write failure" }, 500);
    }

    if (method === "POST") {
      try {
        return jsonResponse(insertRows(table, body || []));
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    if (method === "PATCH" && table === "apple_health_sync_runs") {
      const filter = parsed.searchParams.get("id") || "";
      const syncRunId = filter.replace(/^eq\./, "");
      const row = db.apple_health_sync_runs.find(item => item.id === syncRunId);
      if (!row) return jsonResponse([], 200);
      Object.assign(row, body || {});
      return jsonResponse([row]);
    }

    return jsonResponse({ error: `Unexpected ${method} ${table}` }, 500);
  };

  return db;
}

function applePayload(overrides = {}) {
  return {
    client_version: "1.0.0",
    device_name: "Todd iPhone",
    timezone: "Asia/Taipei",
    days_requested: 1,
    summaries: [{
      summary_date: "2026-06-08",
      source_app: "Apple Health",
      source_device: "iPhone",
      steps: 8421,
      distance_mi: 3.2,
      flights_climbed: 8,
      active_energy_kcal: 610,
      basal_energy_kcal: 1650,
      exercise_minutes: 42,
      stand_minutes: 720,
      resting_hr_bpm: 57,
      avg_hr_bpm: 88,
      min_hr_bpm: 49,
      max_hr_bpm: 132,
      hrv_sdnn_ms: 41,
      hrv_sample_count: 3,
      sleep_minutes: 450,
      sleep_in_bed_minutes: 480,
      workout_count: 1,
      strength_workout_count: 0,
      cardio_workout_count: 1,
      duplicate_policy_flags: { garmin_mirror_possible: true },
      metric_quality: { hrv: "direct_sample" },
      provenance: { steps: "HKQuantityTypeIdentifierStepCount" },
      raw_summary: { sample_count: 12 },
      ...(overrides.summary || {}),
    }],
    raw: { sync_reason: "manual" },
    ...overrides.body,
  };
}

function coachRequest(body, headers = {}) {
  return new Request("https://coach.test/api/coach?action=apple-health-daily", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-coach-secret": "test-secret",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test.afterEach(() => {
  restoreEnv();
});

test("valid Apple Health daily payload writes summaries", async () => {
  const db = installMockSupabase();

  const res = await handler(coachRequest(applePayload()));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.days_requested, 1);
  assert.equal(body.days_written, 1);
  assert.equal(db.apple_health_daily_summaries.length, 1);
  assert.equal(db.apple_health_daily_summaries[0].steps, 8421);
  assert.equal(db.apple_health_sync_runs[0].status, "success");
  assert.equal(db.coach_observations.length, 1);
  assert.match(db.coach_observations[0].observation, /Apple Health daily sync success/);
  assert.equal(db.coach_observations[0].source, "apple-health-daily");
  assert.equal(db.coach_observations[0].raw.observation_type, "apple_health_daily_summary");
  assert.equal(db.coach_observations[0].raw.linked_table, "apple_health_sync_runs");
  assert.equal(db.coach_observations[0].observation_type, undefined);
  assert.equal(db.coach_observations[0].title, undefined);
  assert.equal(db.coach_observations[0].linked_id, undefined);
  assert.equal(db.coach_messages[0].channel, "apple-health-daily");
});

test("empty Apple Health summaries are accepted but logged", async () => {
  const db = installMockSupabase();

  const res = await handler(coachRequest({
    client_version: "1.0.0",
    device_name: "Todd iPhone",
    timezone: "Asia/Taipei",
    days_requested: 0,
    summaries: [],
    raw: { sync_reason: "manual-empty" },
  }));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.days_written, 0);
  assert.equal(db.apple_health_daily_summaries.length, 0);
  assert.equal(db.apple_health_sync_runs[0].status, "success");
  assert.match(db.coach_observations[0].observation, /no summaries/i);
});

test("malformed Apple Health summary dates are rejected and mark the sync run failed", async () => {
  const db = installMockSupabase();

  const res = await handler(coachRequest(applePayload({
    summary: { summary_date: "2026-02-30" },
  })));
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.sync_run_id, db.apple_health_sync_runs[0].id);
  assert.equal(db.apple_health_sync_runs[0].status, "failed");
  assert.equal(db.apple_health_sync_runs[0].days_written, 0);
  assert.equal(db.apple_health_daily_summaries.length, 0);
  assert.ok(body.errors.some(error => error.field === "summary_date"));
});

test("missing Apple Health API auth is rejected before Supabase access", async () => {
  installEnv();
  global.fetch = async () => {
    throw new Error("Supabase should not be called without auth.");
  };

  const res = await handler(new Request("https://coach.test/api/coach?action=apple-health-daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(applePayload()),
  }));
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.match(body.error, /Invalid coach API secret/);
});

test("duplicate Apple Health day/device/source upserts instead of duplicating", async () => {
  const db = installMockSupabase();

  const first = await handler(coachRequest(applePayload({ summary: { steps: 8000 } })));
  const second = await handler(coachRequest(applePayload({ summary: { steps: 9000 } })));

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(db.apple_health_daily_summaries.length, 1);
  assert.equal(db.apple_health_daily_summaries[0].steps, 9000);
  assert.equal(db.apple_health_sync_runs.length, 2);
  assert.ok(db.apple_health_sync_runs.every(row => row.status === "success"));
});

test("Apple Health sync run status is partial when one summary write fails", async () => {
  const db = installMockSupabase({ failSummaryDate: "2026-06-09" });
  const payload = applePayload({
    body: {
      days_requested: 2,
      summaries: [
        applePayload().summaries[0],
        { ...applePayload().summaries[0], summary_date: "2026-06-09", steps: 3000 },
      ],
    },
  });

  const res = await handler(coachRequest(payload));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.days_written, 1);
  assert.equal(body.errors.length, 1);
  assert.equal(db.apple_health_sync_runs[0].status, "partial");
  assert.equal(db.apple_health_daily_summaries.length, 1);
});

test("Apple Health sync succeeds when optional coach observation insert fails", async () => {
  const db = installMockSupabase({ failObservationInsert: true });

  const res = await handler(coachRequest(applePayload()));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.days_written, 1);
  assert.equal(db.apple_health_daily_summaries.length, 1);
  assert.equal(db.apple_health_sync_runs[0].status, "success");
  assert.equal(db.coach_observations.length, 0);
  assert.equal(db.coach_messages[0].raw.observation_id, null);
});

test("migration 006 does not redefine or grant shared coach_observations", () => {
  const migration = readFileSync(new URL("../supabase/migrations/006_apple_health_daily_summaries.sql", import.meta.url), "utf8");

  assert.doesNotMatch(migration, /create table if not exists coach_observations/i);
  assert.doesNotMatch(migration, /observation_type text/i);
  assert.doesNotMatch(migration, /linked_id uuid/i);
  assert.doesNotMatch(migration, /revoke all on table coach_observations/i);
  assert.doesNotMatch(migration, /grant .* on table coach_observations/i);
});

test("Apple Health summaries do not override Oura/Garmin/Rack hierarchy", () => {
  const decision = buildCoachDecision({
    text: "Build today's workout",
    intent: "build_workout",
    dashboard: {
      apple_health_daily_summaries: [
        {
          summary_date: "2026-06-08",
          source_app: "Apple Health",
          hrv_sdnn_ms: 70,
          workout_count: 2,
        },
      ],
    },
    payload: { now: "2026-06-08T02:00:00.000Z" },
  });

  assert.match(DEFAULT_COACH_STATE.source_hierarchy.readiness.join(" "), /Apple Health summary cross-checks only/);
  assert.equal(decision.source_context.readiness_primary, "Oura");
  assert.equal(decision.source_context.nutrition_primary, "Garmin Connect+ Nutrition");
  assert.equal(decision.source_context.workout_primary, "Garmin Connect Strength for set-level execution and physiology");
});
