// src/components/triage/TriageForm.tsx
import React, { useState } from 'react';
import './TriageForm.css';

export interface TriageData {
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  bloodOxygenation: number;
  weight: number;
  height: number;
  muac: number;
  lmp: string;
  comments: string;
  patientStatus: string;
}

interface TriageFormProps {
  onSubmit: (data: Partial<TriageData>) => void;
  initialData?: Partial<TriageData>;
}

const TriageForm: React.FC<TriageFormProps> = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState<Partial<TriageData>>(initialData);

  const handleInputChange = (field: keyof TriageData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="triage-form-card">
      <div className="card-header">
        <h3>Add Readings</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="triage-form">
        <div className="form-group">
          <label>Patient Status</label>
          <select 
            value={formData.patientStatus || ''}
            onChange={(e) => handleInputChange('patientStatus', e.target.value)}
          >
            <option value="">Select option</option>
            <option value="stable">Stable</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="vitals-grid">
          <div className="form-group">
            <label>Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={formData.temperature || ''}
              onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              placeholder="Enter temperature"
            />
          </div>

          <div className="form-group">
            <label>Heart Rate (bpm)</label>
            <input
              type="number"
              value={formData.heartRate || ''}
              onChange={(e) => handleInputChange('heartRate', parseInt(e.target.value))}
              placeholder="Enter heart rate"
            />
          </div>

          <div className="form-group">
            <label>Blood Pressure (mmHg)</label>
            <input
              type="text"
              value={formData.bloodPressure || ''}
              onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
              placeholder="e.g., 120/80"
            />
          </div>

          <div className="form-group">
            <label>Respiratory Rate (bpm)</label>
            <input
              type="number"
              value={formData.respiratoryRate || ''}
              onChange={(e) => handleInputChange('respiratoryRate', parseInt(e.target.value))}
              placeholder="Enter respiratory rate"
            />
          </div>

          <div className="form-group">
            <label>Blood Oxygenation (%)</label>
            <input
              type="number"
              value={formData.bloodOxygenation || ''}
              onChange={(e) => handleInputChange('bloodOxygenation', parseInt(e.target.value))}
              placeholder="Enter oxygenation"
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weight || ''}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
              placeholder="Enter weight"
            />
          </div>

          <div className="form-group">
            <label>Height (cm)</label>
            <input
              type="number"
              value={formData.height || ''}
              onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
              placeholder="Enter height"
            />
          </div>

          <div className="form-group">
            <label>MUAC (cm)</label>
            <input
              type="number"
              step="0.1"
              value={formData.muac || ''}
              onChange={(e) => handleInputChange('muac', parseFloat(e.target.value))}
              placeholder="Enter MUAC"
            />
          </div>
        </div>

        <div className="form-group">
          <label>LMP (Last Menstrual Period)</label>
          <input
            type="date"
            value={formData.lmp || ''}
            onChange={(e) => handleInputChange('lmp', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Comments</label>
          <textarea
            value={formData.comments || ''}
            onChange={(e) => handleInputChange('comments', e.target.value)}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        <button type="submit" className="save-btn">
          Save Readings
        </button>
      </form>
    </div>
  );
};

export default TriageForm;