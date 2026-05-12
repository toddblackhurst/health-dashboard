#!/usr/bin/env python3
"""Clean duplicate or malformed coach intake rows in Supabase."""

from __future__ import annotations

import argparse
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path


TABLES = [
    {
        "name": "recovery_sleep",
        "date_key": "measured_date",
        "source_key": "source",
        "fields": "id,profile_id,measured_date,source,recovery_score_pct,sleep_score_pct,hrv_ms,resting_hr_bpm,respiratory_rate_rpm,spo2_pct,wrist_temp_f,total_sleep_min,time_in_bed_min,sleep_efficiency_pct,deep_sleep_min,rem_sleep_min,sleep_bank_min,readiness_tier,notes,raw,created_at",
    },
    {
        "name": "body_comp_measurements",
        "date_key": "measured_date",
        "source_key": "source",
        "fields": "id,profile_id,measured_date,source,method,confidence_tier,weight_lbs,body_fat_pct,lean_mass_lbs,visceral_fat_g,visceral_fat_level,skeletal_muscle_lbs,trunk_muscle_lbs,body_water_pct,notes,raw,created_at",
    },
    {
        "name": "nutrition_days",
        "date_key": "log_date",
        "source_key": "source",
        "fields": "id,profile_id,log_date,source,completeness,calories_kcal,protein_g,carbs_g,fat_g,sodium_mg,fiber_g,notes,raw,created_at",
    },
]


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


class SupabaseClient:
    def __init__(self, base_url: str, key: str):
        self.base_url = base_url.rstrip("/")
        self.key = key

    def request(self, path: str, *, method: str = "GET", body: object | None = None):
        data = None if body is None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/rest/v1/{path}",
            data=data,
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation,resolution=merge-duplicates",
            },
            method=method,
        )
        with urllib.request.urlopen(req, timeout=45) as response:
            text = response.read().decode("utf-8")
        return json.loads(text) if text else None


def normalize_source(source: str | None, fallback: str) -> str:
    cleaned = str(source or fallback).strip().lower()
    cleaned = re.sub(r"-[0-9a-f]{8,}$", "", cleaned)
    cleaned = cleaned.replace("-daily", "").replace("-morning", "").replace("-evening", "").replace("-reading", "")
    return cleaned


def completeness(row: dict) -> int:
    score = 0
    for value in row.values():
        if value in (None, "", [], {}):
            continue
        score += 2 if isinstance(value, (dict, list)) else 1
    return score


def merge_rows(base: dict, patch: dict) -> dict:
    merged = dict(base)
    for key, value in patch.items():
        if value in (None, "", [], {}):
            continue
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            child = dict(merged[key])
            child.update(value)
            merged[key] = child
            continue
        merged[key] = value
    return merged


def apply_plausibility(config: dict, row: dict) -> dict:
    cleaned = dict(row)
    if config["name"] == "body_comp_measurements":
        weight = cleaned.get("weight_lbs")
        if weight is not None and (float(weight) < 100 or float(weight) > 400):
            cleaned["weight_lbs"] = None
            cleaned["notes"] = f"{(cleaned.get('notes') or '').strip()} Implausible weight cleared during database cleanup.".strip()
        body_fat = cleaned.get("body_fat_pct")
        if body_fat is not None and (float(body_fat) < 2 or float(body_fat) > 60):
            cleaned["body_fat_pct"] = None
    if config["name"] == "nutrition_days":
        protein = float(cleaned.get("protein_g") or 0)
        carbs = float(cleaned.get("carbs_g") or 0)
        fat = float(cleaned.get("fat_g") or 0)
        calories = cleaned.get("calories_kcal")
        if calories is not None:
            calories_value = float(calories)
            min_calories = protein * 4 + carbs * 4 + fat * 9
            if calories_value + 50 < min_calories:
                cleaned["calories_kcal"] = None
                cleaned["notes"] = f"{(cleaned.get('notes') or '').strip()} Calories cleared because parsed total was below visible macro calories.".strip()
    return cleaned


def cleanup_table(client: SupabaseClient, config: dict, apply_changes: bool) -> list[str]:
    rows = client.request(f"{config['name']}?select={config['fields']}&order={config['date_key']}.asc,created_at.asc") or []
    grouped: dict[tuple[str, str, str], list[dict]] = {}
    for row in rows:
        group_key = (
            row["profile_id"],
            str(row.get(config["date_key"]) or ""),
            normalize_source(row.get(config["source_key"]), config["name"]),
        )
        grouped.setdefault(group_key, []).append(row)

    summaries: list[str] = []
    for (_profile_id, date_text, source_family), items in grouped.items():
        if config["name"] == "nutrition_days":
            for item in items:
                if item.get("calories_kcal") is not None and float(item["calories_kcal"]) < 0:
                    item["calories_kcal"] = None
                    note = (item.get("notes") or "").strip()
                    extra = "Negative calorie value cleared during database cleanup."
                    item["notes"] = f"{note} {extra}".strip()
        if len(items) == 1 and completeness(items[0]) > 0:
            row = items[0]
            cleaned = apply_plausibility(config, row)
            changed = any(cleaned.get(key) != row.get(key) for key in cleaned.keys() if key not in {"id", "profile_id", "created_at"})
            if apply_changes and changed:
                client.request(
                    f"{config['name']}?id=eq.{urllib.parse.quote(row['id'], safe='')}",
                    method="PATCH",
                    body={k: v for k, v in cleaned.items() if k not in {"id", "profile_id", "created_at"}},
                )
                summaries.append(f"{config['name']} {date_text} {source_family}: 1 row cleaned")
            continue

        items_sorted = sorted(items, key=completeness, reverse=True)
        keep = dict(items_sorted[0])
        for row in items_sorted[1:]:
            keep = merge_rows(keep, row) if completeness(row) >= completeness(keep) else merge_rows(row, keep)
        keep = apply_plausibility(config, keep)

        summaries.append(f"{config['name']} {date_text} {source_family}: {len(items)} rows -> 1")
        if not apply_changes:
            continue

        keep_id = keep["id"]
        patch_body = {k: v for k, v in keep.items() if k not in {"id", "profile_id", "created_at"}}
        client.request(
            f"{config['name']}?id=eq.{urllib.parse.quote(keep_id, safe='')}",
            method="PATCH",
            body=patch_body,
        )
        for row in items:
            if row["id"] == keep_id:
                continue
            client.request(f"{config['name']}?id=eq.{urllib.parse.quote(row['id'], safe='')}", method="DELETE")
    return summaries


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", required=True)
    parser.add_argument("--runtime-root", default=str(Path.home() / ".todd-coach"))
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    project_root = Path(args.project_root)
    runtime_root = Path(args.runtime_root)
    env = load_env([runtime_root / ".env.local", project_root / ".env.local"])
    url = env.get("SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        raise SystemExit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")

    client = SupabaseClient(url, key)
    all_summaries: list[str] = []
    for table in TABLES:
        all_summaries.extend(cleanup_table(client, table, args.apply))

    mode = "APPLIED" if args.apply else "DRY RUN"
    print(mode)
    for line in all_summaries:
        print(line)
    if not all_summaries:
        print("No cleanup actions needed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
