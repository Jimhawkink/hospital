import React, { useState, useEffect } from "react";

interface TriageEntry {
  id: number;
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
  date: string;
}

interface Patient {
  id: string;
  name: string;
  gender: string;
  age: number;
  dateOfBirth: string;
  tags: string[];
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

const TriagePage: React.FC = () => {
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

  const [triageHistory, setTriageHistory] = useState<TriageEntry[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('Triage');
  const [activeSection, setActiveSection] = useState('Triage');

  // Mock data for demonstration
  useEffect(() => {
    setPatient({
      id: "P001",
      name: "Jael Mwanake",
      gender: "Female",
      age: 26,
      dateOfBirth: "03 Apr 1998",
      tags: ["Asthmatic", "AAR"]
    });

    setTriageHistory([]);
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/encounters/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(triageData),
      });
      if (response.ok) {
        // Handle success
        console.log("Triage data saved successfully");
      }
    } catch (error) {
      console.error("Failed to save triage data:", error);
    }
  };

  const sidebarItems = [
    { id: 'triage', label: 'Triage', icon: '📋', active: true },
    { id: 'complaints', label: 'Complaints & HPI', icon: '💬' },
    { id: 'structured', label: 'Structured visit forms', icon: '📝', hasDropdown: true },
    { id: 'review', label: 'Review of systems', icon: '🔍' },
    { id: 'medication', label: 'Medication history', icon: '💊' },
    { id: 'examination', label: 'Examination', icon: '🩺' },
    { id: 'investigation', label: 'Investigation', icon: '🔬', hasDropdown: true },
    { id: 'diagnosis', label: 'Diagnosis and Plan', icon: '📋' },
    { id: 'prescription', label: 'Prescription', icon: '💊' },
    { id: 'schedule', label: 'Appointment schedule', icon: '📅' },
    { id: 'bills', label: 'Patient bills', icon: '💰', hasDropdown: true },
    { id: 'close', label: 'Close encounter', icon: '✓' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-blue-600 text-white">
        <div className="p-4 border-b border-blue-500">
          <h3 className="font-semibold">Patient encounter</h3>
          <p className="text-xs text-blue-200 mt-1">Manage your patient's visit information and actions here.</p>
        </div>
        <div className="p-2">
          <div className="bg-blue-700 rounded p-2 mb-2 flex items-center">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2">
              <span className="text-blue-600 text-xs font-bold">P</span>
            </div>
          </div>
        </div>
        <nav className="mt-4">
          {sidebarItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => setActiveSection(item.label)}
                className={`w-full flex items-center px-4 py-2 text-sm hover:bg-blue-500 ${
                  item.active ? 'bg-blue-500 border-r-2 border-white' : ''
                }`}
              >
                <span className="w-5 h-5 mr-3 flex items-center justify-center text-xs">
                  {item.icon}
                </span>
                {item.label}
                {item.hasDropdown && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Center Content */}
        <div className="flex-1 bg-white">
          {/* Search Bar */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 border-0 focus:outline-none text-gray-600"
              />
              <div className="flex items-center ml-4">
                <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2">PO</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">Dr Product Ops</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Triage</h1>
            
            <h2 className="text-lg font-semibold mb-4">Add readings</h2>
            
            {/* Triage Form */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Patient status</label>
                <select
                  value={triageData.patientStatus}
                  onChange={(e) => setTriageData({ ...triageData, patientStatus: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select option</option>
                  <option value="Stable">Stable</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  value={triageData.temperature}
                  onChange={(e) => setTriageData({ ...triageData, temperature: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Heart rate (bpm)</label>
                <input
                  type="number"
                  value={triageData.heartRate}
                  onChange={(e) => setTriageData({ ...triageData, heartRate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Blood pressure (mmHg)</label>
                <input
                  type="text"
                  value={triageData.bloodPressure}
                  onChange={(e) => setTriageData({ ...triageData, bloodPressure: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Respiratory rate (bpm)</label>
                <input
                  type="number"
                  value={triageData.respiratoryRate}
                  onChange={(e) => setTriageData({ ...triageData, respiratoryRate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Blood oxygenation (%)</label>
                <input
                  type="number"
                  value={triageData.bloodOxygenation}
                  onChange={(e) => setTriageData({ ...triageData, bloodOxygenation: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={triageData.weight}
                  onChange={(e) => setTriageData({ ...triageData, weight: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={triageData.height}
                  onChange={(e) => setTriageData({ ...triageData, height: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">MUAC (cm)</label>
                <input
                  type="number"
                  value={triageData.muac}
                  onChange={(e) => setTriageData({ ...triageData, muac: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">LMP</label>
                <div className="relative">
                  <input
                    type="date"
                    value={triageData.lmpDate}
                    onChange={(e) => setTriageData({ ...triageData, lmpDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Enter date"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-1">Comments</label>
              <textarea
                value={triageData.comments}
                onChange={(e) => setTriageData({ ...triageData, comments: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save readings
            </button>

            {/* Triage History Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Triage history</h3>
                <div className="flex space-x-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded p-8 text-center">
                <p className="text-gray-500">No triage has been taken for this patient</p>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Overview Sidebar */}
        <div className="w-80 bg-white border-l shadow-sm">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Patient overview</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Hide</span>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {patient && (
            <div className="p-4">
              {/* Patient Avatar and Basic Info */}
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{patient.name}</h4>
                  <p className="text-sm text-gray-600">
                    {patient.gender} • {patient.age} years • {patient.dateOfBirth}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-blue-600 mr-2">🛒</span>
                    <span className="text-sm font-medium">0</span>
                    <button className="ml-2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 0 0 2-14 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {patient.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-800 mt-2 flex items-center">
                  View all tags
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-4 mb-4 border-b">
                {['Triage', 'Encounters', 'History'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Latest Triage Info */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Latest taken</span>
                    <button className="text-blue-600 hover:text-blue-800">View all</button>
                  </div>
                  <p className="text-sm text-gray-600">Not recorded</p>
                </div>

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-500">Triage category</span>
                    <span className="text-xs text-gray-500">Temperature</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm mr-1 text-green-600">●</span>
                      <span className="text-sm">Stable</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">38 °C</span>
                      <span className="text-xs text-red-500 ml-1">H</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Heart rate</span>
                    <p className="text-sm font-medium">84 BPM</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Blood pressure</span>
                    <p className="text-sm font-medium">124/86 mmHg</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Respiratory rate</span>
                    <div className="flex items-center">
                      <p className="text-sm font-medium mr-1">16 breaths/min</p>
                      <span className="text-xs text-red-500">L</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Blood oxygenation</span>
                    <p className="text-sm font-medium">98 %</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Weight</span>
                    <p className="text-sm font-medium">56 kg</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Height</span>
                    <p className="text-sm font-medium">145 cm</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">BMI</span>
                    <div className="flex items-center">
                      <p className="text-sm font-medium mr-1">26.6</p>
                      <span className="text-xs text-red-500">H</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">MUAC</span>
                    <p className="text-sm font-medium">Not recorded</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500">LMP</span>
                  <p className="text-sm font-medium">4 weeks ago</p>
                  <p className="text-xs text-gray-500">(04 Dec 2024)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriagePage;