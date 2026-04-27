/**
 * Mock competition data for the Competitions page.
 * Each object mirrors the shape expected from the Dribl API.
 */
export const mockCompetitions = [
  {
    id: "comp-001",
    name: "Premier League",
    country: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    season: "2024/25",
    progress: {
      current: 28,
      total: 38,
      color: "#7c3aed",
    },
    teams: 20,
    status: "active",
  },
  {
    id: "comp-002",
    name: "La Liga",
    country: "Spain",
    flag: "🇪🇸",
    season: "2024/25",
    progress: {
      current: 27,
      total: 38,
      color: "#f59e0b",
    },
    teams: 20,
    status: "active",
  },
  {
    id: "comp-003",
    name: "UEFA Champions League",
    country: "Europe",
    flag: "🌍",
    season: "2024/25",
    progress: {
      current: 5,
      total: 8,
      color: "#2563eb",
    },
    teams: 36,
    status: "active",
  },
  {
    id: "comp-004",
    name: "Bundesliga",
    country: "Germany",
    flag: "🇩🇪",
    season: "2024/25",
    progress: {
      current: 26,
      total: 34,
      color: "#dc2626",
    },
    teams: 18,
    status: "active",
  },
  {
    id: "comp-005",
    name: "Ligue 1",
    country: "France",
    flag: "🇫🇷",
    season: "2024/25",
    progress: {
      current: 25,
      total: 34,
      color: "#1d4ed8",
    },
    teams: 18,
    status: "active",
  },
  {
    id: "comp-006",
    name: "Serie A",
    country: "Italy",
    flag: "🇮🇹",
    season: "2024/25",
    progress: {
      current: 27,
      total: 38,
      color: "#1d4ed8",
    },
    teams: 20,
    status: "active",
  },
];
