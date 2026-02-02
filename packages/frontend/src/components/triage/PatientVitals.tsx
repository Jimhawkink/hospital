// src/components/triage/PatientVitals.tsx
import React from 'react';
import { TriageData } from './TriageForm';
import './PatientVitals.css';

interface PatientVitalsProps {
  vitals?: Partial<TriageData>;
}

const PatientVitals: React.FC<PatientVitalsProps> = ({ vitals = {} }) => {
  const calculateBMI = () => {
    if (vitals.weight && vitals.height) {
      const heightInMeters = vitals.height / 100;
      return (vitals.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();

  return (
    <div className="patient-vitals-card">
      <div className="card-header">
        <h3>Patient Overview</h3>
      </div>

      <div className="vitals-grid">
        <div className="vital-item">
          <span className="vital-label">Temperature</span>
          <span className="vital-value">
            {vitals.temperature ? `${vitals.temperature} °C` : 'Not recorded'}
          </span>
        </div>

        <div className="vital-item">
          <span className="vital-label">Heart Rate</span>
          <span className="vital-value">
            {vitals.heartRate ? `${vitals.heartRate} BPM` : 'Not recorded'}
          </span>
        </div>

        <div className="vital-item">
          <span className="vital-label">Blood Pressure</span>
          <span className="vital-value">
            {vitals.bloodPressure || 'Not recorded'}
          </span>
        </div>

        <div className="vital-item">
          <span className="vital-label">Respiratory Rate</span>
          <span className="vital-value">
            {vitals.respiratoryRate ? `${vitals.respiratoryRate} breaths/min` : 'Not recorded'}
          </span>
        </div>

        <div className="vital-item">
          <span className="vital-label">Blood Oxygenation</span>
          <span className="vital-value">
            {vitals.bloodOxygenation ? `${vitals.bloodOxygenation} %` : 'Not recorded'}
          </span>
        </div>

        <div className="vital-item">
          <span className="vital-label">Weight</span>
          <span className="vital-value">
            {vitals.weight ? `${vitals.weight} kg` : 'Not recorded'}
          </span>
        </div>

        <div className="vital-item">
          <span className="vital-label">Height</span>
          <span className="vital-value">
            {vitals.height ? `${vitals.height} cm` : 'Not recorded'}
          </span>
        </div>

        <div className="vital-item">
          <span className="vital-label">BMI</span>
          <span className="vital-value">
            {bmi || 'Not calculated'}
          </span>
        </div>

        <div className="vital-item">
          <span className="vital-label">MUAC</span>
          <span className="vital-value">
            {vitals.muac ? `${vitals.muac} cm` : 'Not recorded'}
          </span>
        </div>

        <div className="vital-item">
          <span className="vital-label">LMP</span>
          <span className="vital-value">
            {vitals.lmp ? new Date(vitals.lmp).toLocaleDateString() : 'Not recorded'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PatientVitals;