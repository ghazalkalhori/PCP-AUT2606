#!/usr/bin/env python3
"""
Download ~10 Dribl JSON files for offline use (no API needed when VPN is on for GPU).

Usage (from backend/, VPN OFF if Dribl only works without VPN):
  python scripts/download_dribl_cache.py
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

from curl_cffi import requests
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
OUTPUT_DIR = BACKEND_DIR.parent / "frontend" / "public" / "samples" / "dribl-cache"

from app.services.dribl_normalize import normalize_fixture_for_report

load_dotenv(BACKEND_DIR / ".env")
TOKEN = os.getenv("DRIBL_TOKEN")
BASE_URL = "https://open.dribl.com/api"
TENANT = "FWW"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json",
}


def slugify(value: str, max_len: int = 40) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "-", (value or "unknown").lower()).strip("-")
    return value[:max_len] or "unknown"


def get(url: str, params: dict | None = None) -> dict:
    response = requests.get(
        url, headers=HEADERS, params=params, timeout=45, impersonate="chrome"
    )
    response.raise_for_status()
    return response.json()


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  wrote {path.name}")


def derive_leagues(fixtures: list) -> dict:
    leagues: dict[str, dict] = {}
    for item in fixtures:
        attrs = item.get("attributes", {})
        league_id = (
            attrs.get("league_id")
            or attrs.get("league_name")
            or attrs.get("competition_name")
            or "unknown"
        )
        league_name = attrs.get("league_name") or attrs.get("competition_name") or "Unknown"
        key = str(league_id)
        if key not in leagues:
            leagues[key] = {
                "id": key,
                "name": league_name,
                "competition": attrs.get("competition_name") or league_name,
                "season": attrs.get("season_name"),
                "tenant": attrs.get("tenant_name") or TENANT,
                "matchCount": 0,
            }
        leagues[key]["matchCount"] += 1
    return {"tenant": TENANT, "leagues": list(leagues.values())}


def main() -> None:
    if not TOKEN:
        print("ERROR: DRIBL_TOKEN missing in backend/.env", file=sys.stderr)
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Saving to {OUTPUT_DIR}\n")

    fixtures_resp = get(
        f"{BASE_URL}/fixtures",
        params={
            "start_date": "2024-01-01T00:00:00",
            "end_date": "2026-12-31T23:59:59",
            "tenant_name": TENANT,
            "page": 1,
        },
    )
    fixtures = fixtures_resp.get("data", [])

    write_json(OUTPUT_DIR / "01-fixtures-list-raw.json", fixtures_resp)
    write_json(OUTPUT_DIR / "02-leagues-summary.json", derive_leagues(fixtures))

    completed = [f for f in fixtures if (f.get("attributes") or {}).get("event_status") == "complete"]
    pending = [f for f in fixtures if (f.get("attributes") or {}).get("event_status") != "complete"]

    index = {
        "tenant": TENANT,
        "files": [
            {"file": "01-fixtures-list-raw.json", "description": "Full fixtures API response (page 1)"},
            {"file": "02-leagues-summary.json", "description": "Leagues derived from fixtures"},
        ],
    }

    match_num = 3
    for fixture in (completed[:5] + pending[:3]):
        fid = fixture.get("id")
        attrs = fixture.get("attributes", {})
        home = attrs.get("home_team", "home")
        away = attrs.get("away_team", "away")
        label = slugify(f"{home}-vs-{away}")

        write_json(OUTPUT_DIR / f"{match_num:02d}-fixture-raw-{label}.json", fixture)
        index["files"].append(
            {
                "file": f"{match_num:02d}-fixture-raw-{label}.json",
                "description": f"Raw fixture: {home} vs {away}",
                "fixtureId": fid,
                "status": attrs.get("event_status"),
            }
        )
        match_num += 1

        stats = None
        if attrs.get("event_status") == "complete":
            try:
                stats = get(f"{BASE_URL}/fixtures/{fid}/statistics")
                write_json(OUTPUT_DIR / f"{match_num:02d}-statistics-raw-{label}.json", stats)
                index["files"].append(
                    {
                        "file": f"{match_num:02d}-statistics-raw-{label}.json",
                        "description": f"Statistics: {home} vs {away}",
                        "fixtureId": fid,
                    }
                )
                match_num += 1
            except Exception as exc:
                print(f"  skip statistics {fid}: {exc}")

        report = normalize_fixture_for_report(fixture, stats)
        write_json(OUTPUT_DIR / f"{match_num:02d}-report-ready-{label}.json", report)
        index["files"].append(
            {
                "file": f"{match_num:02d}-report-ready-{label}.json",
                "description": f"Report-ready JSON: {home} vs {away}",
                "fixtureId": fid,
                "reportType": report["reportType"],
            }
        )
        match_num += 1

    write_json(OUTPUT_DIR / "index.json", index)
    print(f"\nDone. {len(list(OUTPUT_DIR.glob('*.json')))} files in dribl-cache/")


if __name__ == "__main__":
    main()
