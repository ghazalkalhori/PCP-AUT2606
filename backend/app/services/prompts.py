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


def build_league_summary_prompt(tone: str, league_data: dict) -> str:
    """
    Build a structured prompt for a league or round summary.
    """

    league_name = (
        league_data.get("leagueName")
        or league_data.get("league")
        or "Selected League"
    )
    competition = league_data.get("competition") or league_name
    season = league_data.get("season") or "Current season"
    round_label = (
        league_data.get("roundLabel")
        or league_data.get("round")
        or "All available rounds"
    )
    matches = league_data.get("matches") or []
    match_count = league_data.get("matchCount")

    if isinstance(matches, list) and matches:
        match_lines = "\n".join(f"- {match}" for match in matches)
    elif match_count:
        match_lines = f"- Match count available: {match_count}"
    else:
        match_lines = "- Detailed fixture list is not available."

    return f"""
You are a professional football journalist.

Generate a concise football league round summary.

Writing style:
- Tone: {tone}

League details:
- League: {league_name}
- Competition: {competition}
- Season: {season}
- Round: {round_label}

Matches and context:
{match_lines}

Instructions:
- Mention the league name, competition, season, and round.
- Summarize key fixtures or available match context.
- Do not invent scores, scorers, rankings, statistics, or incidents.
- For pending matches, write a preview-style summary.
- For completed matches, write a recap-style summary.
- Use a professional, publication-ready tone.
""".strip()
