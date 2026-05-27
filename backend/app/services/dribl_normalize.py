"""
Normalize Dribl fixture + statistics API responses into report-ready JSON.

Dribl puts final scores on GET /fixtures/{id}/statistics (data.attributes.score),
not on the fixture record itself. Goals, cards, and referees live there too.
"""

from __future__ import annotations

from typing import Any


def statistics_attributes(statistics: dict | None) -> dict:
    if not statistics:
        return {}
    data = statistics.get("data")
    if isinstance(data, dict):
        attrs = data.get("attributes")
        if isinstance(attrs, dict):
            return attrs
    attrs = statistics.get("attributes")
    return attrs if isinstance(attrs, dict) else {}


def _parse_score_value(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def extract_scores(
    fixture_attrs: dict,
    statistics: dict | None,
) -> tuple[int | None, int | None]:
    """Scores from statistics first; fixture attributes as fallback."""
    stats_attrs = statistics_attributes(statistics)
    score_block = stats_attrs.get("score") or {}

    home_score = _parse_score_value((score_block.get("home") or {}).get("full_time"))
    away_score = _parse_score_value((score_block.get("away") or {}).get("full_time"))

    if home_score is None:
        home_score = _parse_score_value(
            fixture_attrs.get("home_score") or fixture_attrs.get("home_team_score")
        )
    if away_score is None:
        away_score = _parse_score_value(
            fixture_attrs.get("away_score") or fixture_attrs.get("away_team_score")
        )

    return home_score, away_score


def _team_label(team_id: str | None, fixture_attrs: dict, home_name: str, away_name: str) -> str:
    if not team_id:
        return ""
    home_id = fixture_attrs.get("home_team_id")
    away_id = fixture_attrs.get("away_team_id")
    if team_id == home_id:
        return home_name
    if team_id == away_id:
        return away_name
    return ""


def extract_goals(statistics: dict | None, fixture_attrs: dict, home_name: str, away_name: str) -> list:
    goals = []
    for item in statistics_attributes(statistics).get("goals") or []:
        if not isinstance(item, dict):
            continue
        member = item.get("member") or {}
        first = (member.get("first_name") or "").strip()
        last = (member.get("last_name") or "").strip()
        player = f"{first} {last}".strip()
        team = _team_label(item.get("team_id"), fixture_attrs, home_name, away_name)
        minute = item.get("minute")
        entry = {
            "team": team,
            "player": player,
            "minute": int(minute) if str(minute).isdigit() else minute,
            "ownGoal": bool(item.get("own_goal")),
            "penalty": bool(item.get("penalty_kick")),
            "gameSection": item.get("game_section"),
        }
        if player or minute is not None:
            goals.append(entry)
    return goals


def extract_cards(statistics: dict | None, fixture_attrs: dict, home_name: str, away_name: str) -> list:
    cards = []
    for item in statistics_attributes(statistics).get("cards") or []:
        if not isinstance(item, dict):
            continue
        member = item.get("member") or {}
        first = (member.get("first_name") or "").strip()
        last = (member.get("last_name") or "").strip()
        player = f"{first} {last}".strip()
        team = _team_label(item.get("team_id"), fixture_attrs, home_name, away_name)
        final_card = item.get("final_card") or item.get("offence_code") or {}
        card_type = final_card.get("type") or final_card.get("name") or ""
        minute = item.get("minute")
        cards.append(
            {
                "team": team,
                "player": player,
                "card": card_type,
                "minute": int(minute) if str(minute).isdigit() else minute,
                "gameSection": item.get("game_section"),
            }
        )
    return cards


def extract_substitutions(
    statistics: dict | None, fixture_attrs: dict, home_name: str, away_name: str
) -> list:
    subs = []
    for item in statistics_attributes(statistics).get("substitutions") or []:
        if not isinstance(item, dict):
            continue
        team = _team_label(item.get("team_id"), fixture_attrs, home_name, away_name)
        off_member = item.get("member_off") or item.get("off_member") or {}
        on_member = item.get("member_on") or item.get("on_member") or {}

        def _name(m: dict) -> str:
            return f"{(m.get('first_name') or '').strip()} {(m.get('last_name') or '').strip()}".strip()

        subs.append(
            {
                "team": team,
                "playerOff": _name(off_member) or item.get("player_off") or "",
                "playerOn": _name(on_member) or item.get("player_on") or "",
                "minute": item.get("minute"),
            }
        )
    return subs


def extract_referees(statistics: dict | None) -> list:
    referees = []
    for item in statistics_attributes(statistics).get("referees") or []:
        if not isinstance(item, dict):
            continue
        first = (item.get("first_name") or "").strip()
        last = (item.get("last_name") or "").strip()
        name = f"{first} {last}".strip()
        referees.append(
            {
                "name": name,
                "role": item.get("referee_role") or "",
                "status": item.get("status"),
            }
        )
    return referees


def normalize_fixture_for_report(fixture: dict, statistics: dict | None = None) -> dict:
    attrs = fixture.get("attributes", fixture)
    fixture_id = fixture.get("id", "")
    home = attrs.get("home_team") or attrs.get("home_team_friendly_name") or "Home Team"
    away = attrs.get("away_team") or attrs.get("away_team_friendly_name") or "Away Team"

    home_score, away_score = extract_scores(attrs, statistics)
    event_status = str(attrs.get("event_status") or "").lower()

    payload = {
        "source": "dribl",
        "fixtureId": fixture_id,
        "tenant": attrs.get("tenant_name") or "FWW",
        "reportType": "post_match" if event_status == "complete" else "pre_match",
        "competition": attrs.get("competition_name") or "",
        "league": attrs.get("league_name") or "",
        "season": attrs.get("season_name") or "",
        "round": attrs.get("round_number"),
        "date": attrs.get("local_start_date") or attrs.get("start_date") or "",
        "time": attrs.get("local_start_time") or attrs.get("start_time") or "",
        "venue": attrs.get("ground_name") or "",
        "field": attrs.get("field_name") or "",
        "eventStatus": attrs.get("event_status") or "",
        "homeTeam": {
            "name": home,
            "code": attrs.get("home_team_code"),
            "score": home_score,
        },
        "awayTeam": {
            "name": away,
            "code": attrs.get("away_team_code"),
            "score": away_score,
        },
        "goals": extract_goals(statistics, attrs, home, away),
        "cards": extract_cards(statistics, attrs, home, away),
        "substitutions": extract_substitutions(statistics, attrs, home, away),
        "referees": extract_referees(statistics),
        "notes": [],
        "driblAttributes": attrs,
    }

    if statistics:
        payload["driblStatistics"] = statistics

    if home_score is not None and away_score is not None:
        payload["notes"].append(f"Final score: {home} {home_score} - {away_score} {away}.")

    return payload
