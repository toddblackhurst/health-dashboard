import {
  insertCoachMessage,
  supabase,
  todayISO,
} from "./_coach-lib.mjs";

const NUMERIC_FIELDS = [
  "steps",
  "distance_mi",
  "flights_climbed",
  "active_energy_kcal",
  "basal_energy_kcal",
  "exercise_minutes",
  "stand_minutes",
  "resting_hr_bpm",
  "avg_hr_bpm",
  "min_hr_bpm",
  "max_hr_bpm",
  "hrv_sdnn_ms",
  "sleep_minutes",
  "sleep_in_bed_minutes",
];

const INTEGER_FIELDS = [
  "hrv_sample_count",
  "workout_count",
  "strength_workout_count",
  "cardio_workout_count",
];

const OBJECT_FIELDS = [
  "duplicate_policy_flags",
  "metric_quality",
  "provenance",
  "raw_summary",
];

export class AppleHealthDailyValidationError extends Error {
  constructor(message, errors = [], syncRunId = null) {
    super(message);
    this.name = "AppleHealthDailyValidationError";
    this.errors = errors;
    this.syncRunId = syncRunId;
  }
}

function asNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asInteger(value) {
  const n = asNumber(value);
  return n === null ? null : Math.round(n);
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function cleanText(value, fallback, max = 120) {
  return String(value || fallback || "").trim().slice(0, max);
}

function validateMetric(value, field, index, errors, integer = false) {
  if (value === undefined || value === null || value === "") return null;
  const n = integer ? asInteger(value) : asNumber(value);
  if (n === null) {
    errors.push({ index, field, message: `${field} must be a finite number when provided.` });
    return null;
  }
  if (n < 0) {
    errors.push({ index, field, message: `${field} cannot be negative.` });
    return null;
  }
  return n;
}

function validateObjectField(value, field, index, errors) {
  if (value === undefined || value === null) return {};
  if (!isPlainObject(value)) {
    errors.push({ index, field, message: `${field} must be an object when provided.` });
    return {};
  }
  return value;
}

export function normalizeAppleHealthDailyPayload(body = {}, profile = {}) {
  const errors = [];
  if (!isPlainObject(body)) {
    throw new AppleHealthDailyValidationError("Apple Health daily payload must be a JSON object.", [
      { field: "body", message: "Payload must be a JSON object." },
    ]);
  }
  if (!Array.isArray(body.summaries)) {
    throw new AppleHealthDailyValidationError("Apple Health daily payload requires summaries as an array.", [
      { field: "summaries", message: "summaries must be an array." },
    ]);
  }

  const timezone = cleanText(body.timezone, profile.timezone || "Asia/Taipei", 80) || "Asia/Taipei";
  const daysRequested = asInteger(body.days_requested);
  if (body.days_requested !== undefined && daysRequested === null) {
    errors.push({ field: "days_requested", message: "days_requested must be a number when provided." });
  }

  const summaries = body.summaries.map((summary, index) => {
    if (!isPlainObject(summary)) {
      errors.push({ index, field: "summary", message: "summary must be an object." });
      return null;
    }
    if (!isValidISODate(summary.summary_date)) {
      errors.push({ index, field: "summary_date", message: "summary_date must be a real YYYY-MM-DD date." });
      return null;
    }

    const row = {
      summary_date: summary.summary_date,
      source_app: cleanText(summary.source_app, "Apple Health") || "Apple Health",
      source_device: cleanText(summary.source_device, body.device_name || "iPhone") || "iPhone",
      timezone: cleanText(summary.timezone, timezone, 80) || timezone,
    };
    for (const field of NUMERIC_FIELDS) {
      row[field] = validateMetric(summary[field], field, index, errors);
    }
    for (const field of INTEGER_FIELDS) {
      row[field] = validateMetric(summary[field], field, index, errors, true);
    }
    for (const field of OBJECT_FIELDS) {
      row[field] = validateObjectField(summary[field], field, index, errors);
    }
    return row;
  }).filter(Boolean);

  if (errors.length) {
    throw new AppleHealthDailyValidationError("Apple Health daily payload failed validation.", errors);
  }

  return {
    client_version: cleanText(body.client_version, null, 80) || null,
    device_name: cleanText(body.device_name, null, 120) || null,
    timezone,
    days_requested: daysRequested ?? summaries.length,
    summaries,
    raw: isPlainObject(body.raw) ? body.raw : {},
  };
}

async function createSyncRun(profile, body = {}) {
  const rows = await supabase("apple_health_sync_runs", {
    method: "POST",
    body: JSON.stringify([{
      profile_id: profile.id,
      client_version: cleanText(body.client_version, null, 80) || null,
      device_name: cleanText(body.device_name, null, 120) || null,
      timezone: cleanText(body.timezone, profile.timezone || "Asia/Taipei", 80) || "Asia/Taipei",
      days_requested: asInteger(body.days_requested),
      status: "started",
      raw: {
        source_contract: "apple-health-daily-summary-v1",
        summary_count: Array.isArray(body.summaries) ? body.summaries.length : null,
        raw: isPlainObject(body.raw) ? body.raw : {},
      },
    }]),
  });
  return rows?.[0] || null;
}

async function updateSyncRun(syncRunId, patch = {}) {
  if (!syncRunId) return null;
  const rows = await supabase(`apple_health_sync_runs?id=eq.${encodeURIComponent(syncRunId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...patch,
      completed_at: patch.completed_at || new Date().toISOString(),
    }),
  });
  return rows?.[0] || null;
}

async function insertObservation(profile, normalized, syncRun, status, errors = []) {
  const date = normalized.summaries[0]?.summary_date
    || todayISO(normalized.timezone || profile.timezone || "Asia/Taipei");
  const title = normalized.summaries.length
    ? `Apple Health daily sync ${status}: ${normalized.summaries.length} day${normalized.summaries.length === 1 ? "" : "s"} received`
    : "Apple Health daily sync received no summaries";
  const detail = errors.length
    ? `${errors.length} Apple Health daily sync error${errors.length === 1 ? "" : "s"} occurred.`
    : "Native Apple Health daily summaries were stored as cross-check data only.";
  const rows = await supabase("coach_observations", {
    method: "POST",
    body: JSON.stringify([{
      profile_id: profile.id,
      observation_date: date,
      category: "data_sync",
      observation: `${title}. ${detail}`,
      source: "apple-health-daily",
      confidence: errors.length ? "medium" : "high",
      status: "active",
      evidence: [{
        sync_run_id: syncRun?.id || null,
        days_requested: normalized.days_requested,
        days_written: normalized.summaries.length - errors.length,
      }],
      raw: {
        status,
        errors,
        observation_type: "apple_health_daily_summary",
        linked_table: "apple_health_sync_runs",
        linked_id: syncRun?.id || null,
        source_policy: {
          role: "cross-check",
          does_not_override: ["Oura readiness", "Garmin workout physiology", "Garmin Nutrition", "Rack/Motra history"],
        },
      },
    }]),
  });
  return rows?.[0] || null;
}

async function upsertSummary(profile, syncRun, summary) {
  const row = {
    profile_id: profile.id,
    sync_run_id: syncRun.id,
    ...summary,
    updated_at: new Date().toISOString(),
  };
  return (await supabase("apple_health_daily_summaries?on_conflict=profile_id,summary_date,source_app,source_device", {
    method: "POST",
    body: JSON.stringify([row]),
  }))?.[0] || null;
}

export async function ingestAppleHealthDaily(profile, body = {}) {
  const syncRun = await createSyncRun(profile, body);
  let normalized;
  try {
    normalized = normalizeAppleHealthDailyPayload(body, profile);
  } catch (err) {
    const errors = err instanceof AppleHealthDailyValidationError
      ? err.errors
      : [{ message: err.message || String(err) }];
    await updateSyncRun(syncRun?.id, {
      status: "failed",
      days_written: 0,
      errors,
    });
    if (err instanceof AppleHealthDailyValidationError) err.syncRunId = syncRun?.id || null;
    throw err;
  }

  const errors = [];
  let daysWritten = 0;
  for (const summary of normalized.summaries) {
    try {
      const row = await upsertSummary(profile, syncRun, summary);
      if (row) daysWritten += 1;
    } catch (err) {
      errors.push({
        summary_date: summary.summary_date,
        source_app: summary.source_app,
        source_device: summary.source_device,
        message: err.message || String(err),
      });
    }
  }

  const status = errors.length
    ? (daysWritten > 0 ? "partial" : "failed")
    : "success";
  const updatedSyncRun = await updateSyncRun(syncRun.id, {
    status,
    days_requested: normalized.days_requested,
    days_written: daysWritten,
    errors,
    raw: {
      source_contract: "apple-health-daily-summary-v1",
      client_version: normalized.client_version,
      device_name: normalized.device_name,
      timezone: normalized.timezone,
      summary_dates: normalized.summaries.map(summary => summary.summary_date),
      raw: normalized.raw,
    },
  });

  let observation = null;
  try {
    observation = await insertObservation(profile, normalized, updatedSyncRun || syncRun, status, errors);
  } catch {
    observation = null;
  }
  await insertCoachMessage(
    profile.id,
    "system",
    `Apple Health daily sync ${status}: ${daysWritten}/${normalized.days_requested} day${normalized.days_requested === 1 ? "" : "s"} written.`,
    "apple-health-daily",
    {
      sync_run_id: syncRun.id,
      days_requested: normalized.days_requested,
      days_written: daysWritten,
      errors,
      observation_id: observation?.id || null,
      source_policy: "Apple Health daily summaries are cross-check data and do not override Oura/Garmin/Rack canonical lanes.",
    },
  );

  return {
    ok: status !== "failed",
    sync_run_id: syncRun.id,
    days_requested: normalized.days_requested,
    days_written: daysWritten,
    errors,
  };
}
