import React, { useState } from "react";

interface Encounter {
  encounter_number: string;
  patient_name: string;
  encounter_type: string;
  priority_type?: string;
  notes?: string;
  provider_name: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  encounters: Encounter[];
  totalPages: number;
}

const EncountersTable: React.FC<Props> = ({ encounters, totalPages }) => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th>Encounter #</th>
              <th>Patient Name</th>
              <th>Encounter Type</th>
              <th>Priority</th>
              <th>Notes</th>
              <th>Provider</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {encounters.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4">No encounters found.</td>
              </tr>
            ) : (
              encounters.map((encounter) => (
                <tr key={encounter.encounter_number}>
                  <td className="px-4 py-2">{encounter.encounter_number}</td>
                  <td className="px-4 py-2">{encounter.patient_name}</td>
                  <td className="px-4 py-2">{encounter.encounter_type}</td>
                  <td className="px-4 py-2">{encounter.priority_type || "—"}</td>
                  <td className="px-4 py-2">{encounter.notes || "—"}</td>
                  <td className="px-4 py-2">{encounter.provider_name}</td>
                  <td className="px-4 py-2">{new Date(encounter.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{new Date(encounter.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <button className="px-3 py-1 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-lg text-xs font-medium transition-colors duration-200">
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center space-x-2 mt-4 text-sm">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EncountersTable;
