import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { EditPatientModal } from "../components/EditPatientModal";
import { NewEncounterModal } from "../components/NewEncounterModal";
import { CloseEncounterModal } from "../components/CloseEncounterModal";
import { PatientTagsModal } from "../components/PatientTagsModal";
import { PatientConsentModal } from "../components/PatientConsentModal";

interface Encounter {
  id: string;
  encounter_number: string;
  encounter_type: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient_id: string;
  provider_id: string;
}

interface Patient {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dob?: string | null;
  gender?: string;
  phone?: string;
  email?: string;
  first_encounter?: string;
  last_encounter?: string;
  next_appointment?: string;
  encounters?: Encounter[];
  createdAt?: string;
}

async function fetchPatients(): Promise<Patient[]> {
  try {
    const patientsResponse = await api.get("/patients");
    if (!patientsResponse.data || !Array.isArray(patientsResponse.data)) return [];
    const patients: Patient[] = patientsResponse.data;

    let encounters: Encounter[] = [];
    try {
      const encountersResponse = await api.get("/encounters");
      if (encountersResponse.data && Array.isArray(encountersResponse.data)) {
        encounters = encountersResponse.data;
      }
    } catch { /* ignore */ }

    return patients.map(patient => {
      const patientEncounters = encounters
        .filter(e => e.patient_id === patient.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return {
        ...patient,
        encounters: patientEncounters,
        first_encounter: patientEncounters[0]?.createdAt,
        last_encounter: patientEncounters[patientEncounters.length - 1]?.createdAt,
      };
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: patients, isLoading, error, refetch } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: fetchPatients,
    retry: 3,
  });

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [newEncounterPatient, setNewEncounterPatient] = useState<Patient | null>(null);
  const [closeEncounterPatient, setCloseEncounterPatient] = useState<Patient | null>(null);
  const [tagsPatient, setTagsPatient] = useState<Patient | null>(null);
  const [consentPatient, setConsentPatient] = useState<Patient | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterGender, setFilterGender] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const safePatients = patients || [];

  const getFullName = (p: Patient) => [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");
  const getInitials = (p: Patient) => [p.firstName?.[0], p.lastName?.[0]].filter(Boolean).join("").toUpperCase();
  const calculateAge = (dob?: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const diff = Date.now() - birthDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const filteredPatients = useMemo(() => {
    let filtered = safePatients;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        getFullName(p).toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    }

    if (filterGender !== "all") {
      filtered = filtered.filter(p => p.gender?.toLowerCase() === filterGender.toLowerCase());
    }

    return filtered;
  }, [safePatients, searchQuery, filterGender]);

  const currentPatients = filteredPatients.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredPatients.length / rowsPerPage) || 1;

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterGender]);

  const handleStartEncounter = async (patientId: string) => {
    try {
      await api.post(`/patients/${patientId}/encounters`);
      queryClient.invalidateQueries(["patients"]);
    } catch (error) { console.error("Failed:", error); }
  };

  const handleCloseEncounter = async (_patientId: string, encounterId: string, notes?: string) => {
    try {
      await api.patch(`/encounters/${encounterId}/close`, { notes: notes || '', closedAt: new Date().toISOString() });
      queryClient.invalidateQueries(["patients"]);
      setCloseEncounterPatient(null);
    } catch (error) { console.error("Failed:", error); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("🗑️ Are you sure you want to delete this patient?")) {
      try {
        await api.delete(`/patients/${id}`);
        queryClient.invalidateQueries(["patients"]);
      } catch (error) { console.error("Failed:", error); }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="flex justify-center gap-1 mb-4">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <p className="text-slate-500">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Patients</h3>
          <p className="text-slate-600 mb-4">{(error as any)?.message || 'An error occurred'}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🏥 Header */}
      <div className="bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">👥</div>
            <div>
              <h1 className="text-2xl font-bold">Patient Management</h1>
              <p className="text-cyan-100">View and manage all registered patients</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-lg">🕐</span>
              <span className="font-medium">{currentTime.toLocaleTimeString()}</span>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="font-medium">{safePatients.length} Patients</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: safePatients.length, emoji: '👥', color: 'from-blue-500 to-blue-600' },
          { label: 'Male Patients', value: safePatients.filter(p => p.gender?.toLowerCase() === 'male').length, emoji: '👨', color: 'from-indigo-500 to-purple-600' },
          { label: 'Female Patients', value: safePatients.filter(p => p.gender?.toLowerCase() === 'female').length, emoji: '👩', color: 'from-pink-500 to-rose-600' },
          { label: 'With Encounters', value: safePatients.filter(p => (p.encounters?.length || 0) > 0).length, emoji: '📋', color: 'from-emerald-500 to-teal-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{stat.emoji} {stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-lg`}>
                {stat.emoji}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔧 Controls & Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search patients by name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${showFilters ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                🎛️ Filters {showFilters ? '▲' : '▼'}
              </button>
              <button
                onClick={() => navigate("/dashboard/patients/new")}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all"
              >
                ➕ New Patient
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">👤 Gender</label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="all">All Genders</option>
                  <option value="male">👨 Male</option>
                  <option value="female">👩 Female</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterGender('all'); setSearchQuery(''); }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  🔄 Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">👤 Patient</div>
          <div className="col-span-2">📞 Contact</div>
          <div className="col-span-2">📅 First Visit</div>
          <div className="col-span-2">🔄 Last Visit</div>
          <div className="col-span-1">📋 Visits</div>
          <div className="col-span-2 text-right">⚙️ Actions</div>
        </div>

        {/* Patients List */}
        <div className="divide-y divide-slate-100">
          {currentPatients.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-5xl mb-4 block">👥</span>
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                {searchQuery ? "No patients found" : "No patients registered"}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery ? "Try adjusting your search" : "Get started by adding your first patient"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate("/dashboard/patients/new")}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-medium"
                >
                  ➕ Add First Patient
                </button>
              )}
            </div>
          ) : currentPatients.map((patient) => (
            <div key={patient.id}>
              {/* Main Row */}
              <div
                className="p-4 hover:bg-teal-50/30 transition-colors lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center cursor-pointer"
                onClick={() => setExpandedId(expandedId === patient.id ? null : patient.id)}
              >
                {/* Patient with Expand Icon */}
                <div className="col-span-3 flex items-center gap-3 mb-3 lg:mb-0">
                  {/* Expand/Collapse Chevron */}
                  <button
                    className={`w-6 h-6 flex items-center justify-center text-slate-400 hover:text-teal-600 transition-all duration-200 ${expandedId === patient.id ? 'rotate-90' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === patient.id ? null : patient.id); }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {getInitials(patient)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{getFullName(patient)}</h3>
                    <p className="text-xs text-slate-500">
                      {patient.gender === 'Male' ? '👨' : '👩'} {patient.gender || 'Unknown'} · {calculateAge(patient.dob) ? `${calculateAge(patient.dob)} years` : 'Age N/A'}
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <div className="col-span-2 mb-2 lg:mb-0">
                  <p className="text-sm text-slate-700">{patient.phone || '—'}</p>
                  <p className="text-xs text-slate-400 truncate">{patient.email || '—'}</p>
                </div>

                {/* First Visit */}
                <div className="col-span-2 mb-2 lg:mb-0">
                  <p className="text-sm text-slate-600">
                    {patient.first_encounter ? new Date(patient.first_encounter).toLocaleDateString() : '—'}
                  </p>
                </div>

                {/* Last Visit */}
                <div className="col-span-2 mb-2 lg:mb-0">
                  <p className="text-sm text-slate-600">
                    {patient.last_encounter ? new Date(patient.last_encounter).toLocaleDateString() : '—'}
                  </p>
                </div>

                {/* Visits Count */}
                <div className="col-span-1 mb-2 lg:mb-0">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                    📋 {patient.encounters?.length || 0}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setNewEncounterPatient(patient)}
                    className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200 transition-colors"
                  >
                    ➕ Encounter
                  </button>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">⋮</button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 min-w-[180px] z-50" sideOffset={5} align="end">
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer rounded-lg"
                        onClick={() => setEditingPatient(patient)}
                      >
                        ✏️ Edit Patient
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 cursor-pointer rounded-lg"
                        onClick={() => setCloseEncounterPatient(patient)}
                      >
                        ⏹️ Close Encounter
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded-lg"
                        onClick={() => handleDelete(patient.id)}
                      >
                        🗑️ Delete Patient
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === patient.id && (
                <div className="px-4 py-5 bg-gradient-to-r from-slate-50 via-teal-50/20 to-cyan-50/30 border-t border-slate-100">
                  {/* Patient Details Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">📛 Full Name</p>
                      <p className="text-sm font-semibold text-slate-800">{getFullName(patient)}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">🎂 Age</p>
                      <p className="text-sm font-semibold text-slate-800">{calculateAge(patient.dob) || 'N/A'} years</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">👤 Gender</p>
                      <p className="text-sm font-semibold text-slate-800">{patient.gender === 'Male' ? '👨' : '👩'} {patient.gender || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">📞 Phone</p>
                      <p className="text-sm font-semibold text-slate-800">{patient.phone || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">📅 Date Registered</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Data Consent & Tags Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Data Consent Section */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">✅</span>
                          <span className="text-sm font-medium text-slate-700">Data Consent</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConsentPatient(patient); }}
                          className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                          Pending ❓
                        </button>
                      </div>
                    </div>

                    {/* Patient Tags Section */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏷️</span>
                          <span className="text-sm font-medium text-slate-700">Patient Tags</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setTagsPatient(patient); }}
                          className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                          ➕ Add Tags
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">No tags recorded for this patient</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setNewEncounterPatient(patient); }}
                      className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all hover:scale-[1.02]"
                    >
                      🏥 New Encounter
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConsentPatient(patient); }}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all hover:scale-[1.02]"
                    >
                      ✅ Data Consent
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setTagsPatient(patient); }}
                      className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all hover:scale-[1.02]"
                    >
                      🏷️ Manage Tags
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/patients/${patient.id}`); }}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      📜 View History
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingPatient(patient); }}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      ✏️ Edit Patient
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
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
              {filteredPatients.length > 0 ? `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, filteredPatients.length)} of ${filteredPatients.length}` : '0 results'}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm">⏮️</button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm">◀️ Prev</button>
              <span className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium">{currentPage}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm">Next ▶️</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm">⏭️</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={() => { queryClient.invalidateQueries(["patients"]); setEditingPatient(null); }}
        />
      )}
      {newEncounterPatient && (
        <NewEncounterModal
          patient={newEncounterPatient}
          onClose={() => setNewEncounterPatient(null)}
          onStart={() => handleStartEncounter(newEncounterPatient.id)}
        />
      )}
      {closeEncounterPatient && (
        <CloseEncounterModal
          patient={closeEncounterPatient}
          onClose={() => setCloseEncounterPatient(null)}
          onCloseEncounter={handleCloseEncounter}
        />
      )}
      {tagsPatient && (
        <PatientTagsModal
          patient={tagsPatient}
          onClose={() => setTagsPatient(null)}
          onSave={() => queryClient.invalidateQueries(["patients"])}
        />
      )}
      {consentPatient && (
        <PatientConsentModal
          patient={consentPatient}
          onClose={() => setConsentPatient(null)}
          onSave={() => queryClient.invalidateQueries(["patients"])}
        />
      )}
    </div>
  );
}