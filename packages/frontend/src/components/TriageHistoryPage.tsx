import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

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

const TriageHistoryPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [triageHistory, setTriageHistory] = useState<TriageEntry[]>([]);

  useEffect(() => {
    const fetchTriageHistory = async () => {
      try {
        const response = await fetch(`/api/encounters/triage/${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setTriageHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch triage history:", error);
      }
    };
    if (patientId) fetchTriageHistory();
  }, [patientId]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Triage History</h2>
      {triageHistory.length > 0 ? (
        <ul className="space-y-4">
          {triageHistory.map((entry) => (
            <li key={entry.id} className="p-4 border rounded-md">
              <p>Date: {new Date(entry.date).toLocaleDateString()}</p>
              <p>Status: {entry.patientStatus}</p>
              <p>Temperature: {entry.temperature} °C</p>
              <p>Heart Rate: {entry.heartRate} bpm</p>
              <p>Blood Pressure: {entry.bloodPressure} mmHg</p>
              <p>Comments: {entry.comments}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No triage has been taken for this patient</p>
      )}
    </div>
  );
};

export default TriageHistoryPage;