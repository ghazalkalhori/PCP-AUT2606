import { useEffect, useState } from "react";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { clsx } from "clsx";
import { useNavigate } from "react-router-dom";

const labelClassName = "text-xs text-gray-400 uppercase tracking-wide mb-1";


const writingStyles = ["Professional", "Casual", "Analytical", "Dramatic"];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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
      Object.values(value).filter(Boolean).map(String).join(" - ") ||
      fallback
    );
  }

  return fallback;
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

function LeagueSummaryModal({ isOpen, onClose, data }) {
  const navigate = useNavigate();

  const [writingStyle, setWritingStyle] = useState("Professional");
  const [selectedRound, setSelectedRound] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setWritingStyle("Professional");
    setSelectedRound("all");
    setError("");
    setIsGenerating(false);
  }, [isOpen]);

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

  const leagueName = displayValue(
    data.name || data.league || data.competition,
    "Selected League",
  );
  const leagueSeason = displayValue(data.season, "Season not provided");
  const leagueMatches = displayValue(
    data.matches ?? data.match_count,
    "Matches not provided",
  );
  const leagueStatus = displayValue(data.status, "Status not provided");
  const availableRounds = Array.isArray(data.rounds) ? data.rounds : [];
  const selectedRoundLabel =
    selectedRound === "all" ? "All rounds" : `Round ${selectedRound}`;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const leagueId = data.id || data.leagueId || data.league_id || null;

      if (!leagueId) {
        throw new Error("This league does not have a league ID.");
      }

      // The backend rebuilds and stores the source payload before starting the LLM job.
      const response = await fetch(`${API_BASE_URL}/league-summary/jobs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          league_id: leagueId,
          league_name: displayValue(data.name, "Selected League"),
          competition: displayValue(data.competition),
          season: displayValue(data.season),
          round: selectedRound,
          round_label: selectedRoundLabel,
          match_count: data.matches ?? data.match_count ?? null,
          status: displayValue(data.status),
          tone: writingStyle.toLowerCase(),
          excitement: "balanced",
          comedic_effect: "none",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail || result?.message || "Could not create league summary.",
        );
      }

      if (!result?.report_id || result?.report_status !== "processing") {
        throw new Error("The backend did not create a processing summary job.");
      }

      onClose();
      navigate("/jobs");
    } catch (generateError) {
      console.error("League summary generation failed:", generateError);
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Could not create league summary. Please try again.",
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
        aria-label="Generate League Summary"
      >
        <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Sparkles size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Generate League Summary
              </h2>

              <p className="text-sm text-gray-500">
                Generate an AI summary for this league
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
            <p className={labelClassName}>League</p>

            <p className="mt-2 font-bold text-gray-900">{leagueName}</p>

            <p className="mt-1 text-sm text-gray-500">
              {leagueSeason} • {leagueMatches} matches • {leagueStatus}
            </p>
          </div>

          <div className="mb-6">
            <p className={labelClassName}>Round</p>

            <div className="relative mt-3">
              <select
                value={selectedRound}
                onChange={(event) => setSelectedRound(event.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm font-medium text-gray-700 outline-none transition hover:border-green-300 hover:bg-white focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-100"
              >
                <option value="all">All rounds</option>
                {availableRounds.map((round) => (
                  <option key={round} value={round}>
                    Round {round}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
            </div>
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-4 text-base font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-wait disabled:opacity-70"
          >
            <Sparkles size={18} />
            {isGenerating ? "Creating Summary..." : "Generate Summary"}
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            The summary will use the selected league, round, and writing style.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LeagueSummaryModal;
