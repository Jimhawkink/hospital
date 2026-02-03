import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type OrgForm = {
  name: string;
  country: string;
  city: string;
  county: string;
  sub_county: string;
  ward: string;
  town: string;
  logo_url: string;
};

type OrgSettingsResponse = {
  name?: string;
  country?: string;
  city?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  town?: string;
  logo_url?: string;
};

const emptyForm: OrgForm = {
  name: "",
  country: "",
  city: "",
  county: "",
  sub_county: "",
  ward: "",
  town: "",
  logo_url: "",
};

const menuItems = [
  {
    title: "🏢 Organisation",
    items: [
      { path: "/dashboard/organisation-settings", label: "Organisation Settings", emoji: "⚙️" },
    ]
  },
  {
    title: "📊 Dashboard",
    items: [
      { path: "/dashboard/facility-dashboard", label: "Facility Dashboard", emoji: "🏥" },
      { path: "/dashboard/revenue-tracking", label: "Revenue Tracking", emoji: "💰" },
      { path: "/dashboard/data-completion", label: "Data Completion", emoji: "📈" },
    ]
  },
  {
    title: "📦 Inventory",
    items: [
      { path: "/dashboard/stock-management", label: "Stock Management", emoji: "📦" },
    ]
  },
  {
    title: "👥 Staff",
    items: [
      { path: "/dashboard/staff-management", label: "Staff Management", emoji: "👨‍⚕️" },
    ]
  },
  {
    title: "🏪 Branches",
    items: [
      { path: "/dashboard/branch-management", label: "Branch Management", emoji: "🏪" },
    ]
  },
  {
    title: "💸 Expenses",
    items: [
      { path: "/dashboard/expenses/history", label: "Expense History", emoji: "📜" },
      { path: "/dashboard/expenses/summary", label: "Expense Summary", emoji: "📊" },
    ]
  },
];

export default function OrganizationSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<OrgForm>(emptyForm);
  const [initial, setInitial] = useState<OrgForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get<OrgSettingsResponse>("/organization/settings");
        const loaded: OrgForm = {
          name: data?.name ?? "",
          country: data?.country ?? "",
          city: data?.city ?? "",
          county: data?.county ?? "",
          sub_county: data?.sub_county ?? "",
          ward: data?.ward ?? "",
          town: data?.town ?? "",
          logo_url: data?.logo_url ?? "",
        };
        if (!mounted) return;
        setForm(loaded);
        setInitial(loaded);
      } catch {
        toast.error("❌ Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }, []);

  const discard = () => {
    setForm(initial);
    toast.info("🔄 Changes discarded");
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/organization/settings", form);
      setInitial(form);
      toast.success("✅ Settings saved!");
    } catch {
      toast.error("❌ Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const { data } = await api.post<{ url: string }>("/organization/upload-logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm(f => ({ ...f, logo_url: data.url }));
      toast.success("✅ Logo uploaded!");
    } catch {
      toast.error("❌ Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadLogo(file);
  };

  const isActive = (path: string) => location.pathname === path;
  const hasChanges = JSON.stringify(form) !== JSON.stringify(initial);

  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('hms_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'User',
          role: user.role || 'Administrator',
          initials: user.firstName && user.lastName ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : user.username?.[0]?.toUpperCase() || 'U'
        };
      }
    } catch { }
    return { name: 'User', role: 'Administrator', initials: 'U' };
  };
  const userInfo = getUserInfo();

  // Modern Form Field
  const FormField = ({ name, label, emoji, placeholder }: { name: string; label: string; emoji: string; placeholder?: string }) => (
    <div className="group">
      <label className="text-sm font-semibold text-slate-600 flex items-center gap-2 mb-2">
        <span className="text-lg">{emoji}</span> {label}
      </label>
      <div className="relative">
        <input
          type="text"
          name={name}
          value={(form as any)[name]}
          onChange={handleChange}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400 hover:border-slate-300 shadow-sm"
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </div>
  );

  // Stats data
  const statsData = [
    { label: 'Total Fields', value: '8', emoji: '📝', gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Completed', value: Object.values(form).filter(v => v).length.toString(), emoji: '✅', gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Pending', value: (8 - Object.values(form).filter(v => v).length).toString(), emoji: '⏳', gradient: 'from-amber-500 to-orange-500' },
    { label: 'Logo Status', value: form.logo_url ? 'Set' : 'None', emoji: '🖼️', gradient: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
      <div className="space-y-6 p-6">

        {/* 🔝 Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-6 shadow-2xl">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-4xl shadow-xl border border-white/20">
                🏢
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
                  Organisation Settings
                  <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium">✨ Pro</span>
                </h1>
                <p className="text-blue-100 mt-1 flex items-center gap-2">
                  <span>🔧</span> Manage your facility's information and branding
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/20">
                <span className="text-2xl">🕐</span>
                <div>
                  <div className="text-white/70 text-xs">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div className="text-white font-bold text-lg">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-xl rounded-2xl text-white font-medium transition-all border border-white/20 hover:scale-105"
              >
                <span className="text-xl">🏠</span>
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                <div className="text-right hidden md:block">
                  <p className="text-white font-semibold">{userInfo.name}</p>
                  <p className="text-blue-200 text-xs">{userInfo.role}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-xl">
                  {userInfo.initials}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, i) => (
            <div key={i} className="group relative bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{stat.emoji}</span>
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* 📋 Sidebar */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden sticky top-6">
              <div className="p-5 bg-gradient-to-r from-slate-800 to-slate-900">
                <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                  <span className="text-2xl">📋</span> Navigation
                </h3>
                <p className="text-slate-400 text-sm mt-1">Quick access menu</p>
              </div>
              <nav className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
                {menuItems.map((section, idx) => (
                  <div key={idx}>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">{section.title}</div>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${isActive(item.path)
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                              }`}
                          >
                            <span className="text-xl">{item.emoji}</span>
                            <span>{item.label}</span>
                            {isActive(item.path) && <span className="ml-auto">✓</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* 📝 Main Form */}
          <section className="col-span-12 lg:col-span-9 space-y-6">

            {/* Action Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  {hasChanges && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-semibold animate-pulse">
                      <span className="text-lg">⚠️</span> Unsaved changes
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={discard}
                    disabled={saving || !hasChanges}
                    className="px-5 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <span className="text-lg">🔄</span> Discard
                  </button>
                  <button
                    onClick={save}
                    disabled={saving || !hasChanges}
                    className={`px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${hasChanges && !saving
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:scale-105'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    {saving ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    ) : (
                      <><span className="text-lg">💾</span> Save Changes</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-16 text-center">
                <div className="flex justify-center gap-2 mb-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-4 h-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <p className="text-slate-500 font-medium">Loading organisation settings...</p>
              </div>
            ) : (
              <>
                {/* 🏥 Organisation Info Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">🏥</div>
                      <div>
                        <h2 className="font-bold text-white text-xl">Organisation Information</h2>
                        <p className="text-blue-100">Basic details about your facility</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <FormField name="name" label="Organisation Name" emoji="🏢" placeholder="Enter organisation name" />
                    </div>
                    <FormField name="country" label="Country" emoji="🌍" placeholder="Enter country" />
                    <FormField name="city" label="City" emoji="🏙️" placeholder="Enter city" />
                  </div>
                </div>

                {/* 📍 Location Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">📍</div>
                      <div>
                        <h2 className="font-bold text-white text-xl">Location Details</h2>
                        <p className="text-emerald-100">Administrative area information</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField name="county" label="County" emoji="🗺️" placeholder="Enter county" />
                    <FormField name="sub_county" label="Sub County" emoji="📌" placeholder="Enter sub county" />
                    <FormField name="ward" label="Ward" emoji="🏘️" placeholder="Enter ward" />
                    <FormField name="town" label="Town" emoji="🏠" placeholder="Enter town" />
                  </div>
                </div>

                {/* 🖼️ Logo Upload Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">🖼️</div>
                      <div>
                        <h2 className="font-bold text-white text-xl">Organisation Logo</h2>
                        <p className="text-violet-100">Upload your facility's branding</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={onDrop}
                      className={`relative border-3 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all ${isDragging
                        ? 'border-violet-400 bg-violet-50 scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-300 bg-gradient-to-br from-slate-50 to-violet-50/30'
                        }`}
                    >
                      {uploading && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur rounded-3xl flex items-center justify-center z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-slate-600 font-semibold">Uploading...</span>
                          </div>
                        </div>
                      )}

                      {form.logo_url ? (
                        <div className="space-y-4">
                          <div className="w-40 h-40 bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-5 mx-auto flex items-center justify-center">
                            <img src={form.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                          </div>
                          <p className="text-sm text-slate-600 font-medium flex items-center gap-2 justify-center">
                            <span className="text-lg">✅</span> Current logo uploaded
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl flex items-center justify-center text-5xl mx-auto shadow-lg">
                            📷
                          </div>
                          <div>
                            <p className="text-slate-700 font-bold text-lg">Drop your logo here</p>
                            <p className="text-slate-400 text-sm mt-1">or click to browse files</p>
                          </div>
                        </div>
                      )}

                      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFilePick} />

                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
                      >
                        <span className="text-lg">📂</span> {form.logo_url ? "Change Logo" : "Choose File"}
                      </button>
                    </div>

                    <div className="mt-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                      <p className="text-sm text-amber-700 flex items-center gap-3">
                        <span className="text-2xl">💡</span>
                        <span><strong>Pro tip:</strong> Logo appears on reports, invoices & receipts. Use PNG/JPG, min 800×400px for best quality.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <ToastContainer position="top-right" theme="colored" />
    </div>
  );
}