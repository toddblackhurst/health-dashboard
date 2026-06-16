export const BP_WRITE_READINESS_VERSION = "bp-write-readiness-v1";

const SECRET_LIKE_KEY = /(secret|token|password|authorization|api[_-]?key|x-coach-secret|cookie|oauth|session|jwt|login|payment|billing|card|otp|2fa|passcode|face[_ -]?id)/i;
const SECRET_LIKE_VALUE = /\b(x-coach-secret|authorization)\b|bearer\s+[a-z0-9._~+/=-]+|(?:secret|token|password|api[_-]?key|oauth(?:_| )?client(?:_| )?secret|session(?:_| )?id|cookie|jwt)\s*[:=]\s*\S+|sk-[a-z0-9]{8,}|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/i;
const ACCOUNT_SECURITY_TEXT = /\b(login|sign in|2fa|two[- ]factor|otp|passcode|face id|payment|credit card|billing|captcha|oauth consent)\b/i;

const ALLOWED_FIELDS = new Set([
  "type",
  "measured_at",
  "systolic",
  "diastolic",
  "heart_rate",
  "source",
  "timezone",
  "notes",
  "actor",
  "profile_id",
  "idempotency_key",
  "correlation_id",
  "approval_reference",
]);

const PREFLIGHT_GATES = [
  "protected_read_only_verification_complete",
  "schema_cache_readiness_confirmed_without_secret_handling",
  "exact_todd_approved_payload_named",
  "idempotency_key_generated_before_submit",
  "duplicate_prevention_rule_confirmed",
  "audit_record_defined",
  "rollback_or_repair_path_defined",
  "post_write_readback_plan_defined",
  "medical_safety_interpretation_boundary_confirmed",
];

const AUDIT_FIELDS = [
  "request_timestamp",
  "actor_or_surface",
  "route_and_type",
  "measured_timestamp",
  "bp_category",
  "correlation_id",
  "idempotency_key",
  "returned_non_secret_row_id_or_status",
  "approval_reference",
];

const ROLLBACK_PATH = [
  "use compensating correction or duplicate marker instead of silent delete when possible",
  "verify corrected or superseded row no longer influences coaching unexpectedly",
  "do not proceed if no safe repair path exists",
];

function compactText(value, maxLength = 300) {
  return String(value || "").trim().slice(0, maxLength);
}

function compactId(value, maxLength = 120) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);
}

function hasForbiddenContent(value, depth = 0) {
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "string") return SECRET_LIKE_VALUE.test(value) || ACCOUNT_SECURITY_TEXT.test(value);
  if (typeof value === "number" || typeof value === "boolean") return false;
  if (depth >= 5) return false;
  if (Array.isArray(value)) return value.some(item => hasForbiddenContent(item, depth + 1));
  if (typeof value === "object") {
    return Object.entries(value).some(([key, item]) => SECRET_LIKE_KEY.test(key) || hasForbiddenContent(item, depth + 1));
  }
  return false;
}

function parseIso(value, fieldName, errors) {
  const text = compactText(value, 80);
  if (!text) {
    errors.push(`${fieldName} is required.`);
    return null;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    errors.push(`${fieldName} must be a valid ISO timestamp.`);
    return null;
  }
  return date.toISOString();
}

function parseInteger(value, fieldName, errors, { min, max }) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    errors.push(`${fieldName} is required and must be numeric.`);
    return null;
  }
  const rounded = Math.round(number);
  if (rounded < min || rounded > max) {
    errors.push(`${fieldName} must be between ${min} and ${max}.`);
    return null;
  }
  return rounded;
}

function normalizeSource(value, errors) {
  const normalized = compactId(value, 60);
  if (!normalized) {
    errors.push("source is required.");
    return null;
  }
  return normalized;
}

function deriveBpCategory(systolic, diastolic) {
  if (systolic >= 160 || diastolic >= 100) return "red";
  if (systolic >= 140 || diastolic >= 90) return "yellow";
  return "info";
}

function buildIdempotencyKey({ actorKey, measuredAtIso, systolic, diastolic, source }) {
  return `bp:${actorKey}:${measuredAtIso}:${systolic}:${diastolic}:${source}`;
}

function buildCorrelationId(idempotencyKey) {
  return `bpwr_${compactId(idempotencyKey, 72)}`;
}

function normalizeInput(input = {}, errors = []) {
  const unexpectedFields = Object.keys(input).filter(key => !ALLOWED_FIELDS.has(key));
  if (unexpectedFields.length) {
    errors.push(`Unexpected fields are not allowed in BP write-readiness input: ${unexpectedFields.join(", ")}.`);
  }

  if (hasForbiddenContent(input)) {
    errors.push("BP write-readiness input contains forbidden secret, auth, login, security, or payment content.");
  }

  const type = compactText(input.type || "bp", 20).toLowerCase();
  if (type !== "bp") errors.push("type must remain bp for BP write-readiness.");

  const measuredAtIso = parseIso(input.measured_at, "measured_at", errors);
  const systolic = parseInteger(input.systolic, "systolic", errors, { min: 50, max: 260 });
  const diastolic = parseInteger(input.diastolic, "diastolic", errors, { min: 30, max: 180 });
  const heartRate = input.heart_rate === undefined || input.heart_rate === null || input.heart_rate === ""
    ? null
    : parseInteger(input.heart_rate, "heart_rate", errors, { min: 20, max: 250 });
  const source = normalizeSource(input.source, errors);
  const timezone = compactText(input.timezone || "Asia/Taipei", 80) || "Asia/Taipei";
  const notes = compactText(input.notes, 300) || null;
  const actorKey = compactId(input.profile_id || input.actor || "pending-approval", 40) || "pending-approval";

  return {
    type,
    measured_at: measuredAtIso,
    systolic,
    diastolic,
    heart_rate: heartRate,
    source,
    timezone,
    notes,
    actor_key: actorKey,
    approval_reference: compactText(input.approval_reference, 120) || null,
  };
}

export function validateBpWriteReadinessCandidate(input = {}) {
  const errors = [];
  const normalized = normalizeInput(input, errors);
  if (errors.length) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    normalized,
  };
}

export function buildBpWriteReadinessCandidate(input = {}) {
  const validation = validateBpWriteReadinessCandidate(input);
  if (!validation.ok) return validation;

  const normalized = validation.normalized;
  const idempotencyKey = compactText(
    input.idempotency_key || buildIdempotencyKey({
      actorKey: normalized.actor_key,
      measuredAtIso: normalized.measured_at,
      systolic: normalized.systolic,
      diastolic: normalized.diastolic,
      source: normalized.source,
    }),
    200
  );
  const correlationId = compactText(
    input.correlation_id || buildCorrelationId(idempotencyKey),
    120
  );
  const bpCategory = deriveBpCategory(normalized.systolic, normalized.diastolic);

  return {
    ok: true,
    candidate: {
      version: BP_WRITE_READINESS_VERSION,
      type: "bp",
      write_status: "write_held",
      live_write_allowed: false,
      allowed_operation_class: "planning_only_no_write",
      source_authority: "todd_reported_bp_only",
      medical_safety_boundary: "bp_is_safety_override_input",
      measured_at: normalized.measured_at,
      measured_date: normalized.measured_at.slice(0, 10),
      systolic: normalized.systolic,
      diastolic: normalized.diastolic,
      heart_rate: normalized.heart_rate,
      source: normalized.source,
      timezone: normalized.timezone,
      notes: normalized.notes,
      bp_category: bpCategory,
      idempotency_key: idempotencyKey,
      correlation_id: correlationId,
      duplicate_prevention_rule: "same profile, measured_at, systolic, diastolic, source",
      preflight_gates: [...PREFLIGHT_GATES],
      audit_fields: [...AUDIT_FIELDS],
      rollback_path: [...ROLLBACK_PATH],
      payload_preview: {
        type: "bp",
        measured_at: normalized.measured_at,
        systolic: normalized.systolic,
        diastolic: normalized.diastolic,
        heart_rate: normalized.heart_rate,
        source: normalized.source,
        timezone: normalized.timezone,
        notes: normalized.notes,
      },
      approval_reference: normalized.approval_reference,
    },
  };
}
