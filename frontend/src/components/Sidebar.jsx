import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { clsx } from "clsx";
import { clearAuthSession, getStoredUserName } from "../utils/auth.js";

const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Matches", path: "/matches" },
  { name: "Leagues", path: "/leagues" },
  { name: "Jobs", path: "/jobs" },
  { name: "Generate Report", path: "/generate" },
];

const Sidebar = ({ isOpen = true, setIsOpen }) => {
  const navigate = useNavigate();
  const displayName = getStoredUserName();

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  function handleNavClick() {
    setIsOpen?.(false);
  }

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-30 flex w-52.5 flex-col justify-between bg-slate-950 py-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div>
        <div className="flex items-center gap-3 px-6 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">
              Reporta AI
            </h1>
            <p className="text-gray-400 text-xs">Admin Console</p>
          </div>
        </div>

        <nav className="flex flex-col px-3 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                clsx(
                  "rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-white/95 text-slate-950 font-medium shadow-sm"
                    : "text-slate-400 hover:bg-white/8 hover:text-white",
                )
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-6 pt-4">
        <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold text-sm shrink-0">
          C
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-tight truncate">
            {displayName}
          </p>
          <p className="text-gray-400 text-xs truncate">Administrator</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
