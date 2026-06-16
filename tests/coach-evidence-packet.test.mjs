import test from "node:test";
import assert from "node:assert/strict";

import {
  COACH_EVIDENCE_PACKET_VERSION,
  buildCoachEvidencePacket,
  validateCoachEvidencePacket,
} from "../lib/coach-evidence-packet.mjs";

const OBSERVED_AT = "2026-06-16T06:30:00.000Z";
const GENERATED_AT = "2026-06-16T06:45:00.000Z";

test("buildCoachEvidencePacket creates a local no-write Apple Health supporting packet", () => {
  const packet = buildCoachEvidencePacket({
    packet_type: "apple_health_daily_summary",
    observed_at: OBSERVED_AT,
    generated_at: GENERATED_AT,
    evidence: {
      summary_date: "2026-06-16",
      steps: 8421,
      exercise_minutes: 54,
      sync_status: "fresh",
    },
  });

  assert.equal(packet.version, COACH_EVIDENCE_PACKET_VERSION);
  assert.equal(packet.packet_type, "apple_health_daily_summary");
  assert.equal(packet.registry_key, "apple_health");
  assert.equal(packet.authority_lane, "supporting_evidence");
  assert.equal(packet.source_state, "supporting_only");
  assert.equal(packet.freshness_status, "fresh");
  assert.equal(packet.write_status, "no_write");
  assert.equal(packet.protected_route_status, "not_called");
  assert.equal(packet.no_secret_values, true);
  assert.equal(packet.no_write_performed, true);
  assert.equal(packet.local_only, true);
  assert.equal(packet.metadata.allowed_operation_class, "read_only_no_write");
});

test("Rack manual packets preserve Rack/Motra authority metadata without pretending provider freshness", () => {
  const packet = buildCoachEvidencePacket({
    packet_type: "rack_strength_manual",
    observed_window: {
      start_at: OBSERVED_AT,
      end_at: "2026-06-16T07:20:00.000Z",
      timezone: "Asia/Taipei",
    },
    generated_at: GENERATED_AT,
    evidence: {
      workout_title: "Friday Strength",
      exercises: [
        { name: "Chest Supported Row", sets: "3", reps: "10", load_kg: "24" },
      ],
      note: "Reported manually after training.",
    },
  });

  assert.equal(packet.registry_key, "rack_strength_detail");
  assert.equal(packet.authority_lane, "set_rep_load_authority");
  assert.equal(packet.source_state, "manual_provider_bound");
  assert.equal(packet.freshness_status, "fresh");
  assert.match(packet.metadata.fallback_rules.join(" "), /does not override Rack\/Motra detail/i);
});

test("Oura Advisor and manual evidence packet types stay local and fallback-oriented", () => {
  const ouraPacket = buildCoachEvidencePacket({
    packet_type: "oura_advisor_manual_insight",
    observed_at: OBSERVED_AT,
    generated_at: GENERATED_AT,
    evidence: {
      readiness: "80",
      note: "Todd reported Oura Advisor summary.",
    },
  });
  const manualPacket = buildCoachEvidencePacket({
    packet_type: "manual_source_evidence_packet",
    observed_at: OBSERVED_AT,
    generated_at: GENERATED_AT,
    evidence: {
      lanes_reported: ["garmin_sleep_recovery", "bp_manual"],
      summary: "Manual bridge packet only; not saved.",
    },
  });

  assert.equal(ouraPacket.authority_lane, "manual_fallback_insight");
  assert.equal(ouraPacket.source_state, "fallback_only");
  assert.equal(manualPacket.registry_key, "manual_evidence_packet");
  assert.equal(manualPacket.source_state, "draft_only");
  assert.equal(manualPacket.metadata.allowed_operation_class, "draft_only_no_write");
});

test("validateCoachEvidencePacket rejects secret, auth, login, and payment-like content", () => {
  const validation = validateCoachEvidencePacket({
    packet_type: "bp_manual",
    observed_at: OBSERVED_AT,
    generated_at: GENERATED_AT,
    evidence: {
      systolic: 128,
      diastolic: 79,
      headers: { authorization: "Bearer abc123" },
      note: "x-coach-secret: hidden",
    },
    session_id: "abc",
  });

  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(" "), /forbidden secret, auth, login, security, or payment content/i);
});

test("validateCoachEvidencePacket rejects missing required fields and non no-write statuses", () => {
  const validation = validateCoachEvidencePacket({
    packet_type: "garmin_activity_export",
    generated_at: GENERATED_AT,
    write_status: "submitted",
    protected_route_status: "called_write_route",
    evidence: {},
  });

  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(" "), /observed_window\.start_at is required/i);
  assert.match(validation.errors.join(" "), /write_status must stay local\/no-write/i);
  assert.match(validation.errors.join(" "), /protected_route_status must remain a no-write\/read-only status/i);
  assert.match(validation.errors.join(" "), /evidence is required/i);
});
