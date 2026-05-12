#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

const projectRoot = process.argv[2] || process.cwd();
const runtimeRoot = process.argv[3] || path.join(process.env.HOME || "", ".todd-coach");
loadEnvFile(path.join(runtimeRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env.local"));

const {
  getProfile,
  getCoachState,
  saveCoachState,
  supabase,
} = await import("../netlify/functions/_coach-lib.mjs");

function normalizeExerciseKey(name = "") {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function mergeObjects(base = {}, patch = {}) {
  if (Array.isArray(base) || Array.isArray(patch)) return structuredClone(patch);
  const out = { ...(base || {}) };
  for (const [key, value] of Object.entries(patch || {})) {
    if (value === undefined) continue;
    if (
      value
      && typeof value === "object"
      && !Array.isArray(value)
      && out[key]
      && typeof out[key] === "object"
      && !Array.isArray(out[key])
    ) {
      out[key] = mergeObjects(out[key], value);
    } else {
      out[key] = structuredClone(value);
    }
  }
  return out;
}

const profile = await getProfile();
if (!profile) {
  console.error("No profile found.");
  process.exit(1);
}

const state = await getCoachState(profile.id);
const feedbackRows = await supabase(`session_feedback?profile_id=eq.${profile.id}&select=*&order=session_date.asc,created_at.asc`);

const adaptations = mergeObjects({
  preferred_session_cap_min: 60,
  active_rules: [],
  exercise_adjustments: {},
}, state.adaptations || {});

for (const feedback of feedbackRows || []) {
  adaptations.updated_at = feedback.created_at;
  adaptations.last_feedback_date = feedback.session_date || adaptations.last_feedback_date || null;
  const minutes = Number(feedback.completed_minutes);
  if (Number.isFinite(minutes) && minutes >= 35 && minutes <= 80) {
    adaptations.preferred_session_cap_min = Math.round(minutes);
  }

  const rules = new Set(adaptations.active_rules || []);
  const text = [
    feedback.best_movement,
    feedback.worst_movement,
    feedback.pain_notes,
    feedback.freeform_note,
    feedback.raw?.transcript,
    feedback.raw?.extracted?.summary,
    ...(feedback.raw?.extracted?.next_adjustments || []),
  ].filter(Boolean).join(" ").toLowerCase();

  if (text.includes("right side") || text.includes("body shift") || text.includes("balance")) {
    rules.add("Right-side balance issues need supported, slower unilateral lower-body work before load progression.");
  }
  if (text.includes("hip")) {
    rules.add("If the hip pinches or the body has to shift to finish the rep, regress immediately.");
  }
  if (feedback.rating_label === "repeat") {
    rules.add("When a session is marked repeat, keep the structure and progress load only if mechanics stay clean.");
  }
  if (feedback.rating_label === "retire") {
    rules.add("Retire movements that repeatedly feel wrong or force compensation even when the day is otherwise green.");
  }
  adaptations.active_rules = [...rules].slice(-8);

  const extracted = feedback.raw?.extracted || {};
  for (const item of extracted.exercise_feedback || []) {
    const key = normalizeExerciseKey(item.exercise);
    if (!key) continue;
    adaptations.exercise_adjustments[key] = {
      exercise: item.exercise,
      action: item.action || "watch",
      sentiment: item.sentiment || "neutral",
      note: item.note || null,
      updated_at: feedback.created_at,
      source_date: feedback.session_date,
    };
  }
  if (feedback.worst_movement) {
    const key = normalizeExerciseKey(feedback.worst_movement);
    adaptations.exercise_adjustments[key] = {
      exercise: feedback.worst_movement,
      action: /retire/i.test(feedback.rating_label || "") ? "replace" : "modify",
      sentiment: "negative",
      note: feedback.pain_notes || feedback.freeform_note || null,
      updated_at: feedback.created_at,
      source_date: feedback.session_date,
    };
  }
  if (feedback.best_movement) {
    const key = normalizeExerciseKey(feedback.best_movement);
    adaptations.exercise_adjustments[key] = {
      exercise: feedback.best_movement,
      action: /easy/i.test(feedback.rating_label || "") ? "progress" : "keep",
      sentiment: "positive",
      note: feedback.freeform_note || null,
      updated_at: feedback.created_at,
      source_date: feedback.session_date,
    };
  }
}

await saveCoachState(profile.id, { ...state, adaptations });
console.log(`Backfilled coach adaptations from ${feedbackRows?.length || 0} feedback rows.`);
