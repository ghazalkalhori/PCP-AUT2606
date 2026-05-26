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
from sqlalchemy.orm import Session

from app import models
from app.db import Base, engine, SessionLocal
from app.services.dribl import get_fixture, get_fixtures, get_leagues_from_fixtures

from app.schemas import GenerateReportRequest, GenerateReportResponse
from app.services.prompts import build_league_summary_prompt, build_match_report_prompt
from app.services.ollama import generate_report

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


def get_fixture_attributes(fixture_id: str) -> dict[str, Any]:
    fixture = get_fixture(fixture_id)
    fixture_data = fixture.get("data", {}) if isinstance(fixture, dict) else {}
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
    data: dict[str, Any],
    report_type: str,
    tone: str,
    score: str,
) -> dict[str, Any]:
    return {
        "kind": "match",
        "homeTeam": data.get("home_team"),
        "awayTeam": data.get("away_team"),
        "league": data.get("league_name"),
        "competition": data.get("competition_name"),
        "venue": data.get("ground_name"),
        "matchDate": data.get("local_start_date"),
        "matchTime": data.get("local_start_time"),
        "status": data.get("event_status"),
        "score": score,
        "contentType": report_type,
        "writingStyle": tone,
    }


def build_report_prompt(
    data: dict[str, Any],
    report_type: str,
    tone: str,
    score: str,
) -> str:
    return build_match_report_prompt(
        report_type=report_type,
        tone=tone,
        excitement="Medium",
        comedic_effect="None",
        match_data={
            "home_team": data.get("home_team"),
            "away_team": data.get("away_team"),
            "competition": data.get("competition_name"),
            "league": data.get("league_name"),
            "date": data.get("local_start_date"),
            "time": data.get("local_start_time"),
            "venue": data.get("ground_name"),
            "field": data.get("field_name"),
            "status": data.get("event_status"),
            "score": score,
        },
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
    fixture_id: str,
    report_type: str,
    tone: str,
):
    db = SessionLocal()

    try:
        report = db.query(models.Report).filter(models.Report.id == report_id).first()

        if report is None:
            return

        data = get_fixture_attributes(fixture_id)
        score = build_score(data)
        prompt = build_report_prompt(data, report_type, tone, score)
        result = generate_report(prompt)
        report_text = result.get("report", "").strip()

        if not report_text:
            raise ValueError("The LLM did not return report content.")

        report.content = report_text
        report.status = "draft"

        source_data = build_match_source_data(data, report_type, tone, score)
        report.source_data = json.dumps(source_data)

        db.commit()

    except Exception as error:
        report = db.query(models.Report).filter(models.Report.id == report_id).first()

        if report is not None:
            mark_report_generation_failed(db, report, error)

    finally:
        db.close()


def run_league_summary_generation_background(report_id: int):
    db = SessionLocal()

    try:
        report = db.query(models.Report).filter(models.Report.id == report_id).first()

        if report is None:
            return

        source_data = json.loads(report.source_data or "{}")
        prompt = build_league_summary_prompt(
            tone=report.tone or source_data.get("writingStyle") or "professional",
            league_data=source_data,
        )
        result = generate_report(prompt)
        report_text = result.get("report", "").strip()

        if not report_text:
            raise ValueError("The LLM did not return league summary content.")

        report.content = report_text
        report.status = "draft"
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
def match_detail(fixture_id: str, user: str = Depends(get_current_user)):
    return get_fixture(fixture_id)


@app.post("/jobs")
def create_job(
    request: JobRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    data = get_fixture_attributes(request.fixture_id)

    match_status = str(data.get("event_status", "")).lower()
    report_type = request.report_type.lower().replace("_", "-")

    if match_status == "pending" and report_type == "post-match":
        raise HTTPException(
            status_code=400,
            detail="Post-match reports are only available for complete matches.",
        )

    score = build_score(data)
    source_data = build_match_source_data(
        data=data,
        report_type=request.report_type,
        tone=request.tone,
        score=score,
    )

    new_report = models.Report(
        fixture_id=request.fixture_id,
        report_type=request.report_type,
        tone=request.tone,
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
        request.fixture_id,
        request.report_type,
        request.tone,
    )

    return {
        "job_status": "processing",
        "report_status": new_report.status,
        "report_id": new_report.id,
        "report": None,
    }


@app.post("/league-summary/jobs")
def create_league_summary_job(
    request: LeagueSummaryJobRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    source_data = build_league_source_data(request)

    new_report = models.Report(
        fixture_id=None,
        report_type="league_summary",
        tone=request.tone,
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
        prompt = build_match_report_prompt(
            report_type=request.report_type,
            tone=request.tone,
            excitement=request.excitement,
            comedic_effect=request.comedic_effect,
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
        allowed_statuses = {
            "processing",
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


# Dashboard summary endpoint.
# Frontend uses this to show dashboard cards and recent reports.
@app.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # Get all saved reports from database
    reports = db.query(models.Report).all()

    # Count reports by status
    draft_count = len([r for r in reports if r.status == "draft"])
    review_count = len([r for r in reports if r.status == "review"])
    approved_count = len([r for r in reports if r.status == "approved"])
    published_count = len([r for r in reports if r.status == "published"])

    # Return simple dashboard data
    return {
        "stats": {
            "matches": 0,
            "jobs": len(reports),
            "leagues": 0,
            "content": len(reports),
            "draft": draft_count,
            "review": review_count,
            "approved": approved_count,
            "published": published_count,
        },
        "recent_reports": [serialize_report(report) for report in reports[-5:]],
    }


# Get list of fixtures from Dribl.
# Frontend calls this instead of calling Dribl directly.
@app.get("/matches")
def match_list(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    user: str = Depends(get_current_user),
):
    # Keep FastAPI as the single gateway to Dribl and accept simple query params.
    return get_fixtures(
        start_date=start_date,
        end_date=end_date,
        status=status,
        page=page,
    )


# Get unique leagues from fixture data
@app.get("/leagues")
def league_list(
    tenant_name: str = "FWW",
    start_date: str = "2020-01-01",
    end_date: Optional[str] = None,
    status: str = "all",
    user: str = Depends(get_current_user),
):
    return get_leagues_from_fixtures(
        tenant_name=tenant_name,
        start_date=start_date,
        end_date=end_date,
        status=status,
    )
