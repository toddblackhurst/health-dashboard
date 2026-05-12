#!/usr/bin/env bash
# plan_week.sh
# ─────────────
# Weekly session-planning trigger. Runs Sunday at ~20:00 Taipei.
# Generates next week's Mon/Wed/Fri sessions into weekly_session_plans.sessions[1/3/5].
#
# Idempotent: if weekly_session_plans.week_start already equals next Monday,
# AND all three sessions have non-empty blocks, exits without invoking Codex.

set -uo pipefail

PROJECT_ROOT="/Users/toddsdesktop/Desktop/Codex Projects/Todd's Personal Coach/Todd's Personal Coach"
RUNTIME_ROOT="${TODD_COACH_RUNTIME_ROOT:-$HOME/.todd-coach}"
LOG_DIR="$RUNTIME_ROOT/logs"
DB_PATH="$PROJECT_ROOT/HEALTH_DATABASE.json"
LOG_FILE="$LOG_DIR/plan_week.log"
LOCK_DIR="$LOG_DIR/.plan_week.lock"
CODEX_BIN="${CODEX_BIN:-/Users/toddsdesktop/.nvm/versions/node/v24.13.1/bin/codex}"
CODEX_MODEL="${CODEX_MODEL:-gpt-5.4}"
PYTHON_BIN="${PYTHON_BIN:-/usr/bin/python3}"

mkdir -p "$LOG_DIR"
log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG_FILE"; }

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  age=$(( $(date +%s) - $(stat -f %m "$LOCK_DIR" 2>/dev/null || echo 0) ))
  if (( age > 1800 )); then
    log "Stale lock (${age}s) — taking over."; rmdir "$LOCK_DIR" 2>/dev/null
    mkdir "$LOCK_DIR" || { log "Could not acquire"; exit 0; }
  else
    log "Already running (${age}s) — skip."; exit 0
  fi
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null' EXIT

cd "$RUNTIME_ROOT" || { log "ERROR: cd failed"; exit 1; }

# Compute next Monday's date (or today if today is already Monday).
NEXT_MON=$("$PYTHON_BIN" -c "
import datetime
today = datetime.date.today()
days_until_monday = (7 - today.weekday()) % 7 or 7
# If today IS Sunday, next Monday = tomorrow.
if today.weekday() == 6:
    days_until_monday = 1
print((today + datetime.timedelta(days=days_until_monday)).isoformat())
")
NEXT_WED=$("$PYTHON_BIN" -c "import datetime; print((datetime.date.fromisoformat('$NEXT_MON') + datetime.timedelta(days=2)).isoformat())")
NEXT_FRI=$("$PYTHON_BIN" -c "import datetime; print((datetime.date.fromisoformat('$NEXT_MON') + datetime.timedelta(days=4)).isoformat())")
WEEK_LABEL=$("$PYTHON_BIN" -c "
import datetime
m = datetime.date.fromisoformat('$NEXT_MON')
s = datetime.date.fromisoformat('$NEXT_FRI') + datetime.timedelta(days=1)  # Saturday
print(f'Week of {m.strftime(\"%b %-d\")}–{s.strftime(\"%b %-d, %Y\")}')
")
PLANNED_ON=$(date '+%Y-%m-%d')
WEEK_NUM=$("$PYTHON_BIN" -c "import datetime; print(datetime.date.fromisoformat('$NEXT_MON').strftime('%U'))")

# Idempotency: skip if next week is already planned with content.
ALREADY_PLANNED=$("$PYTHON_BIN" -c "
import json
db = json.load(open('$DB_PATH'))
wsp = db.get('weekly_session_plans', {})
if wsp.get('week_start') != '$NEXT_MON':
    print('NO'); raise SystemExit
sess = wsp.get('sessions', {})
need = ['1','3','5']
for k in need:
    s = sess.get(k, {})
    if not s.get('blocks'):
        print('NO'); raise SystemExit
print('YES')
" 2>/dev/null || echo NO)

if [[ "$ALREADY_PLANNED" == "YES" ]]; then
  log "Next week ($NEXT_MON) already fully planned — skip."
  exit 0
fi

log "Planning next week starting $NEXT_MON. Mon=$NEXT_MON Wed=$NEXT_WED Fri=$NEXT_FRI."

RUN_LOG="$LOG_DIR/plan_week_$(date +%Y%m%d-%H%M%S).log"
SENTINEL="$LOG_DIR/.last_weekly_summary"
rm -f "$SENTINEL"

PROMPT=$(cat <<EOF
You are running unattended for Todd Blackhurst personal coach. Plan next week three training sessions.

Project root: $PROJECT_ROOT
Use absolute paths under that project root. Keep the Codex working directory at $RUNTIME_ROOT.

Next week:
- Monday: $NEXT_MON
- Wednesday: $NEXT_WED
- Friday: $NEXT_FRI
- Week label: $WEEK_LABEL

Steps (do all, no questions):
1. Read context by absolute path under $PROJECT_ROOT: 24_MASTER_COACH_PROMPT.md, ACTIVE_COACH_MEMORY.md, 32_COACH_MEMORY_RETRIEVAL_ENGINE.md, 26_CURRENT_BLOCK.md, 06_WEEKLY_PLANNING_ENGINE.md, 07_SESSION_GENERATOR.md, 08_MOVEMENT_PATTERN_LIBRARY.md, 09_EXERCISE_LIBRARY_MAIN.md, 10_EXERCISE_LIBRARY_CORRECTIVES_AND_ACTIVATION.md, 11_VARIATION_AND_FUN_ENGINE.md, 17_WORLDGYM_TAICHUNG_LAYOUT.md, 20_STRUCTURAL_CORRECTION_PRIORITY_USER.md, 30_HYBRID_COMPOUND_FINISHER_ENGINE.md, 31_BODY_PHOTO_ADAPTATION_ENGINE.md, SESSION_MEMORY.md.
2. Look at the last 2 weeks of strength_logs in $DB_PATH — what exercises were used, what worked, what got flagged for change in SESSION_MEMORY.md, what has not been touched recently.
   Also check ACTIVE_COACH_MEMORY.md for current active issues, avoid/retire exercises, medical open loops, and photo priorities.
3. Compose 3 sessions for $WEEK_LABEL into weekly_session_plans.sessions["1"], ["3"], ["5"]:
   - Standard pattern: Mon = Push-dominant, Wed = Pull-dominant, Fri = Corrective/Unilateral OR a mixed athletic day. Vary the third day across weeks.
   - Each session: PREP block (Floor 3, ~10 min) + Block A (anchor) + Block B (secondary) + Block C (trunk/carry close). Total ≤65 min.
   - Each block has id (prep/a/b/c), label, floor, time_min, exercises[]. Each exercise: name, prescription (e.g. "3×10/side"), load (specific kg or "BW"), cues (1-2 sentences with the key technique cue from SESSION_MEMORY.md if applicable).
   - Pull-Up MUST appear at least once per week (Todd explicit preference).
   - Suitcase Carry or Offset Farmer Carry left-hand-led MUST appear at least once per week (right-dominance correction).
   - At least one landmine pattern OR kettlebell movement per week (fun mandate).
   - Body-photo priorities MUST be addressed weekly: 2-3 trunk exposures, at least one loaded carry, one lower-ab anti-extension exposure, one chest-focused press, and one back-width/scapular-control exposure.
   - Hybrid finishers should preferentially develop trunk stiffness, loaded posture, lower-ab control, side-waist/lower-back tightening, or power transfer.
   - Do not program any movement on the current avoid/retire list unless Todd explicitly requested it.
   - Avoid repeating any exercise more than once across the 3 sessions of the week.
   - Avoid repeating any exercise that appeared 2+ times in the previous 2 weeks (rotation rule).
   - Hip OA: no deep loaded hip flexion. HR cap 122 bpm during strength.
4. Update weekly_session_plans top-level: week_start=$NEXT_MON, week_label="$WEEK_LABEL", planned_on=$PLANNED_ON.
5. Each session should have date (matching the day), day (name), session_type, theme (1 sentence), floor_plan, time_cap_min, status="LIVE — Week $WEEK_NUM planned", blocks[], session_notes (3-4 sentence rationale for the week design).
6. Update last_updated to current ISO timestamp +08:00.
7. If the planning process reveals a new active issue or open loop, update ACTIVE_COACH_MEMORY.md. If it reveals durable preference feedback, update SESSION_MEMORY.md.
8. Run: /bin/bash "$PROJECT_ROOT/sync_now.sh" -m "Weekly plan generated: $WEEK_LABEL"
9. After sync_now.sh succeeds, write $SENTINEL (overwrite):
   Line 1 (≤140 chars): "🗓 Next week planned · Mon: [type] · Wed: [type] · Fri: [type]."
   Line 2+: 3 short bullets — one per session — naming the headline movement and what is new vs. last week. Total under 320 chars.

Do not modify the CURRENT week (week_start before $NEXT_MON). Do not invent equipment not in 17_WORLDGYM_TAICHUNG_LAYOUT.md. Exit when sync succeeds.
EOF
)

if "$CODEX_BIN" exec \
     -m "$CODEX_MODEL" \
     --skip-git-repo-check \
     --ephemeral \
     -C "$RUNTIME_ROOT" \
     --add-dir "$PROJECT_ROOT" \
     --dangerously-bypass-approvals-and-sandbox \
     "$PROMPT" > "$RUN_LOG" 2>&1; then
  "$PYTHON_BIN" "$PROJECT_ROOT/bin/sync_weekly_plan_to_supabase.py" \
    --project-root "$PROJECT_ROOT" \
    --db-path "$RUNTIME_ROOT/HEALTH_DATABASE.json" >> "$RUN_LOG" 2>&1 || true
  log "OK — see $RUN_LOG"
  if [[ -f "$SENTINEL" ]]; then
    subject=$(head -1 "$SENTINEL")
    body=$(tail -n +2 "$SENTINEL")
    "$PROJECT_ROOT/bin/notify.sh" "$subject" "$body" || true
  else
    "$PROJECT_ROOT/bin/notify.sh" "Coach planned next week" \
      "Sessions for $WEEK_LABEL are now in the dashboard." || true
  fi
else
  rc=$?
  log "FAIL exit=$rc — see $RUN_LOG"
  "$PROJECT_ROOT/bin/notify.sh" "Weekly planning FAILED" \
    "Planner exited $rc. See logs/plan_week.log." || true
fi
