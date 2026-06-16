import { SOURCE_REGISTRY } from "./source-registry.mjs";

export const OFFICIAL_PROVIDER_SCAFFOLDING_VERSION = "official-provider-scaffolding-v1";

const DISABLED_STATUS = Object.freeze({
  enabled_by_default: false,
  integration_status: "disabled_by_default",
  implementation_mode: "mock_read_only_scaffold",
  write_status: "no_write",
  protected_route_status: "not_called",
  oauth_status: "not_started",
  browser_automation_status: "not_allowed",
  local_only: true,
});

const GARMIN_FIXTURES = Object.freeze({
  sleep_recovery: Object.freeze({
    observed_date: "2026-06-16",
    provider: "Garmin",
    training_readiness_score: 78,
    body_battery: 71,
    hrv_status_ms: 41,
    resting_heart_rate: 52,
    total_sleep_minutes: 430,
    watch_worn_reliably: true,
  }),
  activities: Object.freeze({
    observed_date: "2026-06-16",
    provider: "Garmin",
    activity_name: "Friday Strength",
    duration_minutes: 62,
    training_load: 57,
    average_heart_rate: 126,
    max_heart_rate: 154,
    corroboration_only: true,
  }),
  nutrition: Object.freeze({
    observed_date: "2026-06-16",
    provider: "Garmin Nutrition",
    calories: 2430,
    protein_g: 181,
    carbs_g: 246,
    fat_g: 72,
    hydration_ml: 3100,
    completeness: "full",
  }),
});

const OURA_FIXTURES = Object.freeze({
  fallback_sleep_recovery: Object.freeze({
    observed_date: "2026-06-16",
    provider: "Oura",
    readiness_score: 83,
    total_sleep_minutes: 437,
    hrv_avg_ms: 39,
    resting_heart_rate: 51,
    fallback_reason: "Garmin primary readiness stale or unreliable.",
  }),
  advisor_summary: Object.freeze({
    observed_date: "2026-06-16",
    provider: "Oura Advisor",
    summary: "Fallback recovery context only; do not override fresh Garmin readiness.",
    source_state: "reported_manual",
  }),
});

const PROVIDER_SCAFFOLDS = Object.freeze({
  garmin: Object.freeze({
    provider_id: "garmin",
    label: "Garmin official integration scaffold",
    authority_boundary:
      "Garmin remains primary for readiness, activities, and nutrition only when approved and truly integrated; Rack/Motra still owns completed strength detail.",
    supported_registry_keys: Object.freeze([
      "garmin_sleep_recovery",
      "garmin_activities",
      "garmin_nutrition",
    ]),
    approval_requirements: Object.freeze([
      "Garmin developer approval is required before any official integration can move beyond mock fixtures.",
      "OAuth, account linking, device setup, and protected routes remain out of scope for this scaffold.",
      "Real provider payloads must not be handled until a separate approved read-only integration task exists.",
    ]),
    admin_playbook_path: "docs/implementation/GARMIN_APPROVAL_CHECKLIST.md",
    interfaces: Object.freeze({
      read_sleep_recovery: Object.freeze({
        status: "mock_only",
        fixture_key: "sleep_recovery",
        registry_key: "garmin_sleep_recovery",
      }),
      read_activities: Object.freeze({
        status: "mock_only",
        fixture_key: "activities",
        registry_key: "garmin_activities",
      }),
      read_nutrition: Object.freeze({
        status: "mock_only",
        fixture_key: "nutrition",
        registry_key: "garmin_nutrition",
      }),
    }),
  }),
  oura: Object.freeze({
    provider_id: "oura",
    label: "Oura official integration scaffold",
    authority_boundary:
      "Oura remains fallback sleep/recovery only and must not mark Garmin fresh or override medical/safety gates.",
    supported_registry_keys: Object.freeze([
      "oura_fallback",
      "oura_advisor_manual_insight",
    ]),
    approval_requirements: Object.freeze([
      "Oura OAuth/app setup is required before any official integration can move beyond mock fixtures.",
      "Real API tokens, account linking, redirects, and protected writes remain out of scope for this scaffold.",
      "Any future Oura read path must preserve Garmin primary readiness precedence.",
    ]),
    admin_playbook_path: "docs/implementation/OURA_API_SETUP_CHECKLIST.md",
    interfaces: Object.freeze({
      read_fallback_sleep_recovery: Object.freeze({
        status: "mock_only",
        fixture_key: "fallback_sleep_recovery",
        registry_key: "oura_fallback",
      }),
      read_advisor_summary: Object.freeze({
        status: "mock_only",
        fixture_key: "advisor_summary",
        registry_key: "oura_advisor_manual_insight",
      }),
    }),
  }),
});

const PROVIDER_FIXTURES = Object.freeze({
  garmin: GARMIN_FIXTURES,
  oura: OURA_FIXTURES,
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requireScaffold(providerId) {
  const scaffold = PROVIDER_SCAFFOLDS[String(providerId || "").trim().toLowerCase()];
  if (!scaffold) {
    throw new Error(`Unknown provider scaffold: ${providerId}`);
  }
  return scaffold;
}

function fixtureFor(providerId, fixtureKey) {
  const fixtures = PROVIDER_FIXTURES[providerId];
  const fixture = fixtures?.[fixtureKey];
  if (!fixture) {
    throw new Error(`Missing fixture ${fixtureKey} for provider scaffold ${providerId}`);
  }
  return clone(fixture);
}

function scaffoldSummary(scaffold) {
  return {
    version: OFFICIAL_PROVIDER_SCAFFOLDING_VERSION,
    provider_id: scaffold.provider_id,
    label: scaffold.label,
    authority_boundary: scaffold.authority_boundary,
    supported_registry_keys: [...scaffold.supported_registry_keys],
    approval_requirements: [...scaffold.approval_requirements],
    admin_playbook_path: scaffold.admin_playbook_path,
    ...DISABLED_STATUS,
  };
}

export function listOfficialProviderScaffolds() {
  return Object.values(PROVIDER_SCAFFOLDS).map(scaffoldSummary);
}

export function getOfficialProviderScaffold(providerId) {
  const scaffold = requireScaffold(providerId);
  return {
    ...scaffoldSummary(scaffold),
    interfaces: clone(scaffold.interfaces),
  };
}

export function createMockProviderReader(providerId) {
  const scaffold = requireScaffold(providerId);

  return Object.freeze({
    ...scaffoldSummary(scaffold),
    async read(interfaceName) {
      const descriptor = scaffold.interfaces[interfaceName];
      if (!descriptor) {
        throw new Error(`Unknown ${providerId} mock interface: ${interfaceName}`);
      }

      const registryEntry = SOURCE_REGISTRY[descriptor.registry_key];
      return {
        version: OFFICIAL_PROVIDER_SCAFFOLDING_VERSION,
        provider_id: scaffold.provider_id,
        interface_name: interfaceName,
        registry_key: descriptor.registry_key,
        label: registryEntry?.label || descriptor.registry_key,
        source_quality: "api_read_only",
        fixture: fixtureFor(scaffold.provider_id, descriptor.fixture_key),
        ...DISABLED_STATUS,
      };
    },
  });
}

