import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { 
  FiSettings, 
  FiPieChart, 
  FiBarChart,   // ✅ Changed here
  FiDollarSign,
  FiTrendingUp,
  FiDatabase,
  FiUsers,
  FiFolder,
  FiChevronDown,
  FiArrowLeft
} from "react-icons/fi";


export default function AdminPanelLayout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 my-1 rounded-lg transition-colors ${
      isActive
        ? "bg-blue-100 text-blue-700 border-r-4 border-blue-700"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Admin Panel Sidebar */}
      <aside className="w-64 bg-white border-r">
        {/* Back to Dashboard */}
        <div className="p-4 border-b">
          <NavLink 
            to="/dashboard" 
            className="flex items-center text-slate-600 hover:text-slate-800"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to EMR/HMIS
          </NavLink>
        </div>

        {/* Admin Navigation */}
        <nav className="p-4">
          <NavLink to="/dashboard/organisation-settings" className={linkClass}>
            <FiSettings className="h-5 w-5 flex-shrink-0" />
            <span className="ml-3">Organisation Settings</span>
          </NavLink>

          <NavLink to="/dashboard/facility-dashboard" className={linkClass}>
            <FiPieChart className="h-5 w-5 flex-shrink-0" />
            <span className="ml-3">Facility dashboard</span>
          </NavLink>

          <div className="mt-4">
            <div className="flex items-center px-4 py-2 text-slate-500 text-sm font-medium">
              <span>Summary dashboard</span>
            </div>
            <NavLink to="/dashboard/revenue-tracking" className={linkClass}>
              <FiTrendingUp className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3">Revenue tracking</span>
            </NavLink>
            <NavLink to="/dashboard/data-completion" className={linkClass}>
              <FiDatabase className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3">Data completion</span>
            </NavLink>
          </div>

          <div className="mt-4">
            <div className="flex items-center px-4 py-2 text-slate-500 text-sm font-medium">
              <span>Inventory</span>
              <FiChevronDown className="ml-auto h-4 w-4" />
            </div>
            <NavLink to="/dashboard/stock-management" className={linkClass}>
              <FiFolder className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3">Stock management</span>
            </NavLink>
          </div>

          <NavLink to="/dashboard/staff-management" className={linkClass}>
            <FiUsers className="h-5 w-5 flex-shrink-0" />
            <span className="ml-3">Staff Management</span>
          </NavLink>

          <NavLink to="/dashboard/branch-management" className={linkClass}>
            <FiFolder className="h-5 w-5 flex-shrink-0" />
            <span className="ml-3">Branch management</span>
          </NavLink>

          <div className="mt-4">
            <div className="flex items-center px-4 py-2 text-slate-500 text-sm font-medium">
              <span>Expenses</span>
              <FiChevronDown className="ml-auto h-4 w-4" />
            </div>
            <NavLink to="/dashboard/expenses/history" className={linkClass}>
              <FiBarChart className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3">Expense history</span>
            </NavLink>
            <NavLink to="/dashboard/expenses/summary" className={linkClass}>
              <FiDollarSign className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3">Expense summary</span>
            </NavLink>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with email verification notice */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center text-blue-700 text-sm">
            <span className="mr-2">📧</span>
            Email verification needed from 29th Jan 2025 to sign in, reset passwords, and receive HMIS updates.
            <button className="ml-2 text-blue-600 underline">Learn more</button>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}