import React, { useState, useEffect } from "react";
import { FiX, FiClock, FiCalendar } from "react-icons/fi";

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
  middle_name?: string | null;
  lastName: string;
  dob?: string | null;
  gender?: string;
  encounters?: Encounter[];
}

interface CloseEncounterModalProps {
  patient: Patient;
  onClose: () => void;
  onCloseEncounter: (
    patientId: string,
    encounterId: string,
    notes?: string,
    closeDate?: string,
    nextAppointmentDate?: string
  ) => void;
}

// ✅ Utility: format a Date into "YYYY-MM-DDTHH:MM" for datetime-local input
const formatDateTimeLocal = (date: Date) => {
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function CloseEncounterModal({
  patient,
  onClose,
  onCloseEncounter,
}: CloseEncounterModalProps) {
  const [selectedEncounter, setSelectedEncounter] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState("");
  const [closeDate, setCloseDate] = useState<string>("");
  const [nextAppointmentDate, setNextAppointmentDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFullName = (p: Patient) =>
    [p.firstName, p.middle_name, p.lastName].filter(Boolean).join(" ");

  const activeEncounters = patient.encounters?.filter((encounter) => true) || [];

  useEffect(() => {
    if (activeEncounters.length > 0) {
      const mostRecent = activeEncounters[activeEncounters.length - 1];
      setSelectedEncounter(mostRecent.id);

      const now = new Date();
      setCloseDate(formatDateTimeLocal(now));

      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      setNextAppointmentDate(formatDateTimeLocal(nextWeek));
    }
  }, [activeEncounters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;

    setIsSubmitting(true);
    try {
      await onCloseEncounter(
        patient.id,
        selectedEncounter,
        closingNotes,
        closeDate,
        nextAppointmentDate
      );
    } catch (error) {
      console.error("Failed to close encounter:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEncounterData = activeEncounters.find(
    (e) => e.id === selectedEncounter
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between p-2 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">
            Close for {getFullName(patient)}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <FiX className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-2">
          {activeEncounters.length > 0 ? (
            <div className="mb-2 p-1 bg-orange-50 border border-orange-200 rounded">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                <span className="text-xs text-orange-800">
                  {activeEncounters.length} active encounter
                  {activeEncounters.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-2 p-1 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1"></div>
                <span className="text-xs text-gray-600">
                  No active encounters
                </span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1 mb-2">
            <div>
              <label className="block text-xs text-slate-700">
                Encounter *
              </label>
              <div className="relative">
                <FiClock className="absolute left-1 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3" />
                <select
                  value={selectedEncounter}
                  onChange={(e) => setSelectedEncounter(e.target.value)}
                  required
                  className="w-full pl-6 pr-1 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                  disabled={activeEncounters.length === 0}
                >
                  <option value="">Select...</option>
                  {activeEncounters.map((encounter) => (
                    <option key={encounter.id} value={encounter.id}>
                      {encounter.encounter_number} - {encounter.encounter_type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-700">Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-1 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3" />
                <input
                  type="text"
                  value={
                    selectedEncounterData
                      ? new Date(
                          selectedEncounterData.createdAt
                        ).toLocaleString()
                      : ""
                  }
                  readOnly
                  className="w-full pl-6 pr-1 py-1 border border-slate-200 rounded bg-slate-50 text-xs text-slate-600"
                  placeholder="Select an encounter"
                />
              </div>
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-xs text-slate-700">Notes</label>
            <textarea
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              rows={1}
              className="w-full px-1 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
              placeholder="Enter notes..."
            />
          </div>
          <div className="grid grid-cols-2 gap-1 mb-2">
            <div>
              <label className="block text-xs text-slate-700">
                Close Date *
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-1 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3" />
                <input
                  type="datetime-local"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  required
                  className="w-full pl-6 pr-1 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-700">
                Selected Close
              </label>
              <input
                type="text"
                value={closeDate ? new Date(closeDate).toLocaleString() : ""}
                readOnly
                className="w-full pl-1 pr-1 py-1 border border-slate-200 rounded bg-slate-50 text-xs text-slate-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 mb-2">
            <div>
              <label className="block text-xs text-slate-700">
                Next Appt Date *
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-1 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3" />
                <input
                  type="datetime-local"
                  value={nextAppointmentDate}
                  onChange={(e) => setNextAppointmentDate(e.target.value)}
                  required
                  className="w-full pl-6 pr-1 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-700">
                Selected Next Appt
              </label>
              <input
                type="text"
                value={
                  nextAppointmentDate
                    ? new Date(nextAppointmentDate).toLocaleString()
                    : ""
                }
                readOnly
                className="w-full pl-1 pr-1 py-1 border border-slate-200 rounded bg-slate-50 text-xs text-slate-600"
              />
            </div>
          </div>
          {selectedEncounterData && (
            <div className="mb-2 p-1 bg-slate-50 rounded">
              <h4 className="text-xs font-semibold text-slate-700">Details</h4>
              <div className="grid grid-cols-2 gap-0.5 text-xs">
                <div>
                  <span className="font-medium text-slate-600">Number:</span>{" "}
                  {selectedEncounterData.encounter_number}
                </div>
                <div>
                  <span className="font-medium text-slate-600">Type:</span>{" "}
                  {selectedEncounterData.encounter_type}
                </div>
                <div>
                  <span className="font-medium text-slate-600">Started:</span>{" "}
                  {new Date(selectedEncounterData.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium text-slate-600">
                    Provider ID:
                  </span>{" "}
                  {selectedEncounterData.provider_id}
                </div>
              </div>
            </div>
          )}
          <div className="mb-2 p-1 bg-gray-50 rounded text-xs text-gray-600">
            <p>Patient ID: {patient.id}</p>
            <p>Active: {activeEncounters.length}</p>
            <p>Selected: {selectedEncounter || "None"}</p>
          </div>
          <div className="flex justify-end space-x-1">
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-xs text-slate-600 border border-slate-200 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !selectedEncounter ||
                !closeDate ||
                !nextAppointmentDate ||
                isSubmitting ||
                activeEncounters.length === 0
              }
              className="px-2 py-1 text-xs text-white bg-orange-600 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {isSubmitting ? "Closing..." : "Close"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
