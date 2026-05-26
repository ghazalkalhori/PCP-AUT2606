// Dashboard shows a summary of backend activity.
// It loads dashboard data from FastAPI using the saved JWT token.

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../utils/auth.js";

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

function getReportTitle(report) {
  const sourceData = report.source_data || {};

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

function getReportDetails(report) {
  const sourceData = report.source_data || {};
  const source =
    displaySourceValue(sourceData.league) ||
    displaySourceValue(sourceData.competition) ||
    "Not provided";

  if (sourceData.kind === "league") {
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

export default function Dashboard() {
  const navigate = useNavigate();

  // Animation state
  const [visible, setVisible] = useState(false);

  // Dashboard data from backend
  const [dashboardData, setDashboardData] = useState(null);
  const [realCounts, setRealCounts] = useState({
    matches: 0,
    leagues: 0,
  });

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Small delay for card animation
    const timer = setTimeout(() => setVisible(true), 80);

    async function fetchDashboard() {
      try {
        // Get JWT token saved after login
        const token = getAuthToken();

        // Call backend dashboard endpoint
        const response = await fetch(`${API_BASE_URL}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        // Show backend error if request fails
        if (!response.ok) {
          setError(data.detail || "Failed to load dashboard.");
          return;
        }

        // Save dashboard data into state
        setDashboardData(data);
        const authHeaders = {
          Authorization: `Bearer ${token}`,
        };

        const [matchesResponse, leaguesResponse] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/matches?page=1`, {
            headers: authHeaders,
          }),
          fetch(`${API_BASE_URL}/leagues`, {
            headers: authHeaders,
          }),
        ]);

        let matchesCount = data?.stats?.matches ?? 0;
        let leaguesCount = data?.stats?.leagues ?? 0;

        if (
          matchesResponse.status === "fulfilled" &&
          matchesResponse.value.ok
        ) {
          const matchesData = await matchesResponse.value.json();

          matchesCount =
            matchesData?.pagination?.total ??
            matchesData?.meta?.total ??
            matchesData?.total ??
            matchesData?.data?.length ??
            matchesCount;
        }

        if (
          leaguesResponse.status === "fulfilled" &&
          leaguesResponse.value.ok
        ) {
          const leaguesData = await leaguesResponse.value.json();

          leaguesCount =
            leaguesData?.pagination?.total ??
            leaguesData?.meta?.total ??
            leaguesData?.total ??
            leaguesData?.data?.length ??
            leaguesCount;
        }

        setRealCounts({
          matches: matchesCount,
          leagues: leaguesCount,
        });
      } catch (error) {
        setError("Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();

    return () => clearTimeout(timer);
  }, []);

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

  // Create stat cards from backend response
  const stats = [
    {
      label: "Matches",
      value: realCounts.matches,
      icon: "📅",
    },
    {
      label: "Jobs / Reports",
      value: dashboardData?.stats?.jobs ?? 0,
      icon: "💼",
    },
    {
      label: "Leagues",
      value: realCounts.leagues,
      icon: "🏆",
    },
    {
      label: "Usable Reports",
      value: dashboardData?.stats?.content ?? 0,
      icon: "📄",
    },
  ];

  // Recent reports from backend
  const recentReports = dashboardData?.recent_reports || [];

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
