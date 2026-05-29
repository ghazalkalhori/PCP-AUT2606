import json
from datetime import date, datetime
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models
from app.services.dribl import get_fixtures


def _as_text(value: Any) -> Optional[str]:
    # Dribl fields are inconsistent: some labels arrive as strings, others as objects.
    if value is None or value == "":
        return None

    if isinstance(value, dict):
        for key in ("name", "title", "club", "team", "display_name"):
            if value.get(key):
                return str(value[key])

        return json.dumps(value, ensure_ascii=False)

    if isinstance(value, list):
        return json.dumps(value, ensure_ascii=False)

    return str(value)


def _as_int(value: Any) -> Optional[int]:
    if value is None or value == "":
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def _fixture_attributes(fixture: dict[str, Any]) -> dict[str, Any]:
    attributes = fixture.get("attributes", {})
    return attributes if isinstance(attributes, dict) else {}


def _fixture_id(fixture: dict[str, Any], attributes: dict[str, Any]) -> Optional[str]:
    value = (
        fixture.get("id")
        or attributes.get("fixture_id")
        or attributes.get("id")
        or attributes.get("match_id")
    )

    return _as_text(value)


def _league_id(attributes: dict[str, Any]) -> str:
    return (
        _as_text(attributes.get("league_id"))
        or _as_text(attributes.get("league_name"))
        or _as_text(attributes.get("competition_name"))
        or "unknown"
    )


def _league_name(attributes: dict[str, Any]) -> str:
    return (
        _as_text(attributes.get("league_name"))
        or _as_text(attributes.get("competition_name"))
        or "Unknown League"
    )


def _league_status(season: Optional[str]) -> str:
    # Status is a display heuristic based on season text rather than a Dribl league field.
    current_year = date.today().year
    season_text = str(season or "")

    if str(current_year) in season_text:
        return "Active"

    if any(str(year) in season_text for year in range(current_year + 1, current_year + 5)):
        return "Upcoming"

    return "Past"


def _apply_match_fields(
    match: models.Match,
    fixture: dict[str, Any],
    attributes: dict[str, Any],
    synced_at: datetime,
) -> None:
    # Denormalize commonly queried fixture fields while preserving the raw Dribl JSON.
    match.league_id = _league_id(attributes)
    match.league_name = _league_name(attributes)
    match.competition_name = _as_text(attributes.get("competition_name"))
    match.season_name = _as_text(attributes.get("season_name"))
    match.tenant_name = _as_text(attributes.get("tenant_name")) or "FWW"
    match.home_team = _as_text(
        attributes.get("home_team")
        or attributes.get("home_club")
        or attributes.get("home_team_name")
    )
    match.away_team = _as_text(
        attributes.get("away_team")
        or attributes.get("away_club")
        or attributes.get("away_team_name")
    )
    match.home_team_id = _as_text(attributes.get("home_team_id"))
    match.away_team_id = _as_text(attributes.get("away_team_id"))
    match.local_start_date = _as_text(
        attributes.get("local_start_date") or attributes.get("start_date")
    )
    match.local_start_time = _as_text(attributes.get("local_start_time"))
    match.utc_datetime = _as_text(
        attributes.get("utc_datetime")
        or attributes.get("utc_start_datetime")
        or attributes.get("start_datetime")
    )
    match.ground_name = _as_text(attributes.get("ground_name"))
    match.field_name = _as_text(attributes.get("field_name"))
    match.event_status = _as_text(attributes.get("event_status"))
    match.matchsheet_status = _as_text(attributes.get("matchsheet_status"))
    match.round_number = _as_int(attributes.get("round_number"))
    match.raw_json = _json_dumps(fixture)
    match.synced_at = synced_at


def _derive_leagues(db: Session, synced_at: datetime) -> int:
    # Rebuild league rows from synced matches because Dribl exposes fixtures, not leagues.
    grouped: dict[str, dict[str, Any]] = {}

    for match in db.query(models.Match).all():
        league_id = match.league_id or match.league_name or match.competition_name or "unknown"

        if league_id not in grouped:
            grouped[league_id] = {
                "league_id": league_id,
                "name": match.league_name or match.competition_name or "Unknown League",
                "competition": match.competition_name or match.league_name,
                "season": match.season_name or "Current Season",
                "tenant": match.tenant_name,
                "matches_count": 0,
                "first_match_date": match.local_start_date,
                "last_match_date": match.local_start_date,
                "rounds": set(),
            }

        league_data = grouped[league_id]
        league_data["matches_count"] += 1

        if match.round_number is not None:
            league_data["rounds"].add(match.round_number)

        if match.local_start_date:
            if (
                not league_data["first_match_date"]
                or match.local_start_date < league_data["first_match_date"]
            ):
                league_data["first_match_date"] = match.local_start_date

            if (
                not league_data["last_match_date"]
                or match.local_start_date > league_data["last_match_date"]
            ):
                league_data["last_match_date"] = match.local_start_date

    leagues_synced = 0

    for league_data in grouped.values():
        league = (
            db.query(models.League)
            .filter(models.League.league_id == league_data["league_id"])
            .first()
        )

        if league is None:
            league = models.League(league_id=league_data["league_id"])
            db.add(league)

        league.name = league_data["name"]
        league.competition = league_data["competition"]
        league.season = league_data["season"]
        league.tenant = league_data["tenant"]
        league.matches_count = league_data["matches_count"]
        league.first_match_date = league_data["first_match_date"]
        league.last_match_date = league_data["last_match_date"]
        league.rounds_json = _json_dumps(sorted(league_data["rounds"]))
        league.status = _league_status(league.season)
        league.synced_at = synced_at
        leagues_synced += 1

    return leagues_synced


def sync_dribl_data(db: Session) -> dict[str, Any]:
    synced_at = datetime.utcnow()
    page = 1
    pages_processed = 0
    matches_synced = 0

    try:
        while True:
            # Pull one Dribl fixture page at a time so large syncs stay memory-light.
            response = get_fixtures(start_date="2020-01-01", page=page)
            fixtures = response.get("data", [])

            if not isinstance(fixtures, list):
                fixtures = []

            for fixture in fixtures:
                if not isinstance(fixture, dict):
                    continue

                attributes = _fixture_attributes(fixture)
                fixture_id = _fixture_id(fixture, attributes)

                if not fixture_id:
                    continue

                # Upsert by fixture_id so repeat syncs refresh existing rows in place.
                match = (
                    db.query(models.Match)
                    .filter(models.Match.fixture_id == fixture_id)
                    .first()
                )

                if match is None:
                    match = models.Match(fixture_id=fixture_id)
                    db.add(match)

                _apply_match_fields(match, fixture, attributes, synced_at)
                matches_synced += 1

            pages_processed += 1
            db.flush()

            # Dribl pagination metadata tells us when the fixture crawl is complete.
            meta = response.get("meta", {}) if isinstance(response, dict) else {}
            last_page = _as_int(meta.get("last_page")) or page

            if page >= last_page:
                break

            page += 1

        leagues_synced = _derive_leagues(db, synced_at)
        db.commit()

    except HTTPException:
        db.rollback()
        raise
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Could not sync Dribl data: {error}",
        ) from error

    return {
        "matches_synced": matches_synced,
        "leagues_synced": leagues_synced,
        "pages_processed": pages_processed,
        "synced_at": synced_at.isoformat(),
    }
