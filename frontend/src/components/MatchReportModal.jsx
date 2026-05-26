import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { clsx } from "clsx";
import { useNavigate } from "react-router-dom";
const labelClassName = "text-xs text-gray-400 uppercase tracking-wide mb-1";
const contentTypes = ["Pre-Match", "Post-Match"];
const writingStyles = ["Professional", "Casual", "Analytical", "Dramatic"];

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

function getMatchStatus(data) {
  return String(data?.status || data?.event_status || "").toLowerCase();
}

function getDefaultContentType(data) {
  return getMatchStatus(data) === "complete" ? "Post-Match" : "Pre-Match";
}

function OptionButton({ selected, label, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-lg text-sm font-medium transition-colors",
        selected
          ? "border-2 border-green-500 text-green-600"
          : "border border-gray-200 text-gray-500 hover:border-gray-300",
        className,
      )}
    >
      {label}
    </button>
  );
}
function MatchReportModal({ isOpen, onClose, data }) {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState("Pre-Match");
  const [writingStyle, setWritingStyle] = useState("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    setContentType(getDefaultContentType(data));
    setWritingStyle("Professional");
    setError("");
    setIsGenerating(false);
  }, [isOpen, data]);
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.body.classList.add("overflow-hidden");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);
  if (!isOpen || !data) return null;
  const modalHomeTeam = displayValue(
    data.homeTeam || data.home_team,
    "Home Team",
  );
  const modalAwayTeam = displayValue(
    data.awayTeam || data.away_team,
    "Away Team",
  );
  const modalLeague = displayValue(
    data.league ||
      data.league_name ||
      data.competition ||
      data.competition_name,
    "League not provided",
  );
  const modalDate = displayValue(
    data.date || data.local_start_date,
    "Date not provided",
  );
  const modalTime = displayValue(
    data.time || data.local_start_time,
    "Time not provided",
  );
  const matchStatus = getMatchStatus(data);
  const isPendingMatch = matchStatus === "pending";
  const handleGenerate = async () => {
    if (isPendingMatch && contentType === "Post-Match") {
      setError("Post-match reports are only available for complete matches.");
      return;
    }
    setIsGenerating(true);
    setError("");

    try {
      const fixtureId = data.fixture_id || data.id || data.raw?.id;

      if (!fixtureId) {
        throw new Error("This match does not have a fixture ID.");
      }

      const reportType =
        contentType === "Pre-Match" ? "pre_match" : "post_match";
      const tone = writingStyle.toLowerCase();

      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fixture_id: fixtureId,
          report_type: reportType,
          tone,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail || result?.message || "Could not generate report.",
        );
      }

      if (!result?.report_id || result?.report_status !== "processing") {
        throw new Error("The backend did not create a processing job.");
      }

      onClose();
      navigate("/jobs");
    } catch (generateError) {
      console.error("Failed creating match report:", generateError);
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Could not generate report. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-4 max-h-screen w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-xl md:max-w-2xl md:p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Generate Match Report"
      >
        <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Generate Match Report
              </h2>
              <p className="text-sm text-gray-500">
                Configure and generate football match content
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div>
          <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className={labelClassName}>Match</p>
            <p className="mt-2 font-bold text-gray-900">
              {modalHomeTeam} vs {modalAwayTeam}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {modalLeague} • {modalDate} at {modalTime}
            </p>
          </div>
          <div className="mb-6">
            <p className={labelClassName}>Content Type</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {contentTypes.map((option) => {
                const disabled = isPendingMatch && option === "Post-Match";

                return (
                  <OptionButton
                    key={option}
                    label={option}
                    selected={contentType === option}
                    onClick={() => {
                      if (disabled) return;
                      setContentType(option);
                      setError("");
                    }}
                    className={clsx(
                      "w-full px-6 py-3 md:w-auto",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  />
                );
              })}
            </div>
            {isPendingMatch && (
              <p className="mt-2 text-xs text-amber-600">
                This fixture is pending, so only pre-match reports can be generated.
              </p>
            )}
          </div>
          <div className="mb-6">
            <p className={labelClassName}>Writing Style</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {writingStyles.map((style) => (
                <OptionButton
                  key={style}
                  label={style}
                  selected={writingStyle === style}
                  onClick={() => setWritingStyle(style)}
                  className="w-full px-5 py-3 md:w-auto"
                />
              ))}
            </div>
          </div>
          <div className="mb-6 border-t border-gray-100" />
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-4 text-base font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-wait disabled:bg-green-300"
          >
            <Sparkles size={18} />
            {isGenerating ? "Creating Job..." : "Generate Report"}
          </button>
          <p className="mt-4 text-center text-xs text-gray-400">
            The AI will generate a football report based on the selected match
            and writing style.
          </p>
        </div>
      </div>
    </div>
  );
}
export default MatchReportModal;
