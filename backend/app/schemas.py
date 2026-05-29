# Request and response schemas for report generation.

from pydantic import BaseModel
from typing import Any, Optional


class GenerateReportRequest(BaseModel):
    """
    Incoming direct-generation request from the frontend.

    Most current UI flows create async jobs instead, but this schema still backs
    the synchronous /reports/generate endpoint.
    """

    report_type: str
    tone: str
    excitement: str
    comedic_effect: str
    match_data: dict[str, Any]


class GenerateReportResponse(BaseModel):
    """
    Response returned by the synchronous generation endpoint.
    """

    success: bool
    report: Optional[str] = None
    model: Optional[str] = None
    error: Optional[str] = None
