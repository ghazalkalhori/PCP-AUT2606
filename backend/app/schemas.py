# Request and response schemas for report generation.

from typing import Any, Literal, Optional

from fastapi import HTTPException
from pydantic import BaseModel, model_validator

VALID_REPORT_TYPES = {"pre_match", "post_match", "round_summary"}
VALID_TONES = {"professional", "fan_based", "formal", "casual"}
VALID_EXCITEMENT = {"low", "medium", "high"}
VALID_COMEDIC = {"none", "low", "medium"}


class GenerateReportRequest(BaseModel):
    """Incoming request from frontend for AI report generation."""

    report_type: str
    tone: str
    excitement: str
    comedic_effect: str
    match_data: dict[str, Any]
    # Optional — falls back to OLLAMA_MODEL env var if not supplied.
    model: Optional[str] = None

    @model_validator(mode="after")
    def validate_enums(self) -> "GenerateReportRequest":
        errors = []

        if self.report_type not in VALID_REPORT_TYPES:
            errors.append(f"report_type must be one of {sorted(VALID_REPORT_TYPES)}")

        if self.tone not in VALID_TONES:
            errors.append(f"tone must be one of {sorted(VALID_TONES)}")

        if self.excitement not in VALID_EXCITEMENT:
            errors.append(f"excitement must be one of {sorted(VALID_EXCITEMENT)}")

        if self.comedic_effect not in VALID_COMEDIC:
            errors.append(f"comedic_effect must be one of {sorted(VALID_COMEDIC)}")

        if not isinstance(self.match_data, dict):
            errors.append("match_data must be a JSON object")

        if errors:
            raise HTTPException(status_code=400, detail="; ".join(errors))

        return self


class GenerateReportResponse(BaseModel):
    """Response returned back to frontend after generation."""

    success: bool
    report: Optional[str] = None
    model: Optional[str] = None
    error: Optional[str] = None


class OllamaStatusResponse(BaseModel):
    """Response for GET /ollama/status."""

    success: bool
    ollamaUrl: str
    models: Optional[list[str]] = None
    error: Optional[str] = None
