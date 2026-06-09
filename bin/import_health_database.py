#!/usr/bin/env python3
"""
Import HEALTH_DATABASE.json into Supabase/Postgres.

Dry run:
  python3 bin/import_health_database.py --dry-run

Live import requires:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

The importer uses REST endpoints so it does not require the Supabase CLI.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "HEALTH_DATABASE.json"


def load_db() -> dict:
    return json.loads(DB_PATH.read_text())


def post_json(url: str, key: str, table: str, rows: list[dict], on_conflict: str | None = None) -> list[dict]:
    if not rows:
        return []
    endpoint = f"{url.rstrip('/')}/rest/v1/{table}"
    if on_conflict:
        endpoint += f"?on_conflict={on_conflict}"
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(rows).encode("utf-8"),
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else []
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{table} import failed: {e.code} {body}") from e


def one_profile(db: dict) -> dict:
    p = db.get("profile", {})
    return {
        "name": p.get("name", "Todd Blackhurst"),
        "sex": p.get("sex"),
        "age": p.get("age"),
        "height_cm": p.get("height_cm"),
        "gym": p.get("gym"),
        "timezone": "Asia/Taipei",
        "goals": p.get("goals", []),
        "constraints": {
            "hip_oa": "avoid deep loaded hip flexion",
            "strength_hr_cap_bpm": 122,
            "strength_days": ["Monday", "Wednesday", "Friday"],
            "weekends": "off training",
            "morning_window": "wake 04:30; finish gym routine 09:30-10:00",
        },
        "medical_context": {
            "asthma": "controlled; daily Relvar plus emergency inhaler",
            "cholesterol": "treated with statin",
            "bp_guidance": "doctor appointment pending",
            "egfr_guidance": "doctor appointment pending",
            "sprint_guidance": "doctor appointment pending",
        },
        "source_hierarchy": {
            "medical": "doctor guidance",
            "body_composition": "DXA authoritative; BIA trend-only",
            "training": "Rack/Motra strength logs plus Garmin workout physiology override planned sessions",
            "recovery": "Garmin Fenix 8 primary when fresh and consistently worn; Oura fallback; symptoms override app readiness",
            "nutrition": "Garmin Connect+ Nutrition when complete; manual Coach closeout fallback",
        },
    }


def with_profile(rows: list[dict], profile_id: str) -> list[dict]:
    return [{**row, "profile_id": profile_id} for row in rows]


def body_comp_rows(db: dict) -> list[dict]:
    rows = []
    for r in db.get("body_composition", []):
        source = r.get("source") or "unknown"
        method = "dxa" if "DXA" in source.upper() else "bia" if "BIA" in source.upper() or "Ocare" in source else "unknown"
        confidence = 1 if method == "dxa" else 3
        rows.append({
            "measured_date": r.get("date"),
            "measured_time": r.get("time"),
            "source": source,
            "method": method,
            "confidence_tier": confidence,
            "weight_lbs": r.get("weight_lbs"),
            "body_fat_pct": r.get("body_fat_pct"),
            "lean_mass_lbs": r.get("lean_mass_lbs"),
            "visceral_fat_g": r.get("visceral_fat_g"),
            "visceral_fat_level": r.get("visceral_fat_level"),
            "skeletal_muscle_lbs": r.get("skeletal_muscle_mass_lbs"),
            "trunk_muscle_lbs": r.get("hume_trunk_muscle_lbs"),
            "body_water_pct": r.get("body_water_pct"),
            "notes": r.get("notes"),
            "raw": r,
        })
    return [r for r in rows if r["measured_date"]]


def recovery_rows(db: dict) -> list[dict]:
    rows = []
    for r in db.get("recovery_sleep", []):
        bevel = r.get("bevel", {}) if isinstance(r.get("bevel"), dict) else {}
        oura = r.get("oura", {}) if isinstance(r.get("oura"), dict) else {}
        rows.append({
            "measured_date": r.get("date"),
            "source": r.get("source", "unknown"),
            "recovery_score_pct": r.get("recovery_score_pct") or bevel.get("recovery_pct"),
            "sleep_score_pct": r.get("sleep_score_pct") or bevel.get("sleep_quality_pct") or oura.get("sleep_score"),
            "hrv_ms": r.get("hrv_ms") or bevel.get("hrv_ms") or oura.get("hrv_avg_ms"),
            "resting_hr_bpm": r.get("resting_hr_bpm") or bevel.get("rhr_bpm") or oura.get("rhr_bpm_avg"),
            "respiratory_rate_rpm": r.get("respiratory_rate_rpm") or bevel.get("respiratory_rate_rpm"),
            "spo2_pct": r.get("spo2_pct") or bevel.get("spo2_pct") or oura.get("spo2_avg_pct"),
            "wrist_temp_f": r.get("wrist_temp_f") or bevel.get("wrist_temp_f"),
            "total_sleep_min": r.get("total_sleep_min") or bevel.get("time_asleep_min") or oura.get("total_sleep_min"),
            "time_in_bed_min": r.get("time_in_bed_min") or bevel.get("time_in_bed_min") or oura.get("time_in_bed_min"),
            "sleep_efficiency_pct": r.get("sleep_efficiency_pct") or bevel.get("sleep_efficiency_pct") or oura.get("sleep_efficiency_pct"),
            "deep_sleep_min": r.get("deep_sleep_min") or bevel.get("deep_sleep_min") or oura.get("deep_sleep_min"),
            "rem_sleep_min": r.get("rem_sleep_min") or bevel.get("rem_sleep_min") or oura.get("rem_sleep_min"),
            "sleep_bank_min": r.get("sleep_bank_min") or bevel.get("sleep_bank_min") or oura.get("sleep_debt_min"),
            "readiness_tier": r.get("readiness_tier"),
            "notes": r.get("notes") or bevel.get("notes"),
            "raw": r,
        })
    return [r for r in rows if r["measured_date"]]


def bp_rows(db: dict) -> list[dict]:
    rows = []
    for r in db.get("blood_pressure", []):
        rows.append({
            "measured_date": r.get("date"),
            "systolic_mmhg": r.get("systolic_mmhg"),
            "diastolic_mmhg": r.get("diastolic_mmhg"),
            "heart_rate_bpm": r.get("heart_rate_bpm"),
            "source": r.get("source"),
            "doctor_review_flag": bool((r.get("diastolic_mmhg") or 0) >= 90),
            "notes": r.get("notes"),
            "raw": r,
        })
    return [r for r in rows if r["measured_date"] and r["systolic_mmhg"] and r["diastolic_mmhg"]]


def nutrition_day_rows(db: dict) -> list[dict]:
    rows = []
    for r in db.get("nutrition_log", []):
        totals = r.get("totals", {})
        rows.append({
            "log_date": r.get("date"),
            "source": r.get("source"),
            "completeness": "complete" if totals else "partial",
            "calories_kcal": totals.get("kcal"),
            "protein_g": totals.get("protein_g"),
            "carbs_g": totals.get("carbs_g"),
            "fat_g": totals.get("fat_g"),
            "notes": r.get("notes"),
            "raw": r,
        })
    return [r for r in rows if r["log_date"]]


def strength_rows(db: dict) -> list[dict]:
    rows = []
    for r in db.get("strength_logs", []):
        rows.append({
            "session_date": r.get("date"),
            "source": r.get("source"),
            "session_name": r.get("session_name"),
            "session_type": r.get("session_type") or r.get("type"),
            "start_time": r.get("start_time") if isinstance(r.get("start_time"), str) and len(r.get("start_time")) <= 8 else None,
            "duration_min": r.get("duration_min"),
            "total_volume_kg": r.get("volume_kg") or r.get("total_volume_kg"),
            "total_reps": r.get("total_reps"),
            "avg_hr_bpm": r.get("avg_hr_bpm"),
            "max_hr_bpm": r.get("max_hr_bpm"),
            "calories_kcal": r.get("calories_kcal") or r.get("calories_kcal_motra"),
            "motra_url": r.get("motra_url") or r.get("motra_share_url"),
            "coaching_note": r.get("coaching_note"),
            "raw": r,
        })
    return [r for r in rows if r["session_date"]]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    db = load_db()
    profile = one_profile(db)
    tables = {
        "profiles": [profile],
        "body_comp_measurements": body_comp_rows(db),
        "recovery_sleep": recovery_rows(db),
        "blood_pressure_readings": bp_rows(db),
        "nutrition_days": nutrition_day_rows(db),
        "strength_sessions": strength_rows(db),
        "raw_imports": [{
            "source": "HEALTH_DATABASE.json",
            "source_date": (db.get("meta", {}).get("last_updated") or db.get("meta", {}).get("created") or "")[:10] or None,
            "payload": db,
        }],
    }

    if args.dry_run:
        for name, rows in tables.items():
            print(f"{name}: {len(rows)} rows")
        return 0

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for live import.", file=sys.stderr)
        return 2

    inserted = post_json(url, key, "profiles", [profile], on_conflict="name")
    if not inserted:
        print("Could not upsert profile.", file=sys.stderr)
        return 1
    profile_id = inserted[0]["id"]
    print(f"Profile: {profile['name']} ({profile_id})")

    import_plan = [
        ("body_comp_measurements", with_profile(tables["body_comp_measurements"], profile_id), "profile_id,measured_date,source"),
        ("recovery_sleep", with_profile(tables["recovery_sleep"], profile_id), "profile_id,measured_date,source"),
        ("blood_pressure_readings", with_profile(tables["blood_pressure_readings"], profile_id), "profile_id,measured_date,source"),
        ("nutrition_days", with_profile(tables["nutrition_days"], profile_id), "profile_id,log_date,source"),
        ("strength_sessions", with_profile(tables["strength_sessions"], profile_id), "profile_id,session_date,source,session_name"),
        ("raw_imports", with_profile(tables["raw_imports"], profile_id), None),
    ]

    for name, rows, conflict in import_plan:
        print(f"Importing {name}: {len(rows)} rows")
        post_json(url, key, name, rows, on_conflict=conflict)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
