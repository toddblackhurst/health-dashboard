import { SOURCE_REGISTRY } from "./source-registry.mjs";

export const COACH_EVIDENCE_PACKET_VERSION = "coach-evidence-packet-v1";

const SECRET_LIKE_KEY = /(secret|token|password|authorization|api[_-]?key|x-coach-secret|cookie|oauth|session|jwt|login|payment|billing|card|otp|2fa|passcode|face[_ -]?id)/i;
const SECRET_LIKE_VALUE = /\b(x-coach-secret|authorization)\b|bearer\s+[a-z0-9._~+/=-]+|(?:secret|token|password|api[_-]?key|oauth(?:_| )?client(?:_| )?secret|session(?:_| )?id|cookie|jwt)\s*[:=]\s*\S+|sk-[a-z0-9]{8,}|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/i;
const ACCOUNT_SECURITY_TEXT = /\b(login|sign in|2fa|two[- ]factor|otp|passcode|face id|payment|credit card|billing|captcha|oauth consent)\b/i;

const ALLOWED_PACKET_TYPES = {
  apple_health_daily_summary: {
    registry_key: "apple_health",
    source: "Apple Health / HealthKit daily summary",
    default_source_state: "supporting_only",
    default_freshness_status: "fresh",
    source_quality: "device_sync",
  },
  rack_strength_export: {
    registry_key: "rack_strength_detail",
    source: "Rack/Motra strength export",
    default_source_state: "fresh",
    default_freshness_status: "fresh",
    source_quality: "provider_export",
  },
  rack_strength_manual: {
    registry_key: "rack_strength_detail",
    source: "Rack/Motra manual strength report",
    default_source_state: "manual_provider_bound",
    default_freshness_status: "fresh",
    source_quality: "reported_manual",
  },
  garmin_manual_freshness: {
    registry_key: "garmin_sleep_recovery",
    source: "Garmin manual freshness report",
    default_source_state: "manual_provider_bound",
    default_freshness_status: "fresh",
    source_quality: "reported_manual",
  },
  garmin_activity_export: {
    registry_key: "garmin_activities",
    source: "Garmin activity export",
    default_source_state: "fresh",
    default_freshness_status: "fresh",
    source_quality: "provider_export",
  },
  garmin_nutrition_manual: {
    registry_key: "garmin_nutrition",
    source: "Garmin Nutrition manual report",
    default_source_state: "manual_provider_bound",
    default_freshness_status: "fresh",
    source_quality: "reported_manual",
  },
  oura_api_recovery: {
    registry_key: "oura_fallback",
    source: "Oura API recovery",
    default_source_state: "fallback_only",
    default_freshness_status: "fresh",
    source_quality: "api_read_only",
  },
  oura_advisor_manual_insight: {
    registry_key: "oura_advisor_manual_insight",
    source: "Oura Advisor manual insight",
    default_source_state: "fallback_only",
    default_freshness_status: "fresh",
    source_quality: "reported_manual",
  },
  bp_manual: {
    registry_key: "blood_pressure",
    source: "Blood pressure manual report",
    default_source_state: "write_held",
    default_freshness_status: "fresh",
    source_quality: "reported_manual",
  },
  body_composition_manual: {
    registry_key: "body_composition",
    source: "Body composition manual report",
    default_source_state: "manual_provider_bound",
    default_freshness_status: "fresh",
    source_quality: "reported_manual",
  },
  manual_source_evidence_packet: {
    registry_key: "manual_evidence_packet",
    source: "Manual source evidence packet",
    default_source_state: "draft_only",
    default_freshness_status: "fresh",
    source_quality: "reported_manual",
  },
};

const ALLOWED_SOURCE_QUALITY = new Set([
  "high",
  "medium",
  "low",
  "reported_manual",
  "provider_export",
  "device_sync",
  "api_read_only",
]);

const ALLOWED_WRITE_STATUS = new Set(["no_write", "draft_only_no_write"]);
const ALLOWED_PROTECTED_ROUTE_STATUS = new Set(["not_called", "verified_read_only", "protected_verification_deferred"]);
const ALLOWED_FRESHNESS_STATUS = new Set(["fresh", "stale", "missing", "not_expected_today"]);

function compactText(value, maxLength = 300) {
  return String(value || "").trim().slice(0, maxLength);
}

function compactId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

function normalizeObservedWindow(input = {}, errors = []) {
  const window = input.observed_window && typeof input.observed_window === "object" ? input.observed_window : {};
  const start = parseIso(window.start_at || input.observed_at || input.observed_start_at, "observed_window.start_at", errors);
  const endValue = window.end_at || input.observed_end_at || window.start_at || input.observed_at || input.observed_start_at;
  const end = parseIso(endValue, "observed_window.end_at", errors);
  const timezone = compactText(window.timezone || input.timezone || "Asia/Taipei", 80) || "Asia/Taipei";
  if (start && end && Date.parse(end) < Date.parse(start)) {
    errors.push("observed_window.end_at must be the same as or later than observed_window.start_at.");
  }
  return {
    start_at: start,
    end_at: end,
    timezone,
  };
}

function buildPacketId(packetType, generatedAt) {
  return `cep_${compactId(packetType)}_${generatedAt.slice(0, 19).replace(/[^0-9]/g, "")}`;
}

export function validateCoachEvidencePacket(input = {}) {
  const errors = [];
  const packetType = compactText(input.packet_type, 80);
  const packetConfig = ALLOWED_PACKET_TYPES[packetType];
  if (!packetConfig) {
    errors.push("packet_type is required and must be one of the approved CoachEvidencePacket types.");
  }

  if (hasForbiddenContent(input)) {
    errors.push("CoachEvidencePacket input contains forbidden secret, auth, login, security, or payment content.");
  }

  const generatedAt = parseIso(input.generated_at || new Date().toISOString(), "generated_at", errors);
  const observedWindow = normalizeObservedWindow(input, errors);
  const sourceQuality = compactText(input.source_quality || packetConfig?.source_quality || "reported_manual", 80);
  if (!ALLOWED_SOURCE_QUALITY.has(sourceQuality)) {
    errors.push("source_quality must be one of: high, medium, low, reported_manual, provider_export, device_sync, api_read_only.");
  }

  const registryEntry = packetConfig ? SOURCE_REGISTRY[packetConfig.registry_key] : null;
  if (packetConfig && !registryEntry) {
    errors.push(`No source registry entry was found for packet_type ${packetType}.`);
  }

  const writeStatus = compactText(input.write_status || "no_write", 80) || "no_write";
  if (!ALLOWED_WRITE_STATUS.has(writeStatus)) {
    errors.push("write_status must stay local/no-write.");
  }

  const protectedRouteStatus = compactText(input.protected_route_status || "not_called", 80) || "not_called";
  if (!ALLOWED_PROTECTED_ROUTE_STATUS.has(protectedRouteStatus)) {
    errors.push("protected_route_status must remain a no-write/read-only status.");
  }

  const freshnessStatus = compactText(
    input.freshness_status || packetConfig?.default_freshness_status || "fresh",
    80
  ) || "fresh";
  if (!ALLOWED_FRESHNESS_STATUS.has(freshnessStatus)) {
    errors.push("freshness_status must be fresh, stale, missing, or not_expected_today.");
  }

  const sourceState = compactText(
    input.source_state || packetConfig?.default_source_state || "manual_provider_bound",
    80
  ) || "manual_provider_bound";
  const source = compactText(input.source || packetConfig?.source, 180);
  if (!source) errors.push("source is required.");

  const evidence = input.evidence && typeof input.evidence === "object" ? input.evidence : null;
  if (!evidence || Array.isArray(evidence) || !Object.keys(evidence).length) {
    errors.push("evidence is required and must be a non-empty object.");
  }

  if (input.no_secret_values === false) errors.push("no_secret_values must remain true.");
  if (input.no_write_performed === false) errors.push("no_write_performed must remain true.");

  if (errors.length) {
    return {
      ok: false,
      errors,
    };
  }

  const packetId = compactText(input.packet_id, 120) || buildPacketId(packetType, generatedAt);
  const authorityLane = registryEntry.authority_role;
  const acquisitionMethod = registryEntry.acquisition_method;
  const noWriteMetadata = {
    no_secret_values: true,
    no_write_performed: true,
    local_only: true,
  };

  return {
    ok: true,
    packet: {
      version: COACH_EVIDENCE_PACKET_VERSION,
      packet_id: packetId,
      source,
      packet_type: packetType,
      registry_key: packetConfig.registry_key,
      observed_window: observedWindow,
      generated_at: generatedAt,
      acquisition_method: acquisitionMethod,
      source_quality: sourceQuality,
      authority_lane: authorityLane,
      source_state: sourceState,
      freshness_status: freshnessStatus,
      write_status: writeStatus,
      protected_route_status: protectedRouteStatus,
      no_secret_values: noWriteMetadata.no_secret_values,
      no_write_performed: noWriteMetadata.no_write_performed,
      local_only: noWriteMetadata.local_only,
      evidence,
      metadata: {
        allowed_operation_class: registryEntry.allowed_operation_class,
        fallback_rules: registryEntry.fallback_rules,
        freshness_window: registryEntry.freshness_window,
      },
    },
  };
}

export function buildCoachEvidencePacket(input = {}) {
  const validation = validateCoachEvidencePacket(input);
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }
  return validation.packet;
}
