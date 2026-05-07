import { useState } from 'react';
import { ChevronRight, Search, Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { clsx } from 'clsx';

const DUMMY_JOBS = [
  { id: 'JOB-001', title: 'Smithfield FC vs Rockdale FC', date: '9 Apr 2025', type: 'post',   typeLabel: 'Post-Match',     status: 'processing' },
  { id: 'JOB-002', title: 'Panthers FC vs Eagles FC',     date: '9 Apr 2025', type: 'pre',    typeLabel: 'Pre-Match',      status: 'approved'   },
  { id: 'JOB-003', title: 'Marconi FC vs Sydney FC',      date: '6 Apr 2025', type: 'post',   typeLabel: 'Post-Match',     status: 'completed'  },
  { id: 'JOB-004', title: 'NPL NSW — Round 5',            date: '6 Apr 2025', type: 'league', typeLabel: 'League Summary', status: 'completed'  },
  { id: 'JOB-005', title: 'Blacktown City vs Penrith FC', date: '7 Apr 2025', type: 'post',   typeLabel: 'Post-Match',     status: 'failed'     },
  { id: 'JOB-006', title: 'Parramatta FC vs Auburn FC',   date: '8 Apr 2025', type: 'pre',    typeLabel: 'Pre-Match',      status: 'approved'   },
  { id: 'JOB-007', title: 'Western Sydney Wanderers vs Sydney FC', date: '5 Apr 2025', type: 'post', typeLabel: 'Post-Match', status: 'completed' },
  { id: 'JOB-008', title: 'NPL NSW — Round 6 Summary',   date: '7 Apr 2025', type: 'league', typeLabel: 'League Summary', status: 'processing' },
];

const STATUS_CONFIG = {
  processing: { label: 'Processing', badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-400' },
  approved:   { label: 'Approved',   badge: 'bg-[#052e16] text-green-400',  dot: 'bg-green-400'  },
  completed:  { label: 'Completed',  badge: 'bg-green-50 text-green-700',   dot: 'bg-green-500'  },
  failed:     { label: 'Failed',     badge: 'bg-red-50 text-red-600',       dot: 'bg-red-500'    },
};

const TYPE_CONFIG = {
  post:   { className: 'bg-blue-50 text-blue-600'     },
  pre:    { className: 'bg-violet-50 text-violet-600' },
  league: { className: 'bg-orange-50 text-orange-600' },
};

const FILTERS = [
  { key: 'all',        label: 'All'        },
  { key: 'approved',   label: 'Approved'   },
  { key: 'failed',     label: 'Failed'     },
  { key: 'processing', label: 'Processing' },
  { key: 'completed',  label: 'Completed'  },
];

function StatusIcon({ status }) {
  if (status === 'processing') return <Loader2 size={20} className="text-orange-400 animate-spin" />;
  if (status === 'approved')   return <CheckCircle2 size={20} className="text-green-500" />;
  if (status === 'completed')  return <CheckCircle2 size={20} className="text-green-400" />;
  if (status === 'failed')     return <XCircle size={20} className="text-red-500" />;
  return <Circle size={20} className="text-gray-300" />;
}

function TypeBadge({ type, typeLabel }) {
  const config = TYPE_CONFIG[type] || { className: 'bg-gray-100 text-gray-500' };
  return (
    <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-md', config.className)}>
      {typeLabel}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, badge: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full', config.badge)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

function JobRow({ job }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors cursor-pointer">
      <div className="shrink-0"><StatusIcon status={job.status} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{job.title}</span>
          <TypeBadge type={job.type} typeLabel={job.typeLabel} />
        </div>
        <div className="text-xs text-gray-400 mt-0.5 font-mono">{job.id} · {job.date}</div>
      </div>
      <StatusBadge status={job.status} />
      <ChevronRight size={15} className="text-gray-300 shrink-0" />
    </div>
  );
}

function GenerationJobs() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const counts = FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? DUMMY_JOBS.length : DUMMY_JOBS.filter(j => j.status === f.key).length;
    return acc;
  }, {});

  const filtered = DUMMY_JOBS.filter(job => {
    const matchesFilter = activeFilter === 'all' || job.status === activeFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || job.title.toLowerCase().includes(q) || job.id.toLowerCase().includes(q) || job.typeLabel.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Jobs</h1>
        <p className="text-gray-400 text-sm mt-0.5">Track AI generation jobs and their statuses</p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs by ID, Match or Type..."
          className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-1.5 flex gap-1 w-fit">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={clsx(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeFilter === f.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            {f.label}
            <span className={clsx(
              'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
              activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            )}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No jobs found</div>
        ) : (
          filtered.map(job => <JobRow key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}

export default GenerationJobs;