import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Filter, Settings, Search, Users, Calendar, User, UserCheck, DollarSign, Headphones, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import StyledButton from "../components/StyledButton";
import Switch from "../components/Switch";

type StaffRow = {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  role: string;
  job_title: string;
  is_active: 0 | 1;
  created_at: string;
};

const API = "http://localhost:5000";

// Helper functions for modern UI
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getAvatarGradient = (id: number) => {
  const gradients = [
    'bg-header-gradient',
    'bg-success-gradient',
    'bg-warning-gradient',
    'bg-danger-gradient',
    'bg-purple-gradient',
    'bg-cyan-gradient',
  ];
  return gradients[id % gradients.length];
};

const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case 'doctor': return UserCheck;
    case 'cashier': return DollarSign;
    case 'reception': return Headphones;
    case 'administrator': return Shield;
    default: return User;
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'doctor': return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'cashier': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'reception': return 'bg-green-100 text-green-800 border border-green-200';
    case 'administrator': return 'bg-purple-100 text-purple-800 border border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

export default function StaffManagement() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const fetchRows = async () => {
    const res = await axios.get<StaffRow[]>(`${API}/api/staff`);
    setRows(res.data);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r =>
      `${r.title} ${r.first_name} ${r.last_name} ${r.role} ${r.job_title}`.toLowerCase().includes(term)
    );
  }, [rows, q]);

  const toggleActive = async (id: number, next: boolean) => {
    await axios.patch(`${API}/api/staff/${id}/active`, { is_active: next });
    setRows(prev => prev.map(r => (r.id === id ? { ...r, is_active: next ? 1 : 0 } : r)));
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this staff member?")) return;
    await axios.delete(`${API}/api/staff/${id}`);
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const activeCount = rows.filter(r => r.is_active).length;
  const inactiveCount = rows.length - activeCount;

  return (
    <div className="min-h-screen bg-brand-gradient">
      {/* Header */}
      <div className="bg-glass backdrop-blur-xl border border-white/20 mx-8 mt-8 rounded-3xl shadow-glass">
        <div className="px-8 py-8">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-header-gradient rounded-2xl flex items-center justify-center shadow-colored animate-float">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Staff Management</h1>
                <p className="text-sm text-slate-600 mt-1 font-medium">
                  {activeCount} active • {rows.length} total members
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-wrap">
              <button className="inline-flex items-center px-5 py-3 text-sm font-semibold text-white bg-warning-gradient rounded-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-500/20 transition-all duration-300 shadow-warning">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
              <button className="inline-flex items-center px-5 py-3 text-sm font-semibold text-slate-700 bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-2xl hover:bg-white hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-500/20 transition-all duration-300">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </button>
              <button
                onClick={() => nav("/staff/new")}
                className="inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-success-gradient rounded-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all duration-300 shadow-success hover:shadow-hover"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-8 mt-8 bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-2xl border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
              <span className="text-sm text-slate-700 font-semibold">{activeCount} Active</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-slate-400 rounded-full shadow-lg"></div>
              <span className="text-sm text-slate-700 font-semibold">{inactiveCount} Inactive</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700 font-semibold">{rows.length} Total Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* Search */}
        <div className="mb-8">
          <div className="bg-glass backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-glass-sm">
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search staff members..."
                className="block w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-300 text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Staff DataGrid */}
        <div className="bg-glass backdrop-blur-xl border border-white/20 rounded-3xl shadow-glass overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Users className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">No staff members found</h3>
              <p className="text-slate-600 mb-8 text-lg">
                {q ? "Try adjusting your search terms" : "Get started by adding your first team member"}
              </p>
              <button
                onClick={() => nav("/staff/new")}
                className="inline-flex items-center px-6 py-3 bg-success-gradient text-white text-sm font-bold rounded-2xl hover:scale-105 transition-all duration-300 shadow-success"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-6 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-6 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                      Role & Position
                    </th>
                    <th className="px-6 py-6 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                      Added Date
                    </th>
                    <th className="px-6 py-6 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-6 text-right text-xs font-black text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-100">
                  {filtered.map((r) => {
                    const RoleIcon = getRoleIcon(r.role);
                    return (
                      <tr key={r.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-b border-slate-100/50">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-12 h-12 ${getAvatarGradient(r.id)} rounded-2xl flex items-center justify-center mr-4 shadow-lg font-bold text-white text-sm`}>
                              {getInitials(r.first_name, r.last_name)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">
                                {`${r.title ? r.title + " " : ""}${r.first_name} ${r.last_name}`}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">ID: {r.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs ${getRoleBadgeColor(r.role)}`}>
                            <RoleIcon className="w-4 h-4" />
                            {r.role}
                          </div>
                          {r.job_title && (
                            <div className="text-sm text-slate-600 mt-1 font-medium">{r.job_title}</div>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-700 font-medium">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                            {new Date(r.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Switch 
                              checked={!!r.is_active} 
                              onChange={v => toggleActive(r.id, v)} 
                            />
                            <span className={`text-sm font-bold uppercase tracking-wide ${
                              r.is_active ? 'text-green-600' : 'text-slate-500'
                            }`}>
                              {r.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => nav(`/staff/${r.id}/edit`)}
                              className="inline-flex items-center justify-center w-10 h-10 bg-info-gradient text-white rounded-xl hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 shadow-lg"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => remove(r.id)}
                              className="inline-flex items-center justify-center w-10 h-10 bg-danger-gradient text-white rounded-xl hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-300 shadow-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results summary */}
        {filtered.length > 0 && (
          <div className="mt-6 bg-glass backdrop-blur-sm border border-white/20 rounded-2xl p-4">
            <div className="flex items-center justify-center text-sm text-slate-600 font-medium">
              <span>
                Showing <span className="font-bold text-slate-800">{filtered.length}</span> of <span className="font-bold text-slate-800">{rows.length}</span> staff member{rows.length !== 1 ? 's' : ''}
              </span>
              {q && (
                <span className="ml-4">
                  • Filtered by: "<span className="font-bold text-indigo-600">{q}</span>"
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}