import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/matches', label: 'Matches' },
  { to: '/leagues', label: 'Leagues' },
  { to: '/reports', label: 'Reports' },
  { to: '/generation-jobs', label: 'Jobs' },
  { to: '/users', label: 'Users' },
  { to: '/settings', label: 'Settings' },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">Reporta AI</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
