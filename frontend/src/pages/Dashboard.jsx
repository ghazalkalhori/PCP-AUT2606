// Dashboard shows a summary of backend activity.
// It loads dashboard data from FastAPI using the saved JWT token.

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../utils/auth.js";
import { getReportTitle } from "../utils/reportTitles.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const pageHeader = (
  <div>
    <h1 className="m-0 text-2xl font-bold text-gray-900">Dashboard</h1>
    <p className="mt-1 text-sm text-gray-500">
      Overview of AI content generation activity
    </p>
  </div>
);

function LoadingState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <Loader2
        size={22}
        className="mx-auto mb-3 animate-spin text-emerald-500"
        aria-hidden="true"
      />
      <p className="text-sm font-semibold text-slate-700">
        Loading Dashboard...
      </p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-10 text-center shadow-sm">
      <p className="text-sm font-semibold text-red-700">{message}</p>
    </div>
  );
}

function DashboardStatusBadge({ status }) {
  const normalizedStatus = String(status || "complete").toLowerCase();

  const styles = {
    draft: "bg-amber-50 text-amber-700 ring-amber-100",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    complete: "bg-blue-50 text-blue-700 ring-blue-100",
    processing: "bg-blue-50 text-blue-700 ring-blue-100",
    failed: "bg-red-50 text-red-700 ring-red-100",
  };

  const label = normalizedStatus
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        styles[normalizedStatus] || "bg-slate-50 text-slate-600 ring-slate-100"
      }`}
    >
      {label}
    </span>
  );
}

function formatReportType(type) {
  if (type?.includes("league")) return "League Summary";
  if (type?.includes("pre")) return "Pre-Match";
  return "Post-Match";
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

function getReportDetails(report) {
  const sourceData = report.source_data || {};
  const source =
    displaySourceValue(sourceData.league) ||
    displaySourceValue(sourceData.competition) ||
    "Not provided";

  if (
    sourceData.kind === "league" ||
    sourceData.kind === "round_summary" ||
    report.report_type?.includes("league")
  ) {
    return [source, sourceData.roundLabel || sourceData.round, report.report_type]
      .filter(Boolean)
      .join(" • ");
  }

  const dateTime = [sourceData.matchDate, sourceData.matchTime]
    .filter(Boolean)
    .join(" at ");

  return [source, dateTime, formatReportType(report.report_type)]
    .filter(Boolean)
    .join(" • ");
}

function formatLastDriblSync(value) {
  if (!value) return "Never";

  const timestamp = String(value);
  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(timestamp);
  const date = new Date(hasTimezone ? timestamp : `${timestamp}Z`);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
    timeZoneName: "short",
  }).format(date);
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Animation state
  const [visible, setVisible] = useState(false);

  // Dashboard data from backend
  const [dashboardData, setDashboardData] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncError, setSyncError] = useState("");

  async function fetchDashboard({ showLoader = false } = {}) {
    // Dashboard data comes from database aggregate counts, not from live Dribl calls.
    if (showLoader) {
      setLoading(true);
    }

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to load dashboard.");
        return;
      }

      setDashboardData(data);
      setError("");
    } catch (error) {
      setError("Could not connect to backend.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    // Small delay for card animation
    const timer = setTimeout(() => setVisible(true), 80);

    fetchDashboard({ showLoader: true });

    return () => clearTimeout(timer);
  }, []);

  async function handleUpdateDriblData() {
    setSyncing(true);
    setSyncMessage("");
    setSyncError("");

    try {
      // Sync is long-running enough for a loading state, but still handled as one API call.
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/sync/dribl`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail || result?.message || "Could not update Dribl data.",
        );
      }

      setSyncMessage(
        `Dribl data updated: ${result.matches_synced ?? 0} matches and ${
          result.leagues_synced ?? 0
        } leagues synced.`,
      );
      await fetchDashboard();
    } catch (syncError) {
      setSyncError(
        syncError instanceof Error
          ? syncError.message
          : "Could not update Dribl data.",
      );
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-7">
        {pageHeader}
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-7">
        {pageHeader}
        <ErrorState message={error} />
      </div>
    );
  }

  // Keep card values close to the backend keys so missing stats degrade to zero.
  const stats = [
    {
      label: "Matches",
      value: dashboardData?.stats?.matches ?? 0,
      icon: "📅",
    },
    {
      label: "Jobs",
      value: dashboardData?.stats?.jobs ?? 0,
      icon: "💼",
    },
    {
      label: "Leagues",
      value: dashboardData?.stats?.leagues ?? 0,
      icon: "🏆",
    },
    {
      label: "Content/Reports",
      value: dashboardData?.stats?.content ?? 0,
      icon: "📄",
    },
  ];

  const recentReports = dashboardData?.recent_reports || [];
  const hasSyncedDriblData =
    (dashboardData?.stats?.matches ?? 0) > 0 ||
    (dashboardData?.stats?.leagues ?? 0) > 0;

  function handleOpenReport(report) {
    const sourceData = report.source_data || {};
    const title = getReportTitle(report);
    const source =
      displaySourceValue(sourceData.league) ||
      displaySourceValue(sourceData.competition) ||
      "Not provided";

    navigate("/report/result", {
      state: {
        type: report.report_type?.includes("league") ? "league" : "match",
        reportId: report.id,
        reportStatus: report.status,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        contentType: report.report_type,
        writingStyle:
          report.tone || sourceData.writingStyle || "Not provided",
        generatedReport: report.content,
        data: {
          source_data: sourceData,
          name: title,
          league: sourceData.league || source,
          competition: sourceData.competition || source,
          date: sourceData.matchDate || "Not provided",
          time: sourceData.matchTime || "Not provided",
          homeTeam: {
            name:
              displaySourceValue(sourceData.homeTeam) ||
              displaySourceValue(sourceData.homeClub) ||
              title.split(" vs ")[0] ||
              title,
          },
          awayTeam: {
            name:
              displaySourceValue(sourceData.awayTeam) ||
              displaySourceValue(sourceData.awayClub) ||
              title.split(" vs ")[1] ||
              "Opponent",
          },
        },
      },
    });
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      {pageHeader}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="m-0 text-sm font-semibold text-slate-800">
            Dribl fixture data
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {hasSyncedDriblData
              ? "Dashboard, matches, and leagues are reading from the local database."
              : "No Dribl data has been synced yet. Update Dribl data to load matches and leagues."}
          </p>
          {syncMessage && (
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {syncMessage}
            </p>
          )}
          {syncError && (
            <p className="mt-2 text-sm font-medium text-red-700">
              {syncError}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-1 md:items-end">
          <button
            type="button"
            onClick={handleUpdateDriblData}
            disabled={syncing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw
              size={16}
              className={syncing ? "animate-spin" : ""}
              aria-hidden="true"
            />
            {syncing ? "Updating..." : "Update Dribl Data"}
          </button>
          <p className="m-0 text-xs text-slate-400">
            Last updated:{" "}
            {formatLastDriblSync(dashboardData?.last_dribl_sync_at)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              background: "white",
              borderRadius: 12,
              padding: "20px 24px",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transition: `opacity 0.4s ease ${i * 0.07}s, transform 0.4s ease ${
                i * 0.07
              }s`,
            }}
          >
            <div style={{ color: "#9CA3AF", marginBottom: 12, fontSize: 22 }}>
              {s.icon}
            </div>

            <p
              style={{
                margin: "0 0 4px",
                fontSize: 32,
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>

            <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Jobs */}
      <div>
        <div
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            padding: "24px 28px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              gap: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Recent Content
            </p>

            <button
              onClick={() => navigate("/jobs")}
              style={{
                background: "none",
                border: "none",
                color: "#10B981",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              View all →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentReports.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
                No jobs found.
              </p>
            ) : (
              recentReports.slice(0, 5).map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => handleOpenReport(report)}
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 18px",
                    borderRadius: 12,
                    background: "#F9FAFB",
                    border: "1px solid #F3F4F6",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {getReportTitle(report)}
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "#9CA3AF",
                      }}
                    >
                      Job #{report.id} · {getReportDetails(report)}
                    </p>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <DashboardStatusBadge
                      status={report.status || "complete"}
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
