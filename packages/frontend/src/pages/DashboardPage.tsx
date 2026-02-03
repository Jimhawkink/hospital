import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

type Encounter = {
  id: number;
  encounter_number: string;
  encounter_type: string;
  priority_type: string;
  notes: string | null;
  patient_id: number;
  provider_id: number;
  createdAt: string;
  updatedAt: string;
  // Enriched fields
  patient_name: string;
  patient_gender: string;
  patient_age: number;
  provider_name: string;
};

type Patient = {
  id: number;
  firstName: string;  // API returns as firstName (aliased from first_name)
  lastName: string;   // API returns as lastName (aliased from last_name)
  gender: string;
  dob: string;
  phone: string;
};

type Staff = {
  id: number;
  firstName: string;
  lastName: string;
  title: string;
};

// Calculate age from DOB
function calculateAge(dob: string): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return Math.max(0, age);
}

// Action Menu Component
function ActionMenu({ encounterId, patientId, onClose }: { encounterId: number; patientId: number; onClose: () => void }) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={menuRef} className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 min-w-[220px]">
      <button
        onClick={() => { navigate(`/dashboard/encounters/triage/${patientId}`); onClose(); }}
        className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors"
      >
        <span className="text-xl">▶️</span>
        <div>
          <span className="font-medium text-slate-700">Resume Encounter</span>
          <p className="text-xs text-slate-400">Continue patient consultation</p>
        </div>
      </button>
      <button
        onClick={() => { navigate(`/dashboard/patients`); onClose(); }}
        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
      >
        <span className="text-xl">📜</span>
        <div>
          <span className="font-medium text-slate-700">Encounter History</span>
          <p className="text-xs text-slate-400">View past encounters</p>
        </div>
      </button>
      <button
        onClick={() => { navigate(`/dashboard/encounters/complaints/${encounterId}`); onClose(); }}
        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
      >
        <span className="text-xl">📝</span>
        <div>
          <span className="font-medium text-slate-700">View Complaints</span>
          <p className="text-xs text-slate-400">Patient symptoms</p>
        </div>
      </button>
      <div className="border-t border-slate-100 my-1" />
      <button
        onClick={onClose}
        className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 transition-colors text-red-600"
      >
        <span className="text-xl">❌</span>
        <span className="font-medium">Cancel Encounter</span>
      </button>
    </div>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: string }) {
  const p = priority?.toLowerCase() || 'normal';

  if (p === 'high' || p === 'urgent' || p === 'emergency') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
        🔴 {priority}
      </span>
    );
  }
  if (p === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
        🟡 {priority}
      </span>
    );
  }
  // Normal / Low
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
      🟢 {priority}
    </span>
  );
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

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${config.bg} ${config.text} rounded-full text-xs font-semibold`}>
      {config.emoji} {type}
    </span>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [totalPatients, setTotalPatients] = useState<number | null>(null);
  const [totalStaff, setTotalStaff] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("Encounters");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("hms_token");
    if (!token) {
      setError("No authentication token");
      setLoading(false);
      return;
    }



    (async () => {
      try {
        console.log("🔍 Fetching data...");

        const [patientsCountRes, encountersRes, patientsRes, staffRes] = await Promise.all([
          api.get("/patients/count").catch(() => ({ data: { total: 0 } })),
          api.get("/encounters").catch(() => ({ data: [] })),
          api.get("/patients").catch(() => ({ data: [] })),
          api.get("/staff").catch(() => ({ data: [] })),
        ]);

        console.log("📋 Encounters:", encountersRes.data);
        console.log("👥 Patients:", patientsRes.data);
        console.log("👨‍⚕️ Staff:", staffRes.data);

        const encountersData = Array.isArray(encountersRes.data) ? encountersRes.data : encountersRes.data?.data || [];
        const patientsData = Array.isArray(patientsRes.data) ? patientsRes.data : [];
        const staffData = Array.isArray(staffRes.data) ? staffRes.data : [];

        // Create lookup maps with both string and number keys for flexibility
        const patientMap: Record<string, Patient> = {};
        patientsData.forEach((p: Patient) => {
          patientMap[String(p.id)] = p;
        });

        const staffMap: Record<string, Staff> = {};
        staffData.forEach((s: Staff) => {
          staffMap[String(s.id)] = s;
        });

        console.log("🗺️ Patient Map:", patientMap);
        console.log("🗺️ Staff Map:", staffMap);

        // Enrich encounters with patient and staff data
        // The backend returns patient data directly with encounters via JOIN
        const enriched = encountersData.map((enc: any) => {
          // First try to get patient data from the JOIN in encounter response
          // Backend returns: patient.firstName, patient.lastName
          const patientFromEnc = enc.patient || enc['patient.firstName'] ? {
            firstName: enc['patient.firstName'] || enc.patient?.firstName,
            lastName: enc['patient.lastName'] || enc.patient?.lastName,
            id: enc['patient.id'] || enc.patient?.id || enc.patient_id,
          } : null;

          // Fallback to patient map lookup
          const patientFromMap = patientMap[String(enc.patient_id)];
          const staff = staffMap[String(enc.provider_id)];

          console.log(`Encounter ${enc.id}: patient_id=${enc.patient_id}`, { patientFromEnc, patientFromMap, enc });

          // Use patient data from encounter JOIN first, then fallback to map
          const patientName = patientFromEnc?.firstName
            ? [patientFromEnc.firstName, patientFromEnc.lastName].filter(Boolean).join(' ').trim()
            : patientFromMap
              ? [patientFromMap.firstName, patientFromMap.lastName].filter(Boolean).join(' ').trim()
              : `Patient #${enc.patient_id}`;

          const providerName = staff
            ? [staff.title, staff.firstName, staff.lastName].filter(Boolean).join(' ').trim()
            : `Provider #${enc.provider_id}`;

          return {
            ...enc,
            patient_name: patientName,
            patient_gender: patientFromMap?.gender || 'Unknown',
            patient_age: patientFromMap?.dob ? calculateAge(patientFromMap.dob) : 0,
            provider_name: providerName,
          };
        });

        console.log("✅ Enriched encounters:", enriched);

        setTotalPatients(patientsCountRes.data?.total ?? patientsData.length);
        setTotalStaff(staffData.length);
        setEncounters(enriched);
      } catch (err: any) {
        console.error("❌ Error:", err);
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = encounters.filter((e) =>
    e.patient_name.toLowerCase().includes(filter.toLowerCase()) ||
    e.encounter_number.toLowerCase().includes(filter.toLowerCase()) ||
    e.encounter_type.toLowerCase().includes(filter.toLowerCase()) ||
    e.priority_type?.toLowerCase().includes(filter.toLowerCase())
  );

  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">🏥</div>
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-blue-100">Waiting Room & Patient Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <div className="text-blue-100 text-sm">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              <div className="text-xl font-bold">🕐 {currentTime.toLocaleTimeString()}</div>
            </div>
            <div className="bg-emerald-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm">Online</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'Total Patients', value: totalPatients, emoji: '👥', color: 'from-blue-500 to-blue-600' },
          { title: 'Total Encounters', value: encounters.length, emoji: '📋', color: 'from-violet-500 to-purple-600' },
          { title: 'Staff Members', value: totalStaff, emoji: '👨‍⚕️', color: 'from-emerald-500 to-teal-600' },
          { title: 'High Priority', value: encounters.filter(e => e.priority_type?.toLowerCase() === 'high').length, emoji: '🔴', color: 'from-red-500 to-rose-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 flex items-center gap-1"><span>{stat.emoji}</span> {stat.title}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{loading ? '...' : stat.value ?? '—'}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                {stat.emoji}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Waiting Room / Encounters Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🏥 Waiting Room
              <span className="text-sm font-normal text-slate-500">({encounters.length} encounters)</span>
            </h2>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors">
                🔍 Filters
              </button>
              <button
                onClick={() => navigate('/dashboard/encounters')}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                ➕ New Encounter
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-slate-100">
          <div className="flex gap-1">
            {['Encounters', 'Priority List', "Today's Appointments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === tab
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search by patient name, encounter number, type..."
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">👤 Patient</div>
          <div className="col-span-2">📅 Time</div>
          <div className="col-span-2">📋 Type</div>
          <div className="col-span-2">🎯 Priority</div>
          <div className="col-span-2">👨‍⚕️ Doctor</div>
          <div className="col-span-1 text-right">⚙️</div>
        </div>

        {/* Encounters List */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="flex justify-center gap-1 mb-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              Loading encounters...
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <span className="text-4xl mb-2 block">📭</span>
              No encounters found
            </div>
          ) : paginated.map((enc) => (
            <div key={enc.id} className="p-4 hover:bg-blue-50/30 transition-colors lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
              {/* Patient Info */}
              <div className="col-span-3 flex items-center gap-3 mb-3 lg:mb-0">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
                  {enc.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{enc.patient_name}</h3>
                  <p className="text-xs text-slate-500">
                    {enc.patient_gender === 'Male' ? '👨' : '👩'} {enc.patient_gender} · {enc.patient_age} years
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="col-span-2 mb-2 lg:mb-0">
                <p className="text-sm font-medium text-slate-700">
                  {new Date(enc.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(enc.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Encounter Type */}
              <div className="col-span-2 mb-2 lg:mb-0">
                <EncounterTypeBadge type={enc.encounter_type} />
              </div>

              {/* Priority */}
              <div className="col-span-2 mb-2 lg:mb-0">
                <PriorityBadge priority={enc.priority_type} />
              </div>

              {/* Assigned Doctor */}
              <div className="col-span-2 mb-2 lg:mb-0">
                <p className="text-sm font-medium text-slate-700">{enc.provider_name}</p>
              </div>

              {/* Actions */}
              <div className="col-span-1 text-right relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === enc.id ? null : enc.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors inline-flex"
                >
                  <span className="text-xl text-slate-500">⋮</span>
                </button>
                {openMenuId === enc.id && (
                  <ActionMenu
                    encounterId={enc.id}
                    patientId={enc.patient_id}
                    onClose={() => setOpenMenuId(null)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {filtered.length > 0 ? `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, filtered.length)} of ${filtered.length}` : '0 results'}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white text-sm"
              >
                ◀️ Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white text-sm"
              >
                Next ▶️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}