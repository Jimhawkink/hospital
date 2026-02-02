import React, { useState } from "react";
import api from "../api/axios";


interface EditPatientModalProps {
  patient: {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    dob?: string | null;
  };
  onClose: () => void;
  onSave: () => void;
}

export function EditPatientModal({
  patient,
  onClose,
  onSave,
}: EditPatientModalProps) {
  const [form, setForm] = useState({
    firstName: patient.firstName,
    middleName: patient.middleName || "",
    lastName: patient.lastName,
    dob: patient.dob || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/patients/${patient.id}`, form);
      onSave();
      onClose();
    } catch (err: any) {
      console.error("Error updating patient:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update patient."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-semibold mb-4">Edit Patient</h2>

        {error && (
          <div className="mb-3 p-2 text-sm text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            name="middleName"
            value={form.middleName}
            onChange={handleChange}
            placeholder="Middle Name"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
