import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronDown, Clock, Search, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import PageContent from '../components/PageContent.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { getJobCounts, getJobsByStatus } from '../services/jobsService.js';

const typeBadgeStyles = {
  'Post-Match': 'bg-purple-100 text-purple-700',
  'Pre-Match': 'bg-blue-100 text-blue-700',
  'League Summary': 'bg-yellow-100 text-yellow-700',
};

function JobStatusIcon({ icon }) {
  if (icon === 'processing') return <Clock size={16} className="text-blue-400" />;
  if (icon === 'approved') return <CheckCircle size={16} className="text-gray-800" />;
  if (icon === 'completed') return <CheckCircle size={16} className="text-green-500" />;
  if (icon === 'failed') return <XCircle size={16} className="text-red-500" />;
  return <Clock size={16} className="text-gray-400" />;
}

function Jobs() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    approved: 0,
    failed: 0,
    processing: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tab counts once on mount.
  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      try {
        const data = await getJobCounts();
        if (!cancelled) {
          setCounts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      }
    }

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Reload the job list whenever the status filter changes.
  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setLoading(true);
      setError(null);
      try {
        const data = await getJobsByStatus(activeFilter);
        if (!cancelled) {
          setJobs(data);
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

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, [activeFilter]);

  // Search is applied client-side over whatever the service returned.
  // Later, swap this for `apiRequest('/jobs?status=...&q=...')` inside the service.
  const visibleJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return jobs;

    return jobs.filter((job) => {
      return (
        job.title.toLowerCase().includes(q) ||
        job.id.toLowerCase().includes(q) ||
        job.type.toLowerCase().includes(q)
      );
    });
  }, [jobs, searchTerm]);

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'failed', label: 'Failed', count: counts.failed },
    { key: 'processing', label: 'Processing', count: counts.processing },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Track AI generation jobs and their statuses"
      />
      <PageContent>
        <div className="space-y-6">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          id="jobs-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search jobs by ID, Match or Type..."
          className="w-full bg-white rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
        />
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load jobs. Please try again.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-start sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      <JobStatusIcon icon={job.icon} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">
                          {job.title}
                        </span>
                        <span
                          className={clsx(
                            'rounded-full px-3 py-0.5 text-xs font-medium',
                            typeBadgeStyles[job.type]
                          )}
                        >
                          {job.type}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        {job.id} · {job.date}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between sm:justify-start">
                  <StatusBadge status={job.status} />
                  <ChevronDown size={16} className="text-gray-400 ml-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      </PageContent>
    </>
  );
}

export default Jobs;
