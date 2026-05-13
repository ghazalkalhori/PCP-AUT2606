import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const recentJobs = [
  {
    id: "JOB-001",
    match: "Man City vs Arsenal",
    type: "Post Match",
    status: "Processing",
    date: "7 May 2026",
  },
  {
    id: "JOB-002",
    match: "Barcelona vs Real Madrid",
    type: "Pre Match",
    status: "Submitted",
    date: "6 May 2026",
  },
  {
    id: "JOB-003",
    match: "Bayern Munich vs Dortmund",
    type: "Post Match",
    status: "Completed",
    date: "6 May 2026",
  },
  {
    id: "JOB-004",
    match: "Premier League — Round 28",
    type: "League Summary",
    status: "Completed",
    date: "5 May 2026",
  },
  {
    id: "JOB-005",
    match: "PSG vs Marseille",
    type: "Post Match",
    status: "Failed",
    date: "5 May 2026",
  },
];

const recentContent = [
  {
    title: "Der Klassiker Dominance: Bayern Munich Crush Dortmund",
    date: "6 Apr",
    words: "412 words",
    status: "Approved",
  },
  {
    title: "Premier League Round 28: Title Race Tightens",
    date: "6 Apr",
    words: "358 words",
    status: "Published",
  },
  {
    title: "Blues and Spurs Cancel Each Other Out",
    date: "5 Apr",
    words: "296 words",
    status: "Draft",
  },
  {
    title: "La Liga Round 27 Recap: Masterful Real Madrid",
    date: "7 Apr",
    words: "316 words",
    status: "Approved",
  },
];

const statusConfig = {
  Processing: { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  Submitted: { bg: "#EDE9FE", color: "#5B21B6", dot: "#8B5CF6" },
  Completed: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  Failed: { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
  Approved: { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  Published: { bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
  Draft: { bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF" },
};

const typeConfig = {
  "Post Match": { bg: "#EDE9FE", color: "#5B21B6" },
  "Pre Match": { bg: "#E0F2FE", color: "#075985" },
  "League Summary": { bg: "#FEF3C7", color: "#92400E" },
};

function StatusBadge({ status }) {
  const s = statusConfig[status] || statusConfig.Draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bg,
        color: s.color,
        padding: "4px 11px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = typeConfig[type] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span
      style={{
        background: t.bg,
        color: t.color,
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {type}
    </span>
  );
}

const stats = [
  {
    label: "Matches",
    value: 8,
    icon: (
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Jobs",
    value: 8,
    icon: (
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    label: "Competitions",
    value: 6,
    icon: (
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
      </svg>
    ),
  },
  {
    label: "Content",
    value: 4,
    icon: (
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

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
          gridTemplateColumns: "repeat(4, 1fr)",
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
              transition: `opacity 0.4s ease ${i * 0.07}s, transform 0.4s ease ${i * 0.07}s`,
            }}
          >
            <div style={{ color: "#9CA3AF", marginBottom: 12 }}>{s.icon}</div>
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

      {/* Two Columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Jobs */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 15,
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
              }}
            >
              View all →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#F9FAFB",
                  border: "1px solid #F3F4F6",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {job.match}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 11,
                      color: "#9CA3AF",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <TypeBadge type={job.type} /> · {job.id} · {job.date}
                  </p>
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Content */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Recent Content
            </p>
            <button
              onClick={() => navigate("/content")}
              style={{
                background: "none",
                border: "none",
                color: "#10B981",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              View all →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentContent.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#F9FAFB",
                  border: "1px solid #F3F4F6",
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#111827",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.title}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 11,
                      color: "#9CA3AF",
                    }}
                  >
                    {c.date} · {c.words}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
