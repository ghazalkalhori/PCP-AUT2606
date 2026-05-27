# prompt.py
# Option 2: Detailed production-style prompt builder for Reporta AI.
#
# Purpose:
# - Generate story-style football reports from structured Dribl JSON data.
# - Support post-match reports, pre-match reports, and round / league summaries.
# - Apply tone, excitement, and comedic-effect settings selected from the UI.
# - Strongly reduce hallucination by forcing the LLM to use only supplied JSON data.
#
# This file should work together with report_style_options.py.
#
# Example:
# from prompt import build_match_report_prompt
#
# prompt = build_match_report_prompt(
#     report_type="post_match",
#     tone="fan_focused",
#     excitement="balanced",
#     comedic_effect="light",
#     match_data=your_match_json,
# )

import json
from typing import Any, Dict


from app.services.report_style_options import get_style_instructions


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
  immediately — do not bury the score. Do not use a markdown # headline.
- Let the article read as one connected story. Section headers (##) are optional signposts,
  not separate mini-essays. Use more ## sections only when the JSON has enough distinct
  phases or topics to justify them.
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
The report is about a football round, league, or group of matches.

Write a round wrap as a connected story: opening theme for the round, then the most
important results and moments across matches — grouped naturally, not a bare
scoreboard. Mention ladder or table movement only if supplied.
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
Structure (no # headline — start with the lead paragraph):

[Lead paragraph — no ## header. Round number, competition, and the big picture when supplied.]

## Around the Grounds
[Main results and stories across matches — narrative paragraphs, not a score list.]

## Ladder and What's Next
[Only if ladder, table, or next-round data exists in the JSON. Otherwise omit.]

Do not use ## Match Wrap as a separate thin header if merged into Around the Grounds.
""",
}


GLOBAL_ANTI_HALLUCINATION_RULES = """
Strict anti-hallucination rules:
- Use only the facts explicitly provided in the JSON.
- Do not use outside knowledge.
- Do not use real-world football knowledge to fill gaps.
- Do not infer missing information from team names, player names, competition names, or venues.
- Do not invent player names.
- Do not invent team names.
- Do not invent scores.
- Do not invent venues.
- Do not invent dates or kick-off times.
- Do not invent competitions, rounds, leagues, seasons, or ladder positions.
- Do not invent goals, goal minutes, assists, cards, substitutions, injuries, suspensions, statistics, votes, or match events.
- Do not invent coaches, referees, fans, attendance, weather, crowd atmosphere, pitch condition, or travel details.
- Do not invent quotes from players, coaches, referees, clubs, fans, or administrators.
- Do not call a player a captain, goalkeeper, defender, midfielder, striker, youngster, veteran, star, or substitute unless that information is supplied.
- Do not say a team dominated, controlled the match, deserved to win, wasted chances, defended bravely, or played poorly unless the supplied data clearly supports it.
- Do not claim momentum changes unless events or notes in the JSON support that story.
- Do not assume the home team won.
- Do not assume the first team listed is the home team unless the JSON confirms it.
- Do not assume a team played at home unless the JSON confirms it.
- Do not treat missing data as proof that something did not happen.
- If an empty list is supplied, you may say there were no recorded entries in the supplied data for that category.
- If data is missing, write around it naturally instead of filling the gap.
- If the JSON has conflicting information, do not choose one version as fact. Mention that the supplied data was inconsistent.
- Every factual sentence in the report must be traceable back to the JSON.
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


MISSING_DATA_RULES = """
Handling missing data:
- If a field is missing, omit it silently — do not mention JSON, "the data", or "not provided".
- Never repeat the same disclaimer in multiple sections (e.g. do not write "the score was
  not provided" in every ## block).
- Do not apologise for missing information or explain what you cannot write.
- If the score is missing, write about the teams, venue, date, and any supplied events
  without inventing a result. If almost nothing is supplied, write a very short factual
  preview of what is known and stop — do not pad with generic match commentary.
- Omit entire ## sections when there is no data to support them (e.g. no second-half
  events means no ## Second Half section).
- Only as a last resort, add at most two closing sentences at the very end (no ## header)
  noting that key details such as the final score or match events were not in the
  supplied record — never more than once in the whole article.
"""


QUALITY_CHECK_INSTRUCTION = """
Before writing, silently check:
1. What facts are actually in the JSON (teams, score, goals with minutes, cards, venue, date)?
2. How much detail is available — should this be a short piece or a longer article?
3. What is the one story this article should tell with only those facts?
4. Which ## sections (if any) are justified — omit empty ones; add more only when data supports them.
5. Does every sentence trace to the JSON? Remove generic filler that adds no fact.

Output only the finished article. No checklist, no preamble, no # headline.
"""


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


def build_match_report_prompt(
    report_type: str,
    tone: str,
    excitement: str,
    comedic_effect: str,
    match_data: Dict[str, Any],
) -> str:
    """
    Build the full LLM prompt for Reporta AI.

    Parameters:
        report_type:
            "post_match", "pre_match", or "round_summary"

        tone:
            Selected by the admin user in the UI.
            Example: "professional", "neutral", "fan_focused", "community_club", "formal"

        excitement:
            Selected by the admin user in the UI.
            Example: "low", "balanced", "high"

        comedic_effect:
            Selected by the admin user in the UI.
            Example: "none", "light", "moderate"

        match_data:
            Structured football data from Dribl/API/backend.

    Returns:
        A complete prompt string to send to the LLM.
    """

    safe_report_type = _normalise_report_type(report_type)
    report_label = REPORT_TYPE_LABELS[safe_report_type]

    style_instructions = get_style_instructions(
        tone=tone,
        excitement=excitement,
        comedic_effect=comedic_effect,
    )

    pretty_json = _safe_json_dumps(match_data)
    data_availability_hint = _build_data_availability_hint(match_data)

    return f"""
You are Reporta AI, a professional Australian football journalist writing for a
competition management platform (Dribl). Turn the structured JSON below into a match
article that reads like published football journalism — not a rigid report template.
Write a longer, more detailed piece when the JSON is rich; keep it short when data is sparse.

Report type:
{report_label}

Report purpose:
{REPORT_TYPE_PURPOSE[safe_report_type]}

{NARRATIVE_STYLE_REFERENCE}

Selected writing style:
Tone:
{style_instructions["tone"]}

Excitement:
{style_instructions["excitement"]}

Comedic effect:
{style_instructions["comedic_effect"]}

Data availability hint (for your planning only — do not quote this in the article):
{data_availability_hint}

{GLOBAL_WRITING_RULES}

{GLOBAL_ANTI_HALLUCINATION_RULES}

{MISSING_DATA_RULES}

Article structure:
{REPORT_STRUCTURE[safe_report_type]}

Output requirements:
- Return only the finished draft article in markdown.
- No # headline. Start with narrative paragraphs; use ## sections only when they help
  structure a longer piece backed by the JSON. Omit any section you cannot fill with
  real story from the JSON.
- Do not use ## Match Summary, ## The Story of the Match, ## Key Moments, ## What It Means,
  or ## Data Note.
- No bullet lists, tables, JSON, or meta-commentary about missing fields.

{QUALITY_CHECK_INSTRUCTION}

Structured JSON data:
{pretty_json}
""".strip()