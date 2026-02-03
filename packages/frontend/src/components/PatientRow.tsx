import React, { useState } from "react";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import axios from "axios";
import { EditPatientModal } from "./EditPatientModal";

interface Patient {
  id: string | number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  dob?: string;
  [key: string]: any;
}

interface PatientRowProps {
  patient: Patient;
  onPatientUpdated: (patient: Patient) => void;
  onPatientDeleted: (id: string | number) => void;
}

export default function PatientRow({ patient, onPatientUpdated, onPatientDeleted }: PatientRowProps) {
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
            patient={{
              id: String(patient.id),
              firstName: patient.first_name,
              lastName: patient.last_name,
              middleName: patient.middle_name,
              dob: patient.dob
            }}
            onClose={() => setShowEditModal(false)}
            onSave={() => {
              onPatientUpdated(patient);
              setShowEditModal(false);
            }}
          />
        )}
      </td>
    </tr>
  );
}
