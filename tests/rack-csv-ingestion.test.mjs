import test from "node:test";
import assert from "node:assert/strict";

import {
  RACK_CSV_INGESTION_VERSION,
  RACK_EXPORT_HEADERS,
  buildRackCsvExportBridge,
  parseRackCsvRows,
} from "../lib/rack-csv-ingestion.mjs";

const VALID_CSV = [
  RACK_EXPORT_HEADERS.join(","),
  "2026-06-16,Friday Strength,Chest Supported Row,1,24,10,work,,Smooth first set",
  "2026-06-16,Friday Strength,Chest Supported Row,2,24,10,work,,Held tempo",
  "2026-06-16,Friday Strength,Farmer Carry,1,,,carry,45 sec,Heavy carry",
  "2026-06-16,Friday Strength,Suitcase Carry,1,,,carry,,30 sec hold left side",
].join("\n");

const INVALID_CSV = [
  RACK_EXPORT_HEADERS.join(","),
  "bad-date,Friday Strength,Chest Supported Row,1,24,10,work,,",
  "2026-06-16,,Chest Supported Row,abc,heavy,ten,,,",
].join("\n");

const DUPLICATE_CSV = [
  RACK_EXPORT_HEADERS.join(","),
  "2026-06-16,Friday Strength,Chest Supported Row,1,24,10,work,,",
  "2026-06-16,Friday Strength,Chest Supported Row,1,24,10,work,,Duplicate import row",
].join("\n");

test("parseRackCsvRows builds local completed-session detail from valid Rack export rows", () => {
  const parsed = parseRackCsvRows(VALID_CSV, { timezone: "Asia/Taipei" });

  assert.equal(parsed.version, RACK_CSV_INGESTION_VERSION);
  assert.deepEqual(parsed.headers, RACK_EXPORT_HEADERS);
  assert.equal(parsed.valid_rows.length, 4);
  assert.equal(parsed.invalid_rows.length, 0);
  assert.equal(parsed.sessions.length, 1);
  assert.equal(parsed.sessions[0].session_date, "2026-06-16");
  assert.equal(parsed.sessions[0].workout_name, "Friday Strength");
  assert.equal(parsed.sessions[0].exercise_count, 3);
  assert.equal(parsed.sessions[0].set_count, 4);
  assert.equal(parsed.sessions[0].exercises[1].sets[0].duration, "45 sec");
  assert.equal(parsed.sessions[0].exercises[2].sets[0].duration, null);
  assert.equal(parsed.sessions[0].exercises[2].sets[0].notes, "30 sec hold left side");
});

test("parseRackCsvRows reports validation errors for invalid or incomplete rows without writing", () => {
  const parsed = parseRackCsvRows(INVALID_CSV, { timezone: "Asia/Taipei" });

  assert.equal(parsed.ok, false);
  assert.equal(parsed.valid_rows.length, 0);
  assert.equal(parsed.invalid_rows.length, 2);
  assert.match(parsed.validation_errors.join(" "), /Date must be a valid session date/i);
  assert.match(parsed.validation_errors.join(" "), /Workout Name is required/i);
  assert.match(parsed.validation_errors.join(" "), /Set Number must be a positive integer/i);
  assert.match(parsed.validation_errors.join(" "), /Weight must be numeric when present/i);
  assert.match(parsed.validation_errors.join(" "), /Reps must be numeric when present/i);
});

test("buildRackCsvExportBridge maps valid Rack export rows into local no-write evidence and refresh metadata", () => {
  const bridge = buildRackCsvExportBridge({
    csv_text: VALID_CSV,
    timezone: "Asia/Taipei",
    generated_at: "2026-06-16T08:00:00.000Z",
  });

  assert.equal(bridge.ok, true);
  assert.equal(bridge.write_status, "no_write");
  assert.equal(bridge.protected_route_status, "not_called");
  assert.equal(bridge.session_count, 1);
  assert.equal(bridge.invalid_row_count, 0);
  assert.equal(bridge.evidence_packets.length, 1);
  assert.equal(bridge.evidence_packets[0].packet_type, "rack_strength_export");
  assert.equal(bridge.evidence_packets[0].registry_key, "rack_strength_detail");
  assert.equal(bridge.evidence_packets[0].source_state, "fresh");
  assert.equal(bridge.evidence_packets[0].evidence.workout_date, "2026-06-16");
  assert.equal("session_date" in bridge.evidence_packets[0].evidence, false);
  assert.deepEqual(
    bridge.refresh_summary.source_authority.fresh_registry_keys,
    ["rack_strength_session", "rack_strength_detail"]
  );
  assert.equal(bridge.refresh_summary.source_groups.fresh.length, 2);
  assert.match(bridge.refresh_summary.garmin_policy, /corroborating only/i);
});

test("buildRackCsvExportBridge surfaces duplicate-risk warnings without pretending to de-duplicate production data", () => {
  const bridge = buildRackCsvExportBridge({
    csv_text: DUPLICATE_CSV,
    timezone: "Asia/Taipei",
    generated_at: "2026-06-16T08:00:00.000Z",
  });

  assert.equal(bridge.ok, true);
  assert.equal(bridge.duplicate_risk_warnings.length, 1);
  assert.match(bridge.duplicate_risk_warnings[0], /Duplicate-risk rows share/i);
  assert.match(bridge.duplicate_risk_warnings[0], /rack_csv_export\|2026-06-16\|friday strength/i);
  assert.equal(bridge.refresh_summary.duplicate_risk_warnings.length, 1);
});
