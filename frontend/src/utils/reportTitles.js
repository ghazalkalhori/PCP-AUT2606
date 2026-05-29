function displayReportValue(value) {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.club ||
      value.team ||
      value.display_name ||
      Object.values(value).filter(Boolean).map(String).join(" - ")
    );
  }

  return "";
}

function getReportTypeLabel(reportType) {
  const type = String(reportType || "").toLowerCase();

  if (type.includes("league") || type.includes("round")) {
    return "League Summary";
  }

  if (type.includes("pre")) {
    return "Pre-Match Report";
  }

  if (type.includes("post")) {
    return "Post-Match Report";
  }

  return "Report";
}

function getLeagueRoundLabel(sourceData) {
  const round = sourceData?.round;
  const roundLabel = displayReportValue(sourceData?.roundLabel);

  if (
    roundLabel &&
    !["all rounds", "all available rounds"].includes(roundLabel.toLowerCase())
  ) {
    return roundLabel.toLowerCase().startsWith("round")
      ? roundLabel
      : `Round ${roundLabel}`;
  }

  if (round !== null && round !== undefined && round !== "" && round !== "all") {
    return `Round ${round}`;
  }

  return "";
}

function isLeagueReport(report, sourceData) {
  const type = String(
    report?.report_type || sourceData?.contentType || "",
  ).toLowerCase();
  const kind = String(sourceData?.kind || "").toLowerCase();

  return (
    type.includes("league") ||
    type.includes("round") ||
    kind === "league" ||
    kind === "round_summary"
  );
}

export function getReportTitle(report = {}) {
  const sourceData = report.source_data || report.sourceData || {};

  if (isLeagueReport(report, sourceData)) {
    const leagueName =
      displayReportValue(sourceData.leagueName) ||
      displayReportValue(sourceData.name) ||
      displayReportValue(sourceData.league) ||
      displayReportValue(sourceData.competition);
    const roundLabel = getLeagueRoundLabel(sourceData);

    if (leagueName && roundLabel) {
      return `${leagueName} ${roundLabel} Summary`;
    }

    if (leagueName) {
      return `${leagueName} League Summary`;
    }

    return "League Summary";
  }

  const homeTeam =
    displayReportValue(sourceData.homeTeam) ||
    displayReportValue(sourceData.homeClub);
  const awayTeam =
    displayReportValue(sourceData.awayTeam) ||
    displayReportValue(sourceData.awayClub);
  const typeLabel = getReportTypeLabel(report.report_type || sourceData.contentType);

  if (homeTeam && awayTeam) {
    return `${homeTeam} vs ${awayTeam} ${typeLabel}`;
  }

  return "Match Report";
}

export { displayReportValue };
