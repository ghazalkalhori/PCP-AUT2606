import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Matches', path: '/matches' },
  { name: 'Competitions', path: '/competitions' },
  { name: 'Jobs', path: '/jobs' },
];

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <aside className={clsx(
      "fixed inset-y-0 left-0 z-30 w-[210px] bg-[#0f1117] flex flex-col justify-between py-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div>
        <div className="flex items-center gap-3 px-6 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Reporta AI</h1>
            <p className="text-gray-400 text-xs">Admin Console</p>
          </div>
        </div>

        <nav className="flex flex-col px-3 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-white text-black font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                )
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-6 border-t border-white/10 pt-4 mt-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold text-sm shrink-0">
          C
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-tight truncate">Chris</p>
          <p className="text-gray-400 text-xs truncate">Administrator</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
