import os
from datetime import date, datetime, timedelta
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


def get_fixture(fixture_id: str):
    url = f"{BASE_URL}/fixtures/{fixture_id}"

    response = requests.get(
        url,
        headers=headers,
        timeout=20,
        impersonate="chrome",
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    return response.json()


def _parse_date_string(value: str, field_name: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be in YYYY-MM-DD format",
        ) from error


# Get fixtures from Dribl using optional date range and paging.
def get_fixtures(
    tenant_name: str = "FWW",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
):
    today = date.today()
    start_day = (
        _parse_date_string(start_date, "start_date")
        if start_date
        else today - timedelta(days=30)
    )
    end_day = _parse_date_string(end_date, "end_date") if end_date else today

    if start_day > end_day:
        raise HTTPException(
            status_code=400,
            detail="start_date must be on or before end_date",
        )

    url = f"{BASE_URL}/fixtures"
    params = {
        "start_date": f"{start_day.isoformat()}T00:00:00",
        "end_date": f"{end_day.isoformat()}T23:59:59",
        "tenant_name": tenant_name,
        "page": page,
    }

    response = requests.get(
        url,
        headers=headers,
        params=params,
        timeout=20,
        impersonate="chrome",
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    return response.json()
