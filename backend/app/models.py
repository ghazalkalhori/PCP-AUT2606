from sqlalchemy import Column, Integer, String, Text
from app.db import Base


# This class = table in database
class Report(Base):
    __tablename__ = "reports"  # table name

    # Primary key (unique ID for each report)
    id = Column(Integer, primary_key=True, index=True)

    # Dribl fixture ID (match ID)
    fixture_id = Column(String)

    # Type of report (pre-match, post-match, etc.)
    report_type = Column(String)

    # Tone of report (formal, casual, etc.)
    tone = Column(String)

    # Actual generated report text
    content = Column(Text)

    # Workflow status (draft, approved, etc.)
    status = Column(String, default="draft")


# This class = users table
class User(Base):
    __tablename__ = "users"

    # Unique user ID
    id = Column(Integer, primary_key=True, index=True)

    # Employee username
    username = Column(String, unique=True, index=True)

    # Hashed password, never store plain password
    password_hash = Column(String)

    # Simple role, example: admin/editor
    role = Column(String, default="admin")