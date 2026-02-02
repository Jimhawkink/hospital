import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import api from "../api/axios";

interface Appointment {
    id: number;
    patient_id: number;
    patient_name: string;
    patient_gender?: string;
    patient_age?: number;
    patient_dob?: string;
    patient_phone?: string;
    appointment_date: string;
    appointment_time: string;
    appointment_type_name: string;
    type_emoji?: string;
    type_color?: string;
    status: string;
    notes?: string;
    reminder_days_before?: number;
    booked_by_name?: string;
    provider_name?: string;
    created_at?: string;
}

interface AppointmentDetailsModalProps {
    appointment: Appointment;
    onClose: () => void;
    onUpdate?: () => void;
}

const statusOptions = [
    { value: "Scheduled", label: "Scheduled", emoji: "📅", color: "bg-blue-100 text-blue-700" },
    { value: "Confirmed", label: "Confirmed", emoji: "✅", color: "bg-green-100 text-green-700" },
    { value: "Checked-in", label: "Checked-in", emoji: "🏥", color: "bg-teal-100 text-teal-700" },
    { value: "In-progress", label: "In-progress", emoji: "⏳", color: "bg-amber-100 text-amber-700" },
    { value: "Completed", label: "Completed", emoji: "✔️", color: "bg-emerald-100 text-emerald-700" },
    { value: "Cancelled", label: "Cancelled", emoji: "❌", color: "bg-red-100 text-red-700" },
    { value: "No-show", label: "No-show", emoji: "👻", color: "bg-slate-100 text-slate-700" },
    { value: "Rescheduled", label: "Rescheduled", emoji: "🔄", color: "bg-purple-100 text-purple-700" },
];

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
    appointment,
    onClose,
    onUpdate,
}) => {
    const [status, setStatus] = useState(appointment.status);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatDob = (dob?: string) => {
        if (!dob) return "N/A";
        return new Date(dob).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);
        setError(null);

        try {
            await api.patch(`/appointments/${appointment.id}`, { status: newStatus });
            setStatus(newStatus);
            setSuccessMessage("✅ Status updated successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
            onUpdate?.();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleReschedule = () => {
        // Could open a reschedule modal here
        alert("Reschedule functionality coming soon! 📅");
    };

    const currentStatus = statusOptions.find(s => s.value === status) || statusOptions[0];

    return (
        <Dialog.Root open onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/60 backdrop-blur-md z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
                    {/* Main Card */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                        {/* Header with Date/Time */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">{appointment.type_emoji || '📅'}</div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">
                                        {formatDate(appointment.appointment_date)} · {formatTime(appointment.appointment_time)}
                                    </div>
                                </div>
                            </div>
                            <Dialog.Close asChild>
                                <button className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 transition-all">
                                    ✕
                                </button>
                            </Dialog.Close>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {/* Messages */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
                                    <span>⚠️</span> {error}
                                    <button onClick={() => setError(null)} className="ml-auto">✕</button>
                                </div>
                            )}

                            {successMessage && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700">
                                    {successMessage}
                                </div>
                            )}

                            {/* Appointment Type Title */}
                            <div>
                                <h2 className="text-lg font-bold text-blue-600">{appointment.appointment_type_name}</h2>
                            </div>

                            {/* Patient Info Card */}
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                        style={{ background: appointment.type_color || '#3B82F6' }}
                                    >
                                        {getInitials(appointment.patient_name)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{appointment.patient_name}</div>
                                        <div className="text-sm text-slate-500">
                                            {appointment.patient_gender === 'Male' ? '👨' : '👩'} {appointment.patient_gender} · {appointment.patient_age || 'N/A'} years · {formatDob(appointment.patient_dob)}
                                        </div>
                                    </div>
                                </div>
                                {appointment.patient_phone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 pt-2">
                                        <span>📞</span> {appointment.patient_phone}
                                    </div>
                                )}
                            </div>

                            {/* Notes Section */}
                            {appointment.notes && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-500">📝 Notes</label>
                                    <p className="text-sm text-slate-700 bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                                        {appointment.notes}
                                    </p>
                                </div>
                            )}

                            {/* Reminder & Created By */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-1">🔔 Reminder</div>
                                    <div className="font-medium text-slate-700">
                                        {appointment.reminder_days_before
                                            ? `${appointment.reminder_days_before} day${appointment.reminder_days_before > 1 ? 's' : ''} before`
                                            : 'No reminder'
                                        }
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3">
                                    <div className="text-xs text-slate-400 mb-1">👤 Created by</div>
                                    <div className="font-medium text-slate-700 truncate">
                                        {appointment.booked_by_name || 'System'}
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Status */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-500">Appointment status</label>
                                <select
                                    value={status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={isUpdating}
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all disabled:opacity-50"
                                >
                                    {statusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.emoji} {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${currentStatus.color} rounded-full text-xs font-semibold`}>
                                        {currentStatus.emoji} {currentStatus.label}
                                    </span>
                                    {isUpdating && (
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleReschedule}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                                >
                                    🔄 Reschedule
                                </button>
                                <button
                                    onClick={() => handleStatusChange('Cancelled')}
                                    disabled={status === 'Cancelled' || isUpdating}
                                    className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    ❌ Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
