import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Complaint {
  id?: number;
  encounter_id: number;
  complaint_text: string;
  duration_value?: number | null;
  duration_unit?: string | null;
  comments?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface EncounterInfo {
  encounter_type: string;
  is_follow_up: boolean;
  is_referred: boolean;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  phone: string;
  patientNumber?: string;
}

interface Encounter {
  id: number;
  encounter_number: string;
  encounter_type: string;
  patient_id: number;
  createdAt: string;
  updatedAt: string;
}

const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [currentComplaint, setCurrentComplaint] = useState<Complaint>({
    complaint_text: '',
    duration_value: null,
    duration_unit: null,
    comments: null,
    encounter_id: 0,
  });
  const [encounterInfo, setEncounterInfo] = useState<EncounterInfo>({
    encounter_type: 'Consultation',
    is_follow_up: false,
    is_referred: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch or create encounter when patient changes
  useEffect(() => {
    if (selectedPatient) {
      fetchOrCreateEncounter();
    }
  }, [selectedPatient]);

  // Fetch complaints and encounter info when encounter changes
  useEffect(() => {
    if (currentEncounter) {
      fetchComplaints();
      fetchEncounterInfo();
    }
  }, [currentEncounter]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get<Patient[]>('/api/patients');
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get<Patient[]>(`/api/patients/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Failed to search patients:', error);
      toast.error('Failed to search patients');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchOrCreateEncounter = async () => {
    if (!selectedPatient) return;

    try {
      const response = await axios.get<Encounter[]>(`/api/encounters?patient_id=${selectedPatient.id}`);
      const openEncounters = response.data.filter(
        (encounter) => encounter.patient_id === selectedPatient.id
      );

      if (openEncounters.length > 0) {
        const latestEncounter = openEncounters.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setCurrentEncounter(latestEncounter);
        setCurrentComplaint((prev) => ({ ...prev, encounter_id: latestEncounter.id }));
      } else {
        const newEncounterResponse = await axios.post<Encounter>('/api/encounters', {
          patient_id: selectedPatient.id,
          encounter_type: 'Consultation',
          encounter_number: `ENC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          priority_type: 'Normal',
        });
        setCurrentEncounter(newEncounterResponse.data);
        setCurrentComplaint((prev) => ({ ...prev, encounter_id: newEncounterResponse.data.id }));
      }
    } catch (error) {
      console.error('Error fetching or creating encounter:', error);
      toast.error('Failed to fetch or create encounter');
    }
  };

  const fetchComplaints = async () => {
    if (!currentEncounter) return;
    try {
      const response = await axios.get<Complaint[]>(`/api/encounters/${currentEncounter.id}/complaints`);
      setComplaints(response.data || []);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setComplaints([]);
      } else {
        console.error('Error fetching complaints:', error);
        toast.error('Failed to load complaints');
      }
    }
  };

  const fetchEncounterInfo = async () => {
    if (!currentEncounter) return;
    try {
      const response = await axios.get<Encounter>(`/api/encounters/${currentEncounter.id}`);
      setEncounterInfo({
        encounter_type: response.data.encounter_type || 'Consultation',
        is_follow_up: false,
        is_referred: false,
      });
    } catch (error) {
      console.error('Error fetching encounter info:', error);
      toast.error('Failed to fetch encounter info');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchPatients(query);
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setShowSearchResults(false);
    setComplaints([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentComplaint((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  const handleAddComplaint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (!currentComplaint.complaint_text.trim()) {
      toast.error('Please enter a complaint or symptom');
      return;
    }

    if (!currentEncounter) {
      toast.error('No active encounter found');
      return;
    }

    // Validate duration_unit
    if (currentComplaint.duration_unit && !['Hours', 'Days', 'Weeks', 'Months', 'Years'].includes(currentComplaint.duration_unit)) {
      toast.error('Please select a valid duration unit (Hours, Days, Weeks, Months, Years)');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        complaint_text: currentComplaint.complaint_text.trim(),
        duration_value: currentComplaint.duration_value !== undefined ? currentComplaint.duration_value : null,
        duration_unit: currentComplaint.duration_unit || null,
        comments: currentComplaint.comments || null,
        encounter_id: currentEncounter.id,
      };

      const response = await axios.post<Complaint>(`/api/encounters/${currentEncounter.id}/complaints`, payload);

      // Add the new complaint to the list immediately
      const newComplaint: Complaint = response.data;
      setComplaints(prev => [...prev, newComplaint]);

      toast.success('Complaint successfully added');
      setCurrentComplaint({
        complaint_text: '',
        duration_value: null,
        duration_unit: null,
        comments: null,
        encounter_id: currentEncounter.id,
      });
    } catch (error: any) {
      console.error('Error saving complaint:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save complaint';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComplaint = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await axios.delete(`/api/encounters/complaints/${id}`);
        // Remove the complaint from the list immediately
        setComplaints(prev => prev.filter(complaint => complaint.id !== id));
        toast.success('Complaint deleted successfully');
      } catch (error) {
        console.error('Error deleting complaint:', error);
        toast.error('Failed to delete complaint');
      }
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-sm">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="py-2 px-3 bg-white border-b mb-4 relative">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 border-0 focus:outline-none text-gray-600 text-sm"
          />
        </div>

        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-50 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-center text-gray-500 text-sm">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">No patients found</div>
            ) : (
              searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className="p-2 border-b border-gray-100 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="font-medium text-sm">{patient.firstName} {patient.lastName}</div>
                  <div className="text-xs text-gray-600">
                    {patient.gender} • {calculateAge(patient.dob)} years • {patient.phone} • {patient.id}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">Complaints & HPI</h1>
            <p className="text-xs text-gray-600">
              Last saved automatically on 08 Feb 2025 at 4:36 AM by Dr. Product Ops
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {selectedPatient.firstName} {selectedPatient.lastName} • {selectedPatient.gender} • {calculateAge(selectedPatient.dob)} years • DOB: {formatDate(selectedPatient.dob)}
            </p>
            {currentEncounter && (
              <p className="text-xs text-gray-600">
                Encounter: {currentEncounter.encounter_number} • {currentEncounter.encounter_type}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              JM
            </div>
            <button
              onClick={() => {
                setSelectedPatient(null);
                setCurrentEncounter(null);
                setComplaints([]);
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Change Patient
            </button>
          </div>
        </div>
      )}

      {!selectedPatient && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">👨‍⚕️</div>
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Select a Patient</h2>
          <p className="text-gray-500 text-sm">Search for a patient above to begin recording complaints</p>
        </div>
      )}

      {selectedPatient && currentEncounter && (
        <>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Select encounter type</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  value={encounterInfo.encounter_type}
                  onChange={(e) => setEncounterInfo({ ...encounterInfo, encounter_type: e.target.value })}
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Investigation">Investigation</option>
                  <option value="Family Planning">Family Planning</option>
                  <option value="ANC">ANC</option>
                  <option value="PNC">PNC</option>
                  <option value="Immunization">Immunization</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Is this a follow up review?</label>
                <div className="flex space-x-3">
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="radio"
                      className="form-radio h-3 w-3"
                      checked={encounterInfo.is_follow_up}
                      onChange={() => setEncounterInfo({ ...encounterInfo, is_follow_up: true })}
                    />
                    <span className="ml-1">Yes</span>
                  </label>
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="radio"
                      className="form-radio h-3 w-3"
                      checked={!encounterInfo.is_follow_up}
                      onChange={() => setEncounterInfo({ ...encounterInfo, is_follow_up: false })}
                    />
                    <span className="ml-1">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Has the patient been referred from another health care unit?
                </label>
                <div className="flex space-x-3">
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="radio"
                      className="form-radio h-3 w-3"
                      checked={encounterInfo.is_referred}
                      onChange={() => setEncounterInfo({ ...encounterInfo, is_referred: true })}
                    />
                    <span className="ml-1">Yes</span>
                  </label>
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="radio"
                      className="form-radio h-3 w-3"
                      checked={!encounterInfo.is_referred}
                      onChange={() => setEncounterInfo({ ...encounterInfo, is_referred: false })}
                    />
                    <span className="ml-1">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Upload documents/attachments</label>
                <div className="flex items-center">
                  <input type="file" className="hidden" id="file-upload" multiple />
                  <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload documents/attachments
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Add complaint</h2>

            <form onSubmit={handleAddComplaint}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Patient complaint or symptoms</label>
                  <select
                    name="complaint_text"
                    value={currentComplaint.complaint_text}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Select option</option>
                    <option value="Headache">Headache</option>
                    <option value="Fever">Fever</option>
                    <option value="Cough">Cough</option>
                    <option value="Diarrhea">Diarrhea</option>
                    <option value="Nausea">Nausea</option>
                    <option value="Vomiting">Vomiting</option>
                    <option value="Chest pain">Chest pain</option>
                    <option value="Abdominal pain">Abdominal pain</option>
                    <option value="Back pain">Back pain</option>
                    <option value="Fatigue">Fatigue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">For how long (optional)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="duration_value"
                      value={currentComplaint.duration_value || ''}
                      onChange={handleInputChange}
                      className="flex-1 p-2 border border-gray-300 rounded text-sm"
                      placeholder="Value"
                      min="0"
                    />
                    <select
                      name="duration_unit"
                      value={currentComplaint.duration_unit || ''}
                      onChange={handleInputChange}
                      className="flex-1 p-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select</option>
                      <option value="Hours">Hours</option>
                      <option value="Days">Days</option>
                      <option value="Weeks">Weeks</option>
                      <option value="Months">Months</option>
                      <option value="Years">Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Comments</label>
                  <input
                    type="text"
                    name="comments"
                    value={currentComplaint.comments || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="Additional comments"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save complaint'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-pink-300">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Current Complaints</h2>

            {complaints.length === 0 ? (
              <p className="text-gray-500 text-sm">No complaint has been recorded for this encounter</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S/N
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symptom
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaints.map((complaint, index) => (
                      <tr key={complaint.id || index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {complaint.complaint_text}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {complaint.duration_value && complaint.duration_unit 
                            ? `${complaint.duration_value} ${complaint.duration_unit.toLowerCase()}`
                            : 'Not recorded'
                          }
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                          {complaint.comments || 'Not recorded'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => complaint.id && handleDeleteComplaint(complaint.id)}
                            className="text-red-600 hover:text-red-800 text-xs p-1"
                            title="Delete complaint"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-600">
                  <span>Rows per page: 5</span>
                  <span>1-{complaints.length} of {complaints.length}</span>
                  <div className="flex space-x-1">
                    <button className="p-1 rounded hover:bg-gray-200" disabled>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button className="p-1 rounded hover:bg-gray-200" disabled>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">HPI</h2>
            <p className="text-xs text-gray-600 mb-2">
              A description of complaints, their onset, duration/timing, character, triggering/aggravating/relieving factors
            </p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded text-sm"
              rows={4}
              placeholder="Enter HPI details here..."
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ComplaintsPage;