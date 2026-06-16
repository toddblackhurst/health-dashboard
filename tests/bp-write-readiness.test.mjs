import test from "node:test";
import assert from "node:assert/strict";

import {
  BP_WRITE_READINESS_VERSION,
  buildBpWriteReadinessCandidate,
  validateBpWriteReadinessCandidate,
} from "../lib/bp-write-readiness.mjs";

test("buildBpWriteReadinessCandidate validates safe BP payload shape", () => {
  const result = buildBpWriteReadinessCandidate({
    measured_at: "2026-01-15T07:30:00+08:00",
    systolic: 121,
    diastolic: 79,
    source: "manual_cuff",
    timezone: "Asia/Taipei",
    notes: "Morning reading before coffee.",
    actor: "Todd",
  });

  assert.equal(result.ok, true);
  assert.equal(result.candidate.version, BP_WRITE_READINESS_VERSION);
  assert.equal(result.candidate.type, "bp");
  assert.equal(result.candidate.payload_preview.type, "bp");
  assert.equal(result.candidate.payload_preview.systolic, 121);
  assert.equal(result.candidate.payload_preview.diastolic, 79);
  assert.equal(result.candidate.source_authority, "todd_reported_bp_only");
});

test("validateBpWriteReadinessCandidate rejects missing measured_at source systolic and diastolic", () => {
  const result = validateBpWriteReadinessCandidate({});

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /measured_at is required/);
  assert.match(result.errors.join(" "), /systolic is required/);
  assert.match(result.errors.join(" "), /diastolic is required/);
  assert.match(result.errors.join(" "), /source is required/);
});

test("validateBpWriteReadinessCandidate rejects secret and auth-like fields", () => {
  const result = validateBpWriteReadinessCandidate({
    measured_at: "2026-01-15T07:30:00+08:00",
    systolic: 121,
    diastolic: 79,
    source: "manual_cuff",
    authorization: "Bearer secret-token",
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /forbidden secret, auth, login, security, or payment content/);
  assert.match(result.errors.join(" "), /Unexpected fields are not allowed/);
});

test("buildBpWriteReadinessCandidate generates deterministic idempotency and correlation metadata", () => {
  const input = {
    measured_at: "2026-01-15T07:30:00+08:00",
    systolic: 121,
    diastolic: 79,
    source: "manual_cuff",
    actor: "Todd",
  };

  const first = buildBpWriteReadinessCandidate(input);
  const second = buildBpWriteReadinessCandidate(input);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.candidate.idempotency_key, second.candidate.idempotency_key);
  assert.equal(first.candidate.correlation_id, second.candidate.correlation_id);
});

test("buildBpWriteReadinessCandidate returns write_held by default", () => {
  const result = buildBpWriteReadinessCandidate({
    measured_at: "2026-01-15T07:30:00+08:00",
    systolic: 145,
    diastolic: 92,
    source: "manual_cuff",
  });

  assert.equal(result.ok, true);
  assert.equal(result.candidate.write_status, "write_held");
  assert.equal(result.candidate.bp_category, "yellow");
});

test("buildBpWriteReadinessCandidate proves no live write can execute by default", () => {
  const result = buildBpWriteReadinessCandidate({
    measured_at: "2026-01-15T07:30:00+08:00",
    systolic: 166,
    diastolic: 101,
    source: "manual_cuff",
  });

  assert.equal(result.ok, true);
  assert.equal(result.candidate.live_write_allowed, false);
  assert.equal(result.candidate.allowed_operation_class, "planning_only_no_write");
  assert.equal(result.candidate.medical_safety_boundary, "bp_is_safety_override_input");
  assert.equal(
    result.candidate.preflight_gates.includes("protected_read_only_verification_complete"),
    true
  );
});
