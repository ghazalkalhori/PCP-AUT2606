// Leagues page loads real league data from the backend and displays it in a clean admin table.

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Sparkles, Trophy } from "lucide-react";
import { clsx } from "clsx";
import GenerateReportModal from "../components/GenerateReportModal.jsx";

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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
        throw new Error("Could not load leagues.");
      }

      const result = await response.json();
      setLeagues(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "Could not load leagues.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchLeagues();
  }, []);

  const filteredLeagues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return leagues;

    return leagues.filter((league) =>
      [
        league.name,
        league.competition,
        league.season,
        league.tenant,
        league.status,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [leagues, searchTerm]);

  function handleRefresh() {
    setRefreshing(true);
    fetchLeagues();
  }

  function handleSummaryClick(league) {
    setSelectedLeague(league);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading leagues...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Leagues
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse available football leagues from fixture data
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshCw size={14} className={clsx(refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search leagues..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 pl-9 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm text-slate-500">
        Showing {filteredLeagues.length} of {leagues.length} leagues
      </p>

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
            {filteredLeagues.map((league) => (
              <tr
                key={league.id}
                className="border-b border-slate-100 transition hover:bg-emerald-50/30 last:border-b-0"
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
        {filteredLeagues.map((league) => (
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

      {!error && filteredLeagues.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No leagues found.
        </div>
      )}

      <GenerateReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type="league_summary"
        data={selectedLeague}
      />
    </div>
  );
}

export default Leagues;
