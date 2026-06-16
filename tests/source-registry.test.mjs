import test from "node:test";
import assert from "node:assert/strict";

import { buildSyncStatus } from "../netlify/functions/_coach-lib.mjs";
import { SOURCE_REGISTRY, SOURCE_REGISTRY_VERSION } from "../lib/source-registry.mjs";

const MONDAY_TAIPEI = "2026-06-08T02:00:00.000Z";

function grouped(syncStatus, bucket, id) {
  return (syncStatus.source_groups?.[bucket] || []).find(item => item.id === id) || null;
}

test("source registry v1 covers the planned source-policy lanes", () => {
  const requiredEntries = [
    "garmin_sleep_recovery",
    "garmin_activities",
    "garmin_nutrition",
    "rack_strength_session",
    "rack_strength_detail",
    "oura_fallback",
    "oura_advisor_manual_insight",
    "apple_health",
    "blood_pressure",
    "body_composition",
    "manual_evidence_packet",
  ];

  for (const key of requiredEntries) {
    const entry = SOURCE_REGISTRY[key];
    assert.ok(entry, `${key} should exist in the source registry`);
    assert.ok(entry.authority_role, `${key} should declare authority_role`);
    assert.ok(entry.freshness_window?.description, `${key} should declare a freshness window`);
    assert.ok(entry.acquisition_method, `${key} should declare an acquisition method`);
    assert.ok(entry.allowed_operation_class, `${key} should declare an allowed operation class`);
    assert.ok(entry.next_action_wording, `${key} should declare next-action wording`);
  }

  assert.match(
    SOURCE_REGISTRY.garmin_activities.fallback_rules.join(" "),
    /does not override Rack\/Motra/i
  );
  assert.equal(SOURCE_REGISTRY.manual_evidence_packet.allowed_operation_class, "draft_only_no_write");
});

test("source groups keep Apple Health fresh separate from stale Garmin and Rack authority lanes", () => {
  const syncStatus = buildSyncStatus({
    now: new Date(MONDAY_TAIPEI),
    profile: { timezone: "Asia/Taipei" },
    recovery_sleep: [{
      date: "2026-06-05",
      source: "Garmin",
      training_readiness_score: 82,
      hrv_status_ms: 44,
    }],
    apple_health_daily_summaries: [{ summary_date: "2026-06-08", steps: 8421 }],
  });

  assert.equal(syncStatus.source_registry.version, SOURCE_REGISTRY_VERSION);
  assert.ok(grouped(syncStatus, "fresh", "apple_health_daily_summary"));
  assert.ok(grouped(syncStatus, "needs_todd", "sleep_recovery"));
  assert.ok(grouped(syncStatus, "needs_todd", "strength_session"));
  assert.ok(grouped(syncStatus, "needs_todd", "strength_exercises"));
  assert.equal(syncStatus.protected_read_only_status.registry_key, "protected_read_only");
  assert.equal(syncStatus.protected_read_only_status.grouping_bucket, "fresh");
});

test("Oura can be a fresh fallback without marking Garmin fresh", () => {
  const syncStatus = buildSyncStatus({
    now: new Date(MONDAY_TAIPEI),
    profile: { timezone: "Asia/Taipei" },
    recovery_sleep: [{
      date: "2026-06-08",
      source: "Oura",
      oura: { readiness_score: 84, hrv_avg_ms: 38, total_sleep_min: 435 },
    }],
  });
  const byId = Object.fromEntries(syncStatus.checks.map(check => [check.id, check]));

  assert.ok(grouped(syncStatus, "fallback", "oura_fallback"));
  assert.ok(grouped(syncStatus, "needs_todd", "sleep_recovery"));
  assert.equal(byId.sleep_recovery.source_state, "manual_provider_bound");
  assert.equal(byId.oura_fallback.source_state, "fallback_only");
  assert.equal(byId.oura_fallback.grouping_bucket, "fallback");
});

test("BP stale remains conservative while Garmin activities stay corroborating-only by policy", () => {
  const syncStatus = buildSyncStatus({
    now: new Date(MONDAY_TAIPEI),
    profile: { timezone: "Asia/Taipei" },
  });
  const byId = Object.fromEntries(syncStatus.checks.map(check => [check.id, check]));

  assert.ok(grouped(syncStatus, "needs_todd", "blood_pressure"));
  assert.equal(byId.blood_pressure.source_state, "write_held");
  assert.equal(byId.blood_pressure.grouping_bucket, "needs_todd");
  assert.match(
    SOURCE_REGISTRY.rack_strength_detail.fallback_rules.join(" "),
    /does not override Rack\/Motra detail/i
  );
  assert.match(
    SOURCE_REGISTRY.garmin_activities.next_action_wording.default,
    /corroborating physiology evidence/i
  );
});
