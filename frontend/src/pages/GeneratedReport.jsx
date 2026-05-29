import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Save, Trash2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { clsx } from "clsx";

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

function convertTextToHtml(text) {
  if (!text) return "";

  return text
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<p><br /></p>";
      if (line.startsWith("### ")) {
        return `<h1>${line.replace("### ", "")}</h1>`;
      }

      if (line.startsWith("#### ")) {
        return `<h2>${line.replace("#### ", "")}</h2>`;
      }

      if (line.startsWith("- ")) {
        return `<p>• ${line.replace("- ", "")}</p>`;
      }

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

  const reportData = data?.source_data || data || {};
  const isLeagueSummary = type === "league" || reportData?.kind === "league";
  const homeTeam = displayValue(
    reportData?.homeTeam || reportData?.homeClub || data?.homeTeam,
    "",
  );
  const awayTeam = displayValue(
    reportData?.awayTeam || reportData?.awayClub || data?.awayTeam,
    "",
  );
  const fallbackTitle = data?.name || data?.fixtureId || "Saved Report";

  const matchTitle =
    homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : fallbackTitle;

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

  const matchDate =
    [
      displayValue(reportData?.matchDate, ""),
      displayValue(reportData?.matchTime, ""),
    ]
      .filter(Boolean)
      .join(" at ") || "Not provided";

  const venueName = displayValue(reportData?.venue || data?.venue);

  const leagueRound = displayValue(reportData?.roundLabel || reportData?.round, "All rounds");
  const leagueSeason = displayValue(reportData?.season || data?.season);
  const leagueMatches = Array.isArray(reportData?.matches)
    ? displayValue(reportData.matchCount ?? reportData.matches.length)
    : displayValue(reportData?.matchCount ?? reportData?.matches ?? data?.matches);

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
              {isLeagueSummary ? "Generated Summary" : "Generated Report"}
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
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  League
                </p>

                <p className="text-sm text-gray-800">{leagueName}</p>
              </div>

              {isLeagueSummary ? (
                <>
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Round
                    </p>

                    <p className="text-sm text-gray-800">{leagueRound}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Season
                    </p>

                    <p className="text-sm text-gray-800">{leagueSeason}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Matches
                    </p>

                    <p className="text-sm text-gray-800">{leagueMatches}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Home Team
                    </p>

                    <p className="text-sm text-gray-800">
                      {homeTeam || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Away Team
                    </p>

                    <p className="text-sm text-gray-800">
                      {awayTeam || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Date
                    </p>

                    <p className="text-sm text-gray-800">{matchDate}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Venue
                    </p>

                    <p className="text-sm text-gray-800">{venueName}</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                AI Settings
              </p>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tone:</span>
                <span className="font-semibold capitalize text-gray-800">
                  {String(selectedWritingStyle)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type:</span>
                <span className="font-semibold capitalize text-gray-800">
                  {String(selectedContentType).replace("_", " ")}
                </span>
              </div>
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
