export const SOURCE_REGISTRY_VERSION = "source-registry-v1";

const READ_ONLY_OR_MANUAL = "read_only_or_manual_no_write";
const READ_ONLY_ONLY = "read_only_no_write";
const DRAFT_ONLY = "draft_only_no_write";

export const SOURCE_REGISTRY = {
  garmin_sleep_recovery: {
    registry_key: "garmin_sleep_recovery",
    check_id: "sleep_recovery",
    label: "Garmin sleep/recovery",
    authority_role: "primary_readiness",
    freshness_window: {
      unit: "days",
      max_age_days: 1,
      requires_reliable_wear: true,
      description: "Fresh when same-day or previous-night Garmin sleep/recovery is available and wear is reliable.",
    },
    fallback_rules: [
      "If Garmin is stale, missing, or unreliable, Oura may inform sleep/recovery as fallback only.",
      "Apple Health remains supporting evidence only and does not make Garmin fresh.",
    ],
    acquisition_method: "Garmin Connect / Fenix 8 read-only review, or a no-write manual evidence packet when Garmin is unavailable.",
    allowed_operation_class: READ_ONLY_OR_MANUAL,
    next_action_wording: {
      fresh: "Use Garmin readiness/recovery when wear is reliable.",
      stale: "Review Garmin sleep/recovery or provide a manual source evidence packet; use Oura only as fallback.",
      missing: "Review Garmin sleep/recovery or provide a manual source evidence packet; use Oura only as fallback.",
      default: "Keep Garmin as the primary readiness authority whenever it is fresh and reliable.",
    },
  },
  garmin_activities: {
    registry_key: "garmin_activities",
    check_id: null,
    label: "Garmin activities",
    authority_role: "workout_physiology_primary",
    freshness_window: {
      unit: "days",
      max_age_days: 1,
      requires_training_day: true,
      description: "Fresh when same-day Garmin activity summary and workout physiology are available after training.",
    },
    fallback_rules: [
      "Garmin activities corroborate workout completion, physiology, and recovery cost.",
      "Garmin strength activity does not override Rack/Motra set, rep, load, or exercise-detail authority by default.",
    ],
    acquisition_method: "Garmin Connect / Fenix 8 read-only activity review.",
    allowed_operation_class: READ_ONLY_ONLY,
    next_action_wording: {
      fresh: "Use Garmin activity summary for workout physiology and recovery cost; keep Rack/Motra as the set-level strength authority.",
      stale: "Review Garmin activity summary when available; do not replace Rack/Motra detail with Apple Health or memory.",
      missing: "Review Garmin activity summary when available; do not replace Rack/Motra detail with Apple Health or memory.",
      default: "Treat Garmin activities as corroborating physiology evidence, not completed set-level strength authority.",
    },
  },
  garmin_nutrition: {
    registry_key: "garmin_nutrition",
    check_id: "nutrition",
    label: "Garmin Nutrition",
    authority_role: "nutrition_authority",
    freshness_window: {
      unit: "days",
      max_age_days: 0,
      requires_daily_closeout: true,
      description: "Fresh when today's Garmin Nutrition totals are available and usable for the active day.",
    },
    fallback_rules: [
      "If Garmin Nutrition is stale or missing, use a manual calories, protein, carbs, fat, and hydration summary.",
      "Apple Health calories do not substitute for Garmin Nutrition authority.",
    ],
    acquisition_method: "Garmin Connect+ Nutrition read-only totals, or a no-write manual nutrition closeout summary.",
    allowed_operation_class: READ_ONLY_OR_MANUAL,
    next_action_wording: {
      fresh: "Use Garmin Nutrition totals for fueling and recovery context.",
      stale: "Review Garmin Nutrition or provide manual calories/protein/hydration summary; do not use Apple Health calories as Garmin Nutrition.",
      missing: "Review Garmin Nutrition or provide manual calories/protein/hydration summary; do not use Apple Health calories as Garmin Nutrition.",
      default: "Keep Garmin Nutrition as the nutrition authority when usable.",
    },
  },
  rack_strength_session: {
    registry_key: "rack_strength_session",
    check_id: "strength_session",
    label: "Rack/Motra strength session",
    authority_role: "strength_log_authority",
    freshness_window: {
      unit: "days",
      max_age_days: 0,
      requires_strength_day: true,
      description: "Fresh when today's completed Rack/Motra strength session exists on a planned strength day.",
    },
    fallback_rules: [
      "If a planned strength session is missing, ask for a reported manual session summary.",
      "Do not count Apple Health workouts as completed strength history.",
    ],
    acquisition_method: "Rack/Motra completed-session review, or a reported manual session summary.",
    allowed_operation_class: READ_ONLY_OR_MANUAL,
    next_action_wording: {
      fresh: "Use Rack/Motra session as completed strength authority.",
      stale: "Review Rack/Motra after training or provide a reported manual session summary; do not count Apple Health workouts as strength history.",
      missing: "Review Rack/Motra after training or provide a reported manual session summary; do not count Apple Health workouts as strength history.",
      not_expected_today: "No Rack/Motra strength session is expected for today's schedule.",
      default: "Keep Rack/Motra as the completed strength-session authority.",
    },
  },
  rack_strength_detail: {
    registry_key: "rack_strength_detail",
    check_id: "strength_exercises",
    label: "Rack/Motra strength exercise detail",
    authority_role: "set_rep_load_authority",
    freshness_window: {
      unit: "days",
      max_age_days: 0,
      requires_strength_day: true,
      description: "Fresh when today's Rack/Motra session includes exercise, set, rep, and load detail on a planned strength day.",
    },
    fallback_rules: [
      "If Rack/Motra detail is stale or missing, use reported manual sets, reps, and load as a bridge only.",
      "Garmin strength activity can corroborate effort and physiology but does not override Rack/Motra detail by default.",
    ],
    acquisition_method: "Rack/Motra exercise-detail review, or reported manual set, rep, and load notes.",
    allowed_operation_class: READ_ONLY_OR_MANUAL,
    next_action_wording: {
      fresh: "Use Rack/Motra exercise detail for progression.",
      stale: "Review Rack/Motra exercise detail or provide reported sets/reps/load; do not infer loads from memory.",
      missing: "Review Rack/Motra exercise detail or provide reported sets/reps/load; do not infer loads from memory.",
      not_expected_today: "No set/rep/load detail is expected for today's schedule.",
      default: "Keep Rack/Motra exercise detail as the sets, reps, and loads authority.",
    },
  },
  oura_fallback: {
    registry_key: "oura_fallback",
    check_id: "oura_fallback",
    label: "Oura fallback sleep/recovery",
    authority_role: "fallback_recovery",
    freshness_window: {
      unit: "days",
      max_age_days: 1,
      requires_garmin_gap: true,
      description: "Fresh when same-day or previous-night Oura sleep/recovery is available and Garmin primary readiness is stale, missing, or unreliable.",
    },
    fallback_rules: [
      "Oura can make coaching usable as fallback without making Garmin fresh.",
      "Fresh reliable Garmin always stays the primary readiness authority.",
    ],
    acquisition_method: "Oura read-only review when Garmin primary readiness is stale, missing, or unreliable.",
    allowed_operation_class: READ_ONLY_ONLY,
    next_action_wording: {
      fresh: "Label Oura as fallback because Garmin is stale, missing, or unreliable.",
      stale: "Use Oura only as fallback if Todd reports it because Garmin is stale, missing, or unreliable.",
      missing: "Use Oura only as fallback if Todd reports it because Garmin is stale, missing, or unreliable.",
      not_expected_today: "Do not use Oura to override fresh reliable Garmin readiness.",
      default: "Treat Oura as fallback sleep/recovery only.",
    },
  },
  oura_advisor_manual_insight: {
    registry_key: "oura_advisor_manual_insight",
    check_id: null,
    label: "Oura Advisor/manual insight",
    authority_role: "manual_fallback_insight",
    freshness_window: {
      unit: "user_reported",
      max_age_days: 1,
      description: "Fresh only when Todd provides current Oura Advisor or manual insight as reported evidence.",
    },
    fallback_rules: [
      "Reported Oura insight may inform context but does not override fresh Garmin or medical/safety flags.",
      "Treat Advisor text as reported evidence, not direct provider authority.",
    ],
    acquisition_method: "Todd-reported Oura Advisor text or manual insight captured without provider automation.",
    allowed_operation_class: READ_ONLY_OR_MANUAL,
    next_action_wording: {
      fresh: "Use reported Oura insight as fallback context only.",
      stale: "Ask Todd for a current Oura Advisor/manual insight only if Garmin remains stale or unreliable.",
      missing: "Ask Todd for a current Oura Advisor/manual insight only if Garmin remains stale or unreliable.",
      default: "Use reported Oura insight only as fallback context.",
    },
  },
  apple_health: {
    registry_key: "apple_health",
    check_id: "apple_health_daily_summary",
    label: "Apple Health daily summary",
    authority_role: "supporting_evidence",
    freshness_window: {
      unit: "days",
      max_age_days: 0,
      description: "Fresh when today's Apple Health daily summary is available.",
    },
    fallback_rules: [
      "Apple Health can be fresh while Garmin/Rack authority freshness remains stale.",
      "Apple Health remains supporting evidence only and does not raise primary readiness or strength-log authority.",
    ],
    acquisition_method: "Apple Health / HealthKit daily summary read-only sync.",
    allowed_operation_class: READ_ONLY_ONLY,
    next_action_wording: {
      fresh: "Use as supporting context only; it does not raise primary readiness confidence.",
      stale: "Refresh Apple Health on device when Todd is present; keep it supporting-only.",
      missing: "Refresh Apple Health on device when Todd is present; keep it supporting-only.",
      default: "Treat Apple Health as supporting evidence only.",
    },
  },
  blood_pressure: {
    registry_key: "blood_pressure",
    check_id: "blood_pressure",
    label: "Blood pressure",
    authority_role: "safety_override",
    freshness_window: {
      unit: "days",
      max_age_days: 0,
      description: "Fresh when today's BP reading is available for the current coaching day.",
    },
    fallback_rules: [
      "If BP is stale or missing, keep the coaching posture conservative.",
      "Manual BP intake remains no-write until a separate write-readiness task is approved.",
    ],
    acquisition_method: "Todd-reported BP reading or a draft-only intake path; no provider automation.",
    allowed_operation_class: DRAFT_ONLY,
    next_action_wording: {
      fresh: "Apply BP safety gate before training intensity.",
      stale: "Todd should report a current BP reading or use the draft-only BP intake path; no write is implied.",
      missing: "Todd should report a current BP reading or use the draft-only BP intake path; no write is implied.",
      default: "Keep BP conservative and safety-sensitive until a current reading exists.",
    },
  },
  body_composition: {
    registry_key: "body_composition",
    check_id: "body_composition",
    label: "Body composition",
    authority_role: "trend_evidence",
    freshness_window: {
      unit: "days",
      max_age_days: 14,
      description: "Fresh when the most recent body-composition trend point is within the last 14 days.",
    },
    fallback_rules: [
      "Body composition is optional trend evidence and should not drive urgent coaching changes.",
      "Manual updates are acceptable when useful, but trend-only rules remain conservative.",
    ],
    acquisition_method: "Read-only trend review or manual trend update.",
    allowed_operation_class: READ_ONLY_OR_MANUAL,
    next_action_wording: {
      fresh: "Use only as trend context; do not overreact to one reading.",
      stale: "Update weight/body trend manually when useful; keep it optional and trend-only.",
      missing: "Update weight/body trend manually when useful; keep it optional and trend-only.",
      default: "Treat body composition as trend evidence only.",
    },
  },
  manual_evidence_packet: {
    registry_key: "manual_evidence_packet",
    check_id: null,
    label: "Manual evidence packet",
    authority_role: "manual_bridge",
    freshness_window: {
      unit: "user_reported",
      max_age_days: 0,
      description: "Current only when Todd composes or reports same-day manual evidence for stale or provider-bound lanes.",
    },
    fallback_rules: [
      "Manual evidence can bridge stale Garmin, BP, nutrition, body, or Rack gaps without marking those primary sources fresh.",
      "Manual evidence stays no-write and does not become provider authority by default.",
    ],
    acquisition_method: "Local no-write draft packet or Todd-reported manual evidence relay.",
    allowed_operation_class: DRAFT_ONLY,
    next_action_wording: {
      default: "Use the manual evidence packet to bridge stale or provider-bound lanes without implying provider freshness or a production write.",
    },
  },
  protected_read_only: {
    registry_key: "protected_read_only",
    check_id: null,
    label: "Protected read-only Coach verification",
    authority_role: "verified_read_only",
    freshness_window: {
      unit: "days",
      max_age_days: 0,
      description: "Fresh when a protected read-only source check succeeds without performing a write.",
    },
    fallback_rules: [
      "Protected read-only verification proves read access only.",
      "It does not prove write readiness or authorize production writes.",
    ],
    acquisition_method: "Protected read-only coach route with Todd-entered secret on an approved device.",
    allowed_operation_class: READ_ONLY_ONLY,
    next_action_wording: {
      fresh: "This sync-status response is read-only; it does not prove write readiness.",
      default: "Treat protected verification as read-only evidence only.",
    },
  },
};

const REGISTRY_BY_CHECK_ID = Object.fromEntries(
  Object.values(SOURCE_REGISTRY)
    .filter(entry => entry.check_id)
    .map(entry => [entry.check_id, entry])
);

function nextActionForState(entry, check = {}) {
  if (!entry) return check.next_action || null;
  const stateKeys = [
    check.freshness_status,
    check.status,
    check.source_state,
    "default",
  ].filter(Boolean);
  for (const key of stateKeys) {
    if (entry.next_action_wording[key]) return entry.next_action_wording[key];
  }
  return check.next_action || null;
}

export function sourceRegistryEntryForCheck(checkId) {
  return REGISTRY_BY_CHECK_ID[checkId] || null;
}

export function groupingBucketForCheck(check = {}) {
  if (check.status === "not_expected" || check.freshness_status === "not_expected_today" || check.source_state === "not_expected_today") {
    return "not_expected";
  }
  if (check.source_state === "fallback_only" && check.freshness_status === "fresh") {
    return "fallback";
  }
  if (check.source_state === "fallback_only") {
    return "needs_todd";
  }
  if (check.source_state === "verified_read_only") {
    return "fresh";
  }
  if (check.freshness_status === "fresh" || check.status === "current") {
    return "fresh";
  }
  return "needs_todd";
}

export function applySourceRegistryPolicy(check = {}) {
  const entry = sourceRegistryEntryForCheck(check.id);
  return {
    ...check,
    registry_key: entry?.registry_key || null,
    grouping_bucket: groupingBucketForCheck(check),
    next_action: nextActionForState(entry, check),
  };
}

export function buildSourceGroups(checks = []) {
  const groups = {
    fresh: [],
    fallback: [],
    needs_todd: [],
    not_expected: [],
  };

  for (const check of checks) {
    const bucket = check.grouping_bucket || groupingBucketForCheck(check);
    if (!groups[bucket]) continue;
    groups[bucket].push({
      id: check.id,
      registry_key: check.registry_key || sourceRegistryEntryForCheck(check.id)?.registry_key || null,
      label: check.label,
      status: check.status,
      source_state: check.source_state,
      freshness_status: check.freshness_status,
      authority_role: check.authority_role,
      next_action: check.next_action || null,
    });
  }

  return groups;
}

export function buildSourceRegistrySnapshot(checks = []) {
  const checksById = new Map(checks.map(check => [check.id, check]));
  return Object.values(SOURCE_REGISTRY).map(entry => {
    const check = entry.check_id ? checksById.get(entry.check_id) || null : null;
    return {
      ...entry,
      status_binding: check
        ? {
            check_id: check.id,
            status: check.status,
            source_state: check.source_state,
            freshness_status: check.freshness_status,
            grouping_bucket: check.grouping_bucket || groupingBucketForCheck(check),
            confidence_effect: check.confidence_effect || null,
            latest_date: check.latest_date || null,
            next_action: check.next_action || nextActionForState(entry, check),
          }
        : null,
    };
  });
}
