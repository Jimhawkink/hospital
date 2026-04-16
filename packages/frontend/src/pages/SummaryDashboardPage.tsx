import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Filler
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("hms_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

interface DashboardStats {
  totalPatients: number;
  newPatientsThisMonth: number;
  totalEncounters: number;
  encountersThisMonth: number;
  totalAppointments: number;
  appointmentsToday: number;
  totalRevenue: number;
  revenueThisMonth: number;
  genderBreakdown: { male: number; female: number; other: number };
  ageGroups: { label: string; male: number; female: number }[];
  encountersByType: { type: string; count: number }[];
  encountersByHour: { hour: number; count: number }[];
  monthlyTrend: { month: string; patients: number; encounters: number }[];
  topDiagnoses: { name: string; count: number }[];
  topInvestigations: { name: string; count: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  encountersByProvider: { name: string; arrived: number; cancelled: number }[];
  repeatVsSingle: { repeat: number; single: number };
  recentPatients: { id: number; name: string; gender: string; phone: string; date: string }[];
}

const emptyStats: DashboardStats = {
  totalPatients: 0, newPatientsThisMonth: 0, totalEncounters: 0, encountersThisMonth: 0,
  totalAppointments: 0, appointmentsToday: 0, totalRevenue: 0, revenueThisMonth: 0,
  genderBreakdown: { male: 0, female: 0, other: 0 },
  ageGroups: [], encountersByType: [], encountersByHour: [], monthlyTrend: [],
  topDiagnoses: [], topInvestigations: [], topProducts: [], encountersByProvider: [],
  repeatVsSingle: { repeat: 0, single: 0 }, recentPatients: [],
};

// Date filter options
const dateFilters = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

export default function SummaryDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [dateFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard-stats?filter=${dateFilter}`);
      setStats({ ...emptyStats, ...res.data });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); setShowSearch(false); return; }
    try {
      const res = await api.get(`/patients?search=${encodeURIComponent(q)}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setSearchResults(data.slice(0, 8));
      setShowSearch(true);
    } catch { setSearchResults([]); }
  };

  const totalGender = stats.genderBreakdown.male + stats.genderBreakdown.female + stats.genderBreakdown.other || 1;

  // Chart configs
  const genderChartData = {
    labels: ["Female", "Male", "Other"],
    datasets: [{
      data: [stats.genderBreakdown.female, stats.genderBreakdown.male, stats.genderBreakdown.other],
      backgroundColor: ["#EC4899", "#3B82F6", "#10B981"],
      borderWidth: 0,
      cutout: "72%",
    }],
  };

  const encounterTypeData = {
    labels: stats.encountersByType.map(e => e.type || "Other"),
    datasets: [{
      data: stats.encountersByType.map(e => e.count),
      backgroundColor: ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#EF4444"],
      borderWidth: 0,
      cutout: "72%",
    }],
  };

  const ageGroupData = {
    labels: stats.ageGroups.map(a => a.label),
    datasets: [
      {
        label: "Female",
        data: stats.ageGroups.map(a => a.female),
        backgroundColor: "rgba(236, 72, 153, 0.7)",
        borderRadius: 4,
      },
      {
        label: "Male",
        data: stats.ageGroups.map(a => a.male),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderRadius: 4,
      },
    ],
  };

  const hourlyData = {
    labels: stats.encountersByHour.map(h => {
      const hr = h.hour;
      if (hr === 0) return "12 AM";
      if (hr < 12) return `${hr} AM`;
      if (hr === 12) return "12 PM";
      return `${hr - 12} PM`;
    }),
    datasets: [{
      label: "Encounters",
      data: stats.encountersByHour.map(h => h.count),
      backgroundColor: "rgba(99, 102, 241, 0.6)",
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const trendData = {
    labels: stats.monthlyTrend.map(m => m.month),
    datasets: [
      {
        label: "Encounters",
        data: stats.monthlyTrend.map(m => m.encounters),
        borderColor: "#6366F1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#6366F1",
      },
      {
        label: "New Patients",
        data: stats.monthlyTrend.map(m => m.patients),
        borderColor: "#EC4899",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#EC4899",
      },
    ],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 10 } } },
    },
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();
  const formatMoney = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);

  const kpiCards = [
    { label: "Patients, total registered", value: formatNum(stats.totalPatients), icon: "👥", color: "from-blue-500 to-indigo-600", change: null },
    { label: "New patients registered", value: stats.newPatientsThisMonth.toString(), icon: "📝", color: "from-emerald-500 to-teal-600", change: "this month", subtitle: new Date().toLocaleString("default", { month: "short", year: "numeric" }) },
    { label: "Encounters, total count", value: formatNum(stats.totalEncounters), icon: "📋", color: "from-purple-500 to-violet-600", change: null },
    { label: "Encounters this month", value: stats.encountersThisMonth.toString(), icon: "🩺", color: "from-rose-500 to-pink-600", change: "this month", subtitle: new Date().toLocaleString("default", { month: "short", year: "numeric" }) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Top Header Bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-2xl">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="🔍 Search for patients by name, number..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-slate-400"
              />
            </div>
            {/* Search Results Dropdown */}
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                {searchResults.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${(p.gender || p.Gender || '').toLowerCase().startsWith('f') ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                      {((p.first_name || p.firstName || '')[0] || '').toUpperCase()}{((p.last_name || p.lastName || '')[0] || '').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {p.first_name || p.firstName} {p.middle_name || p.middleName || ''} {p.last_name || p.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{p.patient_number || p.patientNumber || `PT-${p.id}`} • {p.phone || ''}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${(p.gender || '').toLowerCase().startsWith('f') ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                      {p.gender || p.Gender || '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <span>📅</span>
              <span>Date Filter</span>
              <svg className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[180px]">
                {dateFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => { setDateFilter(f.value); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${dateFilter === f.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              📊 Summary Dashboard
              <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                {dateFilters.find(f => f.value === dateFilter)?.label || "All Time"}
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Real-time facility analytics and patient insights</p>
          </div>
          <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiCards.map((card, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">•••</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{loading ? "..." : card.value}</div>
              <p className="text-sm text-slate-500 mt-1">{card.label}</p>
              {card.subtitle && (
                <p className="text-xs text-indigo-500 mt-2 font-medium">
                  {card.subtitle}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Repeat vs Single + Revenue Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Repeat vs Single Visitors */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">🔄 Patients, single vs repeat</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                <span className="text-sm font-medium text-indigo-700">Repeat visitors</span>
                <span className="text-lg font-bold text-indigo-800">{loading ? "..." : stats.repeatVsSingle.repeat.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <span className="text-sm font-medium text-emerald-700">Single users</span>
                <span className="text-lg font-bold text-emerald-800">{loading ? "..." : stats.repeatVsSingle.single.toLocaleString()}</span>
              </div>
            </div>
          </div>
          {/* Revenue */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-xl">💰</div>
              <span className="text-sm font-medium text-emerald-100">Total Revenue</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{loading ? "..." : formatMoney(stats.totalRevenue)}</div>
            <p className="text-sm text-emerald-200 mt-2">This month: {loading ? "..." : formatMoney(stats.revenueThisMonth)}</p>
          </div>
          {/* Appointments */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-xl">📅</div>
              <span className="text-sm font-medium text-violet-200">Total Appointments</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{loading ? "..." : stats.totalAppointments.toLocaleString()}</div>
            <p className="text-sm text-violet-200 mt-2">Today: {loading ? "..." : stats.appointmentsToday} appointments</p>
          </div>
        </div>

        {/* Gender Donut + Age Group Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Gender Donut */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">🧑‍🤝‍🧑 Total patients by gender</h3>
            <div className="flex items-center gap-8">
              <div className="relative w-48 h-48">
                <Doughnut data={genderChartData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : stats.totalPatients.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-medium">TOTAL</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "FEMALE", pct: ((stats.genderBreakdown.female / totalGender) * 100).toFixed(2), color: "bg-pink-500", val: stats.genderBreakdown.female },
                  { label: "MALE", pct: ((stats.genderBreakdown.male / totalGender) * 100).toFixed(2), color: "bg-blue-500", val: stats.genderBreakdown.male },
                  { label: "OTHER", pct: ((stats.genderBreakdown.other / totalGender) * 100).toFixed(2), color: "bg-emerald-500", val: stats.genderBreakdown.other },
                ].map((g) => (
                  <div key={g.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${g.color}`} />
                    <span className="text-xs font-semibold text-slate-500 w-14">{g.label}</span>
                    <span className="text-sm font-bold text-slate-700">{g.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Age Group Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">📊 Patients by age group, gender comparison</h3>
            <div className="h-56">
              <Bar data={ageGroupData} options={{ ...chartOptions, plugins: { legend: { display: true, position: "top" as const, labels: { boxWidth: 12, font: { size: 10 } } } } }} />
            </div>
          </div>
        </div>

        {/* Encounters by Hour + Visit Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Encounters by Hour */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">⏰ Count of encounters by hour of day</h3>
            <div className="h-56">
              <Bar data={hourlyData} options={chartOptions} />
            </div>
          </div>

          {/* Encounter Types Donut */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">📋 Total encounters by visit type</h3>
            <div className="flex items-center gap-8">
              <div className="relative w-48 h-48">
                <Doughnut data={encounterTypeData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-800">{loading ? "..." : stats.totalEncounters.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-medium">TOTAL</span>
                </div>
              </div>
              <div className="space-y-2">
                {stats.encountersByType.map((e, i) => {
                  const colors = ["bg-indigo-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500", "bg-red-500"];
                  const total = stats.encountersByType.reduce((s, v) => s + v.count, 0) || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[i] || 'bg-slate-400'}`} />
                      <span className="text-xs text-slate-600 w-24 truncate">{e.type || "Other"}</span>
                      <span className="text-xs font-bold text-slate-700">{((e.count / total) * 100).toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">📈 Monthly Trends - Encounters & Patient Registrations</h3>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-xs text-slate-600">Encounters, total count, monthly</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-xs text-slate-600">Patients, new registrations, monthly</span>
            </div>
          </div>
          <div className="h-64">
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>

        {/* Encounters by Provider */}
        {stats.encountersByProvider.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">👨‍⚕️ Encounters, Grouped by Practitioner</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-indigo-600 font-semibold">Patient Encounter Status</th>
                    {stats.encountersByProvider.map((p, i) => (
                      <th key={i} className="text-center py-3 px-4 text-indigo-600 font-semibold">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 font-medium text-slate-700">ARRIVED</td>
                    {stats.encountersByProvider.map((p, i) => (
                      <td key={i} className="text-center py-3 px-4 text-slate-600">
                        <div className="flex items-center justify-center gap-2">
                          <span>{p.arrived.toLocaleString()}</span>
                          <div className="w-16 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((p.arrived / (Math.max(...stats.encountersByProvider.map(x => x.arrived)) || 1)) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-700">CANCELLED</td>
                    {stats.encountersByProvider.map((p, i) => (
                      <td key={i} className="text-center py-3 px-4 text-slate-600">{p.cancelled}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top 10 Diagnoses + Investigations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top 10 Diagnoses */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">🏥 Top 10 Diagnoses</h3>
            <div className="space-y-0">
              <div className="grid grid-cols-12 gap-2 py-2 border-b border-slate-200 mb-1">
                <div className="col-span-8 text-xs font-semibold text-indigo-600">Diagnosis Description</div>
                <div className="col-span-4 text-xs font-semibold text-indigo-600 text-right">Count</div>
              </div>
              {(stats.topDiagnoses.length > 0 ? stats.topDiagnoses : [{ name: "No data", count: 0 }]).map((d, i) => (
                <div key={i} className={`grid grid-cols-12 gap-2 py-2.5 items-center ${i % 2 === 0 ? '' : 'bg-slate-50/50'} rounded-lg px-2 hover:bg-indigo-50/50 transition-colors`}>
                  <div className="col-span-8 text-sm text-slate-700 truncate">{d.name}</div>
                  <div className="col-span-4 text-sm font-bold text-slate-800 text-right">{d.count.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-right mt-2">{stats.topDiagnoses.length} rows</p>
          </div>

          {/* Top 10 Investigations */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">🔬 Top 10 Investigations</h3>
            <div className="space-y-0">
              <div className="grid grid-cols-12 gap-2 py-2 border-b border-slate-200 mb-1">
                <div className="col-span-8 text-xs font-semibold text-indigo-600">Investigation Name</div>
                <div className="col-span-4 text-xs font-semibold text-rose-600 text-right">Count</div>
              </div>
              {(stats.topInvestigations.length > 0 ? stats.topInvestigations : [{ name: "No data", count: 0 }]).map((d, i) => (
                <div key={i} className={`grid grid-cols-12 gap-2 py-2.5 items-center ${i % 2 === 0 ? '' : 'bg-slate-50/50'} rounded-lg px-2 hover:bg-rose-50/50 transition-colors`}>
                  <div className="col-span-8 text-sm text-slate-700 truncate">{d.name}</div>
                  <div className="col-span-4 text-sm font-bold text-slate-800 text-right">{d.count.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-right mt-2">{stats.topInvestigations.length} rows</p>
          </div>
        </div>

        {/* Top 10 Inventory Sales */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">💊 Top 10 Inventory Sales</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-indigo-600 font-semibold">Products Name</th>
                  <th className="text-center py-3 px-4 text-indigo-600 font-semibold">Quantity Sold</th>
                  <th className="text-right py-3 px-4 text-indigo-600 font-semibold">Amount sold (KES)</th>
                </tr>
              </thead>
              <tbody>
                {(stats.topProducts.length > 0 ? stats.topProducts : [{ name: "No data", qty: 0, revenue: 0 }]).map((p, i) => (
                  <tr key={i} className={`border-b border-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'} hover:bg-indigo-50/40 transition-colors`}>
                    <td className="py-3 px-4 text-slate-700">{p.name}</td>
                    <td className="text-center py-3 px-4 text-slate-600 font-medium">{p.qty.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 font-bold text-emerald-700">{formatMoney(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 text-right mt-2">{stats.topProducts.length} rows</p>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">🆕 Recent Patient Registrations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <th className="text-left py-3 px-4 text-indigo-700 font-semibold rounded-l-xl">#</th>
                  <th className="text-left py-3 px-4 text-indigo-700 font-semibold">Patient Name</th>
                  <th className="text-center py-3 px-4 text-indigo-700 font-semibold">Gender</th>
                  <th className="text-center py-3 px-4 text-indigo-700 font-semibold">Phone</th>
                  <th className="text-right py-3 px-4 text-indigo-700 font-semibold rounded-r-xl">Registered</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPatients.map((p, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{p.name}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${p.gender?.toLowerCase().startsWith('f') ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                        {p.gender || "-"}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-slate-600">{p.phone || "-"}</td>
                    <td className="text-right py-3 px-4 text-slate-500 text-xs">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
