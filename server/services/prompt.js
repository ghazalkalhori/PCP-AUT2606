const REPORT_TYPE_GUIDANCE = {
  post_match:
    'Summarize the completed match: final score, goals, cards, substitutions, key stats, and notes from the JSON only.',
  pre_match:
    'Preview the upcoming fixture: teams, form, availability, suspensions, previous meeting, ladder context, and match focus from the JSON only. Do not describe a final score or completed events.',
  round_summary:
    'Summarize the full round: each match result, goal scorers, key moments, updated ladder, round highlights, and biggest mover from the JSON only.',
};

export function buildReportPrompt({
  reportType,
  tone,
  excitement,
  comedicEffect,
  matchData,
}) {
  const matchJson = JSON.stringify(matchData, null, 2);
  const typeGuidance =
    REPORT_TYPE_GUIDANCE[reportType] ||
    'Write the report using only the fields present in the JSON.';

  return `You are a professional football journalist for Reporta AI.

Task: Write a ${reportType} football report using ONLY the structured JSON below.

Style:
- Tone: ${tone}
- Excitement level: ${excitement}
- Comedic effect: ${comedicEffect}

Report type guidance:
${typeGuidance}

Rules:
- Do not invent players, scores, cards, injuries, substitutions, stats, or match events.
- Use only the provided JSON data.
- If a field is missing, write naturally without making up facts.
- Return a clear headline followed by well-structured paragraphs.
- The output is a draft for admin review, not final publication.

Match data:
${matchJson}`;
}
