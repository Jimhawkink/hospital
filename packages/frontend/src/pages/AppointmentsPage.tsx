import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { BookAppointmentModal } from "../components/BookAppointmentModal";
import { AppointmentDetailsModal } from "../components/AppointmentDetailsModal";

// --- Types ---
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

interface GroupedAppointments {
  date: string;
  dayName: string;
  appointments: Appointment[];
}

// --- Helper Functions ---
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Scheduled': 'text-blue-600',
    'Confirmed': 'text-green-600',
    'Checked-in': 'text-teal-600',
    'In-progress': 'text-amber-600',
    'Completed': 'text-emerald-600',
    'Cancelled': 'text-red-600',
    'No-show': 'text-slate-400',
    'Rescheduled': 'text-purple-600',
  };
  return colors[status] || 'text-slate-600';
};

// --- Main Component ---
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const token = localStorage.getItem("hms_token");
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const api = axios.create({
        baseURL: "http://localhost:5000/api",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch appointments from the view or join data manually
      const res = await api.get("/appointments");
      if (res.data && Array.isArray(res.data)) {
        setAppointments(res.data);
      } else {
        setAppointments([]);
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.response?.data?.message || "Failed to load appointments. Please check if the API endpoint exists.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments based on search
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase();
    return appointments.filter(a =>
      a.patient_name?.toLowerCase().includes(q) ||
      a.appointment_type_name?.toLowerCase().includes(q)
    );
  }, [appointments, searchQuery]);

  // Group appointments by date
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};

    filteredAppointments
      .sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
        return dateA.getTime() - dateB.getTime();
      })
      .forEach((apt) => {
        const dateKey = apt.appointment_date;
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(apt);
      });

    return Object.entries(groups).map(([date, apts]) => ({
      date,
      dayName: formatDayName(date),
      appointments: apts,
    })) as GroupedAppointments[];
  }, [filteredAppointments]);

  const todayAppointments = appointments.filter(
    (a) => a.appointment_date === new Date().toISOString().split('T')[0]
  ).length;

  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.appointment_date) >= new Date()
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-xl p-4 shadow-lg text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl">📅</div>
            <div>
              <h1 className="text-lg font-bold">Appointment Schedule</h1>
              <p className="text-blue-100 text-xs">Manage patient appointments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/10 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs">
              <span>🕐</span>
              <span className="font-medium">{currentTime.toLocaleTimeString()}</span>
            </div>
            <button
              onClick={() => setShowBookModal(true)}
              className="px-4 py-2 bg-white text-indigo-700 font-semibold rounded-lg shadow hover:shadow-lg transition-all flex items-center gap-1.5 text-xs"
            >
              📅 Book appointment
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: appointments.length, emoji: '📅', color: 'from-blue-500 to-blue-600' },
          { label: 'Today', value: todayAppointments, emoji: '📆', color: 'from-amber-500 to-orange-600' },
          { label: 'Upcoming', value: upcomingAppointments, emoji: '🗓️', color: 'from-emerald-500 to-teal-600' },
          { label: 'Confirmed', value: appointments.filter(a => a.status === 'Confirmed').length, emoji: '✅', color: 'from-green-500 to-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-3 shadow border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500">{stat.emoji} {stat.label}</p>
                <p className="text-lg font-bold text-slate-800">{loading ? '...' : stat.value}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-sm`}>
                {stat.emoji}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative max-w-sm">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search patients or types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="flex justify-center gap-1 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-slate-400 text-xs">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <span className="text-3xl mb-2 block">⚠️</span>
            <p className="text-red-500 text-xs mb-2">{error}</p>
            <button onClick={fetchAppointments} className="text-blue-600 hover:underline text-xs">
              Try Again
            </button>
          </div>
        ) : groupedAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl mb-3 block">📭</span>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              {searchQuery ? "No appointments found" : "No appointments scheduled"}
            </h3>
            <p className="text-slate-500 text-xs mb-3">
              {searchQuery ? "Try a different search" : "Book your first appointment"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowBookModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-medium"
              >
                📅 Book Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {groupedAppointments.map((group) => (
              <div key={group.date} className="flex">
                {/* Date Column */}
                <div className="w-28 flex-shrink-0 p-3 bg-slate-50/50 border-r border-slate-100">
                  <div className="sticky top-3">
                    <div className="text-xs font-semibold text-slate-700">{group.dayName}</div>
                    <div className="text-sm font-bold text-slate-600">{formatDate(group.date)}</div>
                    <div className="text-[10px] text-slate-400">{group.appointments.length} appt{group.appointments.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Appointments Column */}
                <div className="flex-1 divide-y divide-slate-50">
                  {group.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className="px-3 py-2.5 hover:bg-blue-50/50 cursor-pointer transition-colors flex items-center gap-3 group"
                    >
                      {/* Time */}
                      <div className="w-16 flex-shrink-0">
                        <span className="text-xs font-semibold text-blue-600">{formatTime(apt.appointment_time)}</span>
                      </div>

                      {/* Status Dot */}
                      <div className="w-2 flex-shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${apt.status === 'Scheduled' ? 'bg-blue-400' :
                            apt.status === 'Confirmed' ? 'bg-green-400' :
                              apt.status === 'Cancelled' ? 'bg-red-400' :
                                apt.status === 'Completed' ? 'bg-emerald-400' :
                                  'bg-slate-400'
                          }`} />
                      </div>

                      {/* Patient & Type */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${getStatusColor(apt.status)} group-hover:text-blue-700`}>
                            {apt.patient_name}
                          </span>
                          <span className="text-slate-300 text-xs">-</span>
                          <span className="text-slate-500 text-xs truncate">{apt.appointment_type_name}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                          apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-blue-100 text-blue-700'
                        }`}>
                        {apt.status}
                      </div>

                      {/* Arrow */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showBookModal && (
        <BookAppointmentModal
          onClose={() => setShowBookModal(false)}
          onSuccess={() => {
            fetchAppointments();
            setShowBookModal(false);
          }}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={fetchAppointments}
        />
      )}
    </div>
  );
}
