import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import api from "../api/axios";

interface Patient {
    id: number;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    gender?: string;
    dob?: string;
    phone?: string;
}

interface AppointmentType {
    id: number;
    name: string;
    emoji: string;
    color: string;
    default_duration_minutes: number;
}

interface BookAppointmentModalProps {
    onClose: () => void;
    onSuccess?: () => void;
    preselectedPatient?: Patient | null;
}

// Default appointment types for demo
const defaultAppointmentTypes: AppointmentType[] = [
    { id: 1, name: "Family planning follow-up", emoji: "👨‍👩‍👧", color: "#EC4899", default_duration_minutes: 30 },
    { id: 2, name: "Antenatal follow-up", emoji: "🤰", color: "#F59E0B", default_duration_minutes: 45 },
    { id: 3, name: "Child wellness follow-up", emoji: "👶", color: "#22C55E", default_duration_minutes: 30 },
    { id: 4, name: "Postnatal follow-up", emoji: "🍼", color: "#8B5CF6", default_duration_minutes: 30 },
    { id: 5, name: "Chronic disease follow-up", emoji: "💊", color: "#EF4444", default_duration_minutes: 30 },
    { id: 6, name: "Review of patient condition", emoji: "🔄", color: "#3B82F6", default_duration_minutes: 20 },
    { id: 7, name: "Review of investigations", emoji: "🔬", color: "#06B6D4", default_duration_minutes: 20 },
    { id: 8, name: "Prescription refill", emoji: "💉", color: "#14B8A6", default_duration_minutes: 15 },
    { id: 9, name: "Immunization", emoji: "🩺", color: "#6366F1", default_duration_minutes: 15 },
    { id: 10, name: "General consultation", emoji: "👨‍⚕️", color: "#64748B", default_duration_minutes: 30 },
];

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
    onClose,
    onSuccess,
    preselectedPatient,
}) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(defaultAppointmentTypes);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preselectedPatient || null);
    const [selectedTypeId, setSelectedTypeId] = useState<number | "">("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");
    const [notes, setNotes] = useState("");
    const [reminderDays, setReminderDays] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowPatientDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch patients and appointment types
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch patients
                const patientsRes = await api.get("/patients");
                if (patientsRes.data && Array.isArray(patientsRes.data)) {
                    setPatients(patientsRes.data);
                }

                // Fetch appointment types
                try {
                    const typesRes = await api.get("/appointment-types");
                    if (typesRes.data && Array.isArray(typesRes.data)) {
                        setAppointmentTypes(typesRes.data);
                    }
                } catch { /* Use defaults */ }
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter patients based on search
    const filteredPatients = patients.filter((p) => {
        const fullName = `${p.firstName} ${p.middleName || ''} ${p.lastName}`.toLowerCase();
        const phone = p.phone || '';
        return fullName.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery);
    }).slice(0, 10);

    const getFullName = (p: Patient) =>
        [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");

    const getInitials = (p: Patient) =>
        [p.firstName?.[0], p.lastName?.[0]].filter(Boolean).join("").toUpperCase();

    const calculateAge = (dob?: string) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const diff = Date.now() - birthDate.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setSearchQuery("");
        setShowPatientDropdown(false);
    };

    const handleBookAppointment = async () => {
        if (!selectedPatient) {
            setError("Please select a patient");
            return;
        }
        if (!selectedTypeId) {
            setError("Please select appointment type");
            return;
        }
        if (!appointmentDate || !appointmentTime) {
            setError("Please select date and time");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await api.post("/appointments", {
                patient_id: selectedPatient.id,
                appointment_type_id: selectedTypeId,
                appointment_date: appointmentDate,
                appointment_time: appointmentTime,
                notes: notes,
                reminder_days_before: reminderDays,
                status: "Scheduled",
            });

            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to book appointment");
        } finally {
            setIsSaving(false);
        }
    };

    // Quick date presets
    const setDatePreset = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        setAppointmentDate(date.toISOString().split('T')[0]);
    };

    return (
        <Dialog.Root open onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/60 backdrop-blur-md z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[90vh] overflow-y-auto z-50">
                    {/* Main Card */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                        {/* 📅 Premium Header */}
                        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-lg backdrop-blur-sm">
                                        📅
                                    </div>
                                    <div>
                                        <Dialog.Title className="text-xl font-bold text-white tracking-tight">
                                            Book Appointment
                                        </Dialog.Title>
                                        <p className="text-blue-100 text-sm mt-0.5">
                                            Schedule a new patient appointment
                                        </p>
                                    </div>
                                </div>
                                <Dialog.Close asChild>
                                    <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105">
                                        ✕
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {/* Error Message */}
                            {error && (
                                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-2xl">⚠️</span>
                                    <div className="flex-1">
                                        <div className="text-red-700 text-sm">{error}</div>
                                    </div>
                                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
                                </div>
                            )}

                            {/* 🔍 Patient Search */}
                            <div className="space-y-2" ref={searchRef}>
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <span className="text-lg">🔍</span> Search Patient
                                </label>

                                {selectedPatient ? (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {getInitials(selectedPatient)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-800">{getFullName(selectedPatient)}</div>
                                            <div className="text-xs text-slate-500">
                                                {selectedPatient.gender === 'Male' ? '👨' : '👩'} {selectedPatient.gender} · {calculateAge(selectedPatient.dob) || 'N/A'} years
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedPatient(null)}
                                            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setShowPatientDropdown(true);
                                            }}
                                            onFocus={() => setShowPatientDropdown(true)}
                                            placeholder="Search by name or phone..."
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        />

                                        {/* Dropdown */}
                                        {showPatientDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto z-10">
                                                {isLoading ? (
                                                    <div className="p-4 text-center text-slate-400">Loading...</div>
                                                ) : filteredPatients.length === 0 ? (
                                                    <div className="p-4 text-center text-slate-400">
                                                        {searchQuery ? "No patients found" : "Type to search..."}
                                                    </div>
                                                ) : (
                                                    filteredPatients.map((patient) => (
                                                        <div
                                                            key={patient.id}
                                                            onClick={() => handleSelectPatient(patient)}
                                                            className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors"
                                                        >
                                                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                                {getInitials(patient)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-slate-800 text-sm">{getFullName(patient)}</div>
                                                                <div className="text-xs text-slate-400">{patient.phone || 'No phone'}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 📋 Appointment Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <span className="text-lg">📋</span> Common reasons for return
                                </label>
                                <select
                                    value={selectedTypeId}
                                    onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : "")}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                >
                                    <option value="">Select Option</option>
                                    {appointmentTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.emoji} {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 📅 Date & Time */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <span className="text-lg">📅</span> Select date and time
                                </label>

                                {/* Quick Date Presets */}
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { label: "Today", days: 0, emoji: "📅" },
                                        { label: "Tomorrow", days: 1, emoji: "🌅" },
                                        { label: "+3 Days", days: 3, emoji: "📆" },
                                        { label: "+1 Week", days: 7, emoji: "🗓️" },
                                    ].map((preset) => (
                                        <button
                                            key={preset.days}
                                            onClick={() => setDatePreset(preset.days)}
                                            className="px-3 py-2 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                        >
                                            {preset.emoji} {preset.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">Date</label>
                                        <input
                                            type="date"
                                            value={appointmentDate}
                                            onChange={(e) => setAppointmentDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">Time</label>
                                        <input
                                            type="time"
                                            value={appointmentTime}
                                            onChange={(e) => setAppointmentTime(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 🔔 Reminder */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <span className="text-lg">🔔</span> Reminder
                                </label>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={reminderDays}
                                        onChange={(e) => setReminderDays(Number(e.target.value))}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    >
                                        <option value={0}>No reminder</option>
                                        <option value={1}>1 day before</option>
                                        <option value={2}>2 days before</option>
                                        <option value={3}>3 days before</option>
                                        <option value={7}>1 week before</option>
                                    </select>
                                    <span className="text-xs text-slate-500">SMS reminder will be sent</span>
                                </div>
                            </div>

                            {/* 📝 Notes */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <span className="text-lg">📝</span> Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any notes for this appointment..."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                                />
                            </div>

                            {/* 🎯 Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <Dialog.Close asChild>
                                    <button className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                                        ❌ Cancel
                                    </button>
                                </Dialog.Close>
                                <button
                                    onClick={handleBookAppointment}
                                    disabled={isSaving || !selectedPatient || !selectedTypeId || !appointmentDate || !appointmentTime}
                                    className="flex-[2] px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02]"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        <>📅 Book Appointment</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
