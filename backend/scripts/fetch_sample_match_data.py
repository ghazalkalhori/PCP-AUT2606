#!/usr/bin/env python3
"""
Fetch a real completed FWW fixture from Dribl and write report-ready JSON.

Requires:
  - VPN connected (if your team uses VPN for Dribl)
  - DRIBL_TOKEN in backend/.env

Usage (from backend/):
  python scripts/fetch_sample_match_data.py
  python scripts/fetch_sample_match_data.py --fixture-id xK5pV2zBjN
  python scripts/fetch_sample_match_data.py --output ../frontend/public/samples/post-match-live.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from curl_cffi import requests
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.services.dribl_normalize import normalize_fixture_for_report

load_dotenv(BACKEND_DIR / ".env")

BASE_URL = "https://open.dribl.com/api"
TOKEN = os.getenv("DRIBL_TOKEN")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json",
}


def _get(url: str, params: dict | None = None) -> dict:
    response = requests.get(
        url,
        headers=HEADERS,
        params=params,
        timeout=30,
        impersonate="chrome",
    )
    response.raise_for_status()
    return response.json()


def pick_completed_fixture(fixtures_response: dict) -> dict | None:
    for item in fixtures_response.get("data", []):
        status = (item.get("attributes") or {}).get("event_status", "")
        if str(status).lower() == "complete":
            return item
    data = fixtures_response.get("data", [])
    return data[0] if data else None


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch Dribl sample match JSON")
    parser.add_argument("--fixture-id", help="Specific Dribl fixture ID")
    parser.add_argument(
        "--output",
        default=str(BACKEND_DIR.parent / "frontend" / "public" / "samples" / "post-match-live.json"),
        help="Output JSON file path",
    )
    parser.add_argument("--tenant", default="FWW", help="tenant_name query param")
    args = parser.parse_args()

    if not TOKEN:
        print("ERROR: DRIBL_TOKEN not set in backend/.env", file=sys.stderr)
        sys.exit(1)

    if args.fixture_id:
        fixture_resp = _get(f"{BASE_URL}/fixtures/{args.fixture_id}")
        fixture = fixture_resp.get("data", fixture_resp)
        fixture_id = args.fixture_id
    else:
        fixtures = _get(
            f"{BASE_URL}/fixtures",
            params={
                "start_date": "2025-01-01T00:00:00",
                "end_date": "2026-12-31T23:59:59",
                "tenant_name": args.tenant,
                "page": 1,
            },
        )
        fixture = pick_completed_fixture(fixtures)
        if not fixture:
            print("ERROR: No fixtures returned. Check VPN, token, and tenant_name.", file=sys.stderr)
            sys.exit(1)
        fixture_id = fixture.get("id")

    statistics = None
    try:
        statistics = _get(f"{BASE_URL}/fixtures/{fixture_id}/statistics")
    except Exception as exc:
        print(f"Warning: could not fetch statistics for {fixture_id}: {exc}")

    payload = normalize_fixture_for_report(fixture, statistics)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Wrote {out_path}")
    print(f"Fixture: {payload['homeTeam']['name']} vs {payload['awayTeam']['name']}")
    print(f"Score: {payload['homeTeam']['score']} - {payload['awayTeam']['score']}")
    print(f"Status: {payload['eventStatus']}")
    print(f"Goals in payload: {len(payload['goals'])}")
    print(f"Cards in payload: {len(payload['cards'])}")


if __name__ == "__main__":
    main()
