import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Bookmark, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";

const DUMMY_REPORT = {
  jobId: "JOB-12345",
  title:
    "Arsenal's Clinical Display Overcomes Stubborn Chelsea in North London Derby",
  intro:
    "Arsenal secured a crucial 2-1 victory over Chelsea at the Emirates Stadium, with goals from Martin Ødegaard and Bukayo Saka sealing all three points.",
  body: [
    {
      type: "paragraph",
      text: "The Emirates Stadium witnessed a pulsating encounter as Arsenal edged past Chelsea 2-1 in a match that showcased the Gunners' attacking prowess.",
    },
    { type: "heading", text: "First Half Dominance" },
    {
      type: "paragraph",
      text: "Arsenal came out pressing high and forcing Chelsea into early mistakes. The opening goal came in the 23rd minute from Ødegaard's perfectly weighted through ball to Saka.",
    },
    { type: "heading", text: "Chelsea Fight Back" },
    {
      type: "paragraph",
      text: "Chelsea pulled level through Nicolas Jackson's header from a corner but were caught on the counter as Saka netted his second to seal the win.",
    },
    { type: "heading", text: "Key Takeaways" },
    {
      type: "paragraph",
      text: "Arsenal created 14 chances across the 90 minutes. Saka's performance was exceptional — a constant threat and the decisive contributor on the night.",
    },
  ],
};

function GeneratedReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const [approved, setApproved] = useState(false);
  const { data, contentType, writingStyle, type } = location.state || {};

  const matchTitle =
    type === "match" && data
      ? `${data.homeTeam.name} vs ${data.awayTeam.name}`
      : data?.name || "Barcelona vs Real Madrid";

  const competition =
    type === "match" ? data?.competition : data?.name || "La Liga";
  const matchDate =
    type === "match" && data
      ? `${data.date} at ${data.time}`
      : "9 Apr 2025 at 21:00";

  return (
    <div className="min-h-full bg-[#f5f6fa]">
      <div className="px-4 sm:px-6 pt-5 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={15} /> Back to Jobs
        </button>
      </div>

      <div className="px-4 sm:px-6 pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Generated Content
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-100">
            <CheckCircle2 size={13} /> Completed
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Job ID: {DUMMY_REPORT.jobId}
        </p>
      </div>

      <div className="px-4 sm:px-6 pb-5">
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
              {matchTitle.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 truncate">
              {matchTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <RefreshCw size={13} />{" "}
              <span className="hidden sm:inline">Regenerate</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Bookmark size={13} />{" "}
              <span className="hidden sm:inline">Save Draft</span>
            </button>
            <button
              onClick={() => setApproved(!approved)}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                approved
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-emerald-500 text-emerald-600 hover:bg-emerald-50",
              )}
            >
              <CheckCircle2 size={13} /> {approved ? "Approved" : "Approve"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-10 flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm p-5 sm:p-8 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-4">
            {DUMMY_REPORT.title}
          </h2>
          <p className="text-sm sm:text-base font-semibold text-gray-800 leading-relaxed mb-6 border-b border-gray-100 pb-6">
            {DUMMY_REPORT.intro}
          </p>
          <div className="space-y-4">
            {DUMMY_REPORT.body.map((block, i) =>
              block.type === "heading" ? (
                <h3
                  key={i}
                  className="text-base sm:text-lg font-bold text-gray-900 mt-6"
                >
                  {block.text}
                </h3>
              ) : (
                <p
                  key={i}
                  className="text-gray-600 leading-relaxed text-sm sm:text-[15px]"
                >
                  {block.text}
                </p>
              ),
            )}
          </div>
        </div>

        <div className="w-full lg:w-[260px] shrink-0 bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Content Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Season
              </p>
              <p className="text-sm text-gray-800">2025/2026</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Competition
              </p>
              <p className="text-sm text-gray-800">{competition}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Match
              </p>
              <p className="text-sm text-gray-800">{matchTitle}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Date
              </p>
              <p className="text-sm text-gray-800">{matchDate}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
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
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Generated
            </p>
            <p className="text-sm text-gray-800">
              {new Date().toISOString().replace("T", " ").slice(0, 19)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneratedReport;
