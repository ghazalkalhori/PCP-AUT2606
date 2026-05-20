from typing import Optional

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


# This class represents the reports table in the database.
class Report(Base):
    __tablename__ = "reports"

    # Primary key, unique ID for each report.
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Dribl fixture ID, also known as the match ID.
    fixture_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Type of report, such as pre-match or post-match.
    report_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Tone of the report, such as professional or casual.
    tone: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Actual generated report text.
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Workflow status, such as draft or approved.
    status: Mapped[str] = mapped_column(String, default="draft")


# This class represents the users table in the database.
class User(Base):
    __tablename__ = "users"

    # Primary key, unique ID for each user.
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Employee username or email.
    username: Mapped[str] = mapped_column(String, unique=True, index=True)

    # Hashed password. Never store plain passwords.
    password_hash: Mapped[str] = mapped_column(String)

    # Simple role, such as admin or editor.
    role: Mapped[str] = mapped_column(String, default="admin")
