import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Copy,
  Download,
  Save,
} from "lucide-react";
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
  const [copied, setCopied] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [editableReport, setEditableReport] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const {
    data,
    contentType,
    writingStyle,
    type,
    generatedReport,
    model,
    reportId,
    reportStatus,
  } = location.state || {};

  useEffect(() => {
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
    const normalizedStatus = (reportStatus || "").toLowerCase();

    if (normalizedStatus === "approved" || normalizedStatus === "published") {
      setApproved(true);
      setDraftSaved(false);
      return;
    }

    if (normalizedStatus === "draft" || normalizedStatus === "review") {
      setDraftSaved(true);
      setApproved(false);
    }
  }, [reportStatus]);

  const plainReportText = useMemo(
    () => convertHtmlToText(editableReport),
    [editableReport],
  );

  const wordCount = plainReportText.split(/\s+/).filter(Boolean).length;

  if (!generatedReport) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa]">
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

  const matchTitle =
    type === "match" && data
      ? `${data.homeTeam?.name || "Home Team"} vs ${
          data.awayTeam?.name || "Away Team"
        }`
      : data?.name || "League Summary";

  const competition =
    type === "match" ? data?.competition : data?.name || "Football League";

  const matchDate =
    type === "match" && data
      ? `${data.date} at ${data.time}`
      : "Current Season";

  const updateReport = (nextValue) => {
    setEditableReport(nextValue);
    setDraftSaved(false);
    setApproved(false);
    setSaveError("");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainReportText);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy report:", error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([plainReportText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "generated-report.txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveError("");

    try {
      if (reportId) {
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

  return (
    <div className="min-h-full bg-[#f5f6fa]">
      <div className="px-4 pb-2 pt-5 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/jobs")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={15} />
          Back to Jobs
        </button>
      </div>

      <div className="px-4 pb-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Generated Report
          </h1>

          <span
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
              approved
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : draftSaved
                  ? "border-amber-100 bg-amber-50 text-amber-700"
                  : "border-green-100 bg-green-50 text-green-700",
            )}
          >
            <CheckCircle2 size={13} />
            {approved ? "Approved" : draftSaved ? "Draft Saved" : "Completed"}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-400">
          Generated using {model || "LLM"}
        </p>
      </div>

      <div className="px-4 pb-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
              {matchTitle.slice(0, 2).toUpperCase()}
            </div>

            <span className="truncate text-sm font-medium text-gray-700">
              {matchTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Copy size={13} />
              <span className="hidden sm:inline">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Save size={13} />
              <span className="hidden sm:inline">
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
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                approved
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-emerald-500 text-emerald-600 hover:bg-emerald-50",
              )}
            >
              <CheckCircle2 size={13} />
              {saving ? "Saving..." : approved ? "Approved" : "Approve"}
            </button>
          </div>
        </div>
      </div>

      {saveError && (
        <div className="px-4 pb-5 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        </div>
      )}

      <div className="flex flex-col items-start gap-5 px-4 pb-10 sm:px-6 lg:flex-row">
        <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Report Editor
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

        <div className="w-full shrink-0 space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:w-64">
          <h3 className="text-sm font-bold text-gray-900">Content Details</h3>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Competition
              </p>

              <p className="text-sm text-gray-800">{competition}</p>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Match / League
              </p>

              <p className="text-sm text-gray-800">{matchTitle}</p>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Date
              </p>

              <p className="text-sm text-gray-800">{matchDate}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              AI Settings
            </p>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tone:</span>

              <span className="font-semibold text-gray-800">
                {writingStyle || "Professional"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Type:</span>

              <span className="font-semibold text-gray-800">
                {contentType || "Pre Match"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Model:</span>

              <span className="font-semibold text-gray-800">
                {model || "LLM"}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Generated
            </p>

            <p className="text-sm text-gray-800">
              {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneratedReport;
