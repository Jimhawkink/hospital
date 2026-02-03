// packages/frontend/src/pages/PatientEncounterPage.tsx
// Modern Patient Encounter Page with professional UI
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import ComplaintsPage from './ComplaintsPage';
import InvestigationPage from './InvestigationPage';

// ----- Types -----
interface TriageEntry {
  id: number;
  patient_id: number;
  patient_status: string;
  temperature: string;
  heart_rate: string;
  blood_pressure: string;
  respiratory_rate: string;
  blood_oxygenation: string;
  weight: string;
  height: string;
  muac: string;
  lmp_date: string;
  comments: string;
  date: string;
  createdAt: string;
}

interface Patient {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dob: string;
  patientStatus?: string;
  phone: string;
  email?: string;
  patientNumber?: string;
  areaOfResidence?: string;
  county?: string;
  createdAt: string;
}

interface Encounter {
  id: number;
  encounter_number: string;
  encounter_type: string;
  priority_type?: string;
  notes?: string;
  createdAt: string;
  provider_name?: string;
}

interface TriageData {
  patientStatus: string;
  temperature: string;
  heartRate: string;
  bloodPressure: string;
  respiratoryRate: string;
  bloodOxygenation: string;
  weight: string;
  height: string;
  muac: string;
  lmpDate: string;
  comments: string;
}

// ----- Component -----
const PatientEncounterPage: React.FC = () => {
  const navigate = useNavigate();
  const { encounterId: routeEncounterId, patientId: routePatientId } = useParams();

  // Form state
  const [triageData, setTriageData] = useState<TriageData>({
    patientStatus: "",
    temperature: "",
    heartRate: "",
    bloodPressure: "",
    respiratoryRate: "",
    bloodOxygenation: "",
    weight: "",
    height: "",
    muac: "",
    lmpDate: "",
    comments: "",
  });

  // Data state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [triageHistory, setTriageHistory] = useState<TriageEntry[]>([]);
  const [encounterHistory, setEncounterHistory] = useState<Encounter[]>([]);
  const [latestTriage, setLatestTriage] = useState<TriageEntry | null>(null);
  const [encounterId, setEncounterId] = useState<string | null>(routeEncounterId || null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'Triage' | 'Encounters' | 'History'>('Triage');
  const [activeSection, setActiveSection] = useState('Triage');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPatientPanelVisible, setIsPatientPanelVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  // API helper


  // Load patient from route params
  useEffect(() => {
    if (routePatientId) {
      loadPatient(parseInt(routePatientId));
    }
  }, [routePatientId]);

  const loadPatient = async (patientId: number) => {
    try {
      const res = await api.get<Patient>(`/patients/${patientId}`);
      if (res.data) {
        handlePatientSelect(res.data as Patient);
      }
    } catch (err) {
      console.error("Failed to load patient:", err);
    }
  };

  // Search patients
  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get<Patient[] | { patients: Patient[] }>(`/patients/search?q=${encodeURIComponent(query)}`);
      const data = res.data as any;
      setSearchResults(Array.isArray(data) ? data : data?.patients || []);
      setShowSearchResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery("");
    setShowSearchResults(false);
    setIsPatientPanelVisible(true);

    // Fetch encounters
    try {
      const res = await api.get(`/encounters?patientId=${patient.id}`);
      const encounters = Array.isArray(res.data) ? res.data : [];
      setEncounterHistory(encounters);
      if (encounters.length > 0 && !encounterId) {
        setEncounterId(String(encounters[0].id));
      }
    } catch { setEncounterHistory([]); }

    // Fetch triage history
    await fetchTriageHistory(patient.id);
  };

  const fetchTriageHistory = async (patientId: number) => {
    try {
      const res = await api.get<TriageEntry[] | { data: TriageEntry[] }>(`/triage?patientId=${patientId}`);
      const resData = res.data as any;
      const data = Array.isArray(resData) ? resData : resData?.data || [];
      const sorted = data.sort((a: TriageEntry, b: TriageEntry) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTriageHistory(sorted);
      setLatestTriage(sorted[0] || null);
    } catch {
      setTriageHistory([]);
      setLatestTriage(null);
    }
  };

  // Save triage
  const handleSave = async () => {
    if (!selectedPatient) {
      setSaveMessage({ type: 'error', message: "Please select a patient first" });
      return;
    }
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await api.post("/triage", {
        ...triageData,
        patient_id: selectedPatient.id,
        date: new Date().toISOString(),
        encounter_id: encounterId
      });
      setSaveMessage({ type: 'success', message: "✅ Triage data saved successfully!" });
      setTriageData({ patientStatus: "", temperature: "", heartRate: "", bloodPressure: "", respiratoryRate: "", bloodOxygenation: "", weight: "", height: "", muac: "", lmpDate: "", comments: "" });
      await fetchTriageHistory(selectedPatient.id);
    } catch (err: any) {
      setSaveMessage({ type: 'error', message: err?.response?.data?.message || "Failed to save triage data" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  // Utilities
  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getInitials = (p: Patient) => `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();

  const calculateBMI = (weight: string, height: string) => {
    if (!weight || !height) return null;
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (isNaN(w) || isNaN(h) || h === 0) return null;
    return (w / (h * h)).toFixed(1);
  };

  // Sidebar items
  const sidebarItems = [
    { id: 'triage', label: 'Triage', icon: '🩺', section: 'Triage' },
    { id: 'complaints', label: 'Complaints & HPI', icon: '💬', section: 'Complaints' },
    { id: 'structured', label: 'Structured visit forms', icon: '📝', hasDropdown: true },
    { id: 'review', label: 'Review of systems', icon: '🔍', section: 'Review' },
    { id: 'medication', label: 'Medication history', icon: '💊', section: 'Medication' },
    { id: 'examination', label: 'Examination', icon: '👁️', section: 'Examination' },
    {
      id: 'investigation', label: 'Investigation', icon: '🔬', hasDropdown: true, subItems: [
        { id: 'laboratory', label: 'Laboratory', section: 'Laboratory' },
        { id: 'imaging', label: 'Imaging', section: 'Imaging' },
      ]
    },
    { id: 'diagnosis', label: 'Diagnosis and Plan', icon: '📋', section: 'Diagnosis' },
    { id: 'prescription', label: 'Prescription', icon: '💉', section: 'Prescription' },
    { id: 'schedule', label: 'Appointment schedule', icon: '📅', section: 'Schedule' },
    { id: 'bills', label: 'Patient bills', icon: '💰', hasDropdown: true },
    { id: 'attachments', label: 'Attachments', icon: '📎', section: 'Attachments' },
    { id: 'close', label: 'Close encounter', icon: '✅', section: 'Close' },
  ];

  // Render main content
  const renderContent = () => {
    if (!selectedPatient) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-4xl mb-6">
            👨‍⚕️
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Select a Patient</h2>
          <p className="text-slate-500 text-sm">Search for a patient above to begin the encounter</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'Triage':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  🩺 Triage
                </h1>
                <p className="text-slate-500 text-sm mt-1">Add vital readings for this patient</p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                🔄 Change Patient
              </button>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${saveMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                <span className="text-xl">{saveMessage.type === 'success' ? '✅' : '⚠️'}</span>
                <span className="text-sm font-medium">{saveMessage.message}</span>
              </div>
            )}

            {/* Vitals Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                📊 Add readings
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Patient Status */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Patient status</label>
                  <select
                    value={triageData.patientStatus}
                    onChange={(e) => setTriageData({ ...triageData, patientStatus: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  >
                    <option value="">Select option</option>
                    <option value="Stable">🟢 Stable</option>
                    <option value="Critical">🔴 Critical</option>
                    <option value="Unstable">🟡 Unstable</option>
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">🌡️ Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={triageData.temperature}
                    onChange={(e) => setTriageData({ ...triageData, temperature: e.target.value })}
                    placeholder="36.5"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* Heart Rate */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">❤️ Heart rate (bpm)</label>
                  <input
                    type="number"
                    value={triageData.heartRate}
                    onChange={(e) => setTriageData({ ...triageData, heartRate: e.target.value })}
                    placeholder="72"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* Blood Pressure */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">🩸 Blood pressure (mmHg)</label>
                  <input
                    type="text"
                    value={triageData.bloodPressure}
                    onChange={(e) => {
                      // Allow only numbers and forward slash
                      const value = e.target.value.replace(/[^0-9/]/g, '');
                      setTriageData({ ...triageData, bloodPressure: value });
                    }}
                    placeholder="120/80"
                    pattern="^\d{2,3}\/\d{2,3}$"
                    title="Enter blood pressure as systolic/diastolic (e.g., 120/80)"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* Respiratory Rate */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">💨 Respiratory (bpm)</label>
                  <input
                    type="number"
                    value={triageData.respiratoryRate}
                    onChange={(e) => setTriageData({ ...triageData, respiratoryRate: e.target.value })}
                    placeholder="16"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* SpO2 */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">💧 Blood oxygenation (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={triageData.bloodOxygenation}
                    onChange={(e) => setTriageData({ ...triageData, bloodOxygenation: e.target.value })}
                    placeholder="98"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">⚖️ Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={triageData.weight}
                    onChange={(e) => setTriageData({ ...triageData, weight: e.target.value })}
                    placeholder="70"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">📏 Height (cm)</label>
                  <input
                    type="number"
                    value={triageData.height}
                    onChange={(e) => setTriageData({ ...triageData, height: e.target.value })}
                    placeholder="170"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* MUAC */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">💪 MUAC (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={triageData.muac}
                    onChange={(e) => setTriageData({ ...triageData, muac: e.target.value })}
                    placeholder="25"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* LMP */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">📅 LMP</label>
                  <input
                    type="date"
                    value={triageData.lmpDate}
                    onChange={(e) => setTriageData({ ...triageData, lmpDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Comments */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">📝 Comments</label>
                <textarea
                  value={triageData.comments}
                  onChange={(e) => setTriageData({ ...triageData, comments: e.target.value })}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <>💾 Save readings</>
                  )}
                </button>
              </div>
            </div>

            {/* Triage History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  📋 Triage history
                </h3>
                <button
                  onClick={() => selectedPatient && fetchTriageHistory(selectedPatient.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                  title="Refresh"
                >
                  🔄
                </button>
              </div>

              {triageHistory.length > 0 ? (
                <div className="space-y-3">
                  {triageHistory.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{formatDateTime(entry.date)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.patient_status === 'Stable' ? 'bg-emerald-100 text-emerald-700' :
                          entry.patient_status === 'Critical' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                          {entry.patient_status === 'Stable' ? '🟢' : entry.patient_status === 'Critical' ? '🔴' : '🟡'} {entry.patient_status}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div><span className="text-slate-400">Temp:</span> <span className="font-medium">{entry.temperature || '-'}°C</span></div>
                        <div><span className="text-slate-400">HR:</span> <span className="font-medium">{entry.heart_rate || '-'} bpm</span></div>
                        <div><span className="text-slate-400">BP:</span> <span className="font-medium">{entry.blood_pressure || '-'}</span></div>
                        <div><span className="text-slate-400">SpO2:</span> <span className="font-medium">{entry.blood_oxygenation || '-'}%</span></div>
                      </div>
                      {entry.comments && (
                        <p className="mt-2 text-xs text-slate-500 italic">"{entry.comments}"</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-3xl mb-2 block">📭</span>
                  <p className="text-slate-500 text-sm">No triage records for this patient</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'Complaints':
        return <ComplaintsPage />;

      case 'Laboratory':
      case 'Imaging':
        if (!encounterId) return <div className="text-center py-12 text-red-500">No encounter ID available</div>;
        return <InvestigationPage />;

      default:
        return (
          <div className="text-center py-20">
            <span className="text-4xl mb-4 block">🚧</span>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">{activeSection}</h3>
            <p className="text-slate-500 text-sm">This section is under development</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar */}
      <div className={`bg-white border-r border-slate-200 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-56'} flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Patient encounter</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Manage visit information</p>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            {isSidebarCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sidebarItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.hasDropdown) {
                    setExpandedItems(p => ({ ...p, [item.id]: !p[item.id] }));
                  } else if (item.section) {
                    setActiveSection(item.section);
                  }
                }}
                className={`w-full flex items-center px-3 py-2 text-xs transition-colors ${activeSection === item.section ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-slate-600 hover:bg-slate-50'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <span className="text-sm">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <>
                    <span className="ml-2 flex-1 text-left">{item.label}</span>
                    {item.hasDropdown && <span className="text-[10px]">{expandedItems[item.id] ? '▼' : '▶'}</span>}
                  </>
                )}
              </button>

              {/* Sub-items */}
              {!isSidebarCollapsed && expandedItems[item.id] && item.subItems && (
                <div className="ml-6 border-l border-slate-200">
                  {item.subItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSection(sub.section)}
                      className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${activeSection === sub.section ? 'text-blue-700 bg-blue-50' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Collapse button at bottom */}
        {!isSidebarCollapsed && (
          <div className="p-3 border-t border-slate-100">
            <button className="w-full px-3 py-2 text-xs text-slate-500 hover:text-slate-700 flex items-center gap-2">
              <span>⬅️</span> Collapse
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </div>
      </div>

      {/* Right Panel - Patient Overview */}
      {selectedPatient && isPatientPanelVisible && (
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              👤 Patient overview
            </h3>
            <button onClick={() => setIsPatientPanelVisible(false)} className="text-slate-400 hover:text-slate-600 p-1" title="Hide panel">
              ➡️
            </button>
          </div>

          {/* Patient Info */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {getInitials(selectedPatient)}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">{selectedPatient.firstName} {selectedPatient.lastName}</h4>
                <p className="text-xs text-slate-500">
                  {selectedPatient.gender === 'Male' ? '👨' : '👩'} {selectedPatient.gender} · {calculateAge(selectedPatient.dob)} years · {formatDate(selectedPatient.dob)}
                </p>
              </div>
              <button className="relative">
                <span className="text-xl">🛒</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">0</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              {selectedPatient.phone && <p>📞 {selectedPatient.phone}</p>}
              {selectedPatient.email && <p>📧 {selectedPatient.email}</p>}
              {selectedPatient.patientNumber && <p>🏥 Patient #{selectedPatient.patientNumber}</p>}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-slate-400">No tags added</span>
              <button className="text-blue-600 text-xs font-medium hover:underline">View all tags +</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(['Triage', 'Encounters', 'History'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'Triage' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Latest taken</span>
                  <button className="text-blue-600 hover:underline">View all</button>
                </div>

                {latestTriage ? (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Triage category</span>
                        <span className={`font-medium ${latestTriage.patient_status === 'Stable' ? 'text-emerald-600' :
                          latestTriage.patient_status === 'Critical' ? 'text-red-600' : 'text-amber-600'
                          }`}>
                          {latestTriage.patient_status === 'Stable' ? '🟢' : latestTriage.patient_status === 'Critical' ? '🔴' : '🟡'} {latestTriage.patient_status || 'Not recorded'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Temperature</span>
                        <span className={`font-medium ${parseFloat(latestTriage.temperature || '0') > 37.5 ? 'text-red-600' : ''}`}>
                          {latestTriage.temperature || 'Not recorded'}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Heart rate</span>
                        <span className="font-medium">{latestTriage.heart_rate || 'Not recorded'} BPM</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Blood pressure</span>
                        <span className="font-medium">{latestTriage.blood_pressure || 'Not recorded'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Respiratory rate</span>
                        <span className={`font-medium ${parseInt(latestTriage.respiratory_rate || '0') < 12 ? 'text-red-600' : ''}`}>
                          {latestTriage.respiratory_rate || 'Not recorded'} breaths/min
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Blood oxygenation</span>
                        <span className="font-medium">{latestTriage.blood_oxygenation || 'Not recorded'}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Weight</span>
                        <span className="font-medium">{latestTriage.weight || 'Not recorded'} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Height</span>
                        <span className="font-medium">{latestTriage.height || 'Not recorded'} cm</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">BMI</span>
                        <span className="font-medium">{calculateBMI(latestTriage.weight, latestTriage.height) || 'Not recorded'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">MUAC</span>
                        <span className="font-medium">{latestTriage.muac || 'Not recorded'}</span>
                      </div>
                      {latestTriage.lmp_date && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block">LMP</span>
                          <span className="font-medium">{formatDate(latestTriage.lmp_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Not recorded</p>
                )}
              </div>
            )}

            {activeTab === 'Encounters' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Encounter history</span>
                  <button className="text-blue-600 hover:underline">View all</button>
                </div>

                {encounterHistory.length > 0 ? (
                  encounterHistory.slice(0, 5).map((enc) => (
                    <div key={enc.id} className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Encounter type</span>
                      </div>
                      <p className="font-medium text-slate-700">{enc.encounter_type}</p>
                      <div className="flex items-center justify-between text-slate-400 pt-1">
                        <span>📅 {formatDateTime(enc.createdAt)}</span>
                        <span>👨‍⚕️ {enc.provider_name || 'Provider'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No encounters found</p>
                )}
              </div>
            )}

            {activeTab === 'History' && (
              <div className="space-y-3">
                {['Allergies', 'Medical/Surgical history', 'Family history'].map((section) => (
                  <div key={section} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{section}</span>
                      <button className="text-blue-600">+ Add</button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">No records documented</p>
                  </div>
                ))}
                <button className="text-blue-600 text-xs hover:underline">View all</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Panel - Show Button when hidden */}
      {selectedPatient && !isPatientPanelVisible && (
        <div className="bg-white border-l border-slate-200 flex items-start pt-3 px-1">
          <button
            onClick={() => setIsPatientPanelVisible(true)}
            className="text-blue-600 hover:text-blue-700 p-1"
            title="Show patient overview"
          >
            ⬅️
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientEncounterPage;
