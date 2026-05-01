const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,x-coach-secret",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export function env(name) {
  return globalThis.Netlify?.env?.get(name) || process.env[name] || "";
}

export function preflight(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  return null;
}

export function requireCoachSecret(req) {
  const expected = env("COACH_API_SECRET");
  if (!expected) return "COACH_API_SECRET is not configured.";
  const supplied = req.headers.get("x-coach-secret") || "";
  if (supplied !== expected) return "Invalid coach API secret.";
  return "";
}

export async function supabase(path, options = {}) {
  const url = env("SUPABASE_URL").replace(/\/$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${text}`);
  return body;
}

export async function getProfile() {
  const rows = await supabase("profiles?select=*&order=created_at.asc&limit=1");
  return rows?.[0] || null;
}

export async function insertCoachMessage(profileId, role, body, channel = "web", raw = {}) {
  const rows = await supabase("coach_messages", {
    method: "POST",
    body: JSON.stringify([{ profile_id: profileId, role, body, channel, raw }]),
  });
  return rows?.[0] || null;
}

export function todayISO(timeZone = "Asia/Taipei") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function first(...values) {
  return values.find(v => v !== undefined && v !== null && v !== "");
}

function readinessTier(recovery, hrv, bp) {
  if (bp?.diastolic_mmhg >= 100 || recovery < 35) return "Red";
  if (bp?.diastolic_mmhg >= 90 || recovery < 60 || hrv < 30) return "Yellow-Green";
  return "Green";
}

export function coachReply(text, dashboard = {}) {
  const t = String(text || "").toLowerCase();
  const bp = dashboard.blood_pressure?.at?.(-1);
  const sleep = dashboard.recovery_sleep?.at?.(-1);
  const recovery = first(sleep?.recovery_score_pct, sleep?.bevel?.recovery_pct, sleep?.readiness?.bevel_recovery_pct);
  if (t.includes("hip")) return "Noted. Keep the hip out of deep loaded flexion today. Shorten range before pinch, and choose supported split work or hinge patterns that stay clean.";
  if (t.includes("pain")) return "Pain changes the plan. Keep it below 3/10, stop if it sharpens, and log the movement plus side. I will bias the next session toward pain-free patterns.";
  if (t.includes("short")) return "Short version: keep prep, the main anchor pair, and one trunk/carry block. Cut optional accessories first and leave at the time cap.";
  if (t.includes("nutrition") || t.includes("protein")) return "Protein first. Your default wins are salmon, chicken, whey, yogurt, and eggs. If stress or boredom is calling for sweets, eat protein before deciding.";
  if (t.includes("risk") || t.includes("bp")) return bp?.diastolic_mmhg >= 90
    ? `Main warning is BP: latest ${bp.systolic_mmhg}/${bp.diastolic_mmhg}. Keep intensity advisory-only until your doctor clears hard intervals.`
    : "Main risks are session drift, under-logged food, and ignoring sleep debt. Execute the cap, log food, and keep symptoms louder than app scores.";
  if (recovery && recovery < 60) return `Logged. Recovery is ${recovery}%, so I would train with a managed-load mindset unless symptoms say otherwise.`;
  return "Logged. I will use this as context for the next workout adjustment and weekly review.";
}

export function buildBrief(base) {
  const latestSleep = base.recovery_sleep?.at?.(-1) || {};
  const latestBp = base.blood_pressure?.at?.(-1) || {};
  const recovery = first(latestSleep.recovery_score_pct, latestSleep.bevel?.recovery_pct, latestSleep.readiness?.bevel_recovery_pct, 0);
  const hrv = first(latestSleep.hrv_ms, latestSleep.bevel?.hrv_ms, latestSleep.readiness?.hrv_ms, 0);
  const tier = readinessTier(Number(recovery), Number(hrv), latestBp);
  const bpWarning = latestBp.diastolic_mmhg >= 90 ? ` BP ${latestBp.systolic_mmhg}/${latestBp.diastolic_mmhg} is advisory-warning territory.` : "";
  return {
    readiness_tier: tier,
    recovery_pct: recovery || null,
    call: `${tier} readiness. Recovery ${recovery || "unknown"}%, HRV ${hrv || "unknown"}ms.${bpWarning} Keep doctor guidance above app guidance.`,
    session_type: tier === "Red" ? "Recovery / Walk / Mobility" : "Scheduled training with advisory gates",
    time_cap_min: tier === "Red" ? 35 : 60,
    goal_summary: { protein_target_g: 150 },
  };
}

export async function dashboardFromSupabase() {
  const profile = await getProfile();
  if (!profile) return null;
  const profileId = profile.id;
  const [rawImports, recovery, bp, body, nutrition, strength, feedback, messages] = await Promise.all([
    supabase(`raw_imports?profile_id=eq.${profileId}&select=payload,imported_at&order=imported_at.desc&limit=1`),
    supabase(`recovery_sleep?profile_id=eq.${profileId}&select=*&order=measured_date.asc`),
    supabase(`blood_pressure_readings?profile_id=eq.${profileId}&select=*&order=measured_date.asc`),
    supabase(`body_comp_measurements?profile_id=eq.${profileId}&select=*&order=measured_date.asc`),
    supabase(`nutrition_days?profile_id=eq.${profileId}&select=*&order=log_date.asc`),
    supabase(`strength_sessions?profile_id=eq.${profileId}&select=*&order=session_date.asc`),
    supabase(`session_feedback?profile_id=eq.${profileId}&select=*&order=created_at.asc`),
    supabase(`coach_messages?profile_id=eq.${profileId}&select=*&order=message_at.desc&limit=30`),
  ]);

  const base = rawImports?.[0]?.payload || {};
  base.profile = { ...(base.profile || {}), ...profile };
  base.recovery_sleep = recovery.map(r => ({ ...(r.raw || {}), ...r, date: r.measured_date }));
  base.blood_pressure = bp.map(r => ({ ...(r.raw || {}), ...r, date: r.measured_date }));
  base.body_composition = body.map(r => ({ ...(r.raw || {}), ...r, date: r.measured_date }));
  base.nutrition_log = nutrition.map(r => ({
    ...(r.raw || {}),
    date: r.log_date,
    source: r.source,
    totals: { kcal: r.calories_kcal, protein_g: r.protein_g, carbs_g: r.carbs_g, fat_g: r.fat_g },
    notes: r.notes,
  }));
  base.strength_logs = strength.map(r => ({ ...(r.raw || {}), ...r, date: r.session_date }));
  base.session_feedback = feedback.map(r => ({ ...r, date: r.session_date, timestamp: r.created_at, note: r.freeform_note }));
  base.coach_chat_notes = messages.reverse().map(m => ({ role: m.role, text: m.body, at: m.message_at, channel: m.channel }));
  base.coaching_brief = buildBrief(base);
  base.last_updated = new Date().toISOString();
  return base;
}
