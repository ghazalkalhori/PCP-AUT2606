import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const typeBadgeStyles = {
  "Post-Match": "bg-purple-50 text-purple-700 ring-purple-100",
  "Pre-Match": "bg-blue-50 text-blue-700 ring-blue-100",
  "League Summary": "bg-amber-50 text-amber-700 ring-amber-100",
};

const statusOptions = [
  "Complete",
  "Draft",
  "Approved",
  "Published",
  "Processing",
  "Failed",
];

const pageHeader = (
  <div>
    <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
    <p className="mt-1 text-sm text-slate-500">
      Track AI generation jobs and report statuses
    </p>
  </div>
);

const controlClassName =
  "h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100";

const secondaryButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

function formatReportType(type) {
  if (type?.includes("league")) return "League Summary";
  if (type?.includes("pre")) return "Pre-Match";
  return "Post-Match";
}

function formatReportStatus(status) {
  if (status === "complete") return "Complete";
  if (status === "draft") return "Draft";
  if (status === "approved") return "Approved";
  if (status === "published") return "Published";
  if (status === "failed") return "Failed";
  return "Processing";
}

function formatStoredDateTime(value) {
  if (!value) return "Created at unknown time";

  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);

  if (Number.isNaN(date.getTime())) return "Created at unknown time";

  const formatted = date.toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `Created at ${formatted.replace(",", " at")}`;
}

function displaySourceValue(value) {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.club ||
      value.team ||
      Object.values(value).filter(Boolean).map(String).join(" - ")
    );
  }

  return "";
}

function getReportTitle(report, sourceData) {
  if (sourceData.kind === "league") {
    const leagueTitle =
      displaySourceValue(sourceData.leagueName) ||
      displaySourceValue(sourceData.league) ||
      displaySourceValue(sourceData.competition);

    return leagueTitle ? `${leagueTitle} Summary` : `League Summary #${report.id}`;
  }

  const homeTeam =
    displaySourceValue(sourceData.homeTeam) ||
    displaySourceValue(sourceData.homeClub);
  const awayTeam =
    displaySourceValue(sourceData.awayTeam) ||
    displaySourceValue(sourceData.awayClub);

  if (homeTeam && awayTeam) {
    return `${homeTeam} vs ${awayTeam}`;
  }

  return `Match Report #${report.id}`;
}

function JobStatusIcon({ status }) {
  if (status === "Processing") {
    return <RefreshCw size={17} className="animate-spin text-blue-500" />;
  }

  if (status === "Approved" || status === "Published") {
    return <CheckCircle size={17} className="text-emerald-500" />;
  }

  if (status === "Complete") {
    return <CheckCircle size={17} className="text-blue-500" />;
  }

  if (status === "Draft") {
    return <CheckCircle size={17} className="text-amber-500" />;
  }

  if (status === "Failed") {
    return <XCircle size={17} className="text-red-500" />;
  }

  return <Clock size={17} className="text-slate-400" />;
}

function JobStatusBadge({ status }) {
  const styles = {
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Published: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Complete: "bg-blue-50 text-blue-700 ring-blue-100",
    Draft: "bg-amber-50 text-amber-700 ring-amber-100",
    Processing: "bg-blue-50 text-blue-700 ring-blue-100",
    Failed: "bg-red-50 text-red-700 ring-red-100",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        styles[status] || "bg-slate-50 text-slate-600 ring-slate-100",
      )}
    >
      {status}
    </span>
  );
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

function LoadingState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <Loader2
        size={22}
        className="mx-auto mb-3 animate-spin text-emerald-500"
        aria-hidden="true"
      />
      <p className="text-sm font-semibold text-slate-700">Loading Jobs...</p>
    </div>
  );
}

function Jobs() {
  const navigate = useNavigate();
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("reporta_token");

      const response = await fetch(`${API_BASE_URL}/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Could not load reports");
      }

      const result = await response.json();

      const mappedReports = result.data.map((report) => {
        const content = report.content || "";
        const words = content.trim()
          ? content.trim().split(/\s+/).length
          : null;

        const sourceData = report.source_data || {};
        const title = getReportTitle(report, sourceData);
        const source =
          displaySourceValue(sourceData.league) ||
          displaySourceValue(sourceData.competition) ||
          "Not provided";
        const dateTime = [sourceData.matchDate, sourceData.matchTime]
          .filter(Boolean)
          .join(" at ");
        const detailParts =
          sourceData.kind === "league"
            ? [
                source,
                sourceData.roundLabel || sourceData.round,
                report.report_type,
              ]
            : [source, dateTime, formatReportType(report.report_type)];
        const details = detailParts.filter(Boolean).join(" • ");
        const createdLabel = formatStoredDateTime(report.created_at);

        return {
          id: `REPORT-${report.id}`,
          reportId: report.id,
          title,
          source,
          details,
          type: formatReportType(report.report_type),
          status: formatReportStatus(report.status),
          createdLabel,
          sourceData,
          reportType: report.report_type,
          tone: report.tone,
          createdAt: report.created_at,
          updatedAt: report.updated_at,
          words,
          report: content,
          icon:
            report.status === "approved" || report.status === "published"
              ? "approved"
              : report.status === "failed"
                ? "failed"
                : report.status === "processing"
                  ? "processing"
                  : "complete",
        };
      });

      setSavedJobs(mappedReports);
    } catch (err) {
      setError("Could not load reports from database");

      if (showLoader) {
        setSavedJobs([]);
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchReports({ showLoader: true });
  }, [fetchReports]);

  const counts = useMemo(() => {
    return savedJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
  }, [savedJobs]);

  const hasProcessingJobs = useMemo(
    () => savedJobs.some((job) => job.status === "Processing"),
    [savedJobs],
  );

  useEffect(() => {
    if (!hasProcessingJobs) return undefined;

    const intervalId = window.setInterval(() => {
      fetchReports();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [fetchReports, hasProcessingJobs]);

  const jobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return savedJobs.filter((job) => {
      const matchesFilter =
        selectedStatuses.length === 0 || selectedStatuses.includes(job.status);

      const matchesSearch =
        !query ||
        [job.title, job.id, job.type, job.source, job.details, job.status]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [savedJobs, selectedStatuses, searchTerm]);

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
        reportId: job.reportId,
        reportStatus: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        contentType: job.reportType || job.type,
        writingStyle:
          job.tone || job.sourceData?.writingStyle || "Not provided",
        generatedReport: job.report,
        data: {
          source_data: job.sourceData,
          name: job.title,
          league: job.sourceData?.league || job.source,
          competition: job.sourceData?.competition || job.source,
          date: job.sourceData?.matchDate || "Not provided",
          time: job.sourceData?.matchTime || "Not provided",
          homeTeam: {
            name:
              displaySourceValue(job.sourceData?.homeTeam) ||
              displaySourceValue(job.sourceData?.homeClub) ||
              job.title.split(" vs ")[0] ||
              job.title,
          },
          awayTeam: {
            name:
              displaySourceValue(job.sourceData?.awayTeam) ||
              displaySourceValue(job.sourceData?.awayClub) ||
              job.title.split(" vs ")[1] ||
              "Opponent",
          },
        },
      },
    });
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {pageHeader}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
            <span>Search</span>
            <div className="relative w-full">
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
                className={clsx("w-full pl-9 pr-4", controlClassName)}
              />
            </div>
          </label>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen((isOpen) => !isOpen)}
              className={secondaryButtonClassName}
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
              <div className="absolute right-0 top-11 z-20 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
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
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>
            Showing {jobs.length} of {savedJobs.length} jobs
          </p>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : jobs.length === 0 ? (
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
                className="flex w-full flex-col gap-4 px-5 py-4 text-left transition hover:bg-emerald-50/40 disabled:cursor-wait disabled:bg-slate-50/60 disabled:opacity-80 disabled:hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100">
                    <JobStatusIcon status={job.status} />
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
                      <span>{job.details || job.source}</span>
                      <span>•</span>
                      <span>{job.createdLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <div className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
                    <FileText size={14} />
                    {job.words ? `${job.words} words` : "Pending"}
                  </div>

                  <JobStatusBadge status={job.status} />
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
