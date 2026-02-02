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

const TriageHistoryPage: React.FC = () => {
  const [triageHistory, setTriageHistory] = useState<TriageEntry[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('Triage');

  // Mock data for demonstration
  useEffect(() => {
    // Mock patient data
    setPatient({
      id: "P001",
      name: "Jael Mwanake",
      gender: "Female",
      age: 26,
      dateOfBirth: "03 Apr 1998",
      tags: ["Asthmatic", "AAR"]
    });

    // Mock triage history data (empty to match the "No triage has been taken" state)
    setTriageHistory([]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'stable':
        return 'text-green-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status.toLowerCase()) {
      case 'stable':
        return '●';
      case 'critical':
        return '●';
      default:
        return '●';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm h-full">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Triage</h1>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Triage history</h2>
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
            
            {triageHistory.length > 0 ? (
              <div className="space-y-4">
                {triageHistory.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Date:</span>
                        <p className="font-medium">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <p className={`font-medium ${getStatusColor(entry.patientStatus)}`}>
                          {entry.patientStatus}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-500 text-lg">No triage has been taken for this patient</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Overview Sidebar */}
      <div className="w-80 bg-white border-l shadow-sm overflow-y-auto">
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
                    <span className={`text-sm mr-1 ${getStatusColor('Stable')}`}>
                      {getStatusIndicator('Stable')}
                    </span>
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
  );
};

export default TriageHistoryPage;