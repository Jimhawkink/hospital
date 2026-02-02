// src/components/triage/TriageActions.tsx
import React from 'react';
import './TriageActions.css';

interface TriageActionsProps {
  patientId: string;
  encounterId: string;
  onActionComplete: (action: string) => void;
}

const TriageActions: React.FC<TriageActionsProps> = ({ 
  patientId, 
  encounterId, 
  onActionComplete 
}) => {
  const actions = [
    { id: 'complaints', label: 'Complaints & HPI', icon: '📋' },
    { id: 'visit-forms', label: 'Structured visit forms', icon: '📝' },
    { id: 'systems-review', label: 'Review of systems', icon: '🔍' },
    { id: 'medication', label: 'Medication history', icon: '💊' },
    { id: 'examination', label: 'Examination', icon: '🏥' },
    { id: 'investigation', label: 'Investigation', icon: '🔬' },
    { id: 'diagnosis', label: 'Diagnosis and Pillar', icon: '📊' },
    { id: 'prescription', label: 'Prescription', icon: '🖊️' },
    { id: 'appointment', label: 'Appointment schedule', icon: '📅' },
    { id: 'billing', label: 'Patient bills', icon: '💰' },
    { id: 'close', label: 'Close encounter', icon: '✅' },
  ];

  const handleActionClick = (actionId: string) => {
    // Here you would typically navigate to the appropriate page or open a modal
    console.log(`Action clicked: ${actionId} for patient ${patientId}, encounter ${encounterId}`);
    onActionComplete(actionId);
  };

  return (
    <div className="triage-actions-card">
      <div className="card-header">
        <h3>Trigger</h3>
      </div>

      <div className="actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className="action-btn"
            onClick={() => handleActionClick(action.id)}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TriageActions;