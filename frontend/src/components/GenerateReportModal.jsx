import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { clsx } from "clsx";
import { useNavigate } from "react-router-dom";

const labelClassName = "text-xs text-gray-400 uppercase tracking-wide mb-1";

const contentTypesByMode = {
  match: ["Pre Match", "Post Match", "Round Summary"],
  competition: ["Round Summary"],
  league: ["Round Summary"],
};

const writingStyles = ["Professional", "Casual", "Analytical", "Dramatic"];

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

function GenerateReportModal({ isOpen, onClose, type, data }) {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState(
    type === "competition" || type === "league"
      ? "Round Summary"
      : "Pre Match",
  );
  const [writingStyle, setWritingStyle] = useState("Professional");

  useEffect(() => {
    setContentType(
      type === "competition" || type === "league"
        ? "Round Summary"
        : "Pre Match",
    );
  }, [type, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.classList.add("overflow-hidden");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const contentTypes = contentTypesByMode[type] || contentTypesByMode.match;

  const handleGenerate = () => {
    onClose();

    navigate("/report/result", {
      state: { data, contentType, writingStyle, type },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-4 max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl md:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Generate AI Report"
      >
        <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Sparkles size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Generate AI Report
              </h2>
              <p className="text-sm text-gray-500">
                Configure and generate football content
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
            <p className={labelClassName}>Source</p>

            {type === "match" ? (
              <>
                <p className="mt-2 font-bold text-gray-900">
                  {data.homeTeam.name} vs {data.awayTeam.name}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {data.competition} • {data.date} at {data.time}
                </p>
              </>
            ) : type === "league" ? (
              <>
                <p className="mt-2 font-bold text-gray-900">{data.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {data.season} • {data.matches} matches • {data.status}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 font-bold text-gray-900">{data.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {data.season} • Round {data.progress?.current || "N/A"}
                </p>
              </>
            )}
          </div>

          <div className="mb-6">
            <p className={labelClassName}>Content Type</p>

            <div className="mt-3 flex flex-wrap gap-3">
              {contentTypes.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={contentType === option}
                  onClick={() => setContentType(option)}
                  className="w-full px-6 py-3 md:w-auto"
                />
              ))}
            </div>

            {(type === "competition" || type === "league") && (
              <p className="mt-3 text-xs text-gray-400">
                League reports generate round summaries only
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

          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-4 text-base font-semibold text-white transition-colors hover:bg-green-600"
          >
            <Sparkles size={18} />
            Generate Report
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            The AI will analyze the data and generate a report based on your
            selected style and content type.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GenerateReportModal;