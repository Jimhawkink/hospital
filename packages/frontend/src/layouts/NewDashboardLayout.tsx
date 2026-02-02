import React, { useMemo, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiSearch,
  FiLogOut,
  FiUsers,
  FiGrid,
  FiClipboard,
  FiCalendar,
  FiMessageSquare,
  FiCreditCard,
  FiBarChart2,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

function getDisplayName() {
  try {
    const raw = localStorage.getItem("hms_user");
    const u = raw ? JSON.parse(raw) : null;
    const name =
      u?.name ||
      [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
      "Dr Davis Luke";
    return name;
  } catch {
    return "Dr Davis Luke";
  }
}

function getInitialsFromName(name: string) {
  const ignore = ["dr", "mr", "mrs", "ms", "prof", "doctor"];
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !ignore.includes(p.toLowerCase()));
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase() || "U";
}

function HospitalMark({ expanded }: { expanded: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 h-[65px] border-b border-slate-200 flex-shrink-0">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md text-white">
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M11 3h2v8h8v2h-8v8h-2v-8H3v-2h8V3z" />
        </svg>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? "w-auto" : "w-0"}`}>
        <div className="font-bold text-slate-900 text-lg whitespace-nowrap">Kings Hospital HMS</div>
        <div className="text-xs text-slate-500 whitespace-nowrap">Davis Luke Medical Centre</div>
      </div>
    </div>
  );
}

function Sidebar({ expanded }: { expanded: boolean }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 my-1 rounded-xl transition-all duration-200 group 
      ${isActive
        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform translate-x-1"
        : "text-slate-700 hover:bg-slate-100 hover:text-blue-600"}
      ${expanded ? "justify-start" : "justify-center"}
    `;

  const iconClass = `h-5 w-5 flex-shrink-0 ${expanded ? "mr-3" : ""}`;

  return (
    <aside
      className={`bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-xl 
        ${expanded ? "w-64" : "w-20"} flex flex-col`}
    >
      <HospitalMark expanded={expanded} />
      <nav className="p-4 flex-1 overflow-y-auto no-scrollbar">
        <NavLink to="/dashboard" className={linkClass} end>
          <FiGrid className={iconClass} />
          <span className={`whitespace-nowrap ${!expanded && "hidden"}`}>Dashboard</span>
        </NavLink>

        <NavLink to="/dashboard/patients" className={linkClass}>
          <FiUsers className={iconClass} />
          <span className={`whitespace-nowrap ${!expanded && "hidden"}`}>Patients</span>
        </NavLink>

        <NavLink to="/dashboard/encounters" className={linkClass}>
          <FiClipboard className={iconClass} />
          <span className={`whitespace-nowrap ${!expanded && "hidden"}`}>Encounter List</span>
        </NavLink>

        <NavLink to="/dashboard/schedule" className={linkClass}>
          <FiCalendar className={iconClass} />
          <span className={`whitespace-nowrap ${!expanded && "hidden"}`}>Schedule</span>
        </NavLink>

        <NavLink to="/dashboard/messaging" className={linkClass}>
          <FiMessageSquare className={iconClass} />
          <span className={`whitespace-nowrap ${!expanded && "hidden"}`}>Messaging</span>
        </NavLink>

        <NavLink to="/dashboard/billing" className={linkClass}>
          <FiCreditCard className={iconClass} />
          <span className={`whitespace-nowrap ${!expanded && "hidden"}`}>Billing</span>
        </NavLink>

        <NavLink to="/dashboard/reports" className={linkClass}>
          <FiBarChart2 className={iconClass} />
          <span className={`whitespace-nowrap ${!expanded && "hidden"}`}>Reports</span>
        </NavLink>

        <NavLink to="/dashboard/admin" className={linkClass}>
          <FiSettings className={iconClass} />
          <span className={`whitespace-nowrap ${!expanded && "hidden"}`}>Admin Panel</span>
        </NavLink>
      </nav>
    </aside>
  );
}

function Header({
  onToggleSidebar,
  onSignOut,
  expanded,
}: {
  onToggleSidebar: () => void;
  onSignOut: () => void;
  expanded: boolean;
}) {
  const displayName = useMemo(() => getDisplayName(), []);
  const initials = useMemo(
    () => getInitialsFromName(displayName),
    [displayName]
  );

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 h-[65px] flex justify-between items-center flex-shrink-0 shadow-sm">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors duration-200 mr-4 text-slate-600"
          title="Toggle sidebar"
        >
          {expanded ? (
            <FiChevronLeft className="h-6 w-6" />
          ) : (
            <FiMenu className="h-6 w-6" />
          )}
        </button>
        <div className="relative">
          <FiSearch className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search for patients by name, number..."
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-full w-80 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm text-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
            {initials}
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">
              {displayName}
            </div>
            <div className="text-xs text-slate-500">Administrator</div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          title="Sign out"
          className="p-2 rounded-full hover:bg-red-100 transition-colors duration-200 text-red-500"
        >
          <FiLogOut className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  const logout = () => {
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar expanded={expanded} />
      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setExpanded(!expanded)}
          onSignOut={logout}
          expanded={expanded}
        />
        <main className="p-6 flex-1 overflow-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

