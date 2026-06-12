export const WEEKLY_REVIEW_VERSION = "weekly-review-v1";

export const WEEKLY_REVIEW_SOURCE_HIERARCHY = [
  "safety/medical",
  "Garmin readiness/workout physiology",
  "Rack/Motra completed strength logs",
  "Garmin Nutrition",
  "Oura fallback",
  "Apple Health supporting/data bus",
  "Soundcore sleep aid",
  "Hume/Ocare trend",
  "memory/debrief personalization only",
];

const MS_PER_DAY = 86400000;
const DEFAULT_TIMEZONE = "Asia/Taipei";
const RED_SAFETY_TERMS = [
  /\bmigraine\b/i,
  /\basthma\s+(flare|attack|issue|problem)\b|\bwheez/i,
  /\bchest\s+pain\b/i,
  /\bfaint(ed|ing)?\b|\bsyncope\b|\bpassed\s+out\b/i,
  /\bsharp\s+pain\b/i,
  /\bradiat(ing|es|ed)\s+pain\b/i,
  /\bworsen(ing|ed|s)?\s+pain\b|\bpain\s+(got|gets|is)\s+worse\b/i,
  /\bneurological\b|\bslurred\s+speech\b|\bnumb(ness)?\b|\bweakness\b/i,
];

function asNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function compactText(value, max = 260) {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function first(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "");
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function dateText(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value);
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function addDays(isoDate, days) {
  const parsed = Date.parse(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed + days * MS_PER_DAY).toISOString().slice(0, 10);
}

function rowDate(row = {}) {
  return dateText(first(
    row.date,
    row.session_date,
    row.measured_date,
    row.summary_date,
    row.log_date,
    row.workout_date,
    row.planned_date,
    row.note_date,
    row.observation_date,
    row.created_at,
  ));
}

function inRange(date, start, end) {
  return Boolean(date && start && end && date >= start && date <= end);
}

function rowsForWeek(rows, start, end) {
  return asArray(rows).filter(row => inRange(rowDate(row), start, end));
}

function latestByDate(rows = []) {
  return [...asArray(rows)]
    .filter(row => rowDate(row))
    .sort((a, b) => rowDate(a).localeCompare(rowDate(b)))
    .at(-1) || null;
}

function statusForRows(weekRows, allRows = [], { partialThreshold = 1 } = {}) {
  if (weekRows.length >= partialThreshold) return "present";
  if (weekRows.length) return "partial";
  return asArray(allRows).length ? "stale" : "missing";
}

function coverageEntry(status, role, authority, details = []) {
  return {
    status,
    role,
    authority,
    details: details.filter(Boolean),
  };
}

function rowText(row = {}) {
  return [
    row.topic,
    row.guidance,
    row.training_impact,
    row.notes,
    row.summary,
    row.observation,
    row.action_taken,
    row.workout_title,
    row.completion_status,
    ...asArray(row.symptoms),
    ...asArray(row.red_flag_symptoms),
    ...asArray(row.pain_locations),
  ].filter(Boolean).join(" ");
}

function isGarminRow(row = {}) {
  const source = String(first(row.source, row.source_app, row.raw?.source, "")).toLowerCase();
  return source.includes("garmin")
    || row.garmin
    || row.training_readiness_score !== undefined
    || row.garmin_readiness_score !== undefined
    || row.body_battery_score !== undefined
    || row.recovery_time_hours !== undefined
    || row.hrv_status_ms !== undefined
    || row.garmin_hrv_ms !== undefined;
}

function garminReliable(row = {}) {
  const text = [
    row.garmin_data_quality,
    row.data_quality,
    row.wear_quality,
    row.device_wear,
    row.training_readiness_status,
    row.hrv_status,
    row.garmin?.data_quality,
    row.garmin?.wear_quality,
    row.garmin?.training_readiness_status,
  ].filter(Boolean).join(" ").toLowerCase();
  if (/\b(not worn|not enough data|insufficient|inconsistent|unreliable|poor wear)\b/.test(text)) return false;
  const explicitFalse = [
    row.watch_worn_overnight,
    row.worn_overnight,
    row.garmin_consistently_worn,
    row.garmin?.watch_worn_overnight,
    row.garmin?.worn_overnight,
  ].some(value => value === false || String(value).toLowerCase() === "false");
  return !explicitFalse;
}

function garminMetrics(row = {}) {
  const garmin = row.garmin || {};
  return {
    date: rowDate(row),
    source: first(row.source, garmin.source, "Garmin Connect"),
    readiness_score: asNumber(first(garmin.training_readiness_score, garmin.readiness_score, row.training_readiness_score, row.garmin_readiness_score, isGarminRow(row) ? row.recovery_score_pct : null)),
    body_battery: asNumber(first(garmin.body_battery_score, row.body_battery_score)),
    hrv_ms: asNumber(first(garmin.hrv_ms, garmin.hrv_status_ms, row.hrv_status_ms, row.garmin_hrv_ms, isGarminRow(row) ? row.hrv_ms : null)),
    resting_hr_bpm: asNumber(first(garmin.resting_hr_bpm, row.garmin_resting_hr_bpm, isGarminRow(row) ? row.resting_hr_bpm : null)),
    sleep_min: asNumber(first(garmin.total_sleep_min, row.garmin_total_sleep_min, isGarminRow(row) ? row.total_sleep_min : null)),
    recovery_time_hours: asNumber(first(garmin.recovery_time_hours, row.recovery_time_hours)),
    training_load: asNumber(first(garmin.training_load, row.training_load)),
    reliable: garminReliable(row),
  };
}

function isOuraRow(row = {}) {
  const source = String(first(row.source, row.source_app, row.raw?.source, "")).toLowerCase();
  return source.includes("oura") || row.oura || row.oura_readiness_score !== undefined;
}

function ouraMetrics(row = {}) {
  const oura = row.oura || {};
  return {
    date: rowDate(row),
    source: first(row.source, "Oura"),
    readiness_score: asNumber(first(oura.readiness_score, row.oura_readiness_score, !isGarminRow(row) ? row.recovery_score_pct : null)),
    hrv_ms: asNumber(first(oura.hrv_avg_ms, row.oura_hrv_ms, !isGarminRow(row) ? row.hrv_ms : null)),
    sleep_min: asNumber(first(oura.total_sleep_min, !isGarminRow(row) ? row.total_sleep_min : null)),
  };
}

function strengthExercises(session = {}) {
  return asArray(first(session.exercises, session.strength_exercises)).map(ex => {
    const sets = asArray(first(ex.sets, ex.strength_sets));
    return {
      name: ex.name || ex.exercise || "Unknown exercise",
      category: ex.category || null,
      set_count: sets.length,
      sets: sets.map(set => ({
        set_number: asNumber(set.set_number),
        reps: asNumber(set.reps),
        load_kg: asNumber(set.load_kg),
        load: set.load || null,
        duration_sec: asNumber(set.duration_sec),
        distance_ft: asNumber(set.distance_ft),
      })),
      notes: compactText(ex.notes, 180),
    };
  });
}

function buildStrengthEvidence(strengthRows, plannedRows, appleRows, debriefRows) {
  const sessions = strengthRows.map(row => {
    const exercises = strengthExercises(row);
    return {
      date: rowDate(row),
      title: first(row.session_name, row.workout_name, row.title, row.name, "Rack/Motra strength session"),
      source: first(row.source, "Rack/Motra"),
      exercise_count: exercises.length,
      set_count: exercises.reduce((sum, ex) => sum + ex.set_count, 0),
      exercises,
      notes: compactText(first(row.notes, row.summary), 220),
    };
  });
  const plannedStrength = plannedRows.filter(row => /strength|lift|hypertrophy/i.test(String(first(row.session_type, row.session_goal, row.theme, ""))));
  const completedDates = new Set(sessions.map(row => row.date).filter(Boolean));
  const missedPlannedStrength = plannedStrength
    .filter(row => rowDate(row) && !completedDates.has(rowDate(row)))
    .map(row => ({
      date: rowDate(row),
      planned: first(row.session_type, row.session_goal, row.theme, "planned strength"),
      status: row.status || "planned",
    }));

  return {
    authority: "Rack/Motra completed strength logs",
    completed_session_count: sessions.length,
    completed_sessions: sessions,
    exercise_names: [...new Set(sessions.flatMap(session => session.exercises.map(ex => ex.name)).filter(Boolean))],
    total_logged_sets: sessions.reduce((sum, session) => sum + session.set_count, 0),
    missed_planned_strength: missedPlannedStrength,
    apple_health_strength_counts_seen: appleRows.reduce((sum, row) => sum + (asNumber(row.strength_workout_count) || 0), 0),
    debrief_completed_exercises_seen: debriefRows.reduce((sum, row) => sum + asArray(row.completed_exercises).length, 0),
    authority_warning: "Apple Health workout counts and workout debrief completed-exercise text are not completed set-level strength authority.",
  };
}

function buildGarminContext(recoveryRows, weekStart, weekEnd) {
  const weekGarmin = recoveryRows.filter(row => isGarminRow(row));
  const reliableGarmin = weekGarmin.filter(garminReliable);
  const latestReliableGarmin = latestByDate(reliableGarmin);
  const fallbackOuraRows = recoveryRows.filter(row => isOuraRow(row) || row.oura);
  const latestOura = latestByDate(fallbackOuraRows);
  const latestGarminMetrics = latestReliableGarmin ? garminMetrics(latestReliableGarmin) : null;
  const fallbackOuraMetrics = latestOura ? ouraMetrics(latestOura) : null;
  const status = latestGarminMetrics
    ? "garmin_primary"
    : latestOura
      ? "oura_fallback"
      : weekGarmin.length
        ? "garmin_unreliable"
        : "missing";
  const warnings = [];
  if (!latestGarminMetrics) {
    if (weekGarmin.length) warnings.push("Garmin readiness/workout physiology was present but marked unreliable; use fallback conservatively.");
    else warnings.push("Garmin readiness/workout physiology is missing for the review week.");
  }
  if (!latestGarminMetrics && latestOura) warnings.push("Oura is used only as fallback because Garmin is missing, stale, or unreliable.");

  return {
    authority: "Garmin Fenix 8 / Garmin Connect when fresh and reliably worn",
    status,
    week_start: weekStart,
    week_end: weekEnd,
    garmin_rows_in_week: weekGarmin.length,
    latest_garmin: latestGarminMetrics,
    fallback_oura: !latestGarminMetrics ? fallbackOuraMetrics : null,
    conservative_interpretation: status === "garmin_primary" ? "Use Garmin as primary; note conflicts without displacing it." : "Use missing/unreliable Garmin as a yellow data-quality constraint.",
    warnings,
  };
}

function buildNutritionEvidence(nutritionRows, targets = {}) {
  const proteinTarget = asNumber(first(targets.protein_g, targets.protein_target_g, 150)) || 150;
  const fatTarget = asNumber(first(targets.fat_g, targets.fat_target_g, 70)) || 70;
  const daySummaries = nutritionRows.map(row => {
    const totals = row.totals || row.daily_totals || {};
    const protein = asNumber(first(totals.protein_g, row.protein_g));
    const fat = asNumber(first(totals.fat_g, row.fat_g));
    return {
      date: rowDate(row),
      source: first(row.source, "Garmin Connect+ Nutrition"),
      calories_kcal: asNumber(first(totals.kcal, totals.calories_kcal, row.calories_kcal)),
      protein_g: protein,
      fat_g: fat,
      carbs_g: asNumber(first(totals.carbs_g, row.carbs_g)),
      protein_gap_g: protein === null ? null : Math.max(0, Math.round(proteinTarget - protein)),
      fat_over_g: fat === null ? null : Math.max(0, Math.round(fat - fatTarget)),
      notes: compactText(row.notes, 180),
    };
  });
  const proteinMissDays = daySummaries.filter(day => (day.protein_gap_g || 0) > 0);
  const fatOverDays = daySummaries.filter(day => (day.fat_over_g || 0) > 0);
  return {
    authority: "Garmin Connect+ Nutrition when usable; manual Coach macro closeout is fallback",
    days_logged: daySummaries.length,
    targets: { protein_g: proteinTarget, fat_g: fatTarget },
    days: daySummaries,
    protein_miss_days: proteinMissDays.map(day => ({ date: day.date, gap_g: day.protein_gap_g })),
    fat_over_days: fatOverDays.map(day => ({ date: day.date, over_g: day.fat_over_g })),
    status: daySummaries.length >= 5 ? "usable" : daySummaries.length ? "partial" : "missing",
  };
}

function buildAppleHealthContext(appleRows, syncRuns) {
  const rows = appleRows.map(row => ({
    date: rowDate(row),
    source: "Apple Health / HealthKit daily summary",
    role: "supporting evidence only",
    steps: asNumber(row.steps),
    exercise_minutes: asNumber(first(row.exercise_minutes, row.exercise_min)),
    active_energy_kcal: asNumber(row.active_energy_kcal),
    workout_count: asNumber(row.workout_count),
    strength_workout_count: asNumber(row.strength_workout_count),
    sleep_minutes: asNumber(first(row.sleep_minutes, row.sleep_asleep_min)),
    resting_hr_bpm: asNumber(row.resting_hr_bpm),
    hrv_sdnn_ms: asNumber(row.hrv_sdnn_ms),
  }));
  return {
    role: "supporting evidence/data bus only",
    days_available: rows.length,
    total_steps: rows.reduce((sum, row) => sum + (row.steps || 0), 0),
    total_exercise_minutes: rows.reduce((sum, row) => sum + (row.exercise_minutes || 0), 0),
    total_active_energy_kcal: rows.reduce((sum, row) => sum + (row.active_energy_kcal || 0), 0),
    workout_counts_seen: rows.reduce((sum, row) => sum + (row.workout_count || 0), 0),
    strength_workout_counts_seen: rows.reduce((sum, row) => sum + (row.strength_workout_count || 0), 0),
    latest_sync_status: latestByDate(syncRuns)?.status || null,
    rows,
    authority_warning: "Apple Health activity and workout counts are context only and cannot become completed strength evidence.",
  };
}

function buildDebriefPatterns(debriefRows) {
  const rows = debriefRows.map(row => ({
    id: row.id || null,
    date: rowDate(row),
    title: row.workout_title || null,
    completion_status: row.completion_status || null,
    session_rpe: asNumber(row.session_rpe),
    energy_before: asNumber(row.energy_before),
    energy_after: asNumber(row.energy_after),
    pain_reported: Boolean(row.pain_reported),
    pain_severity: asNumber(row.pain_severity),
    safety_outcome: row.safety_outcome || "none",
    symptoms: asArray(row.symptoms),
    red_flag_symptoms: asArray(row.red_flag_symptoms),
    modifications: asArray(row.modifications),
    skipped_exercises: asArray(row.skipped_exercises),
    completed_exercises_count: asArray(row.completed_exercises).length,
    completed_exercises_authority: "user_reported_not_rack_motra",
  }));
  const constraints = [];
  if (rows.some(row => row.safety_outcome === "red_flag" || row.red_flag_symptoms.length)) {
    constraints.push("Recent debrief red flags require recovery/medical caution until cleared.");
  }
  if (rows.some(row => row.pain_reported || (row.pain_severity || 0) >= 3)) {
    constraints.push("Recent debrief pain should constrain next-week volume, density, or exercise selection.");
  }
  if (rows.some(row => ["skipped", "stopped_early", "partially_completed"].includes(row.completion_status))) {
    constraints.push("Incomplete sessions should be reviewed before adding progression.");
  }

  return {
    role: "subjective workout response; not Rack/Motra or Garmin authority",
    debrief_count: rows.length,
    recent_debriefs: rows,
    response_patterns: constraints,
    authority_warning: "Debrief completed exercises remain user-reported unless corroborated by Rack/Motra completed logs.",
  };
}

function buildSafetyEvents({ doctorRows, bpRows, debriefPatterns, freeText = "" }) {
  const events = [];
  for (const note of doctorRows) {
    const text = rowText(note);
    const severity = /\b(no|avoid|hold|stop|pause|skip|medical hold|do not train|no hard training)\b/i.test(text) ? "red" : /\b(modify|downshift|light only|caution|reduced)\b/i.test(text) ? "yellow" : "info";
    events.push({
      source: "doctor_notes",
      date: rowDate(note),
      severity,
      summary: compactText(text, 220),
    });
  }
  for (const bp of bpRows) {
    const systolic = asNumber(bp.systolic_mmhg);
    const diastolic = asNumber(bp.diastolic_mmhg);
    if (systolic === null && diastolic === null) continue;
    const severity = systolic >= 160 || diastolic >= 100 ? "red" : systolic >= 140 || diastolic >= 90 ? "yellow" : "info";
    if (severity !== "info") {
      events.push({
        source: "blood_pressure_readings",
        date: rowDate(bp),
        severity,
        summary: `BP ${systolic || "?"}/${diastolic || "?"} is a ${severity} safety signal.`,
      });
    }
  }
  for (const debrief of debriefPatterns.recent_debriefs || []) {
    if (debrief.safety_outcome === "red_flag" || debrief.red_flag_symptoms.length) {
      events.push({
        source: "coach_workout_debriefs",
        date: debrief.date,
        severity: "red",
        summary: `Debrief red flag: ${debrief.red_flag_symptoms.join(", ") || "red_flag safety outcome"}.`,
      });
    } else if (debrief.pain_reported || (debrief.pain_severity || 0) >= 3) {
      events.push({
        source: "coach_workout_debriefs",
        date: debrief.date,
        severity: "yellow",
        summary: `Debrief pain signal${debrief.pain_severity !== null ? ` ${debrief.pain_severity}/10` : ""}.`,
      });
    }
  }
  const text = String(freeText || "");
  for (const re of RED_SAFETY_TERMS) {
    if (re.test(text)) {
      events.push({
        source: "input_text",
        date: null,
        severity: "red",
        summary: "User text includes a red safety term.",
      });
      break;
    }
  }
  return {
    events,
    red_events: events.filter(event => event.severity === "red"),
    yellow_events: events.filter(event => event.severity === "yellow"),
    safety_policy: "Medical/safety events override devices, memory, debrief optimism, and next-week progression.",
  };
}

function buildMemoryContext(memoryRows) {
  const activeRows = memoryRows.filter(row => {
    const status = String(first(row.raw?.memory_lifecycle_status, row.lifecycle_status, row.status, "active")).toLowerCase();
    return status === "active" || status === "needs_review";
  });
  return {
    role: "reviewable coach memory for constraints and personalization only",
    active_observation_count: activeRows.length,
    relevant_observations: activeRows.map(row => ({
      id: row.id || null,
      date: rowDate(row),
      category: row.category || null,
      observation: compactText(row.observation, 220),
      confidence: row.confidence || "medium",
      source: row.source || null,
      status: first(row.raw?.memory_lifecycle_status, row.lifecycle_status, row.status, "active"),
    })),
    warning: "Coach Memory can personalize or downshift recommendations, but cannot upgrade readiness or override current safety, Garmin, Garmin Nutrition, or Rack/Motra authority.",
  };
}

function buildProposedObservations({ debriefPatterns, nutritionEvidence, safetyEvents, memoryContext }) {
  const proposals = [];
  if (debriefPatterns.response_patterns.length) {
    proposals.push({
      status: "proposed",
      review_only: true,
      category: "workout_response_pattern",
      observation: "Recent workout debriefs suggest next-week training should stay constrained until symptoms and completion quality are reviewed.",
      evidence_summary: debriefPatterns.response_patterns.join(" "),
      confidence: "medium",
      suggested_action: "Review before promoting to active memory.",
      review_date: null,
      hierarchy_warning: "This proposal cannot override current safety, Garmin readiness, Garmin workout physiology, or Rack/Motra completed logs.",
    });
  }
  if (nutritionEvidence.protein_miss_days.length || nutritionEvidence.fat_over_days.length) {
    proposals.push({
      status: "proposed",
      review_only: true,
      category: "nutrition_pattern",
      observation: "Nutrition adherence may need a next-week protein/fat guardrail.",
      evidence_summary: `${nutritionEvidence.protein_miss_days.length} protein miss day(s), ${nutritionEvidence.fat_over_days.length} fat over day(s).`,
      confidence: nutritionEvidence.days_logged >= 3 ? "medium" : "low",
      suggested_action: "Review Garmin Nutrition/manual closeout pattern before making active memory.",
      review_date: null,
      hierarchy_warning: "Nutrition proposals cannot override Garmin Nutrition totals or safety flags.",
    });
  }
  if (safetyEvents.red_events.length || safetyEvents.yellow_events.length) {
    proposals.push({
      status: "proposed",
      review_only: true,
      category: "safety_constraint",
      observation: "Safety signals appeared during the review week and should constrain next-week training until cleared.",
      evidence_summary: [...safetyEvents.red_events, ...safetyEvents.yellow_events].map(event => event.summary).join(" "),
      confidence: "high",
      suggested_action: "Keep as review-only unless Todd confirms it should become active memory.",
      review_date: null,
      hierarchy_warning: "Safety evidence already overrides memory; this proposal is for continuity, not authority.",
    });
  }
  if (memoryContext.active_observation_count && !proposals.length) {
    proposals.push({
      status: "proposed",
      review_only: true,
      category: "weekly_review_note",
      observation: "Active memory influenced personalization but did not need a new memory promotion from this weekly review.",
      evidence_summary: "Existing active memory was used as context only.",
      confidence: "low",
      suggested_action: "No promotion by default.",
      review_date: null,
      hierarchy_warning: "Memory remains non-authoritative over current safety and source data.",
    });
  }
  return proposals;
}

function makeRecommendation({ id, recommendation, evidence, source_lanes, safety_impact = "none", approval_needed = false }) {
  return {
    id,
    recommendation,
    evidence_drivers: asArray(evidence).filter(Boolean),
    source_lanes: asArray(source_lanes).filter(Boolean),
    safety_impact,
    application: "output_only",
    approval_needed,
  };
}

function buildRecommendations({ weeklyCall, strengthEvidence, garminContext, nutritionEvidence, appleContext, debriefPatterns, safetyEvents, memoryContext }) {
  const recs = [];
  if (weeklyCall.tier === "Red") {
    recs.push(makeRecommendation({
      id: "safety_downshift",
      recommendation: "Do not progress hard training next week until red safety flags are cleared.",
      evidence: safetyEvents.red_events.map(event => event.summary),
      source_lanes: ["safety/medical", "workout debriefs"],
      safety_impact: "downshift",
      approval_needed: true,
    }));
  } else if (weeklyCall.tier === "Yellow") {
    recs.push(makeRecommendation({
      id: "conservative_progression",
      recommendation: "Keep next-week progression conservative: preserve strength anchors, reduce density or optional finishers if readiness or pain is uncertain.",
      evidence: weeklyCall.drivers,
      source_lanes: ["Garmin readiness/workout physiology", "debrief personalization", "source coverage"],
      safety_impact: "conservative",
    }));
  } else if (strengthEvidence.completed_session_count) {
    recs.push(makeRecommendation({
      id: "continue_strength_anchor",
      recommendation: "Continue the Rack/Motra strength anchor next week and progress only one variable when sets remain clean.",
      evidence: [`${strengthEvidence.completed_session_count} Rack/Motra strength session(s), ${strengthEvidence.total_logged_sets} logged set(s).`],
      source_lanes: ["Rack/Motra completed strength logs"],
      safety_impact: "normal",
    }));
  }
  if (!strengthEvidence.completed_session_count && appleContext.strength_workout_counts_seen) {
    recs.push(makeRecommendation({
      id: "repair_strength_authority",
      recommendation: "Do not treat Apple Health strength workout counts as completed strength work; verify Rack/Motra logs before changing next-week progression.",
      evidence: [`Apple Health reported ${appleContext.strength_workout_counts_seen} strength workout count(s), but Rack/Motra completed sessions were missing.`],
      source_lanes: ["Apple Health supporting/data bus", "Rack/Motra completed strength logs"],
      safety_impact: "data_quality",
      approval_needed: true,
    }));
  }
  if (nutritionEvidence.protein_miss_days.length || nutritionEvidence.fat_over_days.length) {
    recs.push(makeRecommendation({
      id: "nutrition_guardrail",
      recommendation: "Use a next-week nutrition guardrail: hit protein earlier and keep fat drift visible before dinner.",
      evidence: [`Protein missed on ${nutritionEvidence.protein_miss_days.length} logged day(s); fat exceeded target on ${nutritionEvidence.fat_over_days.length} logged day(s).`],
      source_lanes: ["Garmin Nutrition"],
      safety_impact: "body_composition_support",
    }));
  }
  if (garminContext.status !== "garmin_primary") {
    recs.push(makeRecommendation({
      id: "readiness_data_quality",
      recommendation: "Treat missing or unreliable Garmin readiness as a yellow data-quality constraint; use Oura only as fallback if available.",
      evidence: garminContext.warnings,
      source_lanes: ["Garmin readiness/workout physiology", "Oura fallback"],
      safety_impact: "conservative",
    }));
  }
  if (debriefPatterns.response_patterns.length && weeklyCall.tier !== "Red") {
    recs.push(makeRecommendation({
      id: "debrief_constraint",
      recommendation: "Let debrief pain or incomplete-session patterns constrain exercise selection and density, without replacing Rack/Motra or Garmin authority.",
      evidence: debriefPatterns.response_patterns,
      source_lanes: ["memory/debrief personalization only", "Rack/Motra completed strength logs", "Garmin readiness/workout physiology"],
      safety_impact: "conservative",
    }));
  }
  if (memoryContext.active_observation_count) {
    recs.push(makeRecommendation({
      id: "memory_personalization",
      recommendation: "Use active memory only to personalize cues, preferences, and constraints; do not use it to upgrade readiness.",
      evidence: memoryContext.relevant_observations.map(row => row.observation).slice(0, 3),
      source_lanes: ["memory/debrief personalization only"],
      safety_impact: "none",
    }));
  }
  return recs;
}

function buildWeeklyCall({ safetyEvents, garminContext, nutritionEvidence, strengthEvidence, debriefPatterns }) {
  const drivers = [];
  let tier = "Green";
  if (safetyEvents.red_events.length) {
    tier = "Red";
    drivers.push(...safetyEvents.red_events.map(event => event.summary));
  } else if (safetyEvents.yellow_events.length) {
    tier = "Yellow";
    drivers.push(...safetyEvents.yellow_events.map(event => event.summary));
  }
  if (garminContext.status !== "garmin_primary") {
    if (tier === "Green") tier = "Yellow";
    drivers.push(...garminContext.warnings);
  }
  if (debriefPatterns.response_patterns.length && tier === "Green") {
    tier = "Yellow";
    drivers.push(...debriefPatterns.response_patterns);
  }
  if (!strengthEvidence.completed_session_count) drivers.push("No Rack/Motra completed strength sessions were present for the review week.");
  if (nutritionEvidence.status !== "usable") drivers.push(`Nutrition evidence is ${nutritionEvidence.status}.`);
  const summary = tier === "Red"
    ? "Red: safety/medical signals override device optimism; no hard-training progression should be recommended."
    : tier === "Yellow"
      ? "Yellow: proceed conservatively because readiness, safety, debrief, or source-quality constraints need attention."
      : "Green: evidence supports normal review-only continuation with source hierarchy intact.";
  return { tier, summary, drivers: [...new Set(drivers.filter(Boolean))] };
}

function buildSourceCoverage({ strengthRows, recoveryRows, garminContext, nutritionRows, appleRows, debriefRows, memoryRows, doctorRows, bpRows }) {
  return {
    safety_medical: coverageEntry(
      doctorRows.length || bpRows.length ? "present" : "missing",
      "override",
      "highest",
      [`doctor_notes: ${doctorRows.length}`, `blood_pressure_readings: ${bpRows.length}`],
    ),
    garmin_readiness_workout_physiology: coverageEntry(
      garminContext.status === "garmin_primary" ? "present" : garminContext.status === "missing" ? "missing" : "partial",
      "primary readiness/recovery/workout physiology when fresh",
      "primary when reliable",
      garminContext.warnings,
    ),
    rack_motra_strength: coverageEntry(
      strengthRows.length ? "present" : "missing",
      "completed set-level strength authority",
      "primary completed strength authority",
      [`completed sessions: ${strengthRows.length}`],
    ),
    garmin_nutrition: coverageEntry(
      statusForRows(nutritionRows, nutritionRows, { partialThreshold: 5 }),
      "nutrition authority when usable",
      "primary nutrition authority",
      [`logged days: ${nutritionRows.length}`],
    ),
    apple_health: coverageEntry(
      appleRows.length ? "present" : "missing",
      "supporting evidence/data bus only",
      "supporting only",
      [`daily summaries: ${appleRows.length}`],
    ),
    workout_debriefs: coverageEntry(
      debriefRows.length ? "present" : "missing",
      "subjective personalization/constraints only",
      "non-authoritative over safety/Garmin/Rack",
      [`debriefs: ${debriefRows.length}`],
    ),
    coach_memory: coverageEntry(
      memoryRows.length ? "present" : "missing",
      "reviewable memory personalization only",
      "non-authoritative over current data",
      [`active/needs-review observations: ${memoryRows.length}`],
    ),
  };
}

function buildWarnings(sourceCoverage, garminContext, appleContext, nutritionEvidence) {
  const warnings = [];
  for (const [lane, entry] of Object.entries(sourceCoverage)) {
    if (["missing", "stale", "partial"].includes(entry.status)) warnings.push(`${lane}: ${entry.status}`);
  }
  warnings.push(...garminContext.warnings);
  if (appleContext.strength_workout_counts_seen) {
    warnings.push("Apple Health strength workout counts are supporting context only and are not completed strength evidence.");
  }
  if (nutritionEvidence.status !== "usable") {
    warnings.push(`Nutrition evidence is ${nutritionEvidence.status}; do not infer missing calories/macros.`);
  }
  return [...new Set(warnings)];
}

export function buildWeeklyReviewV1(input = {}) {
  const timezone = input.timezone || input.profile?.timezone || DEFAULT_TIMEZONE;
  const weekStart = dateText(input.week_start || input.weekStart);
  if (!weekStart) throw new Error("week_start is required in YYYY-MM-DD format.");
  const weekEnd = dateText(input.week_end || input.weekEnd) || addDays(weekStart, 6);

  const strengthAll = asArray(first(input.strength_logs, input.strength_sessions));
  const recoveryAll = asArray(first(input.recovery_sleep, input.recovery));
  const nutritionAll = asArray(first(input.nutrition_log, input.nutrition_days));
  const appleAll = asArray(first(input.apple_health_daily_summaries, input.apple_health));
  const syncAll = asArray(input.apple_health_sync_runs);
  const debriefAll = asArray(first(input.coach_workout_debriefs, input.workout_debriefs));
  const memoryAll = asArray(first(input.coach_observations, input.coach_memory));
  const doctorAll = asArray(input.doctor_notes);
  const bpAll = asArray(first(input.blood_pressure, input.blood_pressure_readings));
  const plannedAll = asArray(first(input.planned_sessions, input.weekly_session_plans));

  const strengthRows = rowsForWeek(strengthAll, weekStart, weekEnd);
  const recoveryRows = rowsForWeek(recoveryAll, weekStart, weekEnd);
  const nutritionRows = rowsForWeek(nutritionAll, weekStart, weekEnd);
  const appleRows = rowsForWeek(appleAll, weekStart, weekEnd);
  const debriefRows = rowsForWeek(debriefAll, weekStart, weekEnd);
  const memoryRows = rowsForWeek(memoryAll, weekStart, weekEnd).length ? rowsForWeek(memoryAll, weekStart, weekEnd) : memoryAll;
  const doctorRows = rowsForWeek(doctorAll, weekStart, weekEnd);
  const bpRows = rowsForWeek(bpAll, weekStart, weekEnd);
  const plannedRows = rowsForWeek(plannedAll, weekStart, weekEnd);

  const garminContext = buildGarminContext(recoveryRows, weekStart, weekEnd);
  const strengthEvidence = buildStrengthEvidence(strengthRows, plannedRows, appleRows, debriefRows);
  const nutritionEvidence = buildNutritionEvidence(nutritionRows, input.nutrition_targets || input.profile?.nutrition_targets || {});
  const appleContext = buildAppleHealthContext(appleRows, syncAll);
  const debriefPatterns = buildDebriefPatterns(debriefRows);
  const safetyEvents = buildSafetyEvents({
    doctorRows,
    bpRows,
    debriefPatterns,
    freeText: input.text || input.notes || "",
  });
  const memoryContext = buildMemoryContext(memoryRows);
  const weeklyCall = buildWeeklyCall({
    safetyEvents,
    garminContext,
    nutritionEvidence,
    strengthEvidence,
    debriefPatterns,
  });
  const sourceCoverage = buildSourceCoverage({
    strengthRows,
    recoveryRows,
    garminContext,
    nutritionRows,
    appleRows,
    debriefRows,
    memoryRows: memoryContext.relevant_observations,
    doctorRows,
    bpRows,
  });
  const missingWarnings = buildWarnings(sourceCoverage, garminContext, appleContext, nutritionEvidence);
  const recommendations = buildRecommendations({
    weeklyCall,
    strengthEvidence,
    garminContext,
    nutritionEvidence,
    appleContext,
    debriefPatterns,
    safetyEvents,
    memoryContext,
  });
  const proposedObservations = buildProposedObservations({
    debriefPatterns,
    nutritionEvidence,
    safetyEvents,
    memoryContext,
  });

  const whatWorked = [];
  if (strengthEvidence.completed_session_count) {
    whatWorked.push(`${strengthEvidence.completed_session_count} Rack/Motra strength session(s) logged with ${strengthEvidence.total_logged_sets} completed set(s).`);
  }
  if (garminContext.status === "garmin_primary") whatWorked.push("Garmin readiness/workout physiology was usable as the primary recovery lane.");
  if (nutritionEvidence.days_logged) whatWorked.push(`${nutritionEvidence.days_logged} nutrition day(s) were logged for review.`);
  if (appleContext.days_available) whatWorked.push("Apple Health supporting activity context was available without changing source authority.");

  const whatFailed = [];
  if (!strengthEvidence.completed_session_count) whatFailed.push("No Rack/Motra completed strength logs were available for the review week.");
  if (garminContext.status !== "garmin_primary") whatFailed.push(...garminContext.warnings);
  if (nutritionEvidence.protein_miss_days.length) whatFailed.push(`${nutritionEvidence.protein_miss_days.length} nutrition day(s) missed the protein target.`);
  if (nutritionEvidence.fat_over_days.length) whatFailed.push(`${nutritionEvidence.fat_over_days.length} nutrition day(s) exceeded the fat target.`);
  if (debriefPatterns.response_patterns.length) whatFailed.push(...debriefPatterns.response_patterns);
  if (safetyEvents.red_events.length || safetyEvents.yellow_events.length) whatFailed.push(...[...safetyEvents.red_events, ...safetyEvents.yellow_events].map(event => event.summary));

  return {
    review_version: WEEKLY_REVIEW_VERSION,
    week_start: weekStart,
    week_end: weekEnd,
    timezone,
    weekly_call: weeklyCall,
    readiness_call: weeklyCall,
    source_coverage: sourceCoverage,
    strength_evidence: strengthEvidence,
    garmin_recovery_workout_physiology: garminContext,
    nutrition_evidence: nutritionEvidence,
    apple_health_supporting_context: appleContext,
    workout_debrief_patterns: debriefPatterns,
    pain_safety_events: safetyEvents,
    coach_memory_context: memoryContext,
    what_worked: whatWorked,
    what_failed_or_needs_attention: [...new Set(whatFailed.filter(Boolean))],
    recommended_next_week_changes: recommendations,
    proposed_observations_for_review: proposedObservations,
    missing_or_stale_data_warnings: missingWarnings,
    source_hierarchy_warning: {
      hierarchy: WEEKLY_REVIEW_SOURCE_HIERARCHY,
      warning: "This review is output-only. It cannot apply plan changes, promote active memory, override safety, or treat supporting sources as authority.",
      not_applied_automatically: true,
    },
  };
}
