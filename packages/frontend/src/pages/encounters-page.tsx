import React, { useEffect, useState } from "react";

type Encounter = {
  id: string;
  encounter_number: string;
  encounter_type: string;
  priority_type?: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient_id: string;
  provider_id: string;
  patient_name: string;
  provider_name: string;
  patient_gender?: string;
  patient_age?: number;
  status?: string;
};

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
};

type Staff = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  jobTitle: string;
};

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [filteredEncounters, setFilteredEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEncounters();
  }, []);

  useEffect(() => {
    filterEncounters();
  }, [searchQuery, encounters, filterStatus, filterType]);

  const fetchEncounters = async () => {
    const token = localStorage.getItem("hms_token");
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setLoading(true);
      const [encountersRes, patientsRes, staffRes] = await Promise.all([
        fetch("http://localhost:5000/api/encounters", { headers }).then(r => r.json()),
        fetch("http://localhost:5000/api/patients", { headers }).then(r => r.json()),
        fetch("http://localhost:5000/api/staff", { headers }).then(r => r.json()),
      ]);

      const encountersData = Array.isArray(encountersRes) 
        ? encountersRes 
        : encountersRes?.data || [];
      
      const patientsData = Array.isArray(patientsRes) ? patientsRes : [];
      const staffData = Array.isArray(staffRes) ? staffRes : [];

      const patientMap = patientsData.reduce((map: any, patient: Patient) => {
        map[patient.id] = patient;
        return map;
      }, {});

      const staffMap = staffData.reduce((map: any, staff: Staff) => {
        map[staff.id] = staff;
        return map;
      }, {});

      const enrichedEncounters = encountersData.map((encounter: any) => {
        const patient = patientMap[encounter.patient_id];
        const provider = staffMap[encounter.provider_id];
        
        let age = null;
        if (patient?.dob) {
          const birthDate = new Date(patient.dob);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
        }

        return {
          ...encounter,
          patient_name: patient
            ? `${patient.first_name} ${patient.last_name}`
            : "Unknown Patient",
          provider_name: provider
            ? `${provider.firstName} ${provider.lastName}`
            : "Unknown Provider",
          patient_gender: patient?.gender || "Unknown",
          patient_age: age,
          status: encounter.status || "Encounter Opened",
        };
      });

      setEncounters(enrichedEncounters);
      setFilteredEncounters(enrichedEncounters);
    } catch (err: any) {
      setError(err.message || "Failed to load encounters");
    } finally {
      setLoading(false);
    }
  };

  const filterEncounters = () => {
    let filtered = [...encounters];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (enc) =>
          enc.patient_name.toLowerCase().includes(query) ||
          enc.encounter_number.toLowerCase().includes(query) ||
          enc.provider_name.toLowerCase().includes(query) ||
          enc.id.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((enc) => enc.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((enc) => enc.encounter_type === filterType);
    }

    setFilteredEncounters(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      "Encounter Opened": "bg-blue-100 text-blue-800",
      "Open": "bg-green-100 text-green-800",
      "Triage Recorded": "bg-yellow-100 text-yellow-800",
      "Diagnosis Added": "bg-purple-100 text-purple-800",
      "Completed": "bg-gray-100 text-gray-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEncounters = filteredEncounters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEncounters.length / itemsPerPage);

  const uniqueStatuses = [...new Set(encounters.map((e) => e.status))];
  const uniqueTypes = [...new Set(encounters.map((e) => e.encounter_type))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Encounter List</h1>
              <p className="text-sm text-slate-600 mt-1">
                Showing {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredEncounters.length)} of{" "}
                {filteredEncounters.length}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">Filters</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">New encounter</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search for patients by name, number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Encounter Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    {uniqueTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterType("all");
                      setSearchQuery("");
                    }}
                    className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        ) : currentEncounters.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No encounters found</h3>
            <p className="text-slate-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentEncounters.map((encounter) => (
              <div
                key={encounter.id}
                className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setSelectedEncounter(encounter);
                  setShowDetails(true);
                }}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                        {encounter.patient_name.charAt(0)}
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {encounter.patient_name}
                          </h3>
                          <span className="text-sm text-slate-600">
                            {encounter.patient_gender} · {encounter.patient_age} years
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-slate-600">
                            <span className="font-medium">Full name:</span> {encounter.patient_name}
                          </span>
                          <span className="text-sm text-slate-600">
                            <span className="font-medium">Age:</span> {encounter.patient_age} years
                          </span>
                          <span className="text-sm text-slate-600">
                            <span className="font-medium">Gender:</span> {encounter.patient_gender}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-slate-600 mb-1">Encounter start date</div>
                        <div className="text-sm font-medium text-slate-900">
                          {formatDate(encounter.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600 mb-1">Encounter type</div>
                        <div className="text-sm font-medium text-slate-900">
                          {encounter.encounter_type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600 mb-1">Encounter State</div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(encounter.status || "")}`}>
                          {encounter.status}
                        </span>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Resume encounter
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {[...Array(Math.min(10, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedEncounter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Encounter Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600">Patient Name</div>
                  <div className="text-base font-medium text-slate-900">{selectedEncounter.patient_name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Encounter Number</div>
                  <div className="text-base font-medium text-slate-900">{selectedEncounter.encounter_number}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Provider</div>
                  <div className="text-base font-medium text-slate-900">{selectedEncounter.provider_name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Encounter Type</div>
                  <div className="text-base font-medium text-slate-900">{selectedEncounter.encounter_type}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Status</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedEncounter.status || "")}`}>
                    {selectedEncounter.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Priority</div>
                  <div className="text-base font-medium text-slate-900">{selectedEncounter.priority_type || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Created At</div>
                  <div className="text-base font-medium text-slate-900">{formatDate(selectedEncounter.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Last Updated</div>
                  <div className="text-base font-medium text-slate-900">{formatDate(selectedEncounter.updatedAt)}</div>
                </div>
              </div>
              {selectedEncounter.notes && (
                <div>
                  <div className="text-sm text-slate-600 mb-2">Notes</div>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-900">{selectedEncounter.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}