#!/usr/bin/env python3
"""
Re-build *-report-ready-*.json files from existing fixture-raw + statistics-raw cache.

No API call needed — run after fixing dribl_normalize.py:

  cd backend && python scripts/refresh_dribl_cache_reports.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.services.dribl_normalize import normalize_fixture_for_report

CACHE_DIR = BACKEND_DIR.parent / "frontend" / "public" / "samples" / "dribl-cache"


def main() -> None:
    updated = 0
    for report_path in sorted(CACHE_DIR.glob("*-report-ready-*.json")):
        if "-report-ready-" not in report_path.name:
            continue
        label = report_path.name.split("-report-ready-", 1)[1]
        fixture_matches = list(CACHE_DIR.glob(f"*-fixture-raw-{label}"))
        stats_matches = list(CACHE_DIR.glob(f"*-statistics-raw-{label}"))

        if not fixture_matches:
            print(f"skip (no fixture): {report_path.name}")
            continue

        fixture_path = fixture_matches[0]
        stats_path = stats_matches[0] if stats_matches else None

        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
        statistics = (
            json.loads(stats_path.read_text(encoding="utf-8")) if stats_path else None
        )
        payload = normalize_fixture_for_report(fixture, statistics)
        report_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        home = payload["homeTeam"]["score"]
        away = payload["awayTeam"]["score"]
        print(
            f"  {report_path.name}: score {home}-{away}, "
            f"goals={len(payload['goals'])}, cards={len(payload['cards'])}"
        )
        updated += 1

    print(f"\nUpdated {updated} report-ready file(s).")


if __name__ == "__main__":
    main()
