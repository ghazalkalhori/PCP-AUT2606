import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Calendar, Briefcase, Trophy, FileText, ArrowRight } from 'lucide-react';
import Matches from '../pages/Matches.jsx';
import Competitions from '../pages/Competitions.jsx';
import { clsx } from 'clsx';

const StatCard = ({ icon: Icon, value, label }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
    <Icon className="text-gray-400 w-5 h-5" />
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
    </div>
  </div>
);

const JobStatus = ({ status }) => {
  const styles = {
    'Processing': 'bg-amber-100 text-amber-700',
    'Submitted': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-green-100 text-green-700',
    'Failed': 'bg-red-100 text-red-700',
  };

  const dots = {
    'Processing': 'bg-amber-500',
    'Submitted': 'bg-blue-500',
    'Completed': 'bg-green-500',
    'Failed': 'bg-red-500',
  };

  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5', styles[status])}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', dots[status])}></span>
      {status}
    </span>
  );
};

const ContentStatus = ({ status }) => {
  const styles = {
    'Approved': 'bg-green-100 text-green-700',
    'Published': 'bg-blue-100 text-blue-700',
    'Draft': 'bg-gray-100 text-gray-700',
  };

  const dots = {
    'Approved': 'bg-green-500',
    'Published': 'bg-blue-500',
    'Draft': 'bg-gray-500',
  };

  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5', styles[status])}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', dots[status])}></span>
      {status}
    </span>
  );
};

const Dashboard = () => {
  const jobs = [
    { title: 'Man City vs Arsenal', type: 'Post Match', id: 'JOB-001', status: 'Processing' },
    { title: 'Barcelona vs Real Madrid', type: 'Pre Match', id: 'JOB-002', status: 'Submitted' },
    { title: 'Bayern Munich vs Dortmund', type: 'Post Match', id: 'JOB-003', status: 'Completed' },
    { title: 'Premier League - Round 28', type: 'League Summary', id: 'JOB-004', status: 'Completed' },
    { title: 'PSG vs Marseille', type: 'Post Match', id: 'JOB-005', status: 'Failed' },
  ];

  const contents = [
    { title: 'Der Klassiker Dominance: Bayern Munich Crush B...', date: '6 Apr', words: '412 words', status: 'Approved' },
    { title: 'Premier League Round 28: Title Race Tightens as...', date: '6 Apr', words: '358 words', status: 'Published' },
    { title: 'Blues and Spurs Cancel Each Other Out in Uninspiring...', date: '5 Apr', words: '296 words', status: 'Draft' },
    { title: 'La Liga Round 27 Recap: Masterful Real Madrid S...', date: '7 Apr', words: '316 words', status: 'Approved' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Overview of AI content generation activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Calendar} value="8" label="Matches" />
        <StatCard icon={Briefcase} value="8" label="Jobs" />
        <StatCard icon={Trophy} value="6" label="Competitions" />
        <StatCard icon={FileText} value="4" label="Content" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900">Recent Jobs</h2>
            <Link to="/jobs" className="text-xs text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {jobs.map((job, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{job.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{job.type} · {job.id}</div>
                </div>
                <JobStatus status={job.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900">Recent Content</h2>
            <Link to="/content" className="text-xs text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {contents.map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date} · {item.words}
                  </div>
                </div>
                <ContentStatus status={item.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Placeholder = ({ title }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-gray-600">Placeholder content for {title}</p>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="matches" element={<Matches />} />
        <Route path="competitions" element={<Competitions />} />
        <Route path="jobs" element={<Placeholder title="Jobs" />} />
        <Route path="generate" element={<Placeholder title="Generate" />} />
        <Route path="content" element={<Placeholder title="Content" />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
