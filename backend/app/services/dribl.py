import os
from datetime import date, datetime
from typing import Optional

from curl_cffi import requests
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

BASE_URL = "https://open.dribl.com/api"
TOKEN = os.getenv("DRIBL_TOKEN")


headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)",
}


# Helper to send a request to Dribl and handle errors.
def _request_dribl(url: str, params: Optional[dict] = None):
    """
    Send a request to Dribl and convert connection/API failures into clean HTTP errors.
    """
    try:
        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=20,
            impersonate="chrome",
        )
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Dribl API. Please check VPN, internet, or Dribl availability.",
        ) from error

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    return response.json()


def get_fixture(fixture_id: str):
    url = f"{BASE_URL}/fixtures/{fixture_id}"
    return _request_dribl(url)


def _parse_date_string(value: str, field_name: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be in YYYY-MM-DD format",
        ) from error


# Get fixtures from Dribl using optional date range, status, and paging.
def get_fixtures(
    tenant_name: str = "FWW",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
):
    start_day = _parse_date_string(start_date, "start_date") if start_date else None
    end_day = _parse_date_string(end_date, "end_date") if end_date else None

    if start_day and end_day and start_day > end_day:
        raise HTTPException(
            status_code=400,
            detail="start_date must be on or before end_date",
        )

    url = f"{BASE_URL}/fixtures"
    params = {
        "tenant_name": tenant_name,
        "page": page,
    }

    if start_day:
        params["start_date"] = f"{start_day.isoformat()}T00:00:00"

    if end_day:
        params["end_date"] = f"{end_day.isoformat()}T23:59:59"

    if status and status.lower() != "all":
        params["event_status"] = status.lower()

    return _request_dribl(url, params=params)


# Build a leagues list from fixture data.
# Dribl does not provide a separate leagues endpoint, so we derive leagues from fixtures.
def get_leagues_from_fixtures(
    tenant_name: str = "FWW",
    start_date: str = "2020-01-01",
    end_date: Optional[str] = None,
    status: str = "all",
):
    today = date.today()
    end_day = _parse_date_string(end_date, "end_date") if end_date else None

    fixtures = []
    page = 1

    while True:
        fixtures_response = get_fixtures(
            tenant_name=tenant_name,
            start_date=start_date,
            end_date=end_day.isoformat() if end_day else None,
            status=None,
            page=page,
        )

        fixtures.extend(fixtures_response.get("data", []))

        meta = fixtures_response.get("meta", {})
        last_page = meta.get("last_page") or page

        if page >= last_page:
            break

        page += 1

    leagues = {}

    for fixture in fixtures:
        attributes = fixture.get("attributes", {})

        league_id = (
            attributes.get("league_id")
            or attributes.get("league_name")
            or attributes.get("competition_name")
            or "unknown"
        )

        league_name = (
            attributes.get("league_name")
            or attributes.get("competition_name")
            or "Unknown League"
        )

        fixture_date = attributes.get("local_start_date") or attributes.get(
            "start_date"
        )
        round_number = attributes.get("round_number")
        season_name = attributes.get("season_name") or "Current Season"

        if league_id not in leagues:
            leagues[league_id] = {
                "id": str(league_id),
                "name": league_name,
                "competition": attributes.get("competition_name") or league_name,
                "season": season_name,
                "tenant": attributes.get("tenant_name") or tenant_name,
                "matches": 0,
                "first_match_date": fixture_date,
                "last_match_date": fixture_date,
                "status": "Past",
                "rounds": set(),
            }

        league = leagues[league_id]
        league["matches"] += 1

        if round_number is not None:
            league["rounds"].add(round_number)

        if fixture_date:
            if (
                not league["first_match_date"]
                or fixture_date < league["first_match_date"]
            ):
                league["first_match_date"] = fixture_date

            if (
                not league["last_match_date"]
                or fixture_date > league["last_match_date"]
            ):
                league["last_match_date"] = fixture_date

    current_year = today.year

    for league in leagues.values():
        season = league.get("season", "")
        league["rounds"] = sorted(league.get("rounds", []))

        if str(current_year) in season:
            league["status"] = "Active"

        elif any(
            str(year) in season for year in range(current_year + 1, current_year + 5)
        ):
            league["status"] = "Upcoming"

        else:
            league["status"] = "Past"

    league_list = list(leagues.values())

    if status != "all":
        normalized_status = status.lower()
        league_list = [
            league
            for league in league_list
            if league.get("status", "").lower() == normalized_status
        ]

    return {
        "data": league_list,
        "total": len(league_list),
    }
