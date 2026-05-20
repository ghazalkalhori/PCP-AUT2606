# Request and response schemas for report generation.

from pydantic import BaseModel
from typing import Any, Optional


class GenerateReportRequest(BaseModel):
    """
    Incoming request from frontend.
    """

    report_type: str
    tone: str
    excitement: str
    comedic_effect: str
    match_data: dict[str, Any]


class GenerateReportResponse(BaseModel):
    """
    Response returned back to frontend.
    """

    success: bool
    report: Optional[str] = None
    model: Optional[str] = None
    error: Optional[str] = None
