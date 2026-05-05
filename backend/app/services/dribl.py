import os
from dotenv import load_dotenv
from fastapi import HTTPException
from curl_cffi import requests

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
        impersonate="chrome"
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    return response.json()


def get_fixtures():
    url = f"{BASE_URL}/fixtures"

    params = {
        "start_date": "2026-01-01T00:00:00",
        "end_date": "2026-04-01T23:59:59",
        "tenant_name": "DFA",
    }

    response = requests.get(
        url,
        headers=headers,
        params=params,
        timeout=20,
        impersonate="chrome"
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    return response.json()