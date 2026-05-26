import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LogOut,
  Trophy,
} from "lucide-react";
import { clsx } from "clsx";
import { clearAuthSession, getStoredUserName } from "../utils/auth.js";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { name: "Matches", path: "/matches", icon: CalendarDays },
  { name: "Leagues", path: "/leagues", icon: Trophy },
  { name: "Jobs", path: "/jobs", icon: ClipboardList },
];

const Sidebar = ({ isOpen = true, setIsOpen }) => {
  const navigate = useNavigate();
  const displayName = getStoredUserName();
  const userInitial = displayName?.trim()?.charAt(0)?.toUpperCase() || "A";

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
        "fixed inset-y-0 left-0 z-30 flex w-56 flex-col justify-between bg-slate-950 py-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div>
        <div className="mb-8 flex items-center gap-3 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-950/30">
            R
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold leading-tight text-white">
              Reporta AI
            </h1>
            <p className="truncate text-xs text-slate-400">Admin Console</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-400 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <Icon size={17} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/10 px-4 pt-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight text-white">
              {displayName || "Administrator"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
