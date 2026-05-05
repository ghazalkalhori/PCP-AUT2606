from fastapi import FastAPI
from pydantic import BaseModel
from app.services.dribl import get_fixture
from app.db import Base, engine
from app import models

# This creates the tables in SQLite automatically
Base.metadata.create_all(bind=engine)

app = FastAPI()

class JobRequest(BaseModel):
    fixture_id: str
    report_type: str
    tone: str = "professional"

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/matches/{fixture_id}")
def match_detail(fixture_id: str):
    return get_fixture(fixture_id)


@app.post("/jobs")
def create_job(request: JobRequest):
    data = get_fixture(request.fixture_id)["data"]["attributes"]

    report = f"""
{request.report_type.title()} Report

{data["home_team"]} vs {data["away_team"]}

Competition: {data["competition_name"]}
League: {data["league_name"]}
Date: {data["local_start_date"]} {data["local_start_time"]}
Venue: {data["ground_name"]}

Status: {data["event_status"]}

Tone: {request.tone}
"""

    return {
        "job_status": "completed",
        "report_status": "draft",
        "report": report
    }