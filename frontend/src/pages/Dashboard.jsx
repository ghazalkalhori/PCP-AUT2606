import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const recentJobs = [
  { id: 'JOB-001', match: 'Man City vs Arsenal', type: 'Post Match', status: 'Processing', date: '7 May 2026' },
  { id: 'JOB-002', match: 'Barcelona vs Real Madrid', type: 'Pre Match', status: 'Submitted', date: '6 May 2026' },
  { id: 'JOB-003', match: 'Bayern Munich vs Dortmund', type: 'Post Match', status: 'Completed', date: '6 May 2026' },
  { id: 'JOB-004', match: 'Premier League — Round 28', type: 'League Summary', status: 'Completed', date: '5 May 2026' },
  { id: 'JOB-005', match: 'PSG vs Marseille', type: 'Post Match', status: 'Failed', date: '5 May 2026' },
];

const recentContent = [
  { title: 'Der Klassiker Dominance: Bayern Munich Crush Dortmund', date: '6 Apr', words: '412 words', status: 'Approved' },
  { title: 'Premier League Round 28: Title Race Tightens', date: '6 Apr', words: '358 words', status: 'Published' },
  { title: 'Blues and Spurs Cancel Each Other Out', date: '5 Apr', words: '296 words', status: 'Draft' },
  { title: 'La Liga Round 27 Recap: Masterful Real Madrid', date: '7 Apr', words: '316 words', status: 'Approved' },
];

const statusConfig = {
  Processing: { bg: 'rgba(251,146,60,0.12)', color: '#EA580C', dot: '#FB923C', border: 'rgba(251,146,60,0.25)' },
  Submitted:  { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED', dot: '#8B5CF6', border: 'rgba(139,92,246,0.25)' },
  Completed:  { bg: 'rgba(16,185,129,0.12)', color: '#059669', dot: '#10B981', border: 'rgba(16,185,129,0.25)' },
  Failed:     { bg: 'rgba(239,68,68,0.12)', color: '#DC2626', dot: '#EF4444', border: 'rgba(239,68,68,0.25)' },
  Approved:   { bg: 'rgba(16,185,129,0.12)', color: '#059669', dot: '#10B981', border: 'rgba(16,185,129,0.25)' },
  Published:  { bg: 'rgba(59,130,246,0.12)', color: '#2563EB', dot: '#3B82F6', border: 'rgba(59,130,246,0.25)' },
  Draft:      { bg: 'rgba(100,116,139,0.10)', color: '#475569', dot: '#94A3B8', border: 'rgba(100,116,139,0.2)' },
};

const typeConfig = {
  'Post Match':     { bg: 'rgba(139,92,246,0.08)', color: '#7C3AED' },
  'Pre Match':      { bg: 'rgba(59,130,246,0.08)', color: '#2563EB' },
  'League Summary': { bg: 'rgba(245,158,11,0.08)', color: '#D97706' },
};

function StatusBadge({ status }) {
  const s = statusConfig[status] || statusConfig.Draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      padding: '4px 11px', borderRadius: 99,
      fontSize: 11.5, fontWeight: 600,
      border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = typeConfig[type] || { bg: 'rgba(100,116,139,0.08)', color: '#475569' };
  return (
    <span style={{
      background: t.bg, color: t.color,
      padding: '2px 8px', borderRadius: 6,
      fontSize: 10.5, fontWeight: 700,
      textTransform: 'uppercase',
    }}>
      {type}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const stats = [
    { label: 'Matches', value: '8', sub: '+2 this week', accent: '#6366F1',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg> },
    { label: 'Jobs', value: '8', sub: '3 in progress', accent: '#EC4899',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
    { label: 'Competitions', value: '6', sub: 'Active leagues', accent: '#F59E0B',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> },
    { label: 'Content', value: '4', sub: '2 pending review', accent: '#10B981',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F7FF 0%, #FFF5F9 50%, #F0FDF8 100%)',
      padding: '36px 40px',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Lora:ital@0;1&display=swap');
        .stat-card:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.10) !important; }
        .job-row:hover { background: white !important; box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important; }
        .quick-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
        .new-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(26,35,54,0.35) !important; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 36,
        opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366F1, #EC4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F0A2A', letterSpacing: '-0.5px' }}>
              Dashboard
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#94A3B8', fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
            Good morning — here's your content overview
          </p>
        </div>
        <button className="new-btn" onClick={() => navigate('/generate')} style={{
          background: 'linear-gradient(135deg, #1A2336 0%, #2D3A52 100%)',
          color: 'white', border: 'none', borderRadius: 12,
          padding: '11px 22px', fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(26,35,54,0.25)',
          fontFamily: "'Outfit', sans-serif",
        }}>
          + New Report Job
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card" style={{
            background: 'white', borderRadius: 18, padding: '22px 24px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
            position: 'relative', overflow: 'hidden', cursor: 'default',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${s.accent}10` }} />
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.accent}15`, color: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              {s.icon}
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
            <p style={{ margin: '0 0 8px', fontSize: 34, fontWeight: 800, color: '#0F0A2A', lineHeight: 1, letterSpacing: '-1px' }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 12, color: s.accent, fontWeight: 500 }}>↑ {s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.06)', padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.35s' }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Generate</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Pre-Match Summary', color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
            { label: 'Post-Match Summary', color: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
            { label: 'League Summary', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
          ].map((btn) => (
            <button key={btn.label} className="quick-btn" onClick={() => navigate('/generate')} style={{
              background: btn.bg, color: btn.color,
              border: `1.5px solid ${btn.color}25`,
              borderRadius: 10, padding: '9px 18px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}>
              + {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.06)', padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.42s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F0A2A' }}>Recent Jobs</p>
            <button onClick={() => navigate('/jobs')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentJobs.map(job => (
              <div key={job.id} className="job-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 12, background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E1B3A' }}>{job.match}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <TypeBadge type={job.type} />
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{job.id} · {job.date}</span>
                  </div>
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.06)', padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.49s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F0A2A' }}>Recent Content</p>
            <button onClick={() => navigate('/content')} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentContent.map((c, i) => (
              <div key={i} className="job-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 12, background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E1B3A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>{c.date} · {c.words}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}