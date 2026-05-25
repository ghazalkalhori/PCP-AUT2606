// Jobs page uses mock generation jobs until the LLM/report backend is connected.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";
import StatusBadge from "../components/StatusBadge.jsx";

const mockJobs = [
  {
    id: "JOB-1042",
    title: "Youth U18 Round Summary",
    source: "Youth U18",
    type: "League Summary",
    status: "Completed",
    date: "14 May 2026",
    time: "4:28 PM",
    words: 624,
    report:
      "### Youth U18 Round Summary\n\nYouth U18 delivered another competitive round with several close matches and strong attacking performances across the league. The round showed good balance between teams, with results highlighting both defensive discipline and late-game pressure.\n\n#### Key Overview\n\nThe league continues to show strong development quality, with multiple teams remaining competitive. Based on the available match data, the round can be summarised as active, balanced, and suitable for further editorial review.\n\n#### Conclusion\n\nThis summary is a demo-generated report used to test the jobs and report review workflow before the final LLM integration is completed.",
    icon: "completed",
  },
  {
    id: "JOB-1041",
    title: "Woonona Sharks vs Bellambi FC",
    source: "1st Grade Men",
    type: "Post-Match",
    status: "Processing",
    date: "14 May 2026",
    time: "4:12 PM",
    words: null,
    report: "Report is still processing.",
    icon: "processing",
  },
  {
    id: "JOB-1040",
    title: "2nd Grade Men Weekly Preview",
    source: "2nd Grade Men",
    type: "Pre-Match",
    status: "Approved",
    date: "14 May 2026",
    time: "3:54 PM",
    words: 438,
    report:
      "### 2nd Grade Men Weekly Preview\n\nThe upcoming 2nd Grade Men fixtures are expected to provide a competitive round of football, with teams looking to build momentum and improve their position in the competition.\n\n#### Match Context\n\nBased on the available fixture data, the round includes several important matchups where consistency, defensive structure, and early control will likely be key factors.\n\n#### Conclusion\n\nThis preview is ready for editorial review and approval as part of the Reporta AI workflow.",
    icon: "approved",
  },
  {
    id: "JOB-1039",
    title: "Pascoe Cup Match Report",
    source: "1st Grade Men",
    type: "Post-Match",
    status: "Failed",
    date: "13 May 2026",
    time: "7:40 PM",
    words: null,
    report: "Report generation failed.",
    icon: "failed",
  },
  {
    id: "JOB-1038",
    title: "Winter 2026 League Summary",
    source: "Home and Away",
    type: "League Summary",
    status: "Completed",
    date: "13 May 2026",
    time: "6:22 PM",
    words: 712,
    report:
      "### Winter 2026 League Summary\n\nThe Winter 2026 competition has shown steady activity across the current fixtures, with participating teams continuing to build rhythm throughout the season.\n\n#### Competition Overview\n\nThe league remains active and competitive, with match results contributing to an evolving picture of team performance and seasonal momentum.\n\n#### Conclusion\n\nThis report is a demo league summary generated for testing the jobs page and generated report page workflow.",
    icon: "completed",
  },
];

const typeBadgeStyles = {
  "Post-Match": "bg-purple-50 text-purple-700 ring-purple-100",
  "Pre-Match": "bg-blue-50 text-blue-700 ring-blue-100",
  "League Summary": "bg-amber-50 text-amber-700 ring-amber-100",
};

const statusOptions = ["Completed", "Processing", "Approved", "Failed"];

function JobStatusIcon({ icon }) {
  if (icon === "processing") {
    return <RefreshCw size={17} className="animate-spin text-blue-500" />;
  }

  if (icon === "approved") {
    return <CheckCircle size={17} className="text-slate-700" />;
  }

  if (icon === "completed") {
    return <CheckCircle size={17} className="text-emerald-500" />;
  }

  if (icon === "failed") {
    return <XCircle size={17} className="text-red-500" />;
  }

  return <Clock size={17} className="text-slate-400" />;
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
        <AlertCircle size={22} />
      </div>
      <p className="font-semibold text-slate-800">No jobs found</p>
      <p className="mt-1 text-sm text-slate-500">
        Try changing the search text or status filter.
      </p>
    </div>
  );
}

function Jobs() {
  const navigate = useNavigate();
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const counts = useMemo(() => {
    return mockJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
  }, []);

  const jobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return mockJobs.filter((job) => {
      const matchesFilter =
        selectedStatuses.length === 0 || selectedStatuses.includes(job.status);

      const matchesSearch =
        !query ||
        [job.title, job.id, job.type, job.source, job.status]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [selectedStatuses, searchTerm]);

  function toggleStatus(status) {
    setSelectedStatuses((currentStatuses) =>
      currentStatuses.includes(status)
        ? currentStatuses.filter((item) => item !== status)
        : [...currentStatuses, status],
    );
  }

  function clearFilters() {
    setSelectedStatuses([]);
  }

  function handleOpenJob(job) {
    if (job.status === "Processing") return;

    navigate("/report/result", {
      state: {
        type: job.type === "League Summary" ? "league" : "match",
        contentType: job.type,
        writingStyle: "Professional",
        generatedReport: job.report,
        model: "Demo Report",
        data: {
          name: job.source,
          competition: job.source,
          date: job.date,
          time: job.time,
          homeTeam: { name: job.title.split(" vs ")[0] || job.title },
          awayTeam: { name: job.title.split(" vs ")[1] || "Opponent" },
        },
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Jobs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track AI generation jobs and report statuses
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <Sparkles size={15} />
          Demo data until LLM is connected
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm sm:px-5">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="jobs-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search jobs by ID, source, type, or status..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 pl-9 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="relative mt-4 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setFilterOpen((isOpen) => !isOpen)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Filter size={15} />
            Filter
            {selectedStatuses.length > 0 && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {selectedStatuses.length}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute left-0 top-16 z-20 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">
                  Filter by status
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                {statusOptions.map((status) => (
                  <label
                    key={status}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => toggleStatus(status)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {counts[status] || 0}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>
          Showing {jobs.length} of {mockJobs.length} jobs
        </p>
        <p>Updated just now</p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => handleOpenJob(job)}
                disabled={job.status === "Processing"}
                className="flex w-full flex-col gap-4 px-5 py-4 text-left transition hover:bg-emerald-50/30 disabled:cursor-wait disabled:hover:bg-white sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100">
                    <JobStatusIcon icon={job.icon} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {job.title}
                      </p>
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                          typeBadgeStyles[job.type],
                        )}
                      >
                        {job.type}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                      <span>{job.id}</span>
                      <span>•</span>
                      <span>{job.source}</span>
                      <span>•</span>
                      <span>
                        {job.date} at {job.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <div className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
                    <FileText size={14} />
                    {job.words ? `${job.words} words` : "Pending"}
                  </div>

                  <StatusBadge status={job.status} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;
