import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import Login from '../pages/Login.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Matches from '../pages/Matches.jsx';
import Leagues from '../pages/Leagues.jsx';
import Reports from '../pages/Reports.jsx';
import GenerationJobs from '../pages/GenerationJobs.jsx';
import Competitions from '../pages/Competitions.jsx';
import Jobs from '../pages/Jobs.jsx';
import Users from '../pages/Users.jsx';
import Settings from '../pages/Settings.jsx';
import NotFound from '../pages/NotFound.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/generation-jobs" element={<GenerationJobs />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
