import { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import PageContent from '../components/PageContent.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import GenerateReportModal from '../components/modals/GenerateReportModal.jsx';
import { getMatches } from '../services/matchesService.js';

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
    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
      <div className="flex min-w-0 items-center gap-2 sm:w-[120px]">
        <TeamBadge team={home} />
        <span className="truncate text-sm font-medium text-gray-900">{home.name}</span>
      </div>
      <span className="w-4 shrink-0 text-center text-[11px] italic text-gray-400">vs</span>
      <div className="flex min-w-0 items-center gap-2 sm:w-[120px]">
        <TeamBadge team={away} />
        <span className="truncate text-sm font-medium text-gray-900">{away.name}</span>
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
function GenerateButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
    >
      <Sparkles size={13} />
      Generate
    </button>
  );
}

const columns = ['MATCH', 'COMPETITION', 'DATE', 'STATUS', 'SCORE', 'ACTIONS'];

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMatches();
        if (!cancelled) {
          setMatches(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMatches();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerateClick = (match) => {
    setSelectedMatch(match);
    setModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Matches"
        description="Browse and manage football match data"
      />
      <PageContent>
        <div className="space-y-6">
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

      {loading && (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load matches. Please try again.
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Table */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
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
                      {match.status !== 'live' && (
                        <GenerateButton onClick={() => handleGenerateClick(match)} />
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="min-w-0">
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
                    <GenerateButton onClick={() => handleGenerateClick(match)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <GenerateReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type="match"
        data={selectedMatch}
      />
        </div>
      </PageContent>
    </>
  );
}

export default Matches;
