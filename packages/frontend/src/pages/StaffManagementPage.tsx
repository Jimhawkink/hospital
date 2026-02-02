import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

type Staff = {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  jobTitle: string;
  username: string;
  password?: string;
  addedOn: string;
  activeStatus: boolean;
  createdAt: string;
  updatedAt: string;
};

const roles = ["Administrator", "Doctor", "Nurse", "Clinical Officer", "Lab Tech", "Pharmacist", "Pharm Tech", "Cashier", "Reception", "Medical Officer"];
const jobTitles = ["Medical Officer", "Nurse", "Clinical Officer", "Lab Tech", "Pharmacist", "Cashier", "Reception", "Doctor", "Administrator"];
const titleOptions = ["Dr.", "Mr.", "Mrs.", "Ms.", "Prof."];

type StaffFormData = {
  title: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  jobTitle: string;
  username: string;
  password: string;
  activeStatus: boolean;
  otp: string;
};

const emptyForm: StaffFormData = {
  title: "",
  firstName: "",
  lastName: "",
  gender: "",
  email: "",
  phone: "+254",
  address: "",
  role: "",
  jobTitle: "",
  username: "",
  password: "",
  activeStatus: true,
  otp: "",
};

// ✅ STABLE Form Field Component - Defined OUTSIDE main component to prevent focus loss
type FormFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  emoji?: string;
  disabled?: boolean;
};

const StableFormField = memo(function StableFormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  emoji = "📝",
  disabled = false,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
        <span>{emoji}</span> {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all text-sm disabled:bg-slate-100 disabled:text-slate-400"
      />
    </div>
  );
});

// ✅ STABLE Select Field Component - Defined OUTSIDE main component
type SelectFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: (string | { value: string; label: string })[];
  emoji?: string;
  required?: boolean;
};

const StableSelectField = memo(function StableSelectField({
  label,
  name,
  value,
  onChange,
  options,
  emoji = "📋",
  required = false,
}: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
        <span>{emoji}</span> {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all text-sm"
      >
        <option value="">Select {label}</option>
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
});

// ✅ Top Loading Bar - Like Afya Yangu Provider Portal
const TopLoadingBar = memo(function TopLoadingBar({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-blue-100 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 animate-loading-bar"
        style={{
          width: '40%',
          animation: 'loadingBar 1.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes loadingBar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(150%);
          }
          100% {
            transform: translateX(350%);
          }
        }
      `}</style>
    </div>
  );
});

export default function ModernStaffManagement() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'list' | 'add'>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterRole, setFilterRole] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Form state - kept at parent level to prevent re-renders
  const [formData, setFormData] = useState<StaffFormData>(emptyForm);
  const [otpSent, setOtpSent] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadStaffFromDatabase();
  }, []);

  const loadStaffFromDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const processedData = (data || []).map((staff: any) => ({
        ...staff,
        addedOn: staff.addedOn || staff.createdAt || '',
        activeStatus: staff.activeStatus !== undefined ? staff.activeStatus : true,
      }));
      setStaffList(processedData);
    } catch (err) {
      setError("Failed to load staff data");
      toast.error("❌ Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  // Stable input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') setOtpSent(false);
  }, []);

  const requestOtp = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("📧 Please enter a valid email address");
      return;
    }
    setIsRequestingOtp(true);
    try {
      const response = await fetch('/api/staff/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to request OTP');
      setOtpSent(true);
      toast.success("✅ OTP sent to your email");
    } catch (err) {
      toast.error(`❌ ${err instanceof Error ? err.message : 'Error sending OTP'}`);
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const saveStaff = async () => {
    if (!otpSent) {
      toast.error("📩 Please request and verify OTP first");
      return;
    }
    if (!formData.firstName || !formData.lastName || !formData.role || !formData.jobTitle || !formData.email || !formData.username || !formData.password || !formData.otp) {
      toast.error("📝 Please fill in all required fields");
      return;
    }
    const phoneRegex = /^(?:\+254|0)(?:7\d{8}|1\d{8})$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error("📞 Invalid phone number format");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save staff');
      }
      const savedStaff = await response.json();
      setStaffList(prev => [...prev, { ...savedStaff, addedOn: savedStaff.createdAt, activeStatus: true }]);
      toast.success("✅ Staff member added successfully");
      setFormData(emptyForm);
      setOtpSent(false);
      setCurrentView('list');
    } catch (err) {
      toast.error(`❌ ${err instanceof Error ? err.message : 'Error saving staff'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (id: number) => {
    const staff = staffList.find(s => s.id === id);
    if (!staff) return;
    const newStatus = !staff.activeStatus;
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeStatus: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      setStaffList(prev => prev.map(s => s.id === id ? { ...s, activeStatus: newStatus } : s));
      toast.success(`✅ Staff ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error("❌ Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("🗑️ Are you sure you want to delete this staff member?")) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      setStaffList(prev => prev.filter(s => s.id !== id));
      toast.success("✅ Staff member deleted");
    } catch (err) {
      toast.error("❌ Failed to delete staff");
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    let filtered = staffList;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    }
    if (filterRole !== "all") {
      filtered = filtered.filter(s => s.role === filterRole);
    }
    return filtered;
  }, [staffList, searchTerm, filterRole]);

  const currentStaff = filteredStaff.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredStaff.length / rowsPerPage) || 1;

  // ✅ Form validation computed values
  const isFormValid = formData.firstName && formData.lastName && formData.role && formData.jobTitle && formData.email && formData.username && formData.password;
  const isOtpReady = isFormValid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const canSubmit = isOtpReady && otpSent && formData.otp;

  if (currentView === 'add') {
    return (
      <>
        {/* 🔵 Top Loading Bar */}
        <TopLoadingBar isLoading={loading} />

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">👨‍⚕️</div>
                <div>
                  <h1 className="text-2xl font-bold">Add New Staff Member</h1>
                  <p className="text-violet-100">Complete the form with staff details</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span>🕐</span>
                  <span className="font-medium">{currentTime.toLocaleTimeString()}</span>
                </div>
                <button
                  onClick={() => { setCurrentView('list'); setFormData(emptyForm); setOtpSent(false); }}
                  className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/20 transition-colors"
                >
                  <span>📋</span>
                  <span>View All Staff</span>
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); saveStaff(); }} className="space-y-6">
            {/* Personal Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">👤</div>
                  <div>
                    <h2 className="font-semibold text-slate-800">Personal Details</h2>
                    <p className="text-xs text-slate-500">Basic staff information</p>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StableSelectField label="Title" name="title" value={formData.title} onChange={handleInputChange} emoji="🏷️" options={titleOptions.map(t => ({ value: t, label: t }))} />
                <StableFormField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Enter first name" required emoji="👤" />
                <StableFormField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Enter last name" required emoji="👤" />
                <StableSelectField label="Gender" name="gender" value={formData.gender} onChange={handleInputChange} emoji="👥" options={[
                  { value: "Male", label: "👨 Male" },
                  { value: "Female", label: "👩 Female" },
                  { value: "Other", label: "🧑 Other" },
                ]} />
              </div>
            </div>

            {/* Contact & Role */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">📞</div>
                  <div>
                    <h2 className="font-semibold text-slate-800">Contact & Role</h2>
                    <p className="text-xs text-slate-500">Contact information and job role</p>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <StableFormField label="Email" name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="email@example.com" required emoji="📧" />
                <StableFormField label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+2547..." emoji="📞" />
                <StableSelectField label="Role" name="role" value={formData.role} onChange={handleInputChange} emoji="🎭" required options={roles} />
                <StableSelectField label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} emoji="💼" required options={jobTitles} />
                <div className="md:col-span-2">
                  <StableFormField label="Address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Enter address" emoji="📍" />
                </div>
              </div>
            </div>

            {/* Account & Security */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🔐</div>
                  <div>
                    <h2 className="font-semibold text-slate-800">Account & Security</h2>
                    <p className="text-xs text-slate-500">Login credentials and verification</p>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <StableFormField label="Username" name="username" value={formData.username} onChange={handleInputChange} placeholder="Enter username" required emoji="👤" />
                <StableFormField label="Password" name="password" value={formData.password} onChange={handleInputChange} type="password" placeholder="Enter password" required emoji="🔑" />
                <div className="md:col-span-2">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1.5">
                        <span>📩</span> OTP Verification <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={handleInputChange}
                        placeholder={otpSent ? "Enter 6-digit OTP" : "Request OTP first"}
                        disabled={!otpSent}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all text-sm disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={!isOtpReady || isRequestingOtp || otpSent}
                      className={`px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${isOtpReady && !isRequestingOtp && !otpSent
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      {isRequestingOtp ? '⏳ Sending...' : otpSent ? '✅ OTP Sent' : '📩 Request OTP'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => { setCurrentView('list'); setFormData(emptyForm); setOtpSent(false); }}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                ❌ Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className={`px-8 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${canSubmit && !loading
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:scale-[1.02]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <>✅ Complete Registration</>}
              </button>
            </div>
          </form>
          <ToastContainer position="top-right" theme="colored" />
        </div>
      </>
    );
  }

  // Staff List View
  return (
    <>
      {/* 🔵 Top Loading Bar */}
      <TopLoadingBar isLoading={loading} />

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">👨‍⚕️</div>
              <div>
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <p className="text-violet-100">View and manage all staff members</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                <span>🕐</span>
                <span className="font-medium">{currentTime.toLocaleTimeString()}</span>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                <span>👥</span>
                <span className="font-medium">{staffList.length} Staff</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Staff', value: staffList.length, emoji: '👥', color: 'from-violet-500 to-purple-600' },
            { label: 'Active', value: staffList.filter(s => s.activeStatus).length, emoji: '🟢', color: 'from-emerald-500 to-teal-600' },
            { label: 'Inactive', value: staffList.filter(s => !s.activeStatus).length, emoji: '🔴', color: 'from-red-500 to-rose-600' },
            { label: 'Doctors', value: staffList.filter(s => s.role === 'Doctor' || s.jobTitle === 'Doctor').length, emoji: '👨‍⚕️', color: 'from-blue-500 to-indigo-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{stat.emoji} {stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{loading ? '...' : stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-lg`}>
                  {stat.emoji}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls & Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search staff by name, email, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${showFilters ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  🎛️ Filters {showFilters ? '▲' : '▼'}
                </button>
                <button
                  onClick={() => setCurrentView('add')}
                  className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all"
                >
                  ➕ Add Staff
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">🎭 Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="all">All Roles</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => { setFilterRole('all'); setSearchTerm(''); }}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">👤 Staff</div>
            <div className="col-span-2">🎭 Role</div>
            <div className="col-span-2">📞 Contact</div>
            <div className="col-span-2">📅 Added</div>
            <div className="col-span-1">📊 Status</div>
            <div className="col-span-2 text-right">⚙️ Actions</div>
          </div>

          {/* Staff List */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex justify-center gap-1 mb-2">
                  <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <p className="text-slate-400">Loading staff...</p>
              </div>
            ) : currentStaff.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-5xl mb-4 block">👥</span>
                <h3 className="text-lg font-medium text-slate-800 mb-2">{searchTerm ? "No staff found" : "No staff members"}</h3>
                <p className="text-slate-500 mb-4">{searchTerm ? "Try adjusting your search" : "Get started by adding your first staff member"}</p>
                {!searchTerm && (
                  <button onClick={() => setCurrentView('add')} className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-medium">
                    ➕ Add First Staff
                  </button>
                )}
              </div>
            ) : currentStaff.map((staff) => (
              <div key={staff.id}>
                <div
                  className="p-4 hover:bg-violet-50/30 transition-colors lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center cursor-pointer"
                  onClick={() => setExpandedId(expandedId === staff.id ? null : staff.id)}
                >
                  <div className="col-span-3 flex items-center gap-3 mb-3 lg:mb-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {staff.firstName?.[0]}{staff.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{staff.title} {staff.firstName} {staff.lastName}</h3>
                      <p className="text-xs text-slate-500">@{staff.username}</p>
                    </div>
                  </div>
                  <div className="col-span-2 mb-2 lg:mb-0">
                    <p className="text-sm text-slate-700">{staff.role}</p>
                    <p className="text-xs text-slate-400">{staff.jobTitle}</p>
                  </div>
                  <div className="col-span-2 mb-2 lg:mb-0">
                    <p className="text-sm text-slate-700">{staff.email}</p>
                    <p className="text-xs text-slate-400">{staff.phone}</p>
                  </div>
                  <div className="col-span-2 mb-2 lg:mb-0">
                    <p className="text-sm text-slate-600">{staff.addedOn ? new Date(staff.addedOn).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="col-span-1 mb-2 lg:mb-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${staff.activeStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {staff.activeStatus ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleActiveStatus(staff.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${staff.activeStatus ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {staff.activeStatus ? '⏸️ Deactivate' : '▶️ Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id)}
                      className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {expandedId === staff.id && (
                  <div className="px-4 py-4 bg-gradient-to-r from-slate-50 to-violet-50/30 border-t border-slate-100">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-slate-500 mb-1">📛 Full Name</p>
                        <p className="text-sm font-medium text-slate-700">{staff.title} {staff.firstName} {staff.lastName}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-slate-500 mb-1">📧 Email</p>
                        <p className="text-sm font-medium text-slate-700">{staff.email}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-slate-500 mb-1">📍 Address</p>
                        <p className="text-sm font-medium text-slate-700">{staff.address || 'N/A'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-slate-500 mb-1">👥 Gender</p>
                        <p className="text-sm font-medium text-slate-700">{staff.gender || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="px-4 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                {filteredStaff.length > 0 ? `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, filteredStaff.length)} of ${filteredStaff.length}` : '0 results'}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm">⏮️</button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm">◀️</button>
                <span className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium">{currentPage}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm">▶️</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 bg-white text-sm">⏭️</button>
              </div>
            </div>
          </div>
        </div>

        <ToastContainer position="top-right" theme="colored" />
      </div>
    </>
  );
}
