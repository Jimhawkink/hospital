import React, { useState } from "react";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import axios from "axios";

export default function PatientRow({ patient, onPatientUpdated, onPatientDeleted }) {
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Delete patient ${patient.first_name}?`)) {
      try {
        await axios.delete(`/api/patients/${patient.id}`);
        onPatientDeleted(patient.id);
      } catch (err) {
        alert("Failed to delete patient");
      }
    }
  };

  return (
    <tr>
      <td className="text-sm font-semibold">
        {patient.first_name} {patient.middle_name} {patient.last_name}
      </td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
      <td>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1 hover:bg-gray-100 rounded">
              <DotsVerticalIcon />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="bg-white shadow rounded p-1">
            <DropdownMenu.Item
              className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-red-600"
              onClick={handleDelete}
            >
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        {showEditModal && (
          <EditPatientModal
            patient={patient}
            onClose={() => setShowEditModal(false)}
            onSave={(updatedPatient) => {
              onPatientUpdated(updatedPatient);
              setShowEditModal(false);
            }}
          />
        )}
      </td>
    </tr>
  );
}
