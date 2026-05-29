"""
Build structured round / league summary JSON from synced Dribl matches in SQLite.
"""

from __future__ import annotations

import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app import models
from app.services.dribl import get_fixture_statistics
from app.services.dribl_normalize import normalize_fixture_for_report, normalize_fixture_record


MAX_MATCHES_IN_ROUND_SUMMARY = 40


def _load_fixture_dict(match: models.Match) -> dict:
    # Fall back to denormalized columns when an older synced row has no raw payload.
    if not match.raw_json:
        return {
            "id": match.fixture_id,
            "attributes": {
                "home_team": match.home_team,
                "away_team": match.away_team,
                "local_start_date": match.local_start_date,
                "local_start_time": match.local_start_time,
                "ground_name": match.ground_name,
                "field_name": match.field_name,
                "event_status": match.event_status,
                "round_number": match.round_number,
                "league_name": match.league_name,
                "competition_name": match.competition_name,
                "season_name": match.season_name,
                "tenant_name": match.tenant_name,
            },
        }

    try:
        loaded = json.loads(match.raw_json)
        return loaded if isinstance(loaded, dict) else {}
    except json.JSONDecodeError:
        return {}


def _summarise_match_entry(
    match: models.Match,
    include_statistics: bool = True,
) -> dict[str, Any]:
    # Completed matches can be enriched with live statistics before prompt generation.
    fixture = _load_fixture_dict(match)
    statistics = None

    if include_statistics and str(match.event_status or "").lower() == "complete":
        try:
            statistics = get_fixture_statistics(match.fixture_id)
        except Exception:
            statistics = None

    if statistics:
        normalized = normalize_fixture_for_report(fixture, statistics)
    else:
        normalized = normalize_fixture_for_report(fixture, None)

    return {
        "fixtureId": match.fixture_id,
        "homeTeam": (normalized.get("homeTeam") or {}).get("name") or match.home_team,
        "awayTeam": (normalized.get("awayTeam") or {}).get("name") or match.away_team,
        "homeScore": (normalized.get("homeTeam") or {}).get("score"),
        "awayScore": (normalized.get("awayTeam") or {}).get("score"),
        "date": normalized.get("date") or match.local_start_date,
        "time": normalized.get("time") or match.local_start_time,
        "venue": normalized.get("venue") or match.ground_name,
        "field": normalized.get("field") or match.field_name,
        "status": normalized.get("eventStatus") or match.event_status,
        "goals": normalized.get("goals") or [],
        "cards": normalized.get("cards") or [],
        "referees": normalized.get("referees") or [],
    }


def build_round_summary_payload(
    db: Session,
    league_id: str,
    round_value: Any = "all",
    league_name: Optional[str] = None,
    competition: Optional[str] = None,
    season: Optional[str] = None,
    tenant: Optional[str] = None,
    include_statistics: bool = True,
) -> dict[str, Any]:
    """
    Aggregate matches for a league (and optional round) into report-ready JSON.
    """
    query = db.query(models.Match).filter(models.Match.league_id == str(league_id))

    if round_value not in (None, "", "all"):
        try:
            # Ignore non-numeric round filters instead of failing the summary request.
            query = query.filter(models.Match.round_number == int(round_value))
        except (TypeError, ValueError):
            pass

    total_in_query = query.count()
    # Limit prompt size so league summaries stay within practical LLM context limits.
    truncated = total_in_query > MAX_MATCHES_IN_ROUND_SUMMARY

    matches = (
        query.order_by(
            models.Match.local_start_date.asc(),
            models.Match.local_start_time.asc(),
            models.Match.id.asc(),
        )
        .limit(MAX_MATCHES_IN_ROUND_SUMMARY)
        .all()
    )

    summarised_matches = [
        _summarise_match_entry(match, include_statistics=include_statistics)
        for match in matches
    ]

    completed = sum(
        1 for item in summarised_matches if str(item.get("status", "")).lower() == "complete"
    )
    pending = len(summarised_matches) - completed
    with_scores = sum(
        1
        for item in summarised_matches
        if item.get("homeScore") is not None and item.get("awayScore") is not None
    )

    round_label = (
        "All available rounds"
        if round_value in (None, "", "all")
        else f"Round {round_value}"
    )

    first_match = matches[0] if matches else None
    resolved_league_name = league_name or (first_match.league_name if first_match else "")
    resolved_competition = competition or (
        first_match.competition_name if first_match else resolved_league_name
    )
    resolved_season = season or (first_match.season_name if first_match else "")
    resolved_tenant = tenant or (first_match.tenant_name if first_match else "FWW")

    notes = []
    if truncated:
        notes.append(
            f"Only the first {MAX_MATCHES_IN_ROUND_SUMMARY} of {total_in_query} "
            f"matches in this selection were included."
        )

    return {
        "kind": "round_summary",
        "leagueId": league_id,
        "leagueName": resolved_league_name,
        "league": resolved_league_name,
        "competition": resolved_competition,
        "season": resolved_season,
        "tenant": resolved_tenant,
        "round": round_value,
        "roundLabel": round_label,
        "matchCount": total_in_query,
        "matchesIncluded": len(summarised_matches),
        "completedCount": completed,
        "pendingCount": pending,
        "matchesWithScores": with_scores,
        "matches": summarised_matches,
        "notes": notes,
    }
