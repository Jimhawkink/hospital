import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BookAppointmentModal } from "../components/BookAppointmentModal";

// --- Type Definitions ---
type Encounter = {
  id: number;
  encounter_number: string;
  encounter_type: string;
  priority_type?: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient_id: number;
  provider_id: number;
  patient_name: string;
  provider_name: string;
  patient_gender?: string;
  patient_age?: number;
  status?: string;
  patient_phone?: string;
};

type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
};

type Staff = {
  id: number;
  firstName: string;
  lastName: string;
  title: string;
};

// --- Utility Functions ---
const getInitials = (name: string) => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return Math.max(0, age);
};

// Priority Badge Component
function PriorityBadge({ priority }: { priority: string | null | undefined }) {
  const p = priority?.toLowerCase() || 'normal';
  if (p === 'high' || p === 'urgent' || p === 'emergency') {
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">🔴 {priority}</span>;
  }
  if (p === 'medium') {
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">🟡 {priority}</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">🟢 {priority}</span>;
}

// Encounter Type Badge
function EncounterTypeBadge({ type }: { type: string }) {
  const t = type?.toLowerCase() || '';
  const configs: Record<string, { emoji: string; bg: string; text: string }> = {
    'delivery': { emoji: '👶', bg: 'bg-pink-100', text: 'text-pink-700' },
    'consultation': { emoji: '💬', bg: 'bg-blue-100', text: 'text-blue-700' },
    'check-up': { emoji: '🩺', bg: 'bg-teal-100', text: 'text-teal-700' },
    'treatment': { emoji: '💊', bg: 'bg-purple-100', text: 'text-purple-700' },
    'emergency': { emoji: '🚨', bg: 'bg-red-100', text: 'text-red-700' },
    'follow-up': { emoji: '🔄', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  };
  const config = configs[t] || { emoji: '📋', bg: 'bg-slate-100', text: 'text-slate-700' };
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${config.bg} ${config.text} rounded-full text-xs font-semibold`}>{config.emoji} {type}</span>;
}

// Status Badge
function StatusBadge({ status }: { status: string | undefined }) {
  const s = status?.toLowerCase() || 'open';
  const configs: Record<string, { emoji: string; bg: string; text: string }> = {
    'open': { emoji: '🟢', bg: 'bg-green-100', text: 'text-green-700' },
    'encounter opened': { emoji: '🔵', bg: 'bg-blue-100', text: 'text-blue-700' },
    'triage recorded': { emoji: '🟡', bg: 'bg-amber-100', text: 'text-amber-700' },
    'completed': { emoji: '✅', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    'closed': { emoji: '⚪', bg: 'bg-slate-100', text: 'text-slate-700' },
  };
  const config = configs[s] || { emoji: '📋', bg: 'bg-slate-100', text: 'text-slate-700' };
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${config.bg} ${config.text} rounded-full text-xs font-semibold`}>{config.emoji} {status || 'Open'}</span>;
}

// --- Main Component ---
export default function EncounterListPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    const token = localStorage.getItem("hms_token");
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    const api = axios.create({
      baseURL: "http://localhost:5000/api",
      headers: { Authorization: `Bearer ${token}` },
    });

    try {
      setLoading(true);
      const [encountersRes, patientsRes, staffRes] = await Promise.all([
        api.get("/encounters"),
        api.get("/patients"),
        api.get("/staff"),
      ]);

      const encountersData = Array.isArray(encountersRes.data) ? encountersRes.data : encountersRes.data?.data || [];
      const patientsData = Array.isArray(patientsRes.data) ? patientsRes.data : [];
      const staffData = Array.isArray(staffRes.data) ? staffRes.data : [];

      const patientMap: Record<string, Patient> = {};
      patientsData.forEach((p: Patient) => { patientMap[String(p.id)] = p; });

      const staffMap: Record<string, Staff> = {};
      staffData.forEach((s: Staff) => { staffMap[String(s.id)] = s; });

      const enriched = encountersData.map((enc: any) => {
        const patient = patientMap[String(enc.patient_id)];
        const staff = staffMap[String(enc.provider_id)];
        return {
          ...enc,
          patient_name: patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${enc.patient_id}`,
          patient_gender: patient?.gender || 'Unknown',
          patient_age: patient?.dob ? calculateAge(patient.dob) : 0,
          patient_phone: patient?.phone,
          provider_name: staff ? `${staff.title || ''} ${staff.firstName} ${staff.lastName}`.trim() : `Provider #${enc.provider_id}`,
          status: enc.status || 'Encounter Opened',
        };
      });

      setEncounters(enriched);
    } catch (err: any) {
      setError(err.message || "Failed to load encounters");
    } finally {
      setLoading(false);
    }
  };

  const filteredEncounters = useMemo(() => {
    let filtered = [...encounters];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.patient_name.toLowerCase().includes(q) ||
        e.encounter_number.toLowerCase().includes(q) ||
        e.provider_name.toLowerCase().includes(q)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(e => e.encounter_type === filterType);
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter(e => e.priority_type === filterPriority);
    }

    return filtered;
  }, [encounters, searchQuery, filterType, filterPriority]);

  const currentEncounters = filteredEncounters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredEncounters.length / itemsPerPage) || 1;

  const uniqueTypes = useMemo(() => [...new Set(encounters.map(e => e.encounter_type).filter(Boolean))], [encounters]);
  const uniquePriorities = useMemo(() => [...new Set(encounters.map(e => e.priority_type).filter(Boolean))], [encounters]);

  return (
    <div className="space-y-6">
      {/* 🏥 Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">📋</div>
            <div>
              <h1 className="text-2xl font-bold">Encounter Management</h1>
              <p className="text-indigo-100">View and manage all patient encounters</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-lg">🕐</span>
              <span className="font-medium">{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="font-medium">{encounters.length} Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Encounters', value: encounters.length, emoji: '📋', color: 'from-blue-500 to-blue-600' },
          { label: 'High Priority', value: encounters.filter(e => e.priority_type?.toLowerCase() === 'high').length, emoji: '🔴', color: 'from-red-500 to-rose-600' },
          { label: 'Consultations', value: encounters.filter(e => e.encounter_type?.toLowerCase() === 'consultation').length, emoji: '💬', color: 'from-emerald-500 to-teal-600' },
          { label: 'Today', value: encounters.filter(e => new Date(e.createdAt).toDateString() === new Date().toDateString()).length, emoji: '📅', color: 'from-violet-500 to-purple-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{stat.emoji} {stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{loading ? '...' : stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-lg`}>
                {stat.emoji}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔧 Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search patients, encounters..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                🎛️ Filters {showFilters ? '▲' : '▼'}
              </button>
              <button
                onClick={() => setShowBookAppointment(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
              >
                📅 Book Appointment
              </button>
              <button
                onClick={() => navigate('/dashboard/patients/new')}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"
              >
                ➕ New Encounter
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">📋 Encounter Type</label>
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">🎯 Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="all">All Priorities</option>
                  {uniquePriorities.map(p => <option key={p} value={p || ''}>{p}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterType('all'); setFilterPriority('all'); setSearchQuery(''); }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  🔄 Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">👤 Patient</div>
          <div className="col-span-2">🆔 Encounter #</div>
          <div className="col-span-2">📋 Type</div>
          <div className="col-span-1">🎯 Priority</div>
          <div className="col-span-2">👨‍⚕️ Provider</div>
          <div className="col-span-2 text-right">⚙️ Actions</div>
        </div>

        {/* Encounters List */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex justify-center gap-1 mb-2">
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <p className="text-slate-400">Loading encounters...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <span className="text-4xl mb-2 block">⚠️</span>
              <p className="text-red-500">{error}</p>
              <button onClick={fetchEncounters} className="mt-2 text-indigo-600 hover:underline">Retry</button>
            </div>
          ) : currentEncounters.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-4xl mb-2 block">📭</span>
              <p className="text-slate-400">No encounters found</p>
            </div>
          ) : currentEncounters.map((enc) => (
            <div key={enc.id}>
              {/* Main Row */}
              <div
                className="p-4 hover:bg-indigo-50/30 transition-colors lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center cursor-pointer"
                onClick={() => setExpandedId(expandedId === enc.id ? null : enc.id)}
              >
                {/* Patient */}
                <div className="col-span-3 flex items-center gap-3 mb-3 lg:mb-0">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {getInitials(enc.patient_name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{enc.patient_name}</h3>
                    <p className="text-xs text-slate-500">{enc.patient_gender === 'Male' ? '👨' : '👩'} {enc.patient_gender} · {enc.patient_age} years</p>
                  </div>
                </div>

                {/* Encounter # */}
                <div className="col-span-2 mb-2 lg:mb-0">
                  <p className="text-sm font-mono text-slate-600">{enc.encounter_number}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(enc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date(enc.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>

                {/* Type */}
                <div className="col-span-2 mb-2 lg:mb-0">
                  <EncounterTypeBadge type={enc.encounter_type} />
                </div>

                {/* Priority */}
                <div className="col-span-1 mb-2 lg:mb-0">
                  <PriorityBadge priority={enc.priority_type} />
                </div>

                {/* Provider */}
                <div className="col-span-2 mb-2 lg:mb-0">
                  <p className="text-sm text-slate-700">{enc.provider_name}</p>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/encounters/triage/${enc.patient_id}`); }}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 transition-colors"
                  >
                    ▶️ Resume
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                  >
                    ⋮
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === enc.id && (
                <div className="px-4 py-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-t border-slate-100">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">📞 Phone</p>
                      <p className="text-sm font-medium text-slate-700">{enc.patient_phone || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">📅 Created</p>
                      <p className="text-sm font-medium text-slate-700">{new Date(enc.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">🔄 Updated</p>
                      <p className="text-sm font-medium text-slate-700">{new Date(enc.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">📝 Status</p>
                      <StatusBadge status={enc.status} />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/dashboard/encounters/triage/${enc.patient_id}`)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg"
                    >
                      ▶️ Resume Encounter
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/encounters/complaints/${enc.id}`)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50"
                    >
                      📝 View Complaints
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50">
                      📜 History
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {filteredEncounters.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredEncounters.length)} of ${filteredEncounters.length}` : '0 results'}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm"
              >
                ⏮️
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm"
              >
                ◀️ Prev
              </button>
              <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium">{currentPage}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm"
              >
                Next ▶️
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm"
              >
                ⏭️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookAppointment && (
        <BookAppointmentModal
          onClose={() => setShowBookAppointment(false)}
          onSuccess={() => {
            setShowBookAppointment(false);
            fetchEncounters();
          }}
        />
      )}
    </div>
  );
}