# Prompt builder utilities for football report generation.


def build_match_report_prompt(
    report_type: str,
    tone: str,
    excitement: str,
    comedic_effect: str,
    match_data: dict,
) -> str:
    """
    Build a structured prompt for the LLM.
    """

    home_team = match_data.get("home_team", "Home Team")
    away_team = match_data.get("away_team", "Away Team")

    competition = match_data.get("competition", "Football Competition")

    score = match_data.get("score", "Unknown Score")

    return f"""
You are a professional football journalist.

Generate a {report_type} football report.

Writing style:
- Tone: {tone}
- Excitement level: {excitement}
- Comedic effect: {comedic_effect}

Match details:
- Home Team: {home_team}
- Away Team: {away_team}
- Competition: {competition}
- Score: {score}

Write a clean, engaging football report suitable for publication.
""".strip()
