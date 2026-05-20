// Matches page shows backend fixture data in a cleaner sports admin layout
// while keeping search, filtering, paging, and report generation simple.

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import MatchReportModal from "../components/MatchReportModal";

const columns = [
  { label: "Match", width: "w-[40%]" },
  { label: "League", width: "w-[12%]" },
  { label: "Venue", width: "w-[13%]" },
  { label: "Date & Time", width: "w-[12%]" },
  { label: "Status", width: "w-[9%]" },
  { label: "", width: "w-[9%]" },
];

const sortOptions = [
  { value: "date-asc", label: "Date ascending" },
  { value: "date-desc", label: "Date descending" },
  { value: "league-asc", label: "League A-Z" },
  { value: "league-desc", label: "League Z-A" },
  { value: "home-asc", label: "Home team A-Z" },
  { value: "away-asc", label: "Away team A-Z" },
  { value: "status", label: "Status" },
];

const statusFilterOptions = [
  { value: "all", label: "All Statuses" },
  { value: "complete", label: "Complete" },
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

const teamAvatarStyles = {
  home: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  away: "bg-indigo-100 text-indigo-700 ring-indigo-200",
};

const statusStyles = {
  complete: "bg-emerald-50/90 text-emerald-700 ring-emerald-100",
  pending: "bg-amber-50/90 text-amber-700 ring-amber-100",
  scheduled: "bg-amber-50/90 text-amber-700 ring-amber-100",
  cancelled: "bg-rose-50/90 text-rose-700 ring-rose-100",
  failed: "bg-rose-50/90 text-rose-700 ring-rose-100",
};

const controlClassName =
  "h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100";

const secondaryButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

function getPageItems(currentPage, lastPage) {
  if (lastPage <= 1) {
    return [1];
  }

  const items = [];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(lastPage, currentPage + 1);

  items.push(1);

  if (start > 2) {
    items.push("left-ellipsis");
  }

  for (
    let page = Math.max(2, start);
    page <= Math.min(lastPage - 1, end);
    page += 1
  ) {
    items.push(page);
  }

  if (end < lastPage - 1) {
    items.push("right-ellipsis");
  }

  if (lastPage > 1) {
    items.push(lastPage);
  }

  return items.filter(
    (item, index, list) => index === 0 || item !== list[index - 1],
  );
}

function getInitials(name) {
  const words = String(name || "")
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) {
    return "TM";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (value.includes("complete")) {
    return "complete";
  }

  if (value.includes("pending")) {
    return "pending";
  }

  if (value.includes("sched")) {
    return "scheduled";
  }

  if (value.includes("cancel")) {
    return "cancelled";
  }

  if (value.includes("fail")) {
    return "failed";
  }

  return value || "unknown";
}

function formatStatusLabel(status) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "unknown") {
    return "Unknown";
  }

  return normalizedStatus
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateLabel(localDate) {
  if (!localDate) {
    return "Date TBC";
  }

  const [year, month, day] = localDate.split("-").map(Number);

  if (!year || !month || !day) {
    return localDate;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatTimeLabel(localTime) {
  if (!localTime) {
    return "Time TBC";
  }

  const [hoursValue, minutesValue] = localTime.split(":");
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return localTime;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const paddedMinutes = String(minutes).padStart(2, "0");

  return `${hour12}:${paddedMinutes} ${period}`;
}

function formatFallbackDateTime(utcDatetime, timezone) {
  if (!utcDatetime) {
    return {
      dateLabel: "Date TBC",
      timeLabel: "Time TBC",
      timezoneLabel: timezone || "AU/Syd",
    };
  }

  const date = new Date(utcDatetime);
  const zone = timezone || "AU/Syd";

  return {
    dateLabel: new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: zone,
    }).format(date),
    timeLabel: new Intl.DateTimeFormat("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: zone,
    }).format(date),
    timezoneLabel: zone === "Australia/Sydney" ? "AU/SYD" : zone,
  };
}

function formatDisplayDateTime(localDate, localTime, timezone, utcDatetime) {
  if (localDate || localTime) {
    return {
      dateLabel: formatDateLabel(localDate),
      timeLabel: formatTimeLabel(localTime),
      timezoneLabel: "AU/SYD",
    };
  }

  return formatFallbackDateTime(utcDatetime, timezone);
}

function getSortTimestamp(localDate, localTime, utcDatetime) {
  if (localDate) {
    const safeTime = localTime || "00:00:00";
    return new Date(`${localDate}T${safeTime}`).getTime();
  }

  if (utcDatetime) {
    return new Date(utcDatetime).getTime();
  }

  return 0;
}

// Result data may be missing in fixture payloads.
// Detailed score or statistics can later come from GET /matches/{fixture_id}/statistics.
function getResultMeta(attributes) {
  const scorePairs = [
    [attributes.home_score, attributes.away_score],
    [attributes.home_goals, attributes.away_goals],
    [attributes.home_team_score, attributes.away_team_score],
  ];

  for (const [homeScore, awayScore] of scorePairs) {
    if (homeScore != null && awayScore != null) {
      return {
        label: `${homeScore} - ${awayScore}`,
        isAvailable: true,
      };
    }
  }

  if (attributes.score) {
    return {
      label: String(attributes.score),
      isAvailable: true,
    };
  }

  return {
    label: "-",
    isAvailable: false,
  };
}

function TeamAvatar({ team }) {
  return (
    <div
      className={clsx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1",
        team.colorClass,
      )}
      aria-hidden="true"
    >
      {team.abbreviation}
    </div>
  );
}

function TeamNameBlock({ team }) {
  return (
    <div className="min-w-0">
      {/* Show one clean team name in the table to reduce visual clutter */}
      <p className="truncate text-sm font-semibold text-slate-900">
        {team.name}
      </p>
    </div>
  );
}

function MatchCell({ match }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <TeamAvatar team={match.homeTeam} />
        <TeamNameBlock team={match.homeTeam} />
      </div>

      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        vs
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <TeamAvatar team={match.awayTeam} />
        <TeamNameBlock team={match.awayTeam} />
      </div>
    </div>
  );
}

function LeagueBadge({ league }) {
  return (
    <div className="min-w-0">
      {/* Show only the league name in the table to keep the row compact */}
      <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
        <span className="truncate">{league || "Unknown League"}</span>
      </span>
    </div>
  );
}

function VenueCell({ ground }) {
  return (
    <div className="min-w-0">
      <div className="flex items-start gap-2">
        <MapPin
          size={14}
          className="mt-0.5 shrink-0 text-slate-400"
          aria-hidden="true"
        />
        <p className="truncate text-sm font-medium text-slate-800">
          {ground || "Venue TBC"}
        </p>
      </div>
    </div>
  );
}

function DateTimeCell({ match }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-800">{match.dateLabel}</p>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Clock3 size={13} aria-hidden="true" />
        <span className="truncate">
          {match.timeLabel} {match.timezoneLabel}
        </span>
      </div>
    </div>
  );
}

function EventStatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status);

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        statusStyles[normalizedStatus] ||
          "bg-slate-100 text-slate-600 ring-slate-200",
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

function GenerateButton({ onClick, loading = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title="Report Generation"
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-3 text-xs font-semibold text-white transition-all hover:bg-emerald-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-wait disabled:opacity-85"
    >
      {loading ? (
        <>
          <RefreshCw size={13} className="animate-spin" />
          Report
        </>
      ) : (
        <>
          <Sparkles size={13} />
          Report
        </>
      )}
    </button>
  );
}

function ResultCell({ match }) {
  return (
    <span
      className={clsx(
        "text-sm font-medium",
        match.hasResult ? "text-slate-800" : "text-slate-400",
      )}
    >
      {match.result}
    </span>
  );
}

function createTeam(primaryName, fallbackName, side) {
  const name = primaryName || fallbackName || "Unknown Team";

  return {
    name,
    secondaryName:
      primaryName && fallbackName && primaryName !== fallbackName
        ? fallbackName
        : side === "home"
          ? "Home"
          : "Away",
    abbreviation: getInitials(name),
    colorClass: teamAvatarStyles[side],
  };
}

// Data formatting keeps the page UI readable without changing the backend response flow.
function formatMatch(match) {
  const homeName = match.home_club || match.home_team || "Home Team";
  const awayName = match.away_club || match.away_team || "Away Team";
  const resultMeta = getResultMeta(match);
  const displayDateTime = formatDisplayDateTime(
    match.local_start_date,
    match.local_start_time,
    match.timezone,
    match.utc_datetime,
  );

  return {
    id: match.id,
    fixture_id: match.id,
    league: match.league_name,
    competition: match.competition_name,
    status: match.event_status,
    normalizedStatus: normalizeStatus(match.event_status),
    season: match.season_name,
    matchsheetStatus: match.matchsheet_status,
    ground: match.ground_name,
    field: match.field_name,
    timezone: displayDateTime.timezoneLabel,
    date: displayDateTime.dateLabel,
    time: displayDateTime.timeLabel,
    dateLabel: displayDateTime.dateLabel,
    timeLabel: displayDateTime.timeLabel,
    timezoneLabel: displayDateTime.timezoneLabel,
    local_start_date: match.local_start_date,
    local_start_time: match.local_start_time,
    utc_datetime: match.utc_datetime,
    venue: {
      ground: match.ground_name,
      field: match.field_name,
    },
    result: resultMeta.label,
    hasResult: resultMeta.isAvailable,
    sortTimestamp: getSortTimestamp(
      match.local_start_date,
      match.local_start_time,
      match.utc_datetime,
    ),
    homeTeam: createTeam(homeName, match.home_team, "home"),
    awayTeam: createTeam(awayName, match.away_team, "away"),
    searchValues: [
      homeName,
      awayName,
      match.home_team,
      match.away_team,
      match.home_club,
      match.away_club,
      match.league_name,
      match.competition_name,
      match.ground_name,
      match.field_name,
      match.event_status,
    ],
    raw: match.raw || match,
  };
}

// Frontend calls our FastAPI backend only, not Dribl directly.
async function getMatchList({ startDate = "", endDate = "", page = 1 } = {}) {
  const token = localStorage.getItem("reporta_token");
  const params = new URLSearchParams({ page: String(page) });

  if (startDate) {
    params.set("start_date", startDate);
  }

  if (endDate) {
    params.set("end_date", endDate);
  }

  const response = await fetch(`http://127.0.0.1:8000/matches?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let backendMessage = "Failed to fetch matches";

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

  return {
    data: result.data || [],
    meta: result.meta || {},
    links: result.links || {},
  };
}

function Matches() {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortValue, setSortValue] = useState("date-asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [generatingMatchId, setGeneratingMatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedFixtureId, setCopiedFixtureId] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 0,
    total: 0,
  });

  // Data loading keeps the existing backend request flow and now supports dates and pages.
  async function loadMatches({
    showPageLoader = false,
    page = 1,
    startDate = appliedStartDate,
    endDate = appliedEndDate,
  } = {}) {
    if (showPageLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const result = await getMatchList({ startDate, endDate, page });
      const formattedMatches = result.data.map((match) => {
        const attributes = match.attributes || {};

        return formatMatch({
          id: match.id,
          home_team: attributes.home_team,
          away_team: attributes.away_team,
          home_club: attributes.home_club,
          away_club: attributes.away_club,
          league_name: attributes.league_name,
          competition_name: attributes.competition_name,
          local_start_date: attributes.local_start_date,
          local_start_time: attributes.local_start_time,
          utc_datetime: attributes.utc_datetime,
          timezone: attributes.timezone,
          ground_name: attributes.ground_name,
          field_name: attributes.field_name,
          event_status: attributes.event_status,
          matchsheet_status: attributes.matchsheet_status,
          season_name: attributes.season_name,
          home_score: attributes.home_score,
          away_score: attributes.away_score,
          home_goals: attributes.home_goals,
          away_goals: attributes.away_goals,
          home_team_score: attributes.home_team_score,
          away_team_score: attributes.away_team_score,
          score: attributes.score,
          raw: match,
        });
      });

      setMatches(formattedMatches);
      setPagination({
        currentPage: Number(result.meta.current_page || page || 1),
        lastPage: Number(result.meta.last_page || 1),
        perPage: Number(result.meta.per_page || formattedMatches.length || 0),
        total: Number(result.meta.total || formattedMatches.length || 0),
      });

      if (selectedMatch) {
        const updatedMatch = formattedMatches.find(
          (match) => match.id === selectedMatch.id,
        );

        if (updatedMatch) {
          setSelectedMatch(updatedMatch);
        } else {
          setDrawerOpen(false);
        }
      }
    } catch (loadError) {
      console.error("Failed loading matches:", loadError);

      if (loadError instanceof Error) {
        setError(loadError.message || "Could not load matches.");
      } else {
        setError("Could not load matches.");
      }

      setMatches([]);

      setPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 0,
        total: 0,
      });
    } finally {
      if (showPageLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    loadMatches({ showPageLoader: true, page: 1, startDate: "", endDate: "" });
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  function handleRowClick(match) {
    setSelectedMatch(match);
    setDrawerOpen(true);
    setCopiedFixtureId(false);
  }

  // Modal opening keeps MatchReportModal working with the selected fixture data.
  function handleGenerateClick(event, match) {
    event.stopPropagation();

    setGeneratingMatchId(match.id);
    setSelectedMatch(match);

    window.setTimeout(() => {
      setGeneratingMatchId(null);
      setModalOpen(true);
    }, 650);
  }

  function handleApplyFilters() {
    if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
      setError("Start date must be on or before end date.");
      return;
    }

    setAppliedStartDate(startDateFilter);
    setAppliedEndDate(endDateFilter);
    loadMatches({
      page: 1,
      startDate: startDateFilter,
      endDate: endDateFilter,
    });
  }

  function handleClearFilters() {
    setStartDateFilter("");
    setEndDateFilter("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    loadMatches({ page: 1, startDate: "", endDate: "" });
  }

  function handleRefresh() {
    setError("");

    loadMatches({
      page: pagination.currentPage,
      startDate: appliedStartDate,
      endDate: appliedEndDate,
    });
  }

  function handlePageChange(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > pagination.lastPage ||
      nextPage === pagination.currentPage
    ) {
      return;
    }

    loadMatches({
      page: nextPage,
      startDate: appliedStartDate,
      endDate: appliedEndDate,
    });
  }

  async function handleCopyFixtureId(event) {
    event.stopPropagation();

    if (!selectedMatch?.fixture_id || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(String(selectedMatch.fixture_id));
      setCopiedFixtureId(true);
    } catch (copyError) {
      setCopiedFixtureId(false);
    }
  }

  // Search and local dropdown filters run on the currently loaded page data.
  const filteredMatches = matches.filter((match) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !search ||
      match.searchValues.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search),
      );
    const matchesLeague =
      selectedLeague === "all" || match.league === selectedLeague;
    const matchesStatus =
      selectedStatus === "all" || match.normalizedStatus === selectedStatus;

    return matchesSearch && matchesLeague && matchesStatus;
  });

  // Sorting stays local so we do not complicate the backend.
  const sortedMatches = [...filteredMatches].sort((left, right) => {
    if (sortValue === "date-desc") {
      return right.sortTimestamp - left.sortTimestamp;
    }

    if (sortValue === "league-asc") {
      return String(left.league || "").localeCompare(
        String(right.league || ""),
      );
    }

    if (sortValue === "league-desc") {
      return String(right.league || "").localeCompare(
        String(left.league || ""),
      );
    }

    if (sortValue === "home-asc") {
      return left.homeTeam.name.localeCompare(right.homeTeam.name);
    }

    if (sortValue === "away-asc") {
      return left.awayTeam.name.localeCompare(right.awayTeam.name);
    }

    if (sortValue === "status") {
      return left.normalizedStatus.localeCompare(right.normalizedStatus);
    }

    return left.sortTimestamp - right.sortTimestamp;
  });

  const leagueOptions = [
    "All Leagues",
    ...Array.from(
      new Set(matches.map((match) => match.league).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right)),
  ];
  const pageItems = getPageItems(pagination.currentPage, pagination.lastPage);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Matches</h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse and manage football match data
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">
            Loading matches...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 bg-slate-100/70">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Matches</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse and manage football match data
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200/80 bg-slate-50 px-4 py-4 shadow-sm sm:px-5">
        <div className="flex flex-col gap-4">
          {/* Search gets its own row so it feels like the main table control */}
          <div className="relative w-full">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="matches-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search matches..."
              className={clsx("w-full pl-9 pr-4", controlClassName)}
            />
          </div>

          {/* Filters and actions are grouped separately to keep the toolbar clean */}
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-33 flex-col gap-1 text-[11px] font-medium text-slate-500">
                <span>Start date</span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(event) => setStartDateFilter(event.target.value)}
                  className={controlClassName}
                />
              </label>
              <label className="flex min-w-33 flex-col gap-1 text-[11px] font-medium text-slate-500">
                <span>End date</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(event) => setEndDateFilter(event.target.value)}
                  className={controlClassName}
                />
              </label>
              <label className="flex min-w-35 flex-col gap-1 text-[11px] font-medium text-slate-500">
                <span>League</span>
                <select
                  value={selectedLeague}
                  onChange={(event) => setSelectedLeague(event.target.value)}
                  className={controlClassName}
                >
                  {leagueOptions.map((option) => (
                    <option
                      key={option}
                      value={option === "All Leagues" ? "all" : option}
                    >
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-35 flex-col gap-1 text-[11px] font-medium text-slate-500">
                <span>Status</span>
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className={controlClassName}
                >
                  {statusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-37.5 flex-col gap-1 text-[11px] font-medium text-slate-500">
                <span>Sort</span>
                <select
                  value={sortValue}
                  onChange={(event) => setSortValue(event.target.value)}
                  className={controlClassName}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={refreshing}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw
                  size={14}
                  className={clsx(refreshing && "animate-spin")}
                />
                Apply
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className={secondaryButtonClassName}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {!error && sortedMatches.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">
            No matches found.
          </p>
        </div>
      )}

      {!error && sortedMatches.length > 0 && (
        <>
          <div className="hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:block">
            <div className="overflow-x-auto rounded-3xl">
              <table className="min-w-215 w-full table-fixed text-left">
                <colgroup>
                  {columns.map((column) => (
                    <col key={column.label} className={column.width} />
                  ))}
                </colgroup>

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    {columns.map((column) => (
                      <th
                        key={column.label}
                        className="px-3.5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {sortedMatches.map((match, index) => (
                    <tr
                      key={match.id}
                      onClick={() => handleRowClick(match)}
                      className={clsx(
                        "cursor-pointer border-b border-slate-100 transition-all duration-200 hover:bg-emerald-50/30 hover:shadow-[inset_3px_0_0_rgba(16,185,129,0.75)]",
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                      )}
                    >
                      <td className="px-3 py-3 align-middle">
                        <MatchCell match={match} />
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <LeagueBadge league={match.league} />
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <VenueCell ground={match.ground} />
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <DateTimeCell match={match} />
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <EventStatusBadge status={match.status} />
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <GenerateButton
                          loading={generatingMatchId === match.id}
                          onClick={(event) => handleGenerateClick(event, match)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 xl:hidden">
            {sortedMatches.map((match) => (
              <article
                key={match.id}
                onClick={() => handleRowClick(match)}
                className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:bg-slate-50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <MatchCell match={match} />
                  </div>
                  <EventStatusBadge status={match.status} />
                </div>

                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      League
                    </p>
                    <LeagueBadge league={match.league} />
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Venue
                    </p>
                    <VenueCell ground={match.ground} />
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Date &amp; Time
                    </p>
                    <DateTimeCell match={match} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    Fixture ID {match.fixture_id}
                  </span>
                  <GenerateButton
                    loading={generatingMatchId === match.id}
                    onClick={(event) => handleGenerateClick(event, match)}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-500">
              <p>
                Showing {sortedMatches.length} of {pagination.total} matches
              </p>
              <p className="mt-0.5 font-medium text-slate-600">
                Page {pagination.currentPage} of {pagination.lastPage}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1 || refreshing}
                className={secondaryButtonClassName}
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <div className="flex flex-wrap items-center gap-1">
                {pageItems.map((item) =>
                  typeof item === "number" ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePageChange(item)}
                      disabled={item === pagination.currentPage || refreshing}
                      className={clsx(
                        "inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition",
                        item === pagination.currentPage
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      key={item}
                      className="inline-flex h-10 min-w-8 items-center justify-center text-sm text-slate-400"
                    >
                      ...
                    </span>
                  ),
                )}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={
                  pagination.currentPage >= pagination.lastPage || refreshing
                }
                className={secondaryButtonClassName}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      <MatchReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type="match"
        data={selectedMatch}
      />

      <div
        className={clsx(
          "fixed inset-0 z-40 transition",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={clsx(
            "absolute inset-0 bg-slate-950/25 backdrop-blur-[2px] transition-opacity duration-300",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
          role="presentation"
        />

        <aside
          className={clsx(
            "absolute right-0 top-0 h-full w-full border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-120 lg:w-130",
            drawerOpen ? "translate-x-0" : "translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Match details"
        >
          {selectedMatch && (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Match details
                    </p>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <MatchCell match={selectedMatch} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Close details panel"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <EventStatusBadge status={selectedMatch.status} />
                  <button
                    type="button"
                    onClick={handleCopyFixtureId}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Copy size={13} />
                    {copiedFixtureId ? "Copied" : "Copy Fixture ID"}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      League
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedMatch.league || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Competition
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedMatch.competition || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Venue
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedMatch.ground || "Venue TBC"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedMatch.field || "Field TBC"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Match date
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedMatch.dateLabel}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedMatch.timeLabel} {selectedMatch.timezoneLabel}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Season
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedMatch.season || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Matchsheet status
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedMatch.matchsheetStatus || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Fixture ID
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedMatch.fixture_id}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Result
                    </p>
                    <p
                      className={clsx(
                        "mt-2 text-sm font-semibold",
                        selectedMatch.hasResult
                          ? "text-slate-900"
                          : "text-slate-400",
                      )}
                    >
                      {selectedMatch.result}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-500">
                  Use the Report button in the matches table to generate a
                  report.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default Matches;
