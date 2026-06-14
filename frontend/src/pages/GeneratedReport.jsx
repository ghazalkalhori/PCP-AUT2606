import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Save, Trash2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { clsx } from "clsx";
import { marked } from "marked";
import { cleanTeamName, getReportTitle } from "../utils/reportTitles.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getAuthHeaders() {
  const token = localStorage.getItem("reporta_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function displayValue(value, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.ground ||
      value.field ||
      Object.values(value).filter(Boolean).map(String).join(" - ") ||
      fallback
    );
  }

  return fallback;
}

/**
 * Parse a single markdown block (no blank lines inside) to HTML.
 * Uses `breaks: true` so single \n becomes <br> within a paragraph.
 */
function parseMarkdownBlock(block) {
  const trimmed = block.trim();
  if (!trimmed) return "<p><br></p>";
  return marked.parse(trimmed, { breaks: true });
}

/**
 * Extract the inner content from a ```md ... ``` fence if present,
 * then convert markdown to HTML using `marked`.
 * Double newlines (\n\n) are preserved as visible blank lines by inserting
 * an explicit empty paragraph between each block.
 * Falls back to a simple line-by-line conversion for legacy plain-text content.
 */
function convertTextToHtml(text) {
  if (!text) return "";

  // Extract content from ```md ... ``` block produced by the LLM.
  const fenceMatch = text.match(/^```(?:md|markdown)?\s*\n([\s\S]*?)```\s*$/m);
  if (fenceMatch) {
    // Split on two-or-more consecutive newlines to get distinct paragraph blocks.
    // Each block is parsed separately, then joined with an empty <p> to produce a
    // visible blank line between sections in the editor.
    const blocks = fenceMatch[1].trim().split(/\n{2,}/);
    return blocks
      .map(parseMarkdownBlock)
      .join("<p><br></p>");
  }

  // If the whole text looks like markdown (contains ##, **, or - lists) parse it directly.
  if (/^#{1,6} |^\*\*|^- |\*\*/.test(text)) {
    const blocks = text.trim().split(/\n{2,}/);
    return blocks
      .map(parseMarkdownBlock)
      .join("<p><br></p>");
  }

  // Legacy fallback for older plain-text reports already stored in the database.
  return text
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<p><br /></p>";
      if (line.startsWith("### ")) return `<h1>${line.slice(4)}</h1>`;
      if (line.startsWith("#### ")) return `<h2>${line.slice(5)}</h2>`;
      if (line.startsWith("- ")) return `<p>• ${line.slice(2)}</p>`;
      return `<p>${line}</p>`;
    })
    .join("");
}

function convertHtmlToText(html) {
  const element = document.createElement("div");
  element.innerHTML = html || "";

  return element.innerText.trim();
}

const editorModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

const editorFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "align",
  "link",
];

function formatSettingValue(value) {
  const display = displayValue(value);
  return display.replace(/_/g, " ");
}

function firstValue(...values) {
  for (const value of values) {
    const display = displayValue(value, "");

    if (display) return display;
  }

  return "";
}

function getFixtureAttributes(reportData) {
  const fixture = reportData?.fixture || {};
  const fixtureData = fixture.data || fixture;
  const attributes = fixtureData.attributes || {};

  return typeof attributes === "object" && attributes !== null ? attributes : {};
}

function getDivisionLabel(league, competition) {
  const leagueValue = displayValue(league, "");
  const competitionValue = displayValue(competition, "");

  if (!leagueValue || !competitionValue) return leagueValue;
  if (leagueValue.toLowerCase() === competitionValue.toLowerCase()) return "";

  const prefix = `${competitionValue} - `;
  if (leagueValue.toLowerCase().startsWith(prefix.toLowerCase())) {
    return leagueValue.slice(prefix.length).trim();
  }

  return leagueValue;
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="text-sm text-gray-800">
        {formatSettingValue(value)}
      </p>
    </div>
  );
}

function GeneratedReport() {
  const location = useLocation();
  const navigate = useNavigate();

  const [approved, setApproved] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [editableReport, setEditableReport] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    data,
    contentType,
    writingStyle,
    type,
    generatedReport,
    reportId,
    reportStatus,
  } = location.state || {};

  const normalizedReportStatus = String(reportStatus || "").toLowerCase();
  const reportData = data?.source_data || data || {};
  const reportTitle = getReportTitle({
    id: reportId,
    report_type: contentType,
    source_data: reportData,
  });
  const isLeagueSummary =
    type === "league" ||
    reportData?.kind === "league" ||
    reportData?.kind === "round_summary";

  useEffect(() => {
    // LLM output is plain markdown-like text; saved drafts may already be HTML.
    if (!generatedReport) {
      setEditableReport("");
      return;
    }

    const isHtml =
      generatedReport.includes("<p") || generatedReport.includes("<h");

    setEditableReport(
      isHtml ? generatedReport : convertTextToHtml(generatedReport),
    );
  }, [generatedReport]);

  useEffect(() => {
    // Mirror backend workflow status in local button/badge state.
    if (
      normalizedReportStatus === "approved" ||
      normalizedReportStatus === "published"
    ) {
      setApproved(true);
      setDraftSaved(false);
      return;
    }

    if (
      normalizedReportStatus === "draft" ||
      normalizedReportStatus === "review"
    ) {
      setDraftSaved(true);
      setApproved(false);
      return;
    }

    if (normalizedReportStatus === "complete") {
      setDraftSaved(false);
      setApproved(false);
    }
  }, [normalizedReportStatus]);

  const plainReportText = useMemo(
    () => convertHtmlToText(editableReport),
    [editableReport],
  );

  const wordCount = plainReportText.split(/\s+/).filter(Boolean).length;

  if (normalizedReportStatus === "failed") {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="mb-2 text-base font-semibold text-gray-900">
            This report failed to generate.
          </p>
          <p className="mb-5 text-sm text-gray-500">{reportTitle}</p>

          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  if (normalizedReportStatus === "processing") {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <p className="mb-4 text-gray-600">
            This report is still being generated.
          </p>

          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  if (!generatedReport) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <p className="mb-4 text-gray-600">No generated report found.</p>

          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const fixtureAttributes = getFixtureAttributes(reportData);
  const matchData = reportData?.match_data || {};
  const homeTeam = cleanTeamName(
    firstValue(
      reportData?.homeTeam,
      reportData?.homeClub,
      matchData?.homeTeam?.name,
      fixtureAttributes.home_team_friendly_name,
      fixtureAttributes.home_team_club_friendly_name,
      fixtureAttributes.home_club,
      fixtureAttributes.home_team,
      data?.homeTeam,
    ),
  );
  const awayTeam = cleanTeamName(
    firstValue(
      reportData?.awayTeam,
      reportData?.awayClub,
      matchData?.awayTeam?.name,
      fixtureAttributes.away_team_friendly_name,
      fixtureAttributes.away_team_club_friendly_name,
      fixtureAttributes.away_club,
      fixtureAttributes.away_team,
      data?.awayTeam,
    ),
  );
  const leagueName = displayValue(
    reportData?.leagueName ||
    reportData?.league ||
    reportData?.competition ||
    data?.league ||
    data?.competition,
  );

  const selectedWritingStyle =
    writingStyle ||
    reportData?.writingStyle ||
    reportData?.tone ||
    "Not provided";

  const selectedContentType =
    contentType ||
    reportData?.contentType ||
    reportData?.report_type ||
    "Not provided";

  const venueName = firstValue(
    reportData?.venue,
    matchData?.venue,
    fixtureAttributes.ground_name,
    data?.venue,
  );
  const fieldName = firstValue(
    reportData?.field,
    matchData?.field,
    fixtureAttributes.field_name,
  );
  const matchTime = firstValue(
    reportData?.matchTime,
    matchData?.time,
    fixtureAttributes.local_start_time,
  );
  const matchDateValue = firstValue(
    reportData?.matchDate,
    matchData?.date,
    fixtureAttributes.local_start_date,
  );
  const matchStatus = firstValue(
    reportData?.status,
    matchData?.eventStatus,
    fixtureAttributes.event_status,
  );
  const storedScore =
    reportData?.score && reportData.score !== "Not available"
      ? reportData.score
      : "";
  const matchScore =
    displayValue(storedScore, "") ||
    (
      reportData?.homeScore !== null &&
        reportData?.homeScore !== undefined &&
        reportData?.awayScore !== null &&
        reportData?.awayScore !== undefined
        ? `${reportData.homeScore}-${reportData.awayScore}`
        : ""
    );

  const leagueRound = displayValue(reportData?.roundLabel || reportData?.round, "All rounds");
  const leagueSeason = displayValue(reportData?.season || data?.season);
  const leagueMatches = Array.isArray(reportData?.matches)
    ? displayValue(reportData.matchCount ?? reportData.matches.length)
    : displayValue(reportData?.matchCount ?? reportData?.matches ?? data?.matches);
  const competitionName = displayValue(reportData?.competition || data?.competition);
  const divisionName = getDivisionLabel(leagueName, competitionName);
  const sourceRows = isLeagueSummary
    ? [
      ["Competition", competitionName],
      ...(divisionName
        ? [["Division/League", divisionName]]
        : !competitionName && leagueName
          ? [["League", leagueName]]
          : []),
      ["Season", leagueSeason],
      ["Round", leagueRound],
      ["Match Count", leagueMatches],
      ["Status", reportData?.status],
    ]
    : [
      ["Home Team", homeTeam],
      ["Away Team", awayTeam],
      ["Competition", competitionName],
      ...(divisionName ? [["Division/League", divisionName]] : []),
      ["Date", matchDateValue],
      ["Time", matchTime],
      ["Venue/Ground", venueName],
      ...(fieldName ? [["Field", fieldName]] : []),
      ["Status", matchStatus],
      ...(matchScore ? [["Score", matchScore]] : []),
    ];
  const settingsRows = isLeagueSummary
    ? [
      ["Writing Style", selectedWritingStyle],
      ["Round", leagueRound],
    ]
    : [
      ["Content Type", selectedContentType],
      ["Tone", selectedWritingStyle],
      ["Excitement Level", reportData?.excitement],
      ["Comedic Effect", reportData?.comedicEffect || reportData?.comedic_effect],
    ];

  const updateReport = (nextValue) => {
    setEditableReport(nextValue);
    setDraftSaved(false);
    setApproved(false);
    setSaveError("");
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveError("");

    try {
      if (reportId) {
        // Draft saves keep edited HTML content in the existing report row.
        const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            content: editableReport,
            status: "draft",
          }),
        });

        if (!response.ok) {
          throw new Error("Could not save draft.");
        }
      }

      setDraftSaved(true);
      setApproved(false);
    } catch (error) {
      console.error("Failed saving draft:", error);
      setSaveError("Could not save draft. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    setSaveError("");

    try {
      if (reportId) {
        // Approval is a status transition plus any latest editor content.
        const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            content: editableReport,
            status: "approved",
          }),
        });

        if (!response.ok) {
          throw new Error("Could not approve report.");
        }
      }

      setApproved(true);
      setDraftSaved(false);
    } catch (error) {
      console.error("Failed approving report:", error);
      setSaveError("Could not approve report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!reportId) {
      navigate("/jobs");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Could not delete report.");
      }

      navigate("/jobs");
    } catch (error) {
      console.error("Failed deleting report:", error);
      setSaveError("Could not delete report. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {reportTitle}
            </h1>

            <span
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
                approved
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : draftSaved
                    ? "border-amber-100 bg-amber-50 text-amber-700"
                    : "border-blue-100 bg-blue-50 text-blue-700",
              )}
            >
              <CheckCircle2 size={13} />
              {approved ? "Approved" : draftSaved ? "Draft Saved" : "Complete"}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {isLeagueSummary
              ? "Review and edit the generated league summary."
              : "Review and edit the generated football report."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/jobs")}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={15} />
          Back to Jobs
        </button>
      </div>

      {saveError && (
        <div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        </div>
      )}

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isLeagueSummary ? "Summary Editor" : "Report Editor"}
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Edit the generated content before saving, approving, or
                publishing.
              </p>
            </div>

            <div className="text-sm text-gray-400">{wordCount} words</div>
          </div>

          <div className="report-editor-wrapper min-h-155 p-5 sm:p-6">
            <ReactQuill
              theme="snow"
              value={editableReport}
              onChange={updateReport}
              readOnly={saving}
              modules={editorModules}
              formats={editorFormats}
              className="report-editor"
            />
          </div>
        </div>

        <div className="w-full shrink-0 space-y-4 lg:w-64">
          <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">Content Details</h3>
            <div className="space-y-3">
              {sourceRows.map(([label, value]) => (
                <DetailRow key={label} label={label} value={value} />
              ))}
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                AI Settings
              </p>

              {settingsRows.map(([label, value]) => (
                <DetailRow key={label} label={label} value={value} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || draftSaved}
              className={clsx(
                "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                draftSaved
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-amber-500 text-amber-600 hover:bg-amber-50",
              )}
            >
              <Save size={13} />
              <span>
                {saving
                  ? "Saving..."
                  : draftSaved
                    ? "Draft Saved"
                    : "Save Draft"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={saving || approved}
              className={clsx(
                "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                approved
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-emerald-500 text-emerald-600 hover:bg-emerald-50",
              )}
            >
              <CheckCircle2 size={13} />
              <span>
                {saving ? "Saving..." : approved ? "Approved" : "Approve"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Delete report?</h3>

            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete this report from the database. This
              action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteReport}
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Delete Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GeneratedReport;
