import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Bookmark,
  CheckCircle2,
  Copy,
  Download,
} from "lucide-react";
import { clsx } from "clsx";

function GeneratedReport() {
  const location = useLocation();
  const navigate = useNavigate();

  const [approved, setApproved] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, contentType, writingStyle, type, generatedReport, model } =
    location.state || {};

  if (!generatedReport) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa]">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <p className="mb-4 text-gray-600">No generated report found.</p>

          <button
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
      ? `${data.homeTeam?.name} vs ${data.awayTeam?.name}`
      : data?.name || "League Summary";

  const competition =
    type === "match" ? data?.competition : data?.name || "Football League";

  const matchDate =
    type === "match" && data
      ? `${data.date} at ${data.time}`
      : "Current Season";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedReport);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy report:", error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedReport], {
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

  return (
    <div className="min-h-full bg-[#f5f6fa]">
      <div className="px-4 pb-2 pt-5 sm:px-6">
        <button
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

          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
            <CheckCircle2 size={13} />
            Completed
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
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Copy size={13} />
              <span className="hidden sm:inline">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>

            <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Bookmark size={13} />
              <span className="hidden sm:inline">Save Draft</span>
            </button>

            <button
              onClick={() => setApproved(!approved)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                approved
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-emerald-500 text-emerald-600 hover:bg-emerald-50",
              )}
            >
              <CheckCircle2 size={13} />
              {approved ? "Approved" : "Approve"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-5 px-4 pb-10 sm:px-6 lg:flex-row">
        <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="space-y-4">
            {generatedReport.split("\n").map((line, index) => {
              if (!line.trim()) {
                return <br key={index} />;
              }

              if (line.startsWith("###")) {
                return (
                  <h2
                    key={index}
                    className="mt-6 text-2xl font-bold text-gray-900"
                  >
                    {line.replace("###", "").trim()}
                  </h2>
                );
              }

              if (line.startsWith("####")) {
                return (
                  <h3
                    key={index}
                    className="mt-5 text-lg font-bold text-gray-900"
                  >
                    {line.replace("####", "").trim()}
                  </h3>
                );
              }

              return (
                <p
                  key={index}
                  className="text-sm leading-8 text-gray-700 sm:text-[15px]"
                >
                  {line}
                </p>
              );
            })}
          </div>
        </div>

        <div className="w-full shrink-0 space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:w-65">
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
