import json
import re
from dataclasses import dataclass
from typing import Any, Dict

from app.services.report_style_options import build_style_block


SUPPORTED_REPORT_TYPES = {
    "post_match",
    "pre_match",
    "round_summary",
}


REPORT_TYPE_LABELS = {
    "post_match": "Post-Match Report",
    "pre_match": "Pre-Match Preview",
    "round_summary": "Round / League Summary",
}


NARRATIVE_STYLE_REFERENCE = """
Write like a professional Australian football match reporter publishing for a club or
league website (similar to NPL NSW match reports: clear opening lede, flowing paragraphs,
chronological storytelling, specific moments named when the data provides them).

Style principles:
- Open with a strong lead paragraph that tells the reader the result and the main story
  immediately — do not bury the score. Respond as plain text only without any structure format response.
- Move through the match in time where the data allows (e.g. early chances, goals,
  turning points, late drama). Weave goals, cards, and substitutions into sentences —
  do not list them in isolation unless the JSON is too sparse to do otherwise.
- Vary sentence length. Use short punchy lines for drama; longer lines for context.
- Name players, minutes, and venues when supplied. Stay specific, not generic.
- You may end with a short factual close (scores, scorers, venue, date) in prose form
  only when those facts exist in the JSON — similar to a brief "match facts" paragraph,
  not a markdown table.

Avoid:
- Thin sections that only repeat "information was not provided".
- Generic filler ("both teams fought hard", "an entertaining encounter", "displayed
  strong performances") unless the JSON supports that claim.
- A report that reads like a form with five equal ## blocks filled with disclaimers.
"""


# These long-form prompt blocks are intentionally separated so match and league prompts
# share the same reporting rules while keeping report-type differences explicit.
REPORT_TYPE_PURPOSE = {
    "post_match": """
The report is about a completed football match.

Write a narrative match report: result in the opening, then the story of how the game
unfolded using only supplied events, scores, statistics, and notes. Chronological flow
preferred when minutes or half information exist. Mention goals, cards, substitutions,
and key players only when named in the JSON.
""",
    "pre_match": """
The report is about an upcoming football fixture.

Write a preview that builds interest: who plays whom, when and where, and what is at
stake — only from supplied fixture, form, ladder, squad, and availability data. Do not
write as if the match has finished. Do not predict a final score or invent rivalry.
""",
    "round_summary": """
The report is about a football round or league — one Football NSW-style match review
per completed fixture, plus a plain-text upcoming fixtures list at the end.

Write like a published round review journalist: each finished match is its own
self-contained article block. Do not write one round-wide essay with sub-headings or
bullet lists. Mention ladder or table movement only if supplied in the JSON.
""",
}


REPORT_STRUCTURE = {
    "post_match": """
Structure (no # headline — start with the lead paragraph):

[Lead paragraph — no ## header. State the result, teams, and defining story in the first
2–3 sentences. Include venue, date, and competition when supplied.]

## First Half
[Only include this section if the JSON supports first-half or early-match narrative —
goals, chances, cards, or notes with minutes before the break, or clear chronological
events. Write as flowing paragraphs; weave events into the story.]

## Second Half
[Only include if the JSON supports later events, additional goals, substitutions, or
closing stages. Omit entirely if there is no basis to separate halves — in that case
keep one continuous narrative in the lead and one ## section only.]

## At a Glance
[Optional. Include only when score, goal scorers, cards, or referees are supplied.
One short prose paragraph or two — e.g. "Goals: Smith 24', Jones 67'." — not bullets.]

Do not use ## Match Summary, ## Key Moments, ## What It Means, or ## Data Note.
""",
    "pre_match": """
Structure (no # headline — start with the lead paragraph):

[Lead paragraph — no ## header. Fixture, competition, date, time, venue when supplied.]

## The Teams
[Form, ladder, recent results — only if provided. Written as narrative paragraphs.]

## Team News
[Suspensions, availability, squad notes — only if provided. Omit section if empty.]

Omit sections with no supporting data. Do not use ## Data Note.
""",
    "round_summary": """
Optional one-line round opener (only if round, competition, or season are supplied):
state the round and competition in one sentence, then a blank line. Omit if not supplied.

For EACH completed match (score is present), use this structure exactly:

1. Match heading on its own line in ALL CAPS:
   [HOME TEAM] [HOME SCORE]-[AWAY SCORE] [AWAY TEAM]
   Example: HAKOAH FC 1-2 BANKSTOWN CITY
   Blank line after the heading.

2. One short factual paragraph (1–3 sentences): state the result and venue/date if
   supplied; mention goal scorers and minutes in prose only when supplied; if only
   teams and score are supplied, one sentence is enough. No bullet points, no
   sub-headings, no speculation, no filler.

3. Goal summary lines (after the paragraph):
   [Home Team] [home score] (Scorer minute', Scorer minute' ...)
   [Away Team] [away score] (Scorer minute' ...)
   Use apostrophe after minutes (e.g. 25', 45+'). Omit scorer parentheses for a team with no goals supplied.
   An own goal (OG) is listed under the team that BENEFITED (the opposing team of
   the player), formatted as: Scorer minute' (og). Never count an own goal toward
   the scoring player's own team.
   Blank line after these two lines before the next match block.

Process every completed match in a sensible order (e.g. by date, or as listed).

At the bottom, after all completed match blocks:

UPCOMING FIXTURES

List each pending match (no score or status is pending):
[Home Team] vs [Away Team] | [Date] | [Time] | [Venue]
One fixture per line. Omit segments only when that field is missing. If no pending fixtures, omit the entire section.
""",
}


GLOBAL_ANTI_HALLUCINATION_RULES = """
Strict anti-hallucination rules:
- Use only facts explicitly provided in the supplied data. Do not use outside knowledge.
- Do not invent player names, team names, scores, venues, dates, or kick-off times.
- Do not invent goals, cards, assists, substitutions, statistics, or any match events.
- Do not invent quotes, coaches, referees, attendance, weather, or crowd details.
- Do not call a player a captain, goalkeeper, defender, midfielder, or striker unless stated.
- Do not say a team dominated or controlled a match unless the data clearly supports it.
- Do not assume the home team won or that the first team listed is home.
- If data is missing, write around it naturally. If conflicting, note the inconsistency.
- Every factual sentence must trace back to the supplied data.
"""


GLOBAL_WRITING_RULES = """
Writing rules:
- Write the output as a polished draft article for admin review.
- The report must read like published football journalism — narrative first, not a
  template with empty sections.
- Do not use a markdown # headline. Start with the lead paragraph, then mostly prose.
- Scale length to the data: sparse JSON → a short factual piece (roughly 150–300 words);
  rich JSON (goals with minutes, cards, substitutions, stats, notes) → a fuller article
  (roughly 400–800+ words) with more detail and optional ## sections.
- Use ## section headers only when they add structure; each section must contain real
  story content, not a disclaimer about missing data. There is no fixed section cap —
  add sections when the JSON supports distinct halves, themes, or match phases.
- The opening paragraphs do not need a ## label.
- Avoid bullet points and numbered lists in the body. Do not use markdown tables.
- Do not output raw JSON, editor notes, or AI commentary.
- Use Australian English spelling and phrasing.
- Prefer concrete supplied facts (names, minutes, venue, score) over vague football clichés.
- Match the requested tone, excitement, and comedic effect without breaking factual accuracy.
- Keep humour safe and publication-appropriate. Never mock players, injuries, or officials.
- The output is a draft for admin review, not final publication.
"""


QUALITY_CHECK_INSTRUCTION = """
Before writing, silently check:
1. What facts are actually supplied (teams, score, goals with minutes, cards, venue, date)?
2. How much detail is available — should this be a short piece or a longer article?
3. What is the one story this article should tell with only those facts?
4. Which ## sections (if any) are justified — omit empty ones; add more only when data supports them.
5. Does every sentence trace to the supplied data? Remove generic filler that adds no fact.

Output only the finished article inside a ```md ... ``` code block. No preamble, no # headline.
"""


ROUND_SUMMARY_EXAMPLE = """
Example format for one completed match (structure and tone only — do not copy names or scores):

BLACKTOWN SPARTANS 4-1 WESTERN CITY RANGERS

League leaders Blacktown Spartans compounded the woes of Western City Rangers with a comfortable 4-1 win in Friday night action.

After a competitive start to the contest, the hosts were able to establish control as the first half went on. Darcy Ellem opened the scoring with his 11th goal of the campaign in the 25th minute, followed by a Sulleyman Bangura brace in the 29th and 40th minutes, sending them into cruise control. Austen Booth completed their first-half dominance with a stoppage-time goal.

With the result beyond doubt, there was a lack of rhythm in the second half before Thomas Lopez scored a late consolation goal in the 89th minute.

Blacktown Spartans 4 (Ellem 25', Bangura 29', 40', Booth 45+')
Western City Rangers 1 (Lopez 89')
"""

ROUND_SUMMARY_QUALITY_CHECK = """
Before writing, silently check:
1. Which matches have a score — write a full block for each, exactly once.
2. Which matches lack a score — list only under UPCOMING FIXTURES, never as finished results.
3. Each match appears only once. Do not duplicate match blocks.
4. For each goal summary line, use only the players and minutes supplied for that fixture.
5. Is ladder or table data present? If not, omit ladder commentary entirely.
6. Does every sentence trace to the supplied data? Remove generic filler.
7. For every match, the goals listed for each team in the goal summary lines must add up
   to that team's score, counting own goals for the benefiting team. If they cannot be
   reconciled, write only the score and omit the goal summary lines for that match.

Wrap your entire response in a single ```md ... ``` code block. No preamble or trailing comments outside that block.
"""


# ─── Shared prompt-building infrastructure ───────────────────────────────────

_ROLE_INTRO = (
    "You are Reporta AI, a professional Australian football journalist "
    "writing for a competition management platform (Dribl)."
)

_OUTPUT_RULE = (
    "Output rule: Wrap your entire response in a single markdown code block: "
    "```md on the first line, your article, then ``` on the last line. "
    "Do not add any preamble, explanation, or comment outside that block."
)

_OUTPUT_REQUIREMENTS_SHARED = (
    "- Return your response as a single ```md ... ``` code block containing the finished article."
)

_MATCH_OUTPUT_EXTRAS = (
    "- No # headline. Start with narrative paragraphs; use ## sections only when they help structure a longer piece.\n"
    "- Do not use ## Match Summary, ## Key Moments, ## What It Means, or ## Data Note.\n"
    "- No bullet lists, tables, raw data, or meta-commentary about missing fields."
)

_ROUND_SUMMARY_OUTPUT_EXTRAS = (
    "- No round-wide bullet lists, score tables, or generic sub-headings.\n"
    "- Do not fabricate goal minutes, player names, venues, or any detail not present in the supplied data."
)


@dataclass(frozen=True)
class _PromptSpec:
    """Per-report-type parts that differ between prompt variants."""

    label: str
    task_blurb: str
    purpose: str                  # empty string → omit the purpose block
    writing_rules: tuple[str, ...]  # inserted after the style block; empty tuple → skip
    structure: str
    quality_check: str
    output_extras: str            # lines appended after the shared output-requirements line


_PROMPT_SPECS: dict[str, _PromptSpec] = {
    "post_match": _PromptSpec(
        label=REPORT_TYPE_LABELS["post_match"],
        task_blurb=(
            "Write a match report that reads like published football journalism — "
            "narrative first, not a rigid template. "
            "Write a detailed piece when data is rich; keep it concise when data is sparse."
        ),
        purpose=REPORT_TYPE_PURPOSE["post_match"],
        writing_rules=(NARRATIVE_STYLE_REFERENCE, GLOBAL_WRITING_RULES),
        structure=REPORT_STRUCTURE["post_match"],
        quality_check=QUALITY_CHECK_INSTRUCTION,
        output_extras=_MATCH_OUTPUT_EXTRAS,
    ),
    "pre_match": _PromptSpec(
        label=REPORT_TYPE_LABELS["pre_match"],
        task_blurb=(
            "Write a match report that reads like published football journalism — "
            "narrative first, not a rigid template. "
            "Write a detailed piece when data is rich; keep it concise when data is sparse."
        ),
        purpose=REPORT_TYPE_PURPOSE["pre_match"],
        writing_rules=(NARRATIVE_STYLE_REFERENCE, GLOBAL_WRITING_RULES),
        structure=REPORT_STRUCTURE["pre_match"],
        quality_check=QUALITY_CHECK_INSTRUCTION,
        output_extras=_MATCH_OUTPUT_EXTRAS,
    ),
    "round_summary": _PromptSpec(
        label=REPORT_TYPE_LABELS["round_summary"],
        task_blurb=(
            "Write one plain-text match article per completed fixture, then list upcoming "
            "fixtures at the end. Write like a Football NSW round review journalist — each "
            "finished match is its own self-contained article block. Do not write a round-wide "
            "essay. Mention ladder or table movement only if supplied."
        ),
        purpose="",
        writing_rules=(),
        structure=REPORT_STRUCTURE["round_summary"],
        quality_check=ROUND_SUMMARY_QUALITY_CHECK,
        output_extras=_ROUND_SUMMARY_OUTPUT_EXTRAS,
    ),
}


def _build_system_message(spec: _PromptSpec, style_block: str) -> str:
    """
    Assemble the system message from a prompt spec and a pre-rendered style block.

    Sections with empty content are omitted so the same helper works for match
    reports (which include writing rules and a purpose block) and league round
    summaries (which include neither).
    """
    parts: list[str] = [
        _ROLE_INTRO,
        f"Your task: {spec.task_blurb}",
    ]

    if spec.purpose:
        parts.append(
            f"Report type: {spec.label}\n\nReport purpose:\n{spec.purpose.strip()}"
        )
    else:
        parts.append(f"Report type: {spec.label}")

    parts.append(_OUTPUT_RULE)
    parts.append(style_block)

    for rule in spec.writing_rules:
        stripped = rule.strip()
        if stripped:
            parts.append(stripped)

    parts.append(GLOBAL_ANTI_HALLUCINATION_RULES.strip())
    parts.append(f"Article structure:\n{spec.structure.strip()}")

    output_reqs = _OUTPUT_REQUIREMENTS_SHARED
    if spec.output_extras:
        output_reqs += "\n" + spec.output_extras
    parts.append(f"Output requirements:\n{output_reqs}")

    parts.append(spec.quality_check.strip())

    return "\n\n".join(parts)


def _normalise_report_type(report_type: str) -> str:
    """
    Convert the report type from the frontend/API into a safe internal value.
    """

    if not report_type:
        return "post_match"

    normalised = report_type.strip().lower()

    aliases = {
        "post-match": "post_match",
        "post match": "post_match",
        "postmatch": "post_match",
        "match_report": "post_match",
        "match report": "post_match",
        "pre-match": "pre_match",
        "pre match": "pre_match",
        "prematch": "pre_match",
        "preview": "pre_match",
        "round-summary": "round_summary",
        "round summary": "round_summary",
        "league_summary": "round_summary",
        "league summary": "round_summary",
        "summary": "round_summary",
    }

    normalised = aliases.get(normalised, normalised)

    if normalised not in SUPPORTED_REPORT_TYPES:
        return "post_match"

    return normalised


def _safe_json_dumps(data: Dict[str, Any]) -> str:
    """
    Convert match data into readable JSON for the prompt.
    """

    return json.dumps(
        data,
        indent=2,
        ensure_ascii=False,
        sort_keys=False,
        default=str,
    )


def _compact_json_dumps(data: Dict[str, Any]) -> str:
    """
    Compact JSON serialisation for league prompts.

    Strips null values and empty lists/dicts before serialising so the model
    is not distracted by empty arrays. Uses no indentation to reduce token count
    by roughly 30-40 % compared to pretty-printed output on deep match arrays.
    """

    def _strip_empty(obj: Any) -> Any:
        if isinstance(obj, dict):
            return {
                k: _strip_empty(v)
                for k, v in obj.items()
                if v is not None and v != [] and v != {}
            }
        if isinstance(obj, list):
            return [_strip_empty(i) for i in obj]
        return obj

    return json.dumps(
        _strip_empty(data),
        separators=(",", ":"),
        ensure_ascii=False,
        sort_keys=False,
        default=str,
    )


def _build_data_availability_hint(match_data: Dict[str, Any]) -> str:
    """
    Give the LLM a simple overview of top-level fields available in the JSON.

    This does not create new facts. It only tells the model which top-level keys exist,
    so it is more likely to stay grounded in the supplied structure.
    """

    if not isinstance(match_data, dict) or not match_data:
        return "The supplied JSON appears to be empty or invalid."

    top_level_keys = list(match_data.keys())

    return (
        "The supplied JSON contains these top-level fields: "
        + ", ".join(str(key) for key in top_level_keys)
        + ". Use the actual values inside these fields as the only source of truth."
    )


def _minute_sort_key(entry: dict) -> tuple[int, int]:
    """Sort key for goal/card entries: ascending minute, unparseable minutes go last."""
    m = re.match(r"(\d+)", str(entry.get("minute", "")))
    return (0, int(m.group(1))) if m else (1, 0)


def _format_match_data_readable(data: Dict[str, Any]) -> str:
    """
    Convert single-match data into structured human-readable text.

    Strips internal/irrelevant fields (source, fixtureId, tenant, reportType, etc.)
    so the LLM receives only the facts it should write about.
    """

    if not isinstance(data, dict) or not data:
        return "No data supplied."

    lines: list[str] = []

    def _add(label: str, value: Any) -> None:
        if value is not None and value != "" and value != [] and value != {}:
            lines.append(f"{label}: {value}")

    _add("Competition", data.get("competition"))
    _add("League", data.get("league"))
    _add("Season", data.get("season"))
    if data.get("round") is not None:
        _add("Round", data.get("round"))

    home_team = data.get("homeTeam") or {}
    away_team = data.get("awayTeam") or {}

    if home_team.get("name"):
        lines.append(f"Home Team: {home_team['name']}")
    if away_team.get("name"):
        lines.append(f"Away Team: {away_team['name']}")

    home_score = home_team.get("score")
    away_score = away_team.get("score")
    if home_score is not None and away_score is not None:
        lines.append(f"Score: {home_score}-{away_score}")

    date = data.get("date", "")
    time_val = data.get("time", "")
    if date:
        dt = date + (f" {time_val}" if time_val else "")
        lines.append(f"Date/Time: {dt}")

    venue = data.get("venue", "")
    field = data.get("field", "")
    if venue:
        loc = venue + (f", {field}" if field and field not in (".", "") else "")
        lines.append(f"Venue: {loc}")

    _add("Status", data.get("eventStatus"))

    goals = data.get("goals") or []
    if goals:
        lines.append("Goals:")
        for g in goals:
            player = g.get("player", "Unknown")
            team = g.get("team", "")
            minute = g.get("minute", "?")
            tags: list[str] = []
            if g.get("ownGoal"):
                tags.append("OG")
            if g.get("penalty"):
                tags.append("pen")
            tag_str = f" ({', '.join(tags)})" if tags else ""
            lines.append(f"  {player} ({team}) {minute}'{tag_str}")

    cards = data.get("cards") or []
    if cards:
        lines.append("Cards:")
        for c in cards:
            player = c.get("player", "Unknown")
            team = c.get("team", "")
            card = c.get("card", "")
            minute = c.get("minute", "?")
            lines.append(f"  {player} ({team}) - {card} {minute}'")

    notes = data.get("notes") or []
    if notes:
        lines.append("Notes:")
        for n in notes:
            lines.append(f"  {n}")

    return "\n".join(lines)


def _format_league_data_readable(data: Dict[str, Any]) -> str:
    """
    Convert league round-summary data into structured human-readable text.

    Replaces raw JSON in the human message so the LLM receives clearly labelled
    fields instead of machine syntax. Irrelevant internal fields (ids, kind, tenant,
    contentType, writingStyle, etc.) are omitted.
    """

    if not isinstance(data, dict) or not data:
        return "No data supplied."

    lines: list[str] = []

    def _add(label: str, value: Any) -> None:
        if value is not None and value != "" and value != [] and value != {}:
            lines.append(f"{label}: {value}")

    _add("League Name", data.get("leagueName") or data.get("league"))
    _add("Competition", data.get("competition"))
    _add("Season", data.get("season"))
    _add("Round", data.get("roundLabel") or data.get("round"))
    _add("Total Matches", data.get("matchCount"))
    _add("Completed", data.get("completedCount"))
    _add("Pending", data.get("pendingCount"))
    _add("Matches With Scores", data.get("matchesWithScores"))

    notes = data.get("notes") or []
    if notes:
        _add("Notes", "; ".join(str(n) for n in notes))

    matches = data.get("matches") or []
    if matches:
        lines.append("")
        lines.append("MATCHES:")
        lines.append(
            "In goal and card lines, (H) = home team player, (A) = away team player. "
            "(OG) = own goal: the goal counts for the OPPOSING team's score."
        )

        for idx, match in enumerate(matches, 1):
            lines.append("")
            lines.append(f"Match {idx}:")

            home = match.get("homeTeam", "")
            away = match.get("awayTeam", "")
            if home:
                lines.append(f"  Home Team: {home}")
            if away:
                lines.append(f"  Away Team: {away}")

            date = match.get("date", "")
            time_val = match.get("time", "")
            venue = match.get("venue", "")
            field = match.get("field", "")

            if date:
                dt = date + (f" {time_val}" if time_val else "")
                lines.append(f"  Date/Time: {dt}")

            if venue:
                loc = venue + (f", {field}" if field and field not in (".", "") else "")
                lines.append(f"  Venue: {loc}")

            status = match.get("status", "")
            home_score = match.get("homeScore")
            away_score = match.get("awayScore")

            if home_score is not None and away_score is not None:
                lines.append(f"  Score: {home_score}-{away_score}")
            else:
                lines.append(f"  Status: {status}")

            goals = match.get("goals") or []
            if goals:
                lines.append("  Goals:")
                for g in sorted(goals, key=_minute_sort_key):
                    player = g.get("player", "Unknown")
                    team = g.get("team", "")
                    side = "H" if team == home else ("A" if team == away else team)
                    minute = g.get("minute", "?")
                    tags: list[str] = []
                    if g.get("ownGoal"):
                        tags.append("OG")
                    if g.get("penalty"):
                        tags.append("pen")
                    tag_str = f" ({', '.join(tags)})" if tags else ""
                    lines.append(f"    {player} ({side}) {minute}'{tag_str}")

            cards = match.get("cards") or []
            if cards:
                lines.append("  Cards:")
                for c in sorted(cards, key=_minute_sort_key):
                    player = c.get("player", "Unknown")
                    team = c.get("team", "")
                    side = "H" if team == home else ("A" if team == away else team)
                    card = c.get("card", "")
                    minute = c.get("minute", "?")
                    lines.append(f"    {player} ({side}) - {card} {minute}'")

    return "\n".join(lines)


def build_match_report_prompt(
    report_type: str,
    tone: str,
    excitement: str,
    comedic_effect: str,
    match_data: Dict[str, Any],
) -> tuple[str, str]:
    """
    Build the LLM prompt for a single-match report as a (system_message, human_message) tuple.

    Parameters:
        report_type:    "post_match", "pre_match", or "round_summary"
        tone:           E.g. "professional", "formal", "neutral", "casual"
        excitement:     E.g. "low", "balanced", "high"
        comedic_effect: E.g. "none", "light", "moderate"
        match_data:     Structured football data from Dribl/API/backend.

    Returns:
        (system_message, human_message) tuple to pass to the LLM.
    """
    safe_report_type = _normalise_report_type(report_type)
    spec = _PROMPT_SPECS[safe_report_type]
    style_block = build_style_block(tone, excitement, comedic_effect)

    system_message = _build_system_message(spec, style_block)
    human_message = f"Match data:\n\n{_format_match_data_readable(match_data)}"

    return system_message, human_message


def build_league_summary_prompt(
    tone: str,
    league_data: dict,
    excitement: str = "balanced",
    comedic_effect: str = "none",
) -> tuple[str, str]:
    """
    Build a league / round summary prompt split into a (system_message, human_message) tuple.

    system_message — role, behaviour, and output rules only.
    human_message  — the round data payload in human-readable format.
    """
    spec = _PROMPT_SPECS["round_summary"]
    style_block = build_style_block(tone, excitement, comedic_effect)
    safe_data = league_data if isinstance(league_data, dict) else {}

    system_message = _build_system_message(spec, style_block)
    human_message = f"Round data:\n\n{_format_league_data_readable(safe_data)}"

    return system_message, human_message
