import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Filler
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("hms_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const pct = (n: number, d: number) => d > 0 ? Math.round(n / d * 100) : 0;

export default function DataCompletionPage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, s, inv, st, stk] = await Promise.allSettled([
        api.get("/patients/search?q="),
        api.get("/dashboard-stats"),
        api.get("/invoices"),
        api.get("/staff"),
        api.get("/stock"),
      ]);
      if (p.status === "fulfilled") setPatients(Array.isArray(p.value.data) ? p.value.data : []);
      if (s.status === "fulfilled") setStats(s.value.data || {});
      if (inv.status === "fulfilled") setInvoices(Array.isArray(inv.value.data) ? inv.value.data : []);
      if (st.status === "fulfilled") setStaff(Array.isArray(st.value.data) ? st.value.data : []);
      if (stk.status === "fulfilled") setStock(Array.isArray(stk.value.data) ? stk.value.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Patient data completion analysis
  const totalPatients = patients.length || stats.totalPatients || 0;
  const withPhone = patients.filter(p => p.phone || p.firstName).length;
  const withEmail = patients.filter(p => p.email).length;
  const withDob = patients.filter(p => p.dob || p.date_of_birth).length;
  const withGender = patients.filter(p => p.gender).length;
  const withNextOfKin = patients.filter(p => p.next_of_kin_first_name || p.nextOfKinFirstName).length;
  const withCounty = patients.filter(p => p.county).length;
  const withOccupation = patients.filter(p => p.occupation).length;
  const withShaNumber = patients.filter(p => p.sha_number || p.shaNumber).length;

  // Staff completeness
  const totalStaff = staff.length;
  const staffWithPhone = staff.filter(s => s.phone).length;
  const staffWithEmail = staff.filter(s => s.email).length;
  const staffActive = staff.filter(s => s.active_status !== false && s.activeStatus !== false).length;

  // Stock completeness
  const totalStock = stock.length;
  const stockWithExpiry = stock.filter(s => s.expiryDate || s.expiry_date).length;
  const stockWithBatch = stock.filter(s => s.batchNo || s.batch_no).length;
  const stockWithSku = stock.filter(s => s.sku).length;
  const stockLow = stock.filter(s => (s.availableUnits || s.available_units || 0) < 10).length;
  const stockExpired = stock.filter(s => {
    const exp = s.expiryDate || s.expiry_date;
    return exp && new Date(exp) < new Date();
  }).length;

  // Invoice completeness
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === "paid").length;
  const pendingInvoices = invoices.filter(i => i.status !== "paid").length;

  // Encounter stats from dashboard
  const totalEncounters = stats.totalEncounters || 0;
  const encThisMonth = stats.encountersThisMonth || 0;

  // Overall score
  const patientFields = [
    { done: withPhone, label: "Phone" },
    { done: withDob, label: "DOB" },
    { done: withGender, label: "Gender" },
  ];
  const patientScore = totalPatients > 0 ? Math.round(patientFields.reduce((s, f) => s + pct(f.done, totalPatients), 0) / patientFields.length) : 0;
  const staffScore = totalStaff > 0 ? Math.round((pct(staffWithPhone, totalStaff) + pct(staffWithEmail, totalStaff)) / 2) : 0;
  const stockScore = totalStock > 0 ? Math.round((pct(stockWithExpiry, totalStock) + pct(stockWithBatch, totalStock)) / 2) : 0;
  const invoiceScore = totalInvoices > 0 ? pct(paidInvoices, totalInvoices) : 0;
  const overallScore = Math.round((patientScore + staffScore + stockScore + invoiceScore) / 4);

  // Score color
  const scoreColor = (s: number) => s >= 80 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : "text-red-600";
  const scoreBg = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 50 ? "bg-amber-500" : "bg-red-500";
  const scoreBgLight = (s: number) => s >= 80 ? "from-emerald-500 to-teal-600" : s >= 50 ? "from-amber-500 to-orange-600" : "from-red-500 to-rose-600";

  // Charts
  const overallDonut = {
    labels: ["Complete", "Incomplete"],
    datasets: [{ data: [overallScore, 100 - overallScore], backgroundColor: [overallScore >= 80 ? "#10B981" : overallScore >= 50 ? "#F59E0B" : "#EF4444", "#E2E8F0"], borderWidth: 0, cutout: "75%" }],
  };

  const moduleScoresBar = {
    labels: ["Patients", "Staff", "Inventory", "Invoices"],
    datasets: [{
      label: "Completion %",
      data: [patientScore, staffScore, stockScore, invoiceScore],
      backgroundColor: ["#6366F1", "#10B981", "#F59E0B", "#06B6D4"],
      borderRadius: 6, borderSkipped: false as const,
    }],
  };

  const patientFieldsBar = {
    labels: ["Phone", "Email", "DOB", "Gender", "Next of Kin", "County", "Occupation", "SHA #"],
    datasets: [{
      label: "Filled %",
      data: [pct(withPhone, totalPatients), pct(withEmail, totalPatients), pct(withDob, totalPatients), pct(withGender, totalPatients), pct(withNextOfKin, totalPatients), pct(withCounty, totalPatients), pct(withOccupation, totalPatients), pct(withShaNumber, totalPatients)],
      backgroundColor: (ctx: any) => {
        const val = ctx.raw as number;
        return val >= 80 ? "#10B981" : val >= 50 ? "#F59E0B" : "#EF4444";
      },
      borderRadius: 6, borderSkipped: false as const,
    }],
  };

  const chartOpt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(0,0,0,0.04)" }, max: 100 } } };
  const dOpt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

  // Completion row helper
  const CompRow = ({ label, done, total, icon }: { label: string; done: number; total: number; icon: string }) => {
    const p = pct(done, total);
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
        <span className="text-base">{icon}</span>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-0.5">
            <span className="font-medium text-slate-700">{label}</span>
            <span className={`font-bold ${scoreColor(p)}`}>{done}/{total} ({p}%)</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full">
            <div className={`h-full rounded-full transition-all ${scoreBg(p)}`} style={{ width: `${p}%` }} />
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Analyzing data completeness...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg">📋</div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Data Completion</h1>
            <p className="text-xs text-slate-500">Monitor record completeness across all modules</p>
          </div>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-200">🔄 Refresh</button>
      </div>

      {/* Overall Score + Module Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Overall Score Donut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Overall Score</h3>
          <div className="relative w-36 h-36">
            <Doughnut data={overallDonut} options={dOpt} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-extrabold ${scoreColor(overallScore)}`}>{overallScore}%</span>
              <span className="text-[10px] text-slate-500">COMPLETE</span>
            </div>
          </div>
        </div>

        {/* Module Score Cards */}
        {[
          { label: "Patient Records", score: patientScore, icon: "👥", count: totalPatients, bg: "from-indigo-500 to-violet-600" },
          { label: "Staff Records", score: staffScore, icon: "👨‍⚕️", count: totalStaff, bg: "from-emerald-500 to-teal-600" },
          { label: "Inventory", score: stockScore, icon: "💊", count: totalStock, bg: "from-amber-500 to-orange-600" },
          { label: "Invoices", score: invoiceScore, icon: "🧾", count: totalInvoices, bg: "from-cyan-500 to-blue-600" },
        ].map((mod, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg transition-all group">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mod.bg} flex items-center justify-center text-base shadow-md mb-3 group-hover:scale-110 transition-transform`}>{mod.icon}</div>
            <div className={`text-2xl font-extrabold ${scoreColor(mod.score)}`}>{mod.score}%</div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{mod.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{mod.count} records</p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full">
              <div className={`h-full rounded-full ${scoreBg(mod.score)}`} style={{ width: `${mod.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Module Scores Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-3">📊 Module Completion Comparison</h3>
        <div className="h-48"><Bar data={moduleScoresBar} options={chartOpt} /></div>
      </div>

      {/* Patient Fields Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3">👥 Patient Field Completion</h3>
          <div className="h-56"><Bar data={patientFieldsBar} options={chartOpt} /></div>
          <div className="flex gap-3 mt-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />≥80% Good</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />50-79% Fair</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />&lt;50% Poor</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">👥 Patient Data Breakdown</h3>
          <CompRow label="Phone Number" done={withPhone} total={totalPatients} icon="📱" />
          <CompRow label="Email Address" done={withEmail} total={totalPatients} icon="📧" />
          <CompRow label="Date of Birth" done={withDob} total={totalPatients} icon="🎂" />
          <CompRow label="Gender" done={withGender} total={totalPatients} icon="⚥" />
          <CompRow label="Next of Kin" done={withNextOfKin} total={totalPatients} icon="👪" />
          <CompRow label="County" done={withCounty} total={totalPatients} icon="📍" />
          <CompRow label="Occupation" done={withOccupation} total={totalPatients} icon="💼" />
          <CompRow label="SHA Number" done={withShaNumber} total={totalPatients} icon="🏥" />
        </div>
      </div>

      {/* Staff + Inventory Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">👨‍⚕️ Staff Data Completion</h3>
          <CompRow label="Phone Number" done={staffWithPhone} total={totalStaff} icon="📱" />
          <CompRow label="Email Address" done={staffWithEmail} total={totalStaff} icon="📧" />
          <CompRow label="Active Status" done={staffActive} total={totalStaff} icon="✅" />
          
          <div className="mt-4 p-3 bg-slate-50 rounded-xl">
            <p className="text-xs font-semibold text-slate-600 mb-2">Quick Stats</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-100">
                <span className="text-slate-500">Total Staff</span>
                <p className="text-lg font-extrabold text-slate-800">{totalStaff}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-100">
                <span className="text-slate-500">Active</span>
                <p className="text-lg font-extrabold text-emerald-600">{staffActive}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">💊 Inventory Data Completion</h3>
          <CompRow label="Expiry Date Set" done={stockWithExpiry} total={totalStock} icon="📅" />
          <CompRow label="Batch Number" done={stockWithBatch} total={totalStock} icon="🏷️" />
          <CompRow label="SKU Code" done={stockWithSku} total={totalStock} icon="🔢" />

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <p className="text-lg font-extrabold text-slate-800">{totalStock}</p>
              <p className="text-[10px] text-slate-500">Total Items</p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl text-center">
              <p className="text-lg font-extrabold text-red-600">{stockExpired}</p>
              <p className="text-[10px] text-red-500">Expired</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl text-center">
              <p className="text-lg font-extrabold text-amber-600">{stockLow}</p>
              <p className="text-[10px] text-amber-500">Low Stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Completion */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4">🧾 Invoice & Billing Completion</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
            <p className="text-xs text-blue-200">Total Invoices</p>
            <p className="text-2xl font-extrabold">{totalInvoices}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
            <p className="text-xs text-emerald-200">Paid</p>
            <p className="text-2xl font-extrabold">{paidInvoices}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
            <p className="text-xs text-amber-200">Pending</p>
            <p className="text-2xl font-extrabold">{pendingInvoices}</p>
          </div>
          <div className={`bg-gradient-to-br ${scoreBgLight(invoiceScore)} rounded-xl p-4 text-white`}>
            <p className="text-xs text-white/70">Payment Rate</p>
            <p className="text-2xl font-extrabold">{invoiceScore}%</p>
          </div>
        </div>
      </div>

      {/* Encounter Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4">🏥 Encounter Data Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-violet-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-violet-700">{totalEncounters}</p>
            <p className="text-xs text-violet-500">Total Encounters</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-blue-700">{encThisMonth}</p>
            <p className="text-xs text-blue-500">This Month</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-700">{(stats.encountersByType || []).length}</p>
            <p className="text-xs text-emerald-500">Visit Types</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-pink-700">{(stats.encountersByProvider || []).length}</p>
            <p className="text-xs text-pink-500">Providers</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
        <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">💡 Recommendations</h3>
        <div className="space-y-2">
          {pct(withEmail, totalPatients) < 50 && (
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="mt-0.5">⚠️</span>
              <p>Only <strong>{pct(withEmail, totalPatients)}%</strong> of patients have email addresses. Consider collecting emails during registration for appointment reminders.</p>
            </div>
          )}
          {pct(withNextOfKin, totalPatients) < 50 && (
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <span className="mt-0.5">⚠️</span>
              <p>Only <strong>{pct(withNextOfKin, totalPatients)}%</strong> of patients have next-of-kin information. This is critical for emergency contacts.</p>
            </div>
          )}
          {stockExpired > 0 && (
            <div className="flex items-start gap-2 text-xs text-red-700">
              <span className="mt-0.5">🚨</span>
              <p><strong>{stockExpired}</strong> stock items are expired. Remove them from inventory immediately.</p>
            </div>
          )}
          {stockLow > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-700">
              <span className="mt-0.5">⚠️</span>
              <p><strong>{stockLow}</strong> items have low stock (below 10 units). Consider restocking.</p>
            </div>
          )}
          {pendingInvoices > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-700">
              <span className="mt-0.5">💰</span>
              <p><strong>{pendingInvoices}</strong> invoices are still pending payment. Follow up for collection.</p>
            </div>
          )}
          {overallScore >= 80 && (
            <div className="flex items-start gap-2 text-xs text-emerald-700">
              <span className="mt-0.5">✅</span>
              <p>Great job! Your overall data completion is <strong>{overallScore}%</strong>. Keep maintaining high data quality.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
