#!/usr/bin/env python3
"""
Send a fake inbound WhatsApp text event to the deployed webhook.

This tests parsing, Supabase logging, and coach reply generation. If
WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are configured in Netlify,
the deployed function will also attempt a real outbound WhatsApp reply.
Use a test sender number unless you intend that.

Required:
  COACH_API_BASE=https://your-site.netlify.app

Example:
  python3 bin/test_whatsapp_webhook.py --from 886900000000 "Workout done. Hip felt okay."
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="sender", required=True)
    ap.add_argument("text")
    args = ap.parse_args()

    base = os.environ.get("COACH_API_BASE", "").strip().rstrip("/")
    if not base:
        raise SystemExit("COACH_API_BASE is required.")

    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "test-waba",
            "changes": [{
                "field": "messages",
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "test-phone-id"},
                    "messages": [{
                        "from": args.sender,
                        "id": f"test-{int(time.time())}",
                        "timestamp": str(int(time.time())),
                        "type": "text",
                        "text": {"body": args.text},
                    }],
                },
            }],
        }],
    }

    req = urllib.request.Request(
        f"{base}/api/whatsapp",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(e.read().decode("utf-8", errors="replace"))
        raise
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
