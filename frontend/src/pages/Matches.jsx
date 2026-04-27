import { Search, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { getMatches } from '../services/matchesService.js';

const matches = getMatches();

/** Rounded-square team avatar with abbreviation */
function TeamBadge({ team }) {
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm"
      style={{ backgroundColor: team.color }}
    >
      {team.abbreviation}
    </div>
  );
}

/** Home vs Away cell with avatars + names */
function MatchCell({ home, away }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-[120px]">
        <TeamBadge team={home} />
        <span className="text-gray-900 text-sm font-medium">{home.name}</span>
      </div>
      <span className="text-gray-400 text-[11px] italic w-4 text-center">vs</span>
      <div className="flex items-center gap-2 w-[120px]">
        <TeamBadge team={away} />
        <span className="text-gray-900 text-sm font-medium">{away.name}</span>
      </div>
    </div>
  );
}

/** Competition cell with coloured dot */
function CompetitionCell({ name }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      <span className="text-gray-600 text-sm">{name}</span>
    </div>
  );
}

/** Date cell: date top, time bottom */
function DateCell({ date, time }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-800 text-sm">{date}</span>
      <span className="text-gray-400 text-xs">{time}</span>
    </div>
  );
}

/** Score cell */
function ScoreCell({ score }) {
  if (!score) {
    return <span className="text-gray-400 text-sm">—</span>;
  }
  return (
    <span className="text-gray-900 text-sm font-bold">
      {score.home} – {score.away}
    </span>
  );
}

/** Green generate button with sparkle icon */
function GenerateButton() {
  return (
    <button
      className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
    >
      <Sparkles size={13} />
      Generate
    </button>
  );
}

const columns = ['MATCH', 'COMPETITION', 'DATE', 'STATUS', 'SCORE', 'ACTIONS'];

function Matches() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Matches</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Browse and manage football match data
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          id="matches-search"
          type="text"
          placeholder="Search Matches..."
          className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col) => (
                <th
                  key={col}
                  className={clsx(
                    "px-4 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider",
                    col === 'SCORE' && "hidden lg:table-cell"
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {matches.map((match) => (
              <tr
                key={match.id}
                className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
              >
                {/* MATCH */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <MatchCell home={match.homeTeam} away={match.awayTeam} />
                </td>

                {/* COMPETITION */}
                <td className="px-4 py-4">
                  <CompetitionCell name={match.competition} />
                </td>

                {/* DATE */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <DateCell date={match.date} time={match.time} />
                </td>

                {/* STATUS */}
                <td className="px-4 py-4">
                  <StatusBadge status={match.status} />
                </td>

                {/* SCORE */}
                <td className="hidden lg:table-cell px-4 py-4">
                  <ScoreCell score={match.score} />
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-4">
                  {match.status !== 'live' && <GenerateButton />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <MatchCell home={match.homeTeam} away={match.awayTeam} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400 text-xs block mb-1">Competition</span>
                <CompetitionCell name={match.competition} />
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">Date</span>
                <DateCell date={match.date} time={match.time} />
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">Status</span>
                <StatusBadge status={match.status} />
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">Score</span>
                <ScoreCell score={match.score} />
              </div>
            </div>
            {match.status !== 'live' && (
              <div className="pt-2 border-t border-gray-50">
                <GenerateButton />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Matches;
