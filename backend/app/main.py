from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.db import Base, engine, SessionLocal
from app.services.dribl import get_fixture


# Create database tables automatically when the app starts.
Base.metadata.create_all(bind=engine)


# Initialize FastAPI app.
app = FastAPI()


# JWT settings.
# SECRET_KEY is used to sign tokens. Later, move this to .env for better security.
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set in environment")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# Password hashing setup.
# We use bcrypt so plain passwords are never stored or compared directly.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# HTTP Bearer security.
# This tells FastAPI that protected routes need an Authorization: Bearer <token> header.
security = HTTPBearer()


# Request body for login.
class LoginRequest(BaseModel):
    username: str
    password: str


# Request body for creating a report job.
class JobRequest(BaseModel):
    fixture_id: str
    report_type: str
    tone: str = "professional"


# Request body for editing a report.
class ReportUpdate(BaseModel):
    content: str


# Create a database session for each API request.
# The session is closed automatically after the request finishes.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Read and validate the JWT token from protected requests.
# If the token is valid, return the username stored inside the token.
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


# Simple health check endpoint.
# Use this to confirm that the backend is running.
@app.get("/health")
def health():
    return {"status": "ok"}


# User login endpoint.
# This is public because users need it before they have a token.
@app.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Find user by username.
    user = db.query(models.User).filter(models.User.username == request.username).first()

    # If username does not exist, reject login.
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Compare entered password with stored hashed password.
    if not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create token payload.
    # "sub" stores the username, and "exp" sets token expiry time.
    payload = {
        "sub": user.username,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    # Encode payload into a JWT token.
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}


# Get match details from Dribl using fixture ID.
# Protected because only logged-in users should access project data.
@app.get("/matches/{fixture_id}")
def match_detail(fixture_id: str, user: str = Depends(get_current_user)):
    return get_fixture(fixture_id)


# Create a report job, generate report text, and save it to the database.
# Protected because only logged-in users should generate reports.
@app.post("/jobs")
def create_job(
    request: JobRequest,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # Get real match data from Dribl.
    data = get_fixture(request.fixture_id)["data"]["attributes"]

    # Generate simple report text from the Dribl fixture data.
    # Later, this part can be replaced with the real LLM output.
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

    # Create a new report object before saving it to the database.
    new_report = models.Report(
        fixture_id=request.fixture_id,
        report_type=request.report_type,
        tone=request.tone,
        content=report_text,
        status="draft",
    )

    # Save the report in the database.
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "job_status": "completed",
        "report_status": new_report.status,
        "report_id": new_report.id,
        "report": new_report.content,
    }


# Get all reports.
# Protected because reports are internal admin content.
@app.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    return db.query(models.Report).all()


# Get all published reports.
# This must be placed before /reports/{report_id}, otherwise FastAPI may treat "published" as an ID.
@app.get("/reports/published")
def get_published(
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    return db.query(models.Report).filter(models.Report.status == "published").all()


# Get one report by ID.
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


# Edit an existing report.
# After editing, the report moves to review stage.
@app.put("/reports/{report_id}")
def update_report(
    report_id: int,
    request: ReportUpdate,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # Find report by ID.
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    # Update report content.
    report.content = request.content

    # Move report to review after editing.
    report.status = "review"

    # Save changes.
    db.commit()
    db.refresh(report)

    return report


# Approve a report.
# Only reports in review status can be approved.
@app.post("/reports/{report_id}/approve")
def approve_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # Find report by ID.
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    # Enforce workflow rule: review -> approved.
    if report.status != "review":
        raise HTTPException(
            status_code=400,
            detail="Report must be in review stage to approve",
        )

    # Update status.
    report.status = "approved"

    db.commit()
    db.refresh(report)

    return report


# Publish a report.
# Only approved reports can be published.
@app.post("/reports/{report_id}/publish")
def publish_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # Find report by ID.
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    # Enforce workflow rule: approved -> published.
    if report.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Report must be approved before publishing",
        )

    # Update status.
    report.status = "published"

    db.commit()
    db.refresh(report)

    return report


# Delete a report.
# Useful for testing and cleaning wrong report entries.
@app.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: str = Depends(get_current_user),
):
    # Find report by ID.
    report = db.query(models.Report).filter(models.Report.id == report_id).first()

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    # Delete report from database.
    db.delete(report)
    db.commit()

    return {"message": "Deleted"}