import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface Payment {
  id: number;
  checkout_request_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
  mpesa_receipt_number: string;
  result_code: number;
  result_desc: string;
  status: string;
  created_at: string;
  updated_at: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string;
  patient_id: number;
}

interface Stats {
  paidToday: number;
  totalPayments: number;
  amountToday: number;
  totalAmount: number;
  failedPayments: number;
  cancelledPayments: number;
  newPatientsToday: number;
  totalPatients: number;
  renewalsToday: number;
  newUsersAmountToday: number;
  renewalAmountToday: number;
}

interface DailyTrend {
  date: string;
  count: number;
  total: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [registrationFee, setRegistrationFee] = useState<number>(300);
  const [editFee, setEditFee] = useState<number>(300);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [savingFee, setSavingFee] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (search) params.append("search", search);
      const res = await api.get(`/payments?${params.toString()}`);
      setPayments(res.data?.payments || []);
      setStats(res.data?.stats || null);
      setDailyTrend(res.data?.dailyTrend || []);
    } catch {
      toast.error("Failed to load payments data");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    api.get("/payments/registration-fee").then(res => {
      if (res.data?.fee) {
        setRegistrationFee(res.data.fee);
        setEditFee(res.data.fee);
      }
    }).catch(() => {});
  }, []);

  const handleSaveFee = async () => {
    if (!editFee || editFee < 1) {
      toast.error("Enter a valid fee amount");
      return;
    }
    setSavingFee(true);
    try {
      await api.put("/payments/registration-fee", { fee: editFee });
      setRegistrationFee(editFee);
      setShowFeeModal(false);
      toast.success(`Registration fee updated to KSh ${editFee}`);
    } catch {
      toast.error("Failed to update registration fee");
    } finally {
      setSavingFee(false);
    }
  };

  const formatCurrency = (n: number) => `KSh ${Number(n).toLocaleString()}`;
  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const statusBadge = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "completed")
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">✅ Completed</span>;
    if (s === "cancelled")
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">⚠️ Cancelled</span>;
    if (s === "failed")
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">❌ Failed</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">⏳ {status || "Pending"}</span>;
  };

  // Chart data
  const lineChartData = {
    labels: dailyTrend.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
    }),
    datasets: [
      {
        label: "Revenue (KSh)",
        data: dailyTrend.map(d => Number(d.total)),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const barChartData = {
    labels: dailyTrend.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
    }),
    datasets: [
      {
        label: "Number of Payments",
        data: dailyTrend.map(d => Number(d.count)),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" as const, labels: { usePointStyle: true, padding: 15 } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
      x: { grid: { display: false } },
    },
  };

  // Pagination
  const totalPages = Math.ceil(payments.length / rowsPerPage) || 1;
  const paginatedPayments = payments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">💰</div>
            <div>
              <h1 className="text-2xl font-bold">Payments</h1>
              <p className="text-emerald-100">M-Pesa Transactions & Registration Fees</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <span className="text-sm text-emerald-100">Registration Fee:</span>
              <span className="ml-2 text-lg font-bold">{formatCurrency(registrationFee)}</span>
            </div>
            <button
              onClick={() => { setEditFee(registrationFee); setShowFeeModal(true); }}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              ✏️ Edit Fee
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[
          { title: "Paid Today", value: stats?.paidToday ?? 0, sub: formatCurrency(stats?.amountToday ?? 0), emoji: "💵", color: "from-emerald-500 to-teal-600" },
          { title: "New Patients Today", value: stats?.newPatientsToday ?? 0, sub: "New registrations", emoji: "🆕", color: "from-blue-500 to-indigo-600" },
          { title: "Renewals Today", value: stats?.renewalsToday ?? 0, sub: "1yr+ re-registrations", emoji: "🔄", color: "from-purple-500 to-violet-600" },
          { title: "Total Patients", value: stats?.totalPatients ?? 0, sub: "All registered", emoji: "👥", color: "from-cyan-500 to-blue-600" },
          { title: "Total Payments", value: stats?.totalPayments ?? 0, sub: formatCurrency(stats?.totalAmount ?? 0), emoji: "📊", color: "from-amber-500 to-orange-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 flex items-center gap-1"><span>{stat.emoji}</span> {stat.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{loading ? "..." : stat.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-lg shadow-lg`}>
                {stat.emoji}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">💵 New Users Amount Today</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats?.newUsersAmountToday ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">🔄 Renewal Amount Today</p>
          <p className="text-xl font-bold text-purple-600">{formatCurrency(stats?.renewalAmountToday ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">❌ Failed / Cancelled</p>
          <p className="text-xl font-bold text-red-600">{stats?.failedPayments ?? 0} / {stats?.cancelledPayments ?? 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
          <h3 className="text-lg font-bold text-slate-800 mb-4">📈 Revenue Trend (14 Days)</h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
          <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Payment Count (14 Days)</h3>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700">🔍 Search Patient / Phone / M-Pesa Code</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name, phone, or receipt..."
              className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">📅 Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">📅 Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 text-sm"
            />
          </div>
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); setCurrentPage(1); }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors whitespace-nowrap"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            💳 M-Pesa Payments
            <span className="text-sm font-normal text-slate-500">({payments.length} transactions)</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-slate-500">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-5xl">📭</span>
            <p className="mt-3 text-slate-500">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Patient Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">M-Pesa Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((p, i) => (
                  <tr key={p.id || i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {p.patient_first_name && p.patient_last_name
                        ? `${p.patient_first_name} ${p.patient_last_name}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.phone_number || p.patient_phone || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.mpesa_receipt_number || p.checkout_request_id?.slice(-10) || "—"}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {payments.length > rowsPerPage && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, payments.length)} of {payments.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 text-sm"
              >← Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${currentPage === page ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >{page}</button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 text-sm"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="text-lg font-bold text-slate-800">✏️ Edit Registration Fee</h3>
              <p className="text-sm text-slate-500">Set the patient registration fee amount</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Registration Fee (KSh)</label>
                <input
                  type="number"
                  value={editFee}
                  onChange={(e) => setEditFee(Number(e.target.value))}
                  min={1}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 text-sm"
                />
              </div>
              <p className="text-xs text-slate-400">Current fee: KSh {registrationFee}. Registration is valid for 1 year.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowFeeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >Cancel</button>
                <button
                  onClick={handleSaveFee}
                  disabled={savingFee}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingFee ? "Saving..." : "Save Fee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" theme="colored" />
    </div>
  );
}
