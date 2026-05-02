#!/usr/bin/env python3
"""Poll an iCloud screenshots folder and log new images to the coach API."""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import json
import mimetypes
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = PROJECT_ROOT / ".env.local"
LOG_DIR = PROJECT_ROOT / "logs"
STATE_FILE = LOG_DIR / "icloud_screenshot_watcher_state.json"
LOG_FILE = LOG_DIR / "icloud_screenshot_watcher.log"
LOCAL_INBOX = PROJECT_ROOT / "screenshots" / "inbox"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"}
TYPE_ALIASES = {
    "blood_pressure": "bp",
    "bp": "bp",
    "nutrition": "food",
    "food": "food",
    "meal": "food",
    "body_composition": "body",
    "body": "body",
    "recovery_sleep": "recovery",
    "recovery": "recovery",
    "sleep": "recovery",
    "activity_session": "activity",
    "activity": "activity",
    "strength_session": "strength",
    "strength": "strength",
    "workout_feedback": "workout",
    "workout": "workout",
    "doctor_note": "doctor",
    "doctor": "doctor",
    "medical": "doctor",
    "note": "note",
}


def log(message: str) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().astimezone().isoformat(timespec="seconds")
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(f"[{stamp}] {message}\n")


def load_env() -> dict[str, str]:
    values = {}
    if ENV_FILE.exists():
        for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    values.update(os.environ)
    return values


def default_icloud_inbox() -> Path:
    return Path.home() / "Library" / "Mobile Documents" / "com~apple~CloudDocs" / "Coach Screenshots"


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {"processed_hashes": {}, "processed_paths": {}}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        backup = STATE_FILE.with_suffix(f".bad-{int(time.time())}.json")
        STATE_FILE.rename(backup)
        log(f"State file was invalid JSON; moved it to {backup}")
        return {"processed_hashes": {}, "processed_paths": {}}


def save_state(state: dict) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(STATE_FILE)


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def is_ready(path: Path, min_age_seconds: int) -> bool:
    try:
        stat = path.stat()
    except FileNotFoundError:
        return False
    return time.time() - stat.st_mtime >= min_age_seconds and stat.st_size > 0


def iter_images(inbox: Path) -> list[Path]:
    if not inbox.exists():
        return []
    images = [
        path
        for path in inbox.rglob("*")
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
        and not path.name.startswith(".")
    ]
    return sorted(images, key=lambda p: p.stat().st_mtime)


def copied_path(original: Path, digest: str, modified: float) -> Path:
    stamp = dt.datetime.fromtimestamp(modified).strftime("%Y%m%d-%H%M%S")
    safe_stem = "".join(c if c.isalnum() or c in "-_" else "-" for c in original.stem)[:60]
    return LOCAL_INBOX / f"{stamp}-{safe_stem}-{digest[:10]}{original.suffix.lower()}"


def post_intake(env: dict[str, str], payload: dict) -> dict:
    base = env.get("COACH_API_BASE", "").rstrip("/")
    secret = env.get("COACH_API_SECRET", "")
    if not base:
        raise RuntimeError("COACH_API_BASE is missing from .env.local")
    if not secret:
        raise RuntimeError("COACH_API_SECRET is missing from .env.local")

    request = urllib.request.Request(
        f"{base}/api/coach?action=intake",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-coach-secret": secret,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Coach API returned {err.code}: {body}") from err


def fallback_payload(original: Path, local_copy: Path, digest: str, reason: str) -> dict:
    stat = original.stat()
    modified_at = dt.datetime.fromtimestamp(stat.st_mtime).astimezone().isoformat(timespec="seconds")
    today = dt.datetime.now().astimezone().date().isoformat()
    return {
        "type": "note",
        "date": today,
        "summary": f"Screenshot received but not vision-parsed: {original.name}",
        "notes": (
            f"Vision parsing did not run: {reason}. "
            f"Local copy: {local_copy}. "
            f"Original iCloud path: {original}. "
            "The screenshot is preserved for manual review."
        ),
        "source": f"vision-fallback-{digest[:10]}",
        "raw": {
            "kind": "screenshot",
            "original_path": str(original),
            "local_copy_path": str(local_copy),
            "filename": original.name,
            "extension": original.suffix.lower(),
            "sha256": digest,
            "size_bytes": stat.st_size,
            "modified_at": modified_at,
            "detected_at": dt.datetime.now().astimezone().isoformat(timespec="seconds"),
        },
    }


def image_for_openai(local_copy: Path, digest: str) -> Path:
    if local_copy.suffix.lower() not in {".heic", ".heif"}:
        return local_copy
    converted = LOCAL_INBOX / f"{local_copy.stem}-{digest[:10]}.jpg"
    if converted.exists():
        return converted
    result = subprocess.run(
        ["/usr/bin/sips", "-s", "format", "jpeg", str(local_copy), "--out", str(converted)],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0 or not converted.exists():
        raise RuntimeError(f"Could not convert HEIC image with sips: {result.stderr.strip()}")
    return converted


def data_url(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def vision_prompt(original: Path, local_copy: Path, digest: str) -> str:
    today = dt.datetime.now().astimezone().date().isoformat()
    return f"""
You are the intake parser for Todd Blackhurst's private athletic coaching system.

Task: read this iPhone screenshot/image, identify the app/source, extract all coach-relevant health, training, nutrition, recovery, or medical data, and return ONLY valid JSON.

Todd context:
- Male, 57, Taichung, Asia/Taipei.
- Sources he uses: Bevel, Oura, Apple Fitness/Apple Watch, Motra/Train Fitness, Ocare3, Hume Body Pod, doctor/hospital documents.
- He does not use WHOOP. Never label a screenshot as WHOOP.
- Nutrition source of truth is Bevel Food Tracking.
- Deep hip positions can irritate his hip; doctor currently says keep training while tracking BP.

Image metadata:
- filename: {original.name}
- local_copy_path: {local_copy}
- sha256: {digest}
- today's local date: {today}

Return JSON in this exact shape:
{{
  "source_app": "Bevel|Oura|Apple Fitness|Apple Watch|Motra|Ocare3|Hume|China Medical University Hospital|Unknown",
  "image_category": "blood_pressure|nutrition|body_composition|recovery_sleep|activity_session|strength_session|workout_feedback|doctor_note|general_note|unknown",
  "screenshot_date": "YYYY-MM-DD or null",
  "summary": "brief human-readable summary",
  "coach_interpretation": "what this means for training, recovery, nutrition, or risk",
  "confidence": 0.0,
  "items": [
    {{
      "type": "bp|food|body|recovery|activity|strength|workout|doctor|note",
      "date": "YYYY-MM-DD",
      "summary": "short summary",
      "notes": "interpretation and context",
      "confidence": 0.0
    }}
  ],
  "warnings": []
}}

Rules:
- Extract visible numbers exactly. Do not invent hidden metrics.
- Use null by omitting unavailable fields from items.
- Put calories as "calories", protein grams as "protein", carbs as "carbs", fat as "fat".
- Put BP as "systolic", "diastolic", and optional "heart_rate".
- Put body metrics as "weight_lbs", "body_fat_pct", "lean_mass_lbs", "visceral_fat_level", "skeletal_muscle_lbs", "body_water_pct".
- Put recovery metrics as "recovery_score_pct", "sleep_score_pct", "hrv_ms", "resting_hr_bpm", "total_sleep_min", "deep_sleep_min", "rem_sleep_min", "wrist_temp_f".
- Put activity metrics as "activity_type", "start_time", "duration_min", "distance_mi", "avg_heart_rate_bpm", "peak_heart_rate_bpm", "active_calories_kcal".
- Put strength metrics as "session_name", "session_type", "start_time", "duration_min", "total_volume_kg", "total_reps", "avg_hr_bpm", "max_hr_bpm", "calories_kcal", and optional "exercises".
- If the image is a medical order/result, use type "doctor" and include "topic", "guidance", and "training_impact".
- If it is not a data screenshot, return one "note" item explaining what it is.
- Dates should be Asia/Taipei local dates. If the screenshot shows no date, use today's local date.
""".strip()


def parse_json_object(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start : end + 1])
        raise


def analyze_image(env: dict[str, str], original: Path, local_copy: Path, digest: str) -> dict:
    key = env.get("OPENAI_API_KEY", "")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is missing from .env.local")
    model = env.get("COACH_VISION_MODEL") or "gpt-4.1-mini"
    prepared = image_for_openai(local_copy, digest)
    payload = {
        "model": model,
        "input": [{
            "role": "user",
            "content": [
                {"type": "input_text", "text": vision_prompt(original, local_copy, digest)},
                {"type": "input_image", "image_url": data_url(prepared), "detail": "high"},
            ],
        }],
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI vision returned {err.code}: {body}") from err

    output_text = body.get("output_text")
    if not output_text:
        chunks = []
        for item in body.get("output", []):
            for content in item.get("content", []):
                if content.get("type") in {"output_text", "text"} and content.get("text"):
                    chunks.append(content["text"])
        output_text = "\n".join(chunks)
    if not output_text:
        raise RuntimeError("OpenAI vision response did not include output text")
    analysis = parse_json_object(output_text)
    analysis["_openai"] = {
        "model": model,
        "response_id": body.get("id"),
        "prepared_image": str(prepared),
    }
    return analysis


def normalize_item(item: dict, analysis: dict, original: Path, local_copy: Path, digest: str) -> dict:
    today = dt.datetime.now().astimezone().date().isoformat()
    normalized_type = TYPE_ALIASES.get(str(item.get("type") or analysis.get("image_category") or "note").lower(), "note")
    source_app = str(analysis.get("source_app") or "Unknown").lower().replace(" ", "-").replace("/", "-")
    category = str(analysis.get("image_category") or normalized_type).lower().replace(" ", "-")
    payload = {
        **item,
        "type": normalized_type,
        "date": item.get("date") or analysis.get("screenshot_date") or today,
        "summary": item.get("summary") or analysis.get("summary") or f"{normalized_type} parsed from screenshot",
        "notes": item.get("notes") or analysis.get("coach_interpretation") or analysis.get("summary") or "",
        "source": item.get("source") or f"vision-{source_app}-{category}-{digest[:10]}",
        "raw": {
            **(item.get("raw") if isinstance(item.get("raw"), dict) else {}),
            "screenshot": {
                "original_path": str(original),
                "local_copy_path": str(local_copy),
                "filename": original.name,
                "sha256": digest,
            },
            "vision_analysis": analysis,
        },
    }
    payload.pop("confidence", None)
    return payload


def payloads_from_analysis(analysis: dict, original: Path, local_copy: Path, digest: str) -> list[dict]:
    items = analysis.get("items")
    if not isinstance(items, list) or not items:
        items = [{
            "type": "note",
            "summary": analysis.get("summary") or f"Screenshot parsed: {original.name}",
            "notes": analysis.get("coach_interpretation") or "Vision parser found no structured rows.",
        }]
    return [normalize_item(item, analysis, original, local_copy, digest) for item in items if isinstance(item, dict)]


def audit_payload(analysis: dict, original: Path, local_copy: Path, digest: str, stored_count: int) -> dict:
    today = dt.datetime.now().astimezone().date().isoformat()
    return {
        "type": "note",
        "date": analysis.get("screenshot_date") or today,
        "summary": f"Vision parsed {original.name}: {analysis.get('image_category', 'unknown')}",
        "notes": (
            f"{analysis.get('summary', 'Screenshot parsed.')} "
            f"Coach interpretation: {analysis.get('coach_interpretation', 'None provided.')} "
            f"Structured item count: {stored_count}. Local copy: {local_copy}."
        ),
        "source": f"vision-audit-{digest[:10]}",
        "raw": {
            "screenshot": {
                "original_path": str(original),
                "local_copy_path": str(local_copy),
                "filename": original.name,
                "sha256": digest,
            },
            "vision_analysis": analysis,
        },
    }


def process_once(args: argparse.Namespace) -> int:
    env = load_env()
    inbox = Path(env.get("COACH_SCREENSHOT_INBOX") or default_icloud_inbox()).expanduser()
    state = load_state()
    processed_hashes = state.setdefault("processed_hashes", {})
    processed_paths = state.setdefault("processed_paths", {})
    LOCAL_INBOX.mkdir(parents=True, exist_ok=True)

    if not inbox.exists():
        log(f"Inbox does not exist yet: {inbox}")
        return 0

    processed = 0
    skipped_recent = 0
    for image in iter_images(inbox):
        if processed >= args.max_files:
            break
        if not is_ready(image, args.min_age_seconds):
            skipped_recent += 1
            continue

        digest = file_sha256(image)
        if digest in processed_hashes:
            continue

        target = copied_path(image, digest, image.stat().st_mtime)
        if not target.exists():
            shutil.copy2(image, target)

        analysis = None
        posted = []
        try:
            if args.no_vision:
                raise RuntimeError("vision disabled by --no-vision")
            analysis = analyze_image(env, image, target, digest)
            payloads = payloads_from_analysis(analysis, image, target, digest)
            payloads.append(audit_payload(analysis, image, target, digest, len(payloads)))
        except Exception as exc:
            payloads = [fallback_payload(image, target, digest, str(exc))]
            log(f"Vision fallback for {image.name}: {exc}")

        if args.dry_run:
            print(json.dumps({"analysis": analysis, "payloads": payloads}, indent=2))
        else:
            for payload in payloads:
                response = post_intake(env, payload)
                if not response.get("ok"):
                    raise RuntimeError(f"Unexpected coach API response: {response}")
                posted.append({"type": payload.get("type"), "summary": payload.get("summary")})

        processed_hashes[digest] = {
            "original_path": str(image),
            "local_copy_path": str(target),
            "processed_at": dt.datetime.now().astimezone().isoformat(timespec="seconds"),
            "analysis_summary": analysis.get("summary") if isinstance(analysis, dict) else None,
            "analysis_category": analysis.get("image_category") if isinstance(analysis, dict) else None,
            "posted": posted,
        }
        processed_paths[str(image)] = digest
        processed += 1
        log(f"Processed {image.name} -> {target.name}; posted={posted or 'dry-run'}")

    if not args.dry_run:
        save_state(state)
    log(f"Run complete. processed={processed} skipped_recent={skipped_recent} inbox={inbox}")
    return processed


def main() -> int:
    parser = argparse.ArgumentParser(description="Log new iCloud screenshot files to Todd's coach API.")
    parser.add_argument("--dry-run", action="store_true", help="Print payloads without posting or marking files processed.")
    parser.add_argument("--no-vision", action="store_true", help="Skip OpenAI vision and log only the screenshot arrival.")
    parser.add_argument("--max-files", type=int, default=10, help="Maximum new files to process per run.")
    parser.add_argument("--min-age-seconds", type=int, default=15, help="Wait this long after file modification before processing.")
    args = parser.parse_args()

    try:
        process_once(args)
        return 0
    except Exception as exc:
        log(f"ERROR: {exc}")
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
