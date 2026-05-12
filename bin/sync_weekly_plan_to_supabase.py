#!/usr/bin/env python3
"""Sync local weekly session plans into Supabase weekly_plans/planned_sessions."""

from __future__ import annotations

import argparse
import json
import urllib.parse
import urllib.request
from pathlib import Path


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


def session_rows(weekly_plan_id: str, sessions: dict[str, dict]) -> list[dict]:
    rows = []
    for key, session in sorted(sessions.items(), key=lambda item: int(item[0])):
        if not session.get("blocks"):
            continue
        rows.append(
            {
                "weekly_plan_id": weekly_plan_id,
                "planned_date": session.get("date"),
                "day_index": int(key),
                "session_type": session.get("session_type"),
                "session_goal": session.get("theme"),
                "floor_plan": session.get("floor_plan"),
                "time_cap_min": session.get("time_cap_min"),
                "blocks": session.get("blocks", []),
                "status": session.get("status") or "locked",
            }
        )
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-path", required=True)
    parser.add_argument("--project-root", required=True)
    args = parser.parse_args()

    db_path = Path(args.db_path)
    project_root = Path(args.project_root)
    runtime_root = db_path.parent
    env = load_env([runtime_root / ".env.local", project_root / ".env.local"])
    url = env.get("SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        raise SystemExit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")

    db = json.loads(db_path.read_text(encoding="utf-8"))
    weekly = db.get("weekly_session_plans") or {}
    week_start = weekly.get("week_start")
    sessions = weekly.get("sessions") or {}
    if not week_start or not sessions:
        raise SystemExit("No weekly_session_plans found in local database.")

    client = SupabaseClient(url, key)
    profiles = client.request("profiles?select=id&order=created_at.asc&limit=1")
    if not profiles:
        raise SystemExit("No profile found in Supabase.")
    profile_id = profiles[0]["id"]

    weekly_row = {
        "profile_id": profile_id,
        "week_start": week_start,
        "label": weekly.get("week_label"),
        "status": "locked",
        "raw": weekly,
    }
    upserted = client.request("weekly_plans?on_conflict=profile_id,week_start", method="POST", body=[weekly_row]) or []
    if not upserted:
        raise SystemExit("Could not upsert weekly_plans row.")
    weekly_plan_id = upserted[0]["id"]

    existing = client.request(
        f"planned_sessions?select=id&weekly_plan_id=eq.{urllib.parse.quote(weekly_plan_id, safe='')}"
    ) or []
    for row in existing:
        client.request(f"planned_sessions?id=eq.{urllib.parse.quote(row['id'], safe='')}", method="DELETE")

    rows = session_rows(weekly_plan_id, sessions)
    if rows:
        client.request("planned_sessions", method="POST", body=rows)

    print(f"Synced week {week_start} with {len(rows)} planned sessions to Supabase.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
