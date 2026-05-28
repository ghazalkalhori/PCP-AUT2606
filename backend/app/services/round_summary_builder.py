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
    preview_mode: bool = False,
) -> dict[str, Any]:
    fixture = _load_fixture_dict(match)
    statistics = None

    if (
        include_statistics
        and not preview_mode
        and str(match.event_status or "").lower() == "complete"
    ):
        try:
            statistics = get_fixture_statistics(match.fixture_id)
        except Exception:
            statistics = None

    if statistics:
        normalized = normalize_fixture_for_report(fixture, statistics)
    else:
        normalized = normalize_fixture_for_report(fixture, None)

    entry = {
        "fixtureId": match.fixture_id,
        "homeTeam": (normalized.get("homeTeam") or {}).get("name") or match.home_team,
        "awayTeam": (normalized.get("awayTeam") or {}).get("name") or match.away_team,
        "date": normalized.get("date") or match.local_start_date,
        "time": normalized.get("time") or match.local_start_time,
        "venue": normalized.get("venue") or match.ground_name,
        "field": normalized.get("field") or match.field_name,
        "status": normalized.get("eventStatus") or match.event_status,
    }

    if not preview_mode:
        entry["homeScore"] = (normalized.get("homeTeam") or {}).get("score")
        entry["awayScore"] = (normalized.get("awayTeam") or {}).get("score")
        entry["goals"] = normalized.get("goals") or []
        entry["cards"] = normalized.get("cards") or []
        entry["referees"] = normalized.get("referees") or []

    return entry


def build_round_summary_payload(
    db: Session,
    league_id: str,
    round_value: Any = "all",
    league_name: Optional[str] = None,
    competition: Optional[str] = None,
    season: Optional[str] = None,
    tenant: Optional[str] = None,
    include_statistics: bool = True,
    article_mode: str = "recap",
) -> dict[str, Any]:
    """
    Aggregate matches for a league (and optional round) into report-ready JSON.

    article_mode:
        "preview" — upcoming fixtures only, for round preview articles
        "recap" — all statuses, with statistics for completed matches
    """
    preview_mode = str(article_mode or "recap").lower() == "preview"
    query = db.query(models.Match).filter(models.Match.league_id == str(league_id))

    if round_value not in (None, "", "all"):
        try:
            query = query.filter(models.Match.round_number == int(round_value))
        except (TypeError, ValueError):
            pass

    total_in_query = query.count()
    truncated = total_in_query > MAX_MATCHES_IN_ROUND_SUMMARY

    all_matches = (
        query.order_by(
            models.Match.local_start_date.asc(),
            models.Match.local_start_time.asc(),
            models.Match.id.asc(),
        )
        .limit(MAX_MATCHES_IN_ROUND_SUMMARY * 2 if preview_mode else MAX_MATCHES_IN_ROUND_SUMMARY)
        .all()
    )

    completed_in_round = []
    preview_matches = []

    for match in all_matches:
        status = str(match.event_status or "").lower()
        entry = _summarise_match_entry(
            match,
            include_statistics=include_statistics,
            preview_mode=preview_mode,
        )
        if status == "complete":
            if preview_mode and len(completed_in_round) < 10:
                completed_in_round.append(
                    _summarise_match_entry(match, include_statistics=True, preview_mode=False)
                )
            if not preview_mode:
                preview_matches.append(entry)
        else:
            preview_matches.append(entry)

    if preview_mode:
        matches = preview_matches[:MAX_MATCHES_IN_ROUND_SUMMARY]
        summarised_matches = matches
    else:
        matches = all_matches[:MAX_MATCHES_IN_ROUND_SUMMARY]
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
    if preview_mode and not summarised_matches:
        notes.append("No pending fixtures were found for this round selection.")
    if truncated:
        notes.append(
            f"Only the first {MAX_MATCHES_IN_ROUND_SUMMARY} of {total_in_query} "
            f"matches in this selection were included."
        )

    payload_kind = "round_preview" if preview_mode else "round_summary"

    return {
        "kind": payload_kind,
        "articleType": "preview" if preview_mode else "recap",
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
        "previewMatchCount": len(summarised_matches) if preview_mode else pending,
        "matches": summarised_matches,
        "completedMatchesInRound": completed_in_round if preview_mode else [],
        "notes": notes,
    }
