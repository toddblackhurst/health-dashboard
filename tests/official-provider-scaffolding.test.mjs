import test from "node:test";
import assert from "node:assert/strict";

import {
  OFFICIAL_PROVIDER_SCAFFOLDING_VERSION,
  createMockProviderReader,
  getOfficialProviderScaffold,
  listOfficialProviderScaffolds,
} from "../lib/official-provider-scaffolding.mjs";

test("official provider scaffolds stay disabled by default and local-only", () => {
  const scaffolds = listOfficialProviderScaffolds();
  const byId = Object.fromEntries(scaffolds.map(item => [item.provider_id, item]));

  assert.equal(scaffolds.length, 2);
  assert.equal(byId.garmin.integration_status, "disabled_by_default");
  assert.equal(byId.oura.integration_status, "disabled_by_default");
  assert.equal(byId.garmin.implementation_mode, "mock_read_only_scaffold");
  assert.equal(byId.oura.write_status, "no_write");
  assert.equal(byId.garmin.protected_route_status, "not_called");
  assert.equal(byId.oura.oauth_status, "not_started");
  assert.equal(byId.garmin.local_only, true);
  assert.equal(byId.oura.browser_automation_status, "not_allowed");
});

test("Garmin scaffold exposes only mock read interfaces for Garmin lanes", async () => {
  const scaffold = getOfficialProviderScaffold("garmin");
  const reader = createMockProviderReader("garmin");
  const sleep = await reader.read("read_sleep_recovery");
  const activities = await reader.read("read_activities");
  const nutrition = await reader.read("read_nutrition");

  assert.equal(scaffold.version, OFFICIAL_PROVIDER_SCAFFOLDING_VERSION);
  assert.deepEqual(scaffold.supported_registry_keys, [
    "garmin_sleep_recovery",
    "garmin_activities",
    "garmin_nutrition",
  ]);
  assert.match(scaffold.authority_boundary, /Rack\/Motra still owns completed strength detail/i);
  assert.equal(sleep.registry_key, "garmin_sleep_recovery");
  assert.equal(sleep.fixture.provider, "Garmin");
  assert.equal(sleep.source_quality, "api_read_only");
  assert.equal(activities.fixture.corroboration_only, true);
  assert.equal(nutrition.fixture.completeness, "full");
  assert.equal(nutrition.write_status, "no_write");
});

test("Oura scaffold stays fallback-only and does not imply Garmin freshness", async () => {
  const scaffold = getOfficialProviderScaffold("oura");
  const reader = createMockProviderReader("oura");
  const fallback = await reader.read("read_fallback_sleep_recovery");
  const advisor = await reader.read("read_advisor_summary");

  assert.deepEqual(scaffold.supported_registry_keys, [
    "oura_fallback",
    "oura_advisor_manual_insight",
  ]);
  assert.match(scaffold.authority_boundary, /must not mark Garmin fresh/i);
  assert.equal(fallback.registry_key, "oura_fallback");
  assert.equal(fallback.fixture.provider, "Oura");
  assert.match(fallback.fixture.fallback_reason, /Garmin primary readiness stale or unreliable/i);
  assert.equal(advisor.registry_key, "oura_advisor_manual_insight");
  assert.equal(advisor.fixture.source_state, "reported_manual");
  assert.equal(advisor.protected_route_status, "not_called");
});

test("unknown provider scaffolds and interfaces fail closed", async () => {
  assert.throws(() => getOfficialProviderScaffold("polar"), /Unknown provider scaffold/i);

  const reader = createMockProviderReader("garmin");
  await assert.rejects(() => reader.read("read_blood_pressure"), /Unknown garmin mock interface/i);
});

