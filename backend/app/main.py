import os
import json
from datetime import datetime, timedelta
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.db import Base, engine, SessionLocal
from app.services.dribl import get_fixture, get_fixture_statistics
from app.services.dribl_sync import sync_dribl_data
from app.services.dribl_normalize import (
    normalize_fixture_for_report,
    normalize_fixture_record,
    score_label_from_match_data,
)

from app.schemas import GenerateReportRequest, GenerateReportResponse
from app.services.prompts import build_league_summary_prompt, build_match_report_prompt
from app.services.ollama import generate_report
from app.services.report_style_options import get_style_options, resolve_report_style
from app.services.round_summary_builder import build_round_summary_payload

# Ensure the lightweight SQLite schema exists when the API starts locally.
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

SECRET_KEY: str = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set in environment")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class JobRequest(BaseModel):
    fixture_id: str
    report_type: str
    tone: str = "professional"
    excitement: str = "balanced"
    comedic_effect: str = "none"
    fixture: Optional[dict[str, Any]] = None
    statistics: Optional[dict[str, Any]] = None
    match_data: Optional[dict[str, Any]] = None


class LeagueSummaryJobRequest(BaseModel):
    league_id: Optional[str] = None
    league_name: str
    competition: Optional[str] = None
    season: Optional[str] = None
    round: Optional[Any] = "all"
    round_label: Optional[str] = None
    matches: Optional[Any] = None
    match_count: Optional[int] = None
    status: Optional[str] = None
    tone: str = "professional"
    excitement: str = "balanced"
    comedic_effect: str = "none"


class ReportUpdate(BaseModel):
    content: str


class ReportCreate(BaseModel):
    fixture_id: Optional[str] = None
    report_type: str
    tone: str = "professional"
    source_data: Optional[dict[str, Any]] = None
    content: str
    status: str = "draft"


class ReportPatch(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None
    source_data: Optional[dict[str, Any]] = None


def serialize_report(report: models.Report):
    source_data = None

    # Reports store their generation inputs as JSON text so the UI can replay context.
    if getattr(report, "source_data", None):
        try:
            source_data = json.loads(report.source_data)
        except json.JSONDecodeError:
            source_data = None

    return {
        "id": report.id,
        "fixture_id": report.fixture_id,
        "report_type": report.report_type,
        "tone": report.tone,
        "source_data": source_data,
        "content": report.content,
        "status": report.status,
        "created_at": getattr(report, "created_at", None),
        "updated_at": getattr(report, "updated_at", None),
    }


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return username

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_fixture_from_database(fixture_id: str, db: Session) -> Optional[dict[str, Any]]:
    # Prefer the synced fixture snapshot to avoid calling Dribl for every report view.
    match = (
        db.query(models.Match)
        .filter(models.Match.fixture_id == str(fixture_id))
        .first()
    )

    if match is None or not match.raw_json:
        return None

    try:
        fixture = json.loads(match.raw_json)
    except json.JSONDecodeError:
        return None

    return fixture if isinstance(fixture, dict) else None


def get_fixture_data(fixture: dict[str, Any]) -> dict[str, Any]:
    # Dribl responses may arrive as either a top-level record or wrapped in "data".
    wrapped_data = fixture.get("data")

    if isinstance(wrapped_data, dict):
        return wrapped_data

    if isinstance(fixture.get("attributes"), dict):
        return fixture

    return {}


def get_fixture_attributes(
    fixture_id: str,
    db: Optional[Session] = None,
) -> dict[str, Any]:
    fixture = get_fixture_from_database(fixture_id, db) if db is not None else None

    if fixture is None:
        fixture = get_fixture(fixture_id)

    fixture_data = get_fixture_data(fixture) if isinstance(fixture, dict) else {}
    attributes = (
        fixture_data.get("attributes", {})
        if isinstance(fixture_data, dict)
        else {}
    )

    if not isinstance(attributes, dict) or not attributes:
        raise HTTPException(
            status_code=502,
            detail="Fixture data did not include match attributes.",
        )

    return attributes


def load_fixture_payload(fixture_id: str, db: Optional[Session] = None) -> dict[str, Any]:
    fixture = get_fixture_from_database(fixture_id, db) if db is not None else None

    if fixture is None:
        live_fixture = get_fixture(fixture_id)
        fixture = live_fixture.get("data", live_fixture)

    return fixture if isinstance(fixture, dict) else {}


def load_statistics_payload(
    fixture_id: str, event_status: Optional[str] = None
) -> Optional[dict[str, Any]]:
    # Statistics are only expected once a match is complete; pending fixtures skip this call.
    if str(event_status or "").lower() != "complete":
        return None

    try:
        response = get_fixture_statistics(fixture_id)
    except HTTPException:
        return None

    if isinstance(response, dict):
        return response

    return None


def build_match_bundle(
    fixture_id: str,
    db: Optional[Session] = None,
    fixture: Optional[dict[str, Any]] = None,
    statistics: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    # Bundle the raw fixture, optional statistics, and normalized data used by prompts.
    fixture_payload = fixture or load_fixture_payload(fixture_id, db)
    fixture_record = normalize_fixture_record(fixture_payload)
    attributes = fixture_record.get("attributes", {})

    if not isinstance(attributes, dict):
        attributes = {}

    statistics_payload = statistics
    if statistics_payload is None:
        statistics_payload = load_statistics_payload(
            fixture_id, attributes.get("event_status")
        )

    match_data = normalize_fixture_for_report(fixture_payload, statistics_payload)

    return {
        "fixture_id": fixture_id,
        "fixture": fixture_payload,
        "statistics": statistics_payload,
        "match_data": match_data,
    }


def serialize_match(match: models.Match) -> dict[str, Any]:
    raw_fixture: dict[str, Any] = {}

    # Rehydrate the original Dribl payload, then overlay denormalized DB fields.
    if match.raw_json:
        try:
            loaded = json.loads(match.raw_json)
            raw_fixture = loaded if isinstance(loaded, dict) else {}
        except json.JSONDecodeError:
            raw_fixture = {}

    raw_data = get_fixture_data(raw_fixture) if isinstance(raw_fixture, dict) else {}
    raw_attributes = (
        raw_data.get("attributes", {})
        if isinstance(raw_data, dict) and isinstance(raw_data.get("attributes"), dict)
        else {}
    )

    attributes = {
        **raw_attributes,
        "fixture_id": match.fixture_id,
        "league_id": match.league_id,
        "league_name": match.league_name,
        "competition_name": match.competition_name,
        "season_name": match.season_name,
        "tenant_name": match.tenant_name,
        "home_team": match.home_team,
        "away_team": match.away_team,
        "home_team_id": match.home_team_id,
        "away_team_id": match.away_team_id,
        "local_start_date": match.local_start_date,
        "local_start_time": match.local_start_time,
        "utc_datetime": match.utc_datetime,
        "ground_name": match.ground_name,
        "field_name": match.field_name,
        "event_status": match.event_status,
        "matchsheet_status": match.matchsheet_status,
        "round_number": match.round_number,
    }

    return {
        "type": "fixtures",
        "id": match.fixture_id,
        "attributes": attributes,
    }


def serialize_league(league: models.League) -> dict[str, Any]:
    rounds = []

    if league.rounds_json:
        try:
            loaded = json.loads(league.rounds_json)
            rounds = loaded if isinstance(loaded, list) else []
        except json.JSONDecodeError:
            rounds = []

    return {
        "id": league.league_id,
        "name": league.name,
        "competition": league.competition,
        "season": league.season,
        "tenant": league.tenant,
        "matches": league.matches_count,
        "match_count": league.matches_count,
        "first_match_date": league.first_match_date,
        "last_match_date": league.last_match_date,
        "rounds": rounds,
        "status": league.status,
        "synced_at": league.synced_at,
    }


def build_score(data: dict[str, Any]) -> str:
    home_score = data.get("home_score")
    away_score = data.get("away_score")

    if home_score is None or away_score is None:
        home_score = data.get("home_team_score")
        away_score = data.get("away_team_score")

    if home_score is not None and away_score is not None:
        return f"{home_score}-{away_score}"

    return "Not available"


def build_match_source_data(
    match_bundle: dict[str, Any],
    report_type: str,
    tone: str,
    excitement: str = "balanced",
    comedic_effect: str = "none",
) -> dict[str, Any]:
    # Store both display metadata and raw source payloads with each generated report.
    match_data = match_bundle.get("match_data") or {}
    score = score_label_from_match_data(match_data)
    style = resolve_report_style(tone, excitement, comedic_effect)

    return {
        "kind": "match",
        "fixtureId": match_bundle.get("fixture_id"),
        "homeTeam": (match_data.get("homeTeam") or {}).get("name"),
        "awayTeam": (match_data.get("awayTeam") or {}).get("name"),
        "league": match_data.get("league"),
        "competition": match_data.get("competition"),
        "venue": match_data.get("venue"),
        "matchDate": match_data.get("date"),
        "matchTime": match_data.get("time"),
        "status": match_data.get("eventStatus"),
        "score": score,
        "contentType": report_type,
        "tone": style["tone"],
        "excitement": style["excitement"],
        "comedic_effect": style["comedic_effect"],
        "writingStyle": style["tone"],
        "fixture": match_bundle.get("fixture"),
        "statistics": match_bundle.get("statistics"),
        "match_data": match_data,
    }


def build_report_prompt(
    match_data: dict[str, Any],
    report_type: str,
    tone: str,
    excitement: str = "balanced",
    comedic_effect: str = "none",
) -> str:
    style = resolve_report_style(tone, excitement, comedic_effect)
    return build_match_report_prompt(
        report_type=report_type,
        tone=style["tone"],
        excitement=style["excitement"],
        comedic_effect=style["comedic_effect"],
        match_data=match_data,
    )


def build_league_source_data(request: LeagueSummaryJobRequest) -> dict[str, Any]:
    round_value = request.round if request.round not in (None, "") else "all"
    round_label = request.round_label

    if not round_label:
        round_label = "All rounds" if round_value == "all" else f"Round {round_value}"

    matches = request.matches if request.matches is not None else []

    return {
        "kind": "league",
        "leagueId": request.league_id,
        "leagueName": request.league_name,
        "league": request.league_name,
        "competition": request.competition or request.league_name,
        "season": request.season,
        "round": round_value,
        "roundLabel": round_label,
        "matches": matches,
        "matchCount": request.match_count,
        "status": request.status,
        "contentType": "League Summary",
        "writingStyle": request.tone,
    }


def mark_report_generation_failed(
    db: Session,
    report: models.Report,
    error: Exception,
):
    # Keep the failure visible in the report list and preserve the error for debugging.
    source_data = {}

    if report.source_data:
        try:
            source_data = json.loads(report.source_data)
        except json.JSONDecodeError:
            source_data = {}

    source_data["generation_error"] = str(error)
    report.source_data = json.dumps(source_data)
    report.content = f"Report generation failed: {error}"
    report.status = "failed"
    db.commit()


def run_report_generation_background(
    report_id: int,
    match_bundle: dict[str, Any],
    report_type: str,
    tone: str,
    excitement: str = "balanced",
    comedic_effect: str = "none",
):
    # Background tasks run outside the request session, so open a fresh DB session here.
    db = SessionLocal()

    try:
        report = db.query(models.Report).filter(models.Report.id == report_id).first()

        if report is None:
            return

        style = resolve_report_style(tone, excitement, comedic_effect)
        match_data = match_bundle.get("match_data") or {}
        prompt = build_report_prompt(
            match_data,
            report_type,
            style["tone"],
            style["excitement"],
            style["comedic_effect"],
        )
        result = generate_report(prompt)
        report_text = result.get("report", "").strip()

        if not report_text:
            raise ValueError("The LLM did not return report content.")

        report.content = report_text
        # Report status moves processing -> complete only after non-empty LLM output.
        report.status = "complete"
        report.tone = style["tone"]

        source_data = build_match_source_data(
            match_bundle,
            report_type,
            style["tone"],
            style["excitement"],
            style["comedic_effect"],
        )
        report.source_data = json.dumps(source_data)

        db.commit()

    except Exception as error:
        report = db.query(models.Report).filter(models.Report.id == report_id).first()

        if report is not None:
            mark_report_generation_failed(db, report, error)

    finally:
        db.close()


def run_league_summary_generation_background(report_id: int):
    # League summaries reuse the same status lifecycle as match reports.
    db = SessionLocal()

    try:
        report = db.query(models.Report).filter(models.Report.id == report_id).first()

        if report is None:
            return

        source_data = json.loads(report.source_data or "{}")
        style = resolve_report_style(
            report.tone or source_data.get("tone") or source_data.get("writingStyle") or "professional",
            source_data.get("excitement"),
            source_data.get("comedic_effect"),
        )
        prompt = build_league_summary_prompt(
            tone=style["tone"],
            league_data=source_data,
            excitement=style["excitement"],
            comedic_effect=style["comedic_effect"],
        )
        result = generate_report(prompt)
        report_text = result.get("report", "").strip()

        if not report_text:
            raise ValueError("The LLM did not return league summary content.")

        report.content = report_text
        report.status = "complete"
        db.commit()

    except Exception as error:
        report = db.query(models.Report).filter(models.Report.id == report_id).first()

        if report is not None:
            mark_report_generation_failed(db, report, error)

    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/report-style-options")
def report_style_options(user: str = Depends(get_current_user)):
    return get_style_options()


@app.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(models.User).filter(models.User.username == request.username).first()
    )

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    payload = {
        "sub": user.username,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}


@app.get("/matches/{fixture_id}")
def match_detail(
    fixture_id: str,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    return build_match_bundle(fixture_id, db)


@app.post("/jobs")
def create_job(
    request: JobRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # The UI may send preloaded fixture/statistics data; rebuild normalized data when possible.
    if request.match_data:
        match_bundle = {
            "fixture_id": request.fixture_id,
            "fixture": request.fixture,
            "statistics": request.statistics,
            "match_data": request.match_data,
        }
        if request.fixture and request.statistics:
            match_bundle["match_data"] = normalize_fixture_for_report(
                request.fixture, request.statistics
            )
    else:
        match_bundle = build_match_bundle(
            request.fixture_id,
            db,
            fixture=request.fixture,
            statistics=request.statistics,
        )

    match_data = match_bundle.get("match_data") or {}
    match_status = str(match_data.get("eventStatus", "")).lower()
    report_type = request.report_type.lower().replace("_", "-")

    if match_status == "pending" and report_type == "post-match":
        raise HTTPException(
            status_code=400,
            detail="Post-match reports are only available for complete matches.",
        )

    style = resolve_report_style(
        request.tone, request.excitement, request.comedic_effect
    )

    source_data = build_match_source_data(
        match_bundle=match_bundle,
        report_type=request.report_type,
        tone=style["tone"],
        excitement=style["excitement"],
        comedic_effect=style["comedic_effect"],
    )

    new_report = models.Report(
        fixture_id=request.fixture_id,
        report_type=request.report_type,
        tone=style["tone"],
        source_data=json.dumps(source_data),
        content=None,
        status="processing",
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    background_tasks.add_task(
        run_report_generation_background,
        new_report.id,
        match_bundle,
        request.report_type,
        style["tone"],
        style["excitement"],
        style["comedic_effect"],
    )

    return {
        "job_status": "processing",
        "report_status": new_report.status,
        "report_id": new_report.id,
        "report": None,
    }


@app.get("/leagues/{league_id}/round-summary-data")
def league_round_summary_data(
    league_id: str,
    round: str = "all",
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    """Return structured round JSON (matches with scores when available) for the UI."""
    league = (
        db.query(models.League).filter(models.League.league_id == str(league_id)).first()
    )

    return build_round_summary_payload(
        db=db,
        league_id=league_id,
        round_value=round,
        league_name=league.name if league else None,
        competition=league.competition if league else None,
        season=league.season if league else None,
        tenant=league.tenant if league else None,
    )


@app.post("/league-summary/jobs")
def create_league_summary_job(
    request: LeagueSummaryJobRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    if not request.league_id:
        raise HTTPException(status_code=400, detail="league_id is required.")

    style = resolve_report_style(
        request.tone, request.excitement, request.comedic_effect
    )

    # Build round data from synced matches so the backend, not the client, owns summary inputs.
    source_data = build_round_summary_payload(
        db=db,
        league_id=str(request.league_id),
        round_value=request.round,
        league_name=request.league_name,
        competition=request.competition,
        season=request.season,
    )
    source_data["roundLabel"] = request.round_label or source_data.get("roundLabel")
    source_data["contentType"] = "League Summary"
    source_data["tone"] = style["tone"]
    source_data["excitement"] = style["excitement"]
    source_data["comedic_effect"] = style["comedic_effect"]
    source_data["writingStyle"] = style["tone"]

    new_report = models.Report(
        fixture_id=None,
        report_type="league_summary",
        tone=style["tone"],
        source_data=json.dumps(source_data),
        content=None,
        status="processing",
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    background_tasks.add_task(
        run_league_summary_generation_background,
        new_report.id,
    )

    return {
        "job_status": "processing",
        "report_status": new_report.status,
        "report_id": new_report.id,
        "report": None,
    }


@app.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    reports = db.query(models.Report).order_by(models.Report.id.desc()).all()

    return {
        "data": [serialize_report(report) for report in reports],
        "total": len(reports),
    }


@app.post("/reports")
def create_report(
    request: ReportCreate,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    new_report = models.Report(
        fixture_id=request.fixture_id,
        report_type=request.report_type,
        tone=request.tone,
        source_data=json.dumps(request.source_data) if request.source_data else None,
        content=request.content,
        status=request.status,
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return serialize_report(new_report)


@app.get("/reports/published")
def get_published(
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    reports = (
        db.query(models.Report)
        .filter(models.Report.status == "published")
        .order_by(models.Report.id.desc())
        .all()
    )

    return {
        "data": [serialize_report(report) for report in reports],
        "total": len(reports),
    }


# Generate AI football report using the LLM server through Ollama.
@app.post("/reports/generate", response_model=GenerateReportResponse)
def generate_ai_report(
    request: GenerateReportRequest,
    user: str = Depends(get_current_user),
):
    try:
        # Convert frontend report settings and match data into a prompt.
        style = resolve_report_style(
            request.tone, request.excitement, request.comedic_effect
        )
        prompt = build_match_report_prompt(
            report_type=request.report_type,
            tone=style["tone"],
            excitement=style["excitement"],
            comedic_effect=style["comedic_effect"],
            match_data=request.match_data,
        )

        # Send the prompt to Ollama and receive generated text.
        result = generate_report(prompt)

        return GenerateReportResponse(
            success=True,
            report=result["report"],
            model=result["model"],
        )

    except Exception as error:
        return GenerateReportResponse(
            success=False,
            error=str(error),
        )


@app.get("/reports/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    return serialize_report(report)


@app.put("/reports/{report_id}")
def update_report(
    report_id: int,
    request: ReportUpdate,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    report.content = request.content
    report.status = "draft"

    db.commit()
    db.refresh(report)

    return serialize_report(report)


@app.patch("/reports/{report_id}")
def patch_report(
    report_id: int,
    request: ReportPatch,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    if request.content is not None:
        report.content = request.content

    if request.source_data is not None:
        report.source_data = json.dumps(request.source_data)

    if request.status is not None:
        # Keep report workflow states constrained to values the frontend understands.
        allowed_statuses = {
            "processing",
            "complete",
            "draft",
            "review",
            "approved",
            "published",
            "failed",
        }

        if request.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail="Invalid report status")

        report.status = request.status

    db.commit()
    db.refresh(report)

    return serialize_report(report)


@app.post("/reports/{report_id}/approve")
def approve_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "approved"

    db.commit()
    db.refresh(report)

    return serialize_report(report)


@app.post("/reports/{report_id}/publish")
def publish_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Report must be approved before publishing",
        )

    report.status = "published"

    db.commit()
    db.refresh(report)

    return serialize_report(report)


@app.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(report)
    db.commit()

    return {"message": "Deleted"}


@app.post("/sync/dribl")
def sync_dribl(
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    return sync_dribl_data(db)


@app.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # Dashboard counts are database-backed, so they reflect the latest Dribl sync and jobs.
    excluded_content_statuses = ["processing", "failed"]

    matches_count = db.query(func.count(models.Match.id)).scalar() or 0
    leagues_count = db.query(func.count(models.League.id)).scalar() or 0
    last_match_sync_at = db.query(func.max(models.Match.synced_at)).scalar()
    last_league_sync_at = db.query(func.max(models.League.synced_at)).scalar()
    last_dribl_sync_at = max(
        [value for value in (last_match_sync_at, last_league_sync_at) if value],
        default=None,
    )
    jobs_count = db.query(func.count(models.Report.id)).scalar() or 0
    content_count = (
        db.query(func.count(models.Report.id))
        .filter(~models.Report.status.in_(excluded_content_statuses))
        .scalar()
        or 0
    )
    draft_count = (
        db.query(func.count(models.Report.id))
        .filter(models.Report.status == "draft")
        .scalar()
        or 0
    )
    complete_count = (
        db.query(func.count(models.Report.id))
        .filter(models.Report.status == "complete")
        .scalar()
        or 0
    )
    review_count = (
        db.query(func.count(models.Report.id))
        .filter(models.Report.status == "review")
        .scalar()
        or 0
    )
    approved_count = (
        db.query(func.count(models.Report.id))
        .filter(models.Report.status == "approved")
        .scalar()
        or 0
    )
    published_count = (
        db.query(func.count(models.Report.id))
        .filter(models.Report.status == "published")
        .scalar()
        or 0
    )
    recent_reports = (
        db.query(models.Report)
        .filter(~models.Report.status.in_(excluded_content_statuses))
        .order_by(models.Report.id.desc())
        .limit(5)
        .all()
    )

    return {
        "stats": {
            "matches": matches_count,
            "matches_count": matches_count,
            "jobs": jobs_count,
            "jobs_count": jobs_count,
            "leagues": leagues_count,
            "leagues_count": leagues_count,
            "content": content_count,
            "content_count": content_count,
            "complete": complete_count,
            "draft": draft_count,
            "review": review_count,
            "approved": approved_count,
            "published": published_count,
        },
        "last_dribl_sync_at": last_dribl_sync_at,
        "recent_reports": [serialize_report(report) for report in recent_reports],
        "recent_content": [serialize_report(report) for report in recent_reports],
    }


@app.get("/matches")
def match_list(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # Matches are served from the local sync cache with backend pagination.
    per_page = 50
    safe_page = max(page, 1)
    query = db.query(models.Match)

    if start_date:
        query = query.filter(models.Match.local_start_date >= start_date)

    if end_date:
        query = query.filter(models.Match.local_start_date <= end_date)

    if status and status.lower() != "all":
        query = query.filter(func.lower(models.Match.event_status) == status.lower())

    total = query.count()
    last_page = max(1, (total + per_page - 1) // per_page)
    safe_page = min(safe_page, last_page)

    matches = (
        query.order_by(
            models.Match.local_start_date.asc(),
            models.Match.local_start_time.asc(),
            models.Match.id.asc(),
        )
        .offset((safe_page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "data": [serialize_match(match) for match in matches],
        "meta": {
            "current_page": safe_page,
            "last_page": last_page,
            "per_page": per_page,
            "total": total,
        },
        "links": {},
    }


@app.get("/leagues")
def league_list(
    tenant_name: Optional[str] = None,
    start_date: str = "2020-01-01",
    end_date: Optional[str] = None,
    status: str = "all",
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # Leagues are derived during sync, then filtered from the local database.
    query = db.query(models.League)

    if tenant_name and tenant_name.lower() != "all":
        query = query.filter(models.League.tenant == tenant_name)

    if start_date:
        query = query.filter(models.League.last_match_date >= start_date)

    if end_date:
        query = query.filter(models.League.first_match_date <= end_date)

    if status and status.lower() != "all":
        query = query.filter(func.lower(models.League.status) == status.lower())

    leagues = (
        query.order_by(models.League.name.asc(), models.League.season.asc()).all()
    )

    return {
        "data": [serialize_league(league) for league in leagues],
        "total": len(leagues),
    }
