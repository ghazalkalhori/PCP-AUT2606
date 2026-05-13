// Dashboard shows a summary of backend activity.
// It loads dashboard data from FastAPI using the saved JWT token.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge.jsx";
import { getAuthToken } from "../utils/auth.js";

export default function Dashboard() {
  const navigate = useNavigate();

  // Animation state
  const [visible, setVisible] = useState(false);

  // Dashboard data from backend
  const [dashboardData, setDashboardData] = useState(null);

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
        const response = await fetch("http://127.0.0.1:8000/dashboard", {
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
    return <p style={{ padding: 32 }}>Loading dashboard...</p>;
  }

  if (error) {
    return <p style={{ padding: 32, color: "red" }}>{error}</p>;
  }

  // Create stat cards from backend response
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
      label: "Content",
      value: dashboardData?.stats?.content ?? 0,
      icon: "📄",
    },
  ];

  // Recent reports from backend
  const recentReports = dashboardData?.recent_reports || [];

  return (
    <div
      style={{
        padding: "32px 36px",
        background: "#F8FAFC",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111827" }}
        >
          Dashboard
        </h1>

        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B7280" }}>
          Overview of AI content generation activity
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 20,
        }}
      >
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
              Recent Jobs
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
                <div
                  key={report.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 18px",
                    borderRadius: 12,
                    background: "#F9FAFB",
                    border: "1px solid #F3F4F6",
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
                      Fixture: {report.fixture_id}
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "#9CA3AF",
                      }}
                    >
                      Job #{report.id} · {report.report_type}
                    </p>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={report.status || "completed"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
