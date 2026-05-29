import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { clsx } from "clsx";
import { useNavigate } from "react-router-dom";
const labelClassName = "text-[11px] text-gray-400 uppercase tracking-wide mb-1";
const contentTypes = ["Pre-Match", "Post-Match"];
const DEFAULT_STYLE_OPTIONS = {
  tones: ["professional", "formal", "neutral", "casual"],
  excitement_levels: ["low", "balanced", "high"],
  comedic_effects: ["none", "light", "moderate"],
};
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
function formatStyleLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
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
  return String(
    data?.status ||
      data?.event_status ||
      data?.match_data?.eventStatus ||
      "",
  ).toLowerCase();
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
        "rounded-lg text-xs font-medium transition-colors",
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
  const [tone, setTone] = useState("professional");
  const [excitement, setExcitement] = useState("balanced");
  const [comedicEffect, setComedicEffect] = useState("none");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const fixtureId = data?.fixture_id || data?.id || data?.raw?.id;
  useEffect(() => {
    if (!isOpen) return;
    setContentType(getDefaultContentType(data));
    setTone("professional");
    setExcitement("balanced");
    setComedicEffect("none");
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
  const displayMatch = data;
  const modalHomeTeam = displayValue(
    displayMatch.homeTeam?.name || data.homeTeam || data.home_team,
    "Home Team",
  );
  const modalAwayTeam = displayValue(
    displayMatch.awayTeam?.name || data.awayTeam || data.away_team,
    "Away Team",
  );
  const modalLeague = displayValue(
    displayMatch.league ||
      data.league ||
      data.league_name ||
      displayMatch.competition ||
      data.competition ||
      data.competition_name,
    "League not provided",
  );
  const modalDate = displayValue(
    displayMatch.date || data.date || data.local_start_date,
    "Date not provided",
  );
  const modalTime = displayValue(
    displayMatch.time || data.time || data.local_start_time,
    "Time not provided",
  );
  const matchStatus = getMatchStatus(displayMatch);
  const isPendingMatch = matchStatus === "pending";
  async function handleGenerate() {
    if (isPendingMatch && contentType === "Post-Match") {
      setError("Post-match reports are only available for complete matches.");
      return;
    }
    setIsGenerating(true);
    setError("");
    try {
      if (!fixtureId) {
        throw new Error("This match does not have a fixture ID.");
      }
      const reportType =
        contentType === "Pre-Match" ? "pre_match" : "post_match";
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fixture_id: fixtureId,
          report_type: reportType,
          tone,
          excitement,
          comedic_effect: comedicEffect,
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
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 py-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Generate Match Report"
      >
        <div className="flex max-h-[86vh] flex-col">
          <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 md:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <Sparkles size={17} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Generate Match Report
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Choose report settings before creating the job
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4 md:px-6">
            <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className={labelClassName}>Match</p>
              <p className="mt-1.5 text-sm font-bold text-gray-900">
                {modalHomeTeam} vs {modalAwayTeam}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {modalLeague} • {modalDate} at {modalTime}
              </p>
            </div>
            <div className="mb-4">
              <p className={labelClassName}>Content Type</p>
              <div className="mt-2 flex flex-wrap gap-2">
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
                        "w-full px-4 py-2.5 md:w-auto",
                        disabled && "cursor-not-allowed opacity-40",
                      )}
                    />
                  );
                })}
              </div>
              {isPendingMatch && (
                <p className="mt-1.5 text-xs text-amber-600">
                  This fixture is pending, so only pre-match reports can be
                  generated.
                </p>
              )}
            </div>
            <div className="mb-4">
              <p className={labelClassName}>Tone</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEFAULT_STYLE_OPTIONS.tones.map((option) => (
                  <OptionButton
                    key={option}
                    label={formatStyleLabel(option)}
                    selected={tone === option}
                    onClick={() => setTone(option)}
                    className="w-full px-4 py-2.5 md:w-auto"
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className={labelClassName}>Excitement</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEFAULT_STYLE_OPTIONS.excitement_levels.map((option) => (
                  <OptionButton
                    key={option}
                    label={formatStyleLabel(option)}
                    selected={excitement === option}
                    onClick={() => setExcitement(option)}
                    className="w-full px-4 py-2.5 md:w-auto"
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className={labelClassName}>Comedic effect</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEFAULT_STYLE_OPTIONS.comedic_effects.map((option) => (
                  <OptionButton
                    key={option}
                    label={formatStyleLabel(option)}
                    selected={comedicEffect === option}
                    onClick={() => setComedicEffect(option)}
                    className="w-full px-4 py-2.5 md:w-auto"
                  />
                ))}
              </div>
            </div>
            <div className="mb-4 border-t border-gray-100" />
            {error && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300"
            >
              <Sparkles size={16} />
              {isGenerating ? "Creating Job..." : "Generate Report"}
            </button>
            <p className="mt-3 text-center text-[11px] text-gray-400">
              The backend will gather the required match data when generation
              starts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MatchReportModal;