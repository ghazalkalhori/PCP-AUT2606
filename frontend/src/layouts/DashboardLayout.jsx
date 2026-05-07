import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

function DashboardLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;