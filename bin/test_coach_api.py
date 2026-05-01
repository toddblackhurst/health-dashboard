#!/usr/bin/env python3
"""
Smoke-test the deployed connected coach API.

Required:
  COACH_API_BASE=https://your-site.netlify.app
  COACH_API_SECRET=...

Examples:
  python3 bin/test_coach_api.py dashboard
  python3 bin/test_coach_api.py message "Hip feels tight"
  python3 bin/test_coach_api.py feedback --date 2026-05-01 --rating right --note "Good session"
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


def env_required(name: str) -> str:
    val = os.environ.get(name, "").strip().rstrip("/")
    if not val:
        print(f"{name} is required.", file=sys.stderr)
        raise SystemExit(2)
    return val


def call(action: str, payload: dict | None = None) -> dict:
    base = env_required("COACH_API_BASE")
    secret = env_required("COACH_API_SECRET")
    url = f"{base}/api/coach?action={action}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method="POST" if payload is not None else "GET",
        headers={
            "x-coach-secret": secret,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(e.read().decode("utf-8", errors="replace"), file=sys.stderr)
        raise


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("dashboard")
    msg = sub.add_parser("message")
    msg.add_argument("text")
    fb = sub.add_parser("feedback")
    fb.add_argument("--date", required=True)
    fb.add_argument("--rating", default="right")
    fb.add_argument("--minutes", type=float)
    fb.add_argument("--note", default="")
    args = ap.parse_args()

    if args.cmd == "dashboard":
        out = call("dashboard")
        print(json.dumps({
            "source": out.get("source"),
            "profile": out.get("dashboard", {}).get("profile", {}).get("name"),
            "brief": out.get("dashboard", {}).get("coaching_brief", {}),
        }, indent=2))
    elif args.cmd == "message":
        print(json.dumps(call("message", {"text": args.text, "channel": "smoke-test"}), indent=2))
    elif args.cmd == "feedback":
        print(json.dumps(call("feedback", {
            "date": args.date,
            "rating_label": args.rating,
            "completed_minutes": args.minutes,
            "note": args.note,
            "source": "smoke-test",
        }), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
