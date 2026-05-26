// Leagues page loads current league data from the backend.

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Trophy } from "lucide-react";
import LeagueSummaryModal from "../components/LeagueSummaryModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const columns = [
  "LEAGUE",
  "COMPETITION",
  "SEASON",
  "MATCHES",
  "STATUS",
  "ACTIONS",
];

const pageHeader = (
  <div>
    <h1 className="text-2xl font-bold text-slate-900">Leagues</h1>
    <p className="mt-1 text-sm text-slate-500">
      Browse current football leagues available
    </p>
  </div>
);

function getAuthHeaders() {
  const token = localStorage.getItem("reporta_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function LeagueAvatar({ name }) {
  const initials = (name || "L")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
      {initials}
    </div>
  );
}

function LeagueCell({ league }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LeagueAvatar name={league.name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {league.name}
        </p>
        <p className="truncate text-xs text-slate-400">
          Tenant: {league.tenant}
        </p>
      </div>
    </div>
  );
}

function ActiveBadge({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {status || "Active"}
    </span>
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
      <p className="text-sm font-semibold text-slate-700">
        Loading Leagues Data...
      </p>
    </div>
  );
}

function SummaryButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
    >
      <Sparkles size={13} />
      Summary
    </button>
  );
}

function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);

  async function fetchLeagues() {
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/leagues`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        let backendMessage = "Could not load leagues.";

        try {
          const errorData = await response.json();

          backendMessage =
            errorData?.detail ||
            errorData?.message ||
            `Backend returned ${response.status}`;
        } catch {
          backendMessage = `Backend returned ${response.status}`;
        }

        throw new Error(backendMessage);
      }

      const result = await response.json();

      setLeagues(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error("Failed loading leagues:", err);

      if (err instanceof Error) {
        setError(err.message || "Could not load leagues.");
      } else {
        setError("Could not load leagues.");
      }

      setLeagues([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeagues();
  }, []);

  function handleSummaryClick(league) {
    setSelectedLeague(league);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div className="space-y-7">
        {pageHeader}
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {pageHeader}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <p>
            Showing {leagues.length} of {leagues.length} leagues
          </p>
        </div>
      )}

      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {leagues.map((league) => (
              <tr
                key={league.id}
                className="border-b border-slate-100 transition hover:bg-emerald-50/40 last:border-b-0"
              >
                <td className="px-4 py-3 align-middle">
                  <LeagueCell league={league} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 align-middle">
                  {league.competition}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 align-middle">
                  {league.season}
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    <Trophy size={13} />
                    {league.matches} matches
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <ActiveBadge status={league.status} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <SummaryButton onClick={() => handleSummaryClick(league)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {leagues.map((league) => (
          <div
            key={league.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <LeagueCell league={league} />

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="mb-1 text-xs text-slate-400">Competition</p>
                <p className="font-medium text-slate-700">
                  {league.competition}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="mb-1 text-xs text-slate-400">Season</p>
                <p className="font-medium text-slate-700">{league.season}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="mb-1 text-xs text-slate-400">Matches</p>
                <p className="font-medium text-slate-700">{league.matches}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="mb-1 text-xs text-slate-400">Status</p>
                <ActiveBadge status={league.status} />
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <SummaryButton onClick={() => handleSummaryClick(league)} />
            </div>
          </div>
        ))}
      </div>

      {!error && leagues.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No leagues found. Update Dribl data from the Dashboard to sync leagues.
        </div>
      )}

      <LeagueSummaryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selectedLeague}
      />
    </div>
  );
}

export default Leagues;
