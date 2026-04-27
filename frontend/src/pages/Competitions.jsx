import { Users, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { getCompetitions } from '../services/competitionsService.js';

const competitions = getCompetitions();

/** Rounded-square avatar with flag emoji */
function FlagAvatar({ flag }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
      {flag}
    </div>
  );
}

/** Competition name + country */
function CompetitionCell({ name, country, flag }) {
  return (
    <div className="flex items-center gap-3">
      <FlagAvatar flag={flag} />
      <div className="flex flex-col">
        <span className="text-gray-900 text-sm font-semibold">{name}</span>
        <span className="text-gray-400 text-xs">{country}</span>
      </div>
    </div>
  );
}

/** Progress bar with round label */
function ProgressCell({ progress }) {
  const pct = (progress.current / progress.total) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: progress.color }}
        />
      </div>
      <span className="text-gray-400 text-xs whitespace-nowrap">
        R{progress.current}/{progress.total}
      </span>
    </div>
  );
}

/** Teams cell with icon */
function TeamsCell({ count }) {
  return (
    <div className="flex items-center gap-1.5 text-gray-500">
      <Users size={14} className="text-gray-400" />
      <span className="text-sm">{count}</span>
    </div>
  );
}

/** Active status pill */
function ActiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}

/** Green Summary button with sparkle icon */
function SummaryButton() {
  return (
    <button
      className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
    >
      <Sparkles size={13} />
      Summary
    </button>
  );
}

const columns = ['COMPETITION', 'SEASON', 'PROGRESS', 'TEAMS', 'STATUS', 'ACTIONS'];

function Competitions() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Competitions</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Manage leagues and tournament data
        </p>
      </div>

      {/* Count label */}
      <p className="text-gray-500 text-sm">{competitions.length} competitions</p>

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
                    col === 'PROGRESS' && "hidden lg:table-cell"
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {competitions.map((comp) => (
              <tr
                key={comp.id}
                className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
              >
                {/* COMPETITION */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <CompetitionCell name={comp.name} country={comp.country} flag={comp.flag} />
                </td>

                {/* SEASON */}
                <td className="px-4 py-4 text-gray-700 text-sm">
                  {comp.season}
                </td>

                {/* PROGRESS */}
                <td className="hidden lg:table-cell px-4 py-4">
                  <ProgressCell progress={comp.progress} />
                </td>

                {/* TEAMS */}
                <td className="px-4 py-4">
                  <TeamsCell count={comp.teams} />
                </td>

                {/* STATUS */}
                <td className="px-4 py-4">
                  <ActiveBadge />
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-4">
                  <SummaryButton />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-4">
        {competitions.map((comp) => (
          <div key={comp.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
            <CompetitionCell name={comp.name} country={comp.country} flag={comp.flag} />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400 text-xs block mb-1">Season</span>
                <span className="text-gray-700">{comp.season}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">Teams</span>
                <TeamsCell count={comp.teams} />
              </div>
              <div>
                <span className="text-gray-400 text-xs block mb-1">Status</span>
                <ActiveBadge />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-50">
              <SummaryButton />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Competitions;
