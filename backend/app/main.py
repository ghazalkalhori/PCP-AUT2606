import os
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
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
from app.services.prompts import build_match_report_prompt
from app.services.ollama import generate_report

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
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


class ReportUpdate(BaseModel):
    content: str


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
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    data = get_fixture(request.fixture_id)["data"]["attributes"]

    report_text = f"""
{request.report_type.title()} Report

{data["home_team"]} vs {data["away_team"]}

Competition: {data["competition_name"]}
League: {data["league_name"]}
Date: {data["local_start_date"]} {data["local_start_time"]}
Venue: {data["ground_name"]}

Status: {data["event_status"]}

Tone: {request.tone}
"""

    new_report = models.Report(
        fixture_id=request.fixture_id,
        report_type=request.report_type,
        tone=request.tone,
        content=report_text,
        status="draft",
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "job_status": "completed",
        "report_status": new_report.status,
        "report_id": new_report.id,
        "report": new_report.content,
    }


@app.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    return db.query(models.Report).all()


@app.get("/reports/published")
def get_published(
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    return db.query(models.Report).filter(models.Report.status == "published").all()


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

    return report


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
    report.status = "review"

    db.commit()
    db.refresh(report)

    return report


@app.post("/reports/{report_id}/approve")
def approve_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "review":
        raise HTTPException(
            status_code=400,
            detail="Report must be in review stage to approve",
        )

    report.status = "approved"

    db.commit()
    db.refresh(report)

    return report


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

    return report


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
        "recent_reports": reports[-5:],
    }


# Get list of fixtures from Dribl.
# Frontend calls this instead of calling Dribl directly.
@app.get("/matches")
def match_list(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    user: str = Depends(get_current_user),
):
    # Keep FastAPI as the single gateway to Dribl and accept simple query params.
    return get_fixtures(
        start_date=start_date,
        end_date=end_date,
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
