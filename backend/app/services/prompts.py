# Prompt builder utilities for football report generation.

import json


_REPORT_TYPE_GUIDANCE = {
    "post_match": (
        "Summarise a completed match using only the provided score, goals, cards, "
        "substitutions, statistics, and notes. Do not preview future events."
    ),
    "pre_match": (
        "Preview an upcoming fixture using only the provided fixture, ladder, squad, "
        "form, suspension, and availability data. Do not invent final scores or completed events."
    ),
    "round_summary": (
        "Summarise the round or league using only the provided list of matches, results, "
        "ladder movement, highlights, and available statistics."
    ),
}


def build_match_report_prompt(
    report_type: str,
    tone: str,
    excitement: str,
    comedic_effect: str,
    match_data: dict,
) -> str:
    """
    Build a structured anti-hallucination prompt for the LLM.
    All factual content must come from match_data — the model must not invent anything.
    """
    guidance = _REPORT_TYPE_GUIDANCE.get(
        report_type,
        "Write a football report using only the data provided below.",
    )

    pretty_json = json.dumps(match_data, indent=2, ensure_ascii=False)

    return f"""You are a professional football journalist for Reporta AI.

Task:
Write a {report_type} football report using ONLY the structured JSON data below.

Style settings:
- Tone: {tone}
- Excitement level: {excitement}
- Comedic effect: {comedic_effect}

Report type guidance:
{guidance}

Strict rules:
- Use only the information provided in the JSON.
- Do not invent player names.
- Do not invent team names.
- Do not invent scores.
- Do not invent venues.
- Do not invent dates.
- Do not invent cards, substitutions, injuries, statistics, suspensions, or match events.
- If a field is missing, write naturally without making up facts.
- If the JSON does not contain enough information, say that some details were unavailable.
- Return a clear headline followed by well-structured paragraphs.
- The output is a draft for admin review, not final publication.

Structured JSON data:
{pretty_json}""".strip()
