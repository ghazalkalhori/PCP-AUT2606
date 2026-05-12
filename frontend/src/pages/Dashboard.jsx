import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageContent from '../components/PageContent.jsx';
import PageHeader from '../components/PageHeader.jsx';

const recentJobs = [
  { id: 'JOB-001', match: 'Man City vs Arsenal', type: 'Post Match', status: 'Processing', date: '7 May 2026' },
  { id: 'JOB-002', match: 'Barcelona vs Real Madrid', type: 'Pre Match', status: 'Submitted', date: '6 May 2026' },
  { id: 'JOB-003', match: 'Bayern Munich vs Dortmund', type: 'Post Match', status: 'Completed', date: '6 May 2026' },
  { id: 'JOB-004', match: 'Premier League — Round 28', type: 'League Summary', status: 'Completed', date: '5 May 2026' },
  { id: 'JOB-005', match: 'PSG vs Marseille', type: 'Post Match', status: 'Failed', date: '5 May 2026' },
];

const statusConfig = {
  Processing: { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  Submitted:  { bg: '#EDE9FE', color: '#5B21B6', dot: '#8B5CF6' },
  Completed:  { bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  Failed:     { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
};

const typeConfig = {
  'Post Match':     { bg: '#EDE9FE', color: '#5B21B6' },
  'Pre Match':      { bg: '#E0F2FE', color: '#075985' },
  'League Summary': { bg: '#FEF3C7', color: '#92400E' },
};

function StatusBadge({ status }) {
  const s = statusConfig[status] || { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      padding: '4px 11px', borderRadius: 99,
      fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = typeConfig[type] || { bg: '#F3F4F6', color: '#374151' };
  return (
    <span style={{
      background: t.bg, color: t.color,
      padding: '2px 8px', borderRadius: 6,
      fontSize: 11, fontWeight: 600,
    }}>
      {type}
    </span>
  );
}

const stats = [
  { label: 'Matches', value: 8, to: '/matches', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { label: 'Jobs', value: 8, to: '/jobs', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
  { label: 'Competitions', value: 6, to: '/competitions', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> },
];

export default function Dashboard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="AI-powered football match report generation"
      />
      <PageContent>
        <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s, i) => (
          <Link
            key={s.label}
            to={s.to}
            aria-label={`Go to ${s.label}`}
            className="block rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm outline-none transition-[box-shadow,border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-emerald-200/90 hover:bg-emerald-50/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 sm:px-6"
          >
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.4s ease ${i * 0.07}s, transform 0.4s ease ${i * 0.07}s`,
              }}
            >
              <div style={{ color: '#9CA3AF', marginBottom: 12 }}>{s.icon}</div>
              <p style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Jobs — full width after removing Recent Content */}
      <div className="min-w-0">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Recent Jobs</p>
            <Link
              to="/jobs"
              aria-label="View all jobs"
              className="shrink-0 text-[13px] font-medium text-emerald-600 no-underline transition-colors hover:text-emerald-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
            >
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 sm:gap-2.5">
            {recentJobs.map(job => (
              <div key={job.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[13px] font-semibold text-gray-900" style={{ margin: 0 }}>{job.match}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9CA3AF', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                    <TypeBadge type={job.type} /> · {job.id} · {job.date}
                  </p>
                </div>
                <div className="shrink-0 self-start sm:self-center">
                  <StatusBadge status={job.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>
      </PageContent>
    </>
  );
}
