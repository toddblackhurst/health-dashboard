#!/usr/bin/env python3
"""Deterministic daily coach brief refresh for launchd.

This refresh prefers the live Supabase-backed coach dashboard and only falls
back to the local JSON archive when the API is unavailable.
"""

from __future__ import annotations

import argparse
import copy
import json
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


TAIPEI = timezone(timedelta(hours=8))
GOAL_DATE = date(2026, 8, 1)
GOAL_WEIGHT = 159.3


def load_env(paths: list[Path]) -> dict[str, str]:
    values: dict[str, str] = {}
    for path in paths:
        if not path.exists():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def fetch_live_dashboard(env: dict[str, str]) -> dict:
    base = str(env.get("COACH_API_BASE", "")).rstrip("/")
    secret = str(env.get("COACH_API_SECRET", "")).strip()
    if not base or not secret:
        return {}
    req = urllib.request.Request(
        f"{base}/api/coach?action=dashboard&full=1",
        headers={"x-coach-secret": secret},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return {}
    return payload.get("dashboard") or {}


def row_date(item: dict) -> str:
    return str(
        item.get("date")
        or item.get("measured_date")
        or item.get("log_date")
        or item.get("session_date")
        or ""
    )


def completeness(item: dict) -> int:
    score = 0
    for value in item.values():
        if value in (None, "", [], {}):
            continue
        score += 2 if isinstance(value, (dict, list)) else 1
    return score


def latest_by_date(items: list[dict]) -> dict:
    valid = [x for x in items if isinstance(x, dict)]
    if not valid:
        return {}
    valid.sort(key=lambda item: (row_date(item), completeness(item), str(item.get("created_at") or item.get("timestamp") or "")))
    return valid[-1]


def readiness_from_recovery(rec: dict) -> str:
    recovery = rec.get("recovery_score_pct")
    hrv = rec.get("hrv_ms")
    sleep_min = rec.get("total_sleep_min")

    if recovery is not None and recovery < 50:
        return "Red"
    if sleep_min is not None and sleep_min < 300:
        return "Red"
    if recovery is not None and recovery >= 66 and (hrv is None or hrv >= 35):
        return "Green"
    return "Yellow"


def fmt_hours(minutes: int | float | None) -> str:
    if minutes is None:
        return "unknown sleep"
    minutes = int(round(minutes))
    return f"{minutes // 60}h{minutes % 60:02d}"


def summarize_recent_weight(body_items: list[dict]) -> tuple[float | None, str]:
    rows = [x for x in body_items if isinstance(x, dict) and x.get("weight_lbs") is not None]
    latest = latest_by_date(rows)
    weight = latest.get("weight_lbs")
    recent = [x.get("weight_lbs") for x in rows[-7:]]
    if len(recent) >= 2:
        delta = recent[-1] - recent[0]
        if abs(delta) < 0.4:
            trend = "weight is basically holding steady across the recent scale window"
        elif delta < 0:
            trend = f"weight is down {abs(delta):.1f} lb across the recent scale window"
        else:
            trend = f"weight is up {delta:.1f} lb across the recent scale window"
    else:
        trend = "not enough recent scale data to call a clean trend"
    return weight, trend


def build_upcoming(db: dict, today: date) -> dict:
    dow = str(today.isoweekday())
    sessions = db.get("weekly_session_plans", {}).get("sessions", {})
    session = copy.deepcopy(sessions.get(dow) or {})
    if session and session.get("blocks"):
        session["planned_date"] = today.isoformat()
        session["day_label"] = today.strftime("%A %b %-d")
        session["status"] = "LIVE - daily brief refreshed"
        session["coach_note"] = (
            "Use the planned structure without cross-floor supersets. Lead left-side work where relevant, "
            "keep strength near the HR cap, and keep loaded hip flexion pain-free. Skip the optional close "
            "if readiness, grip, or mechanics say the main work was enough."
        )
        session["why"] = "The point today is high-quality load and clean positions, not extra volume."
        return session

    return {
        "planned_date": today.isoformat(),
        "day_label": today.strftime("%A %b %-d"),
        "session_type": "Recovery / non-lifting day",
        "floor_plan": "Walk or easy cardio only",
        "time_cap_min": 45,
        "blocks": [],
        "coach_note": "No strength session is scheduled today. Keep it easy and protect the next lift.",
        "why": "Recovery days preserve the quality of the next anchor session.",
    }


def fallback_call(today: date, readiness: str, recovery: dict) -> tuple[str, str]:
    recovery_bits = []
    if recovery.get("recovery_score_pct") is not None:
        recovery_bits.append(f"recovery {recovery['recovery_score_pct']}%")
    if recovery.get("hrv_ms") is not None:
        recovery_bits.append(f"HRV {recovery['hrv_ms']} ms")
    if recovery.get("total_sleep_min") is not None:
        recovery_bits.append(f"sleep {fmt_hours(recovery['total_sleep_min'])}")
    if recovery.get("resting_hr_bpm") is not None:
        recovery_bits.append(f"RHR {recovery['resting_hr_bpm']} bpm")
    numbers = ", ".join(recovery_bits) if recovery_bits else "latest recovery data is incomplete"
    verb = "Train" if today.isoweekday() in (1, 3, 5) and readiness != "Red" else "Recover"
    call = f"{verb} today based on {numbers}. Keep the cap tight and adjust volume if HR or hip tolerance drifts."
    basis = f"{readiness}: {numbers}."
    return call, basis


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", required=True)
    parser.add_argument("--log-dir", required=True)
    parser.add_argument("--db-path")
    args = parser.parse_args()

    project = Path(args.project_root)
    log_dir = Path(args.log_dir)
    db_path = Path(args.db_path) if args.db_path else project / "HEALTH_DATABASE.json"
    runtime_root = db_path.parent
    db = json.loads(db_path.read_text())
    env = load_env([runtime_root / ".env.local", project / ".env.local"])
    live = fetch_live_dashboard(env)

    now = datetime.now(TAIPEI)
    today = now.date()
    today_s = today.isoformat()

    recovery_items = live.get("recovery_sleep") or db.get("recovery_sleep", [])
    body_items = live.get("body_composition") or db.get("body_composition", [])
    recovery = live.get("current", {}).get("recovery_sleep") or latest_by_date(recovery_items)

    live_brief = live.get("coaching_brief") or {}
    readiness = live_brief.get("readiness_tier") or readiness_from_recovery(recovery)
    call = live_brief.get("call")
    recovery_basis = None
    if not call:
        call, recovery_basis = fallback_call(today, readiness, recovery)
    else:
        recovery_basis = f"{readiness}: using live Supabase-backed coach dashboard."

    recovery_trend = "Live Supabase dashboard is the primary brief input; local JSON is now fallback/archive."
    weight, trend = summarize_recent_weight(body_items)
    fat_to_lose = round(max(0.0, (weight or GOAL_WEIGHT) - GOAL_WEIGHT), 1)
    weeks_remaining = round(max(0, (GOAL_DATE - today).days) / 7, 1)
    weight_text = f"{weight:.1f} lb" if weight is not None else "no current weight"
    active_adjustments = live_brief.get("active_adjustments") or []

    db["coaching_brief"] = {
        "date": today_s,
        "readiness_tier": readiness,
        "call": call,
        "sprint_gate": "N/A - sprints are Saturday-standalone." if today.isoweekday() != 6 else "Evaluate HRV >=35 ms before sprinting.",
        "progress_note": (
            f"Current scale anchor is {weight_text}; {trend}. "
            f"To reach {GOAL_WEIGHT:.1f} lb by Aug 1, the remaining cut is about {fat_to_lose:.1f} lb over {weeks_remaining:.1f} weeks."
        ),
        "encouragement": "Make today look professional: hit the main objective, keep the positions clean, and leave the junk volume alone.",
        "goal_summary": {
            "as_of": today_s,
            "current_weight_lbs": weight,
            "target_weight_lbs": GOAL_WEIGHT,
            "fat_to_lose_lbs": fat_to_lose,
            "weeks_remaining": weeks_remaining,
        },
        "active_adjustments": active_adjustments,
        "data_completeness": live_brief.get("data_completeness") or live.get("current", {}).get("data_completeness"),
        "source": "supabase-dashboard" if live else "local-json-fallback",
    }

    if isinstance(recovery, dict) and recovery:
        recovery["readiness_tier_basis"] = recovery_basis
        recovery["recovery_trend"] = recovery_trend

    db["upcoming_session"] = build_upcoming(db, today)
    db["last_updated"] = now.isoformat(timespec="seconds")

    db_path.write_text(json.dumps(db, indent=2, ensure_ascii=False) + "\n")

    log_dir.mkdir(parents=True, exist_ok=True)
    sentinel = log_dir / ".last_brief_summary"
    active_line = f"- Adjustments: {', '.join(active_adjustments[:3])}\n" if active_adjustments else ""
    sentinel.write_text(
        f"{readiness} - {call[:120]}\n"
        f"- Recovery: {recovery_basis}\n"
        f"{active_line}"
        f"- Today: {db['upcoming_session'].get('session_type', 'planned session')}\n",
        encoding="utf-8",
    )
    print(f"Updated {db_path}")
    print(sentinel.read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
