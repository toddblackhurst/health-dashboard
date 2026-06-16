import { buildCoachEvidencePacket } from "./coach-evidence-packet.mjs";
import { SOURCE_REGISTRY } from "./source-registry.mjs";

export const RACK_CSV_INGESTION_VERSION = "rack-csv-ingestion-v1";

export const RACK_EXPORT_HEADERS = [
  "Date",
  "Workout Name",
  "Exercise",
  "Set Number",
  "Weight",
  "Reps",
  "Set Type",
  "Duration",
  "Notes",
];

function compactText(value, maxLength = 240) {
  return String(value || "").trim().slice(0, maxLength);
}

function csvRows(text = "") {
  const input = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n" && !inQuotes) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function normalizeHeaders(headers = []) {
  return headers.map(value => compactText(value, 80));
}

function validateHeaders(headers = []) {
  const normalized = normalizeHeaders(headers);
  const errors = [];

  if (!normalized.length) {
    errors.push("Rack CSV export is empty.");
    return { ok: false, headers: normalized, errors };
  }

  if (normalized.length !== RACK_EXPORT_HEADERS.length) {
    errors.push(`Rack CSV export must have exactly ${RACK_EXPORT_HEADERS.length} columns.`);
  }

  for (let index = 0; index < RACK_EXPORT_HEADERS.length; index += 1) {
    if (normalized[index] !== RACK_EXPORT_HEADERS[index]) {
      errors.push(`Expected header ${RACK_EXPORT_HEADERS[index]} at column ${index + 1}.`);
    }
  }

  return {
    ok: errors.length === 0,
    headers: normalized,
    errors,
  };
}

function padTwo(value) {
  return String(value).padStart(2, "0");
}

function normalizeDate(value) {
  const text = compactText(value, 40);
  if (!text) return null;

  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${padTwo(month)}-${padTwo(day)}`;
  }

  match = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${padTwo(month)}-${padTwo(day)}`;
  }

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    let [, month, day, year] = match;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${padTwo(month)}-${padTwo(day)}`;
  }

  const asDate = new Date(text);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toISOString().slice(0, 10);
  }

  return null;
}

function optionalNumber(value) {
  const text = compactText(value, 40);
  if (!text) return null;
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return Number.NaN;
  return Number(text);
}

function normalizeRow(rawRow = [], rowNumber = 0, options = {}) {
  const timezone = compactText(options.timezone || "Asia/Taipei", 80) || "Asia/Taipei";
  const sourceName = compactText(options.source_name || "rack_csv_export", 80) || "rack_csv_export";
  const row = Object.fromEntries(RACK_EXPORT_HEADERS.map((header, index) => [header, compactText(rawRow[index], 500)]));
  const errors = [];
  const sessionDate = normalizeDate(row.Date);
  if (!sessionDate) errors.push("Date must be a valid session date.");
  if (!row["Workout Name"]) errors.push("Workout Name is required.");
  if (!row.Exercise) errors.push("Exercise is required.");

  const setNumberValue = optionalNumber(row["Set Number"]);
  if (setNumberValue === null || Number.isNaN(setNumberValue) || !Number.isInteger(setNumberValue) || setNumberValue <= 0) {
    errors.push("Set Number must be a positive integer.");
  }

  const weightValue = optionalNumber(row.Weight);
  if (Number.isNaN(weightValue)) errors.push("Weight must be numeric when present.");

  const repsValue = optionalNumber(row.Reps);
  if (Number.isNaN(repsValue)) errors.push("Reps must be numeric when present.");

  if (!row["Set Type"]) errors.push("Set Type is required.");

  const sessionKey = sessionDate && row["Workout Name"]
    ? `${sourceName}|${sessionDate}|${row["Workout Name"]}`.toLowerCase()
    : null;
  const duplicateRiskKey = sessionKey && row.Exercise && Number.isInteger(setNumberValue)
    ? `${sessionKey}|${row.Exercise}|${setNumberValue}`.toLowerCase()
    : null;

  return {
    ok: errors.length === 0,
    row_number: rowNumber,
    raw: row,
    errors,
    normalized: {
      source_name: sourceName,
      timezone,
      session_date: sessionDate,
      workout_name: row["Workout Name"] || null,
      exercise: row.Exercise || null,
      set_number: Number.isInteger(setNumberValue) ? setNumberValue : null,
      weight: weightValue === null || Number.isNaN(weightValue) ? null : weightValue,
      reps: repsValue === null || Number.isNaN(repsValue) ? null : repsValue,
      set_type: row["Set Type"] || null,
      duration: row.Duration || null,
      notes: row.Notes || null,
      session_key: sessionKey,
      duplicate_risk_key: duplicateRiskKey,
    },
  };
}

function buildSessions(rows = []) {
  const sessionMap = new Map();

  for (const row of rows) {
    const sessionKey = row.session_key;
    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, {
        session_key: sessionKey,
        session_date: row.session_date,
        workout_name: row.workout_name,
        exercise_count: 0,
        set_count: 0,
        duplicate_risk_key: sessionKey,
        exercises: new Map(),
      });
    }

    const session = sessionMap.get(sessionKey);
    if (!session.exercises.has(row.exercise)) {
      session.exercises.set(row.exercise, {
        name: row.exercise,
        set_count: 0,
        sets: [],
      });
      session.exercise_count += 1;
    }

    const exercise = session.exercises.get(row.exercise);
    exercise.sets.push({
      set_number: row.set_number,
      weight: row.weight,
      reps: row.reps,
      set_type: row.set_type,
      duration: row.duration,
      notes: row.notes,
      duplicate_risk_key: row.duplicate_risk_key,
    });
    exercise.set_count += 1;
    session.set_count += 1;
  }

  return [...sessionMap.values()].map(session => ({
    session_key: session.session_key,
    session_date: session.session_date,
    workout_name: session.workout_name,
    exercise_count: session.exercise_count,
    set_count: session.set_count,
    duplicate_risk_key: session.duplicate_risk_key,
    exercises: [...session.exercises.values()],
  }));
}

function duplicateWarnings(validRows = []) {
  const duplicates = new Map();
  for (const row of validRows) {
    if (!row.duplicate_risk_key) continue;
    duplicates.set(row.duplicate_risk_key, (duplicates.get(row.duplicate_risk_key) || 0) + 1);
  }

  return [...duplicates.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => `Duplicate-risk rows share ${key} (${count} rows). This local bridge does not de-duplicate production data.`);
}

function rackSourceAuthority(validSessions = []) {
  const sessionEntry = SOURCE_REGISTRY.rack_strength_session;
  const detailEntry = SOURCE_REGISTRY.rack_strength_detail;
  const garminEntry = SOURCE_REGISTRY.garmin_activities;

  return {
    session_registry_key: sessionEntry.registry_key,
    session_authority_role: sessionEntry.authority_role,
    detail_registry_key: detailEntry.registry_key,
    detail_authority_role: detailEntry.authority_role,
    garmin_registry_key: garminEntry.registry_key,
    garmin_authority_role: garminEntry.authority_role,
    garmin_corroboration_only: true,
    garmin_corroboration_rule: garminEntry.fallback_rules[1],
    fresh_registry_keys: validSessions.length ? [sessionEntry.registry_key, detailEntry.registry_key] : [],
  };
}

function rackRefreshSummary(validSessions = [], invalidRowCount = 0, warnings = []) {
  const authority = rackSourceAuthority(validSessions);
  const first = validSessions[0] || null;
  return {
    session_date: first?.session_date || null,
    workout_name: first?.workout_name || null,
    session_count: validSessions.length,
    exercise_count: first?.exercise_count || 0,
    set_count: first?.set_count || 0,
    missing_or_invalid_row_count: invalidRowCount,
    duplicate_risk_warnings: warnings,
    source_authority: authority,
    source_groups: {
      fresh: authority.fresh_registry_keys.map(registryKey => ({
        registry_key: registryKey,
        label: SOURCE_REGISTRY[registryKey].label,
        status: "current",
        source_state: "fresh",
        freshness_status: "fresh",
      })),
      fallback: [],
      needs_todd: [],
    },
    garmin_policy: "Garmin-only strength activity remains corroborating only and does not override Rack detail by default.",
    write_status: "no_write",
    protected_route_status: "not_called",
  };
}

function sessionObservedWindow(sessionDate, timezone = "Asia/Taipei") {
  const day = compactText(sessionDate, 40) || "1970-01-01";
  return {
    start_at: `${day}T00:00:00.000Z`,
    end_at: `${day}T23:59:59.000Z`,
    timezone,
  };
}

function packetSafeExercises(exercises = []) {
  return exercises.map(exercise => ({
    name: exercise.name,
    set_count: exercise.set_count,
    sets: (exercise.sets || []).map(set => ({
      set_number: set.set_number,
      weight: set.weight,
      reps: set.reps,
      set_type: set.set_type,
      duration: set.duration,
      notes: set.notes,
      duplicate_risk_signature: set.duplicate_risk_key,
    })),
  }));
}

export function parseRackCsvRows(csvText = "", options = {}) {
  const parsedRows = csvRows(csvText);
  const headerValidation = validateHeaders(parsedRows[0] || []);
  const dataRows = headerValidation.ok ? parsedRows.slice(1) : [];
  const normalizedRows = [];
  const validationErrors = [...headerValidation.errors];

  dataRows.forEach((rawRow, index) => {
    if (!rawRow.some(cell => compactText(cell, 40))) return;
    const normalized = normalizeRow(rawRow, index + 2, options);
    normalizedRows.push(normalized);
    if (!normalized.ok) {
      validationErrors.push(`Row ${normalized.row_number}: ${normalized.errors.join(" ")}`);
    }
  });

  const validRows = normalizedRows.filter(row => row.ok).map(row => row.normalized);
  const invalidRows = normalizedRows.filter(row => !row.ok).map(row => ({
    row_number: row.row_number,
    errors: row.errors,
    raw: row.raw,
  }));
  const sessions = buildSessions(validRows);
  const warnings = duplicateWarnings(validRows);

  return {
    ok: headerValidation.ok && validRows.length > 0 && validationErrors.length === 0,
    version: RACK_CSV_INGESTION_VERSION,
    headers: headerValidation.headers,
    valid_rows: validRows,
    invalid_rows: invalidRows,
    validation_errors: validationErrors,
    duplicate_risk_warnings: warnings,
    sessions,
  };
}

export function buildRackCsvExportBridge(input = {}) {
  const timezone = compactText(input.timezone || "Asia/Taipei", 80) || "Asia/Taipei";
  const parsed = parseRackCsvRows(input.csv_text || "", {
    timezone,
    source_name: input.source_name || "rack_csv_export",
  });
  const validSessions = parsed.sessions || [];
  const sourceAuthority = rackSourceAuthority(validSessions);
  const refreshSummary = rackRefreshSummary(
    validSessions,
    parsed.invalid_rows.length,
    parsed.duplicate_risk_warnings
  );

  const evidencePackets = validSessions.map(session => buildCoachEvidencePacket({
    packet_type: "rack_strength_export",
    observed_window: sessionObservedWindow(session.session_date, timezone),
    generated_at: input.generated_at || new Date().toISOString(),
    evidence: {
      workout_date: session.session_date,
      workout_name: session.workout_name,
      exercise_count: session.exercise_count,
      set_count: session.set_count,
      duplicate_risk_signature: session.duplicate_risk_key,
      exercises: packetSafeExercises(session.exercises),
    },
  }));

  return {
    ok: parsed.validation_errors.length === 0 && evidencePackets.length > 0,
    version: RACK_CSV_INGESTION_VERSION,
    source: "Rack/Motra completed-history CSV export",
    session_count: validSessions.length,
    valid_row_count: parsed.valid_rows.length,
    invalid_row_count: parsed.invalid_rows.length,
    validation_errors: parsed.validation_errors,
    duplicate_risk_warnings: parsed.duplicate_risk_warnings,
    source_authority: sourceAuthority,
    sessions: validSessions,
    refresh_summary: refreshSummary,
    evidence_packets: evidencePackets,
    write_status: "no_write",
    protected_route_status: "not_called",
    no_secret_values: true,
    no_write_performed: true,
    local_only: true,
  };
}
