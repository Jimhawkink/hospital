import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Filler
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("hms_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

const fmt = (n: number) => new Intl.NumberFormat("en-KE").format(Math.round(n));
const fmtK = (n: number) => `KES ${fmt(n)}`;

export default function RevenueTrackingPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [invoices, setInvoices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<"charts"|"tables">("charts");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, i, sl] = await Promise.allSettled([
        api.get("/dashboard-stats"),
        api.get("/invoices"),
        api.get("/pos/sales"),
      ]);
      if (s.status === "fulfilled") setStats(s.value.data || {});
      if (i.status === "fulfilled") setInvoices(Array.isArray(i.value.data) ? i.value.data : []);
      if (sl.status === "fulfilled") {
        const d = sl.value.data;
        setSales(Array.isArray(d) ? d : (d?.rows || d?.sales || []));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // --- COMPUTED DATA ---
  const totalRevenue = stats.totalRevenue || 0;
  const revenueMonth = stats.revenueThisMonth || 0;
  const totalEnc = stats.totalEncounters || 0;
  const encMonth = stats.encountersThisMonth || 0;
  const totalPat = stats.totalPatients || 0;
  const newPatMonth = stats.newPatientsThisMonth || 0;

  // Invoices
  const totalInvoiced = invoices.reduce((s, inv) => s + (Number(inv.amount) || 0), 0);
  const paidInv = invoices.filter(i => i.status === "paid");
  const pendingInv = invoices.filter(i => i.status !== "paid");
  const totalPaid = paidInv.reduce((s, inv) => s + (Number(inv.amount) || 0), 0);
  const totalPending = pendingInv.reduce((s, inv) => s + (Number(inv.amount) || 0), 0);

  // POS
  const totalPosSales = sales.reduce((s, sl) => s + (Number(sl.total_amount) || 0), 0);
  const cashSales = sales.filter(s => s.payment_method === "Cash");
  const mpesaSales = sales.filter(s => s.payment_method !== "Cash");
  const totalCash = cashSales.reduce((s, sl) => s + (Number(sl.total_amount) || 0), 0);
  const totalMpesa = mpesaSales.reduce((s, sl) => s + (Number(sl.total_amount) || 0), 0);
  const avgPerEnc = totalEnc > 0 ? totalRevenue / totalEnc : 0;
  const collRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced * 100) : 0;

  // Encounter types
  const encByType = stats.encountersByType || [];
  const encByHour = stats.encountersByHour || [];
  const monthlyTrend = stats.monthlyTrend || [];
  const topProducts = stats.topProducts || [];
  const topDiagnoses = stats.topDiagnoses || [];
  const encByProvider = stats.encountersByProvider || [];

  // --- Payment method monthly pivot (from sales) ---
  const salesByMonth: Record<string, { cash: number; mpesa: number; total: number }> = {};
  sales.forEach((s: any) => {
    const d = new Date(s.created_at || s.createdAt);
    const key = `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
    if (!salesByMonth[key]) salesByMonth[key] = { cash: 0, mpesa: 0, total: 0 };
    const amt = Number(s.total_amount) || 0;
    if (s.payment_method === "Cash") salesByMonth[key].cash += amt;
    else salesByMonth[key].mpesa += amt;
    salesByMonth[key].total += amt;
  });
  const pmMonths = Object.keys(salesByMonth).slice(-12);

  // --- CHARTS ---
  const encTypeData = {
    labels: encByType.map((e: any) => e.type || "Unknown"),
    datasets: [{
      data: encByType.map((e: any) => e.count),
      backgroundColor: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
      borderWidth: 0, cutout: "70%",
    }],
  };

  const billsByMethodData = {
    labels: ["Cash", "M-Pesa/Paybill", "Outstanding"],
    datasets: [{
      data: [totalCash, totalMpesa, totalPending],
      backgroundColor: ["#10B981", "#6366F1", "#F59E0B"],
      borderWidth: 0, cutout: "70%",
    }],
  };

  const monthlyBarData = {
    labels: monthlyTrend.map((m: any) => m.month),
    datasets: [
      { label: "Encounters", data: monthlyTrend.map((m: any) => m.encounters), backgroundColor: "rgba(99,102,241,0.7)", borderRadius: 4, borderSkipped: false as const },
      { label: "Patients", data: monthlyTrend.map((m: any) => m.patients), backgroundColor: "rgba(16,185,129,0.7)", borderRadius: 4, borderSkipped: false as const },
    ],
  };

  const encLineData = {
    labels: monthlyTrend.map((m: any) => m.month),
    datasets: [{
      label: "Encounters",
      data: monthlyTrend.map((m: any) => m.encounters),
      borderColor: "#10B981", backgroundColor: "rgba(16,185,129,0.1)",
      fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: "#10B981",
    }, {
      label: "New Patients",
      data: monthlyTrend.map((m: any) => m.patients),
      borderColor: "#EF4444", backgroundColor: "rgba(239,68,68,0.05)",
      fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: "#EF4444",
    }],
  };

  const topProdBarData = {
    labels: topProducts.slice(0, 10).map((p: any) => (p.name || "").substring(0, 18)),
    datasets: [{
      label: "Revenue (KES)",
      data: topProducts.slice(0, 10).map((p: any) => p.revenue),
      backgroundColor: ["#6366F1", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5"],
      borderRadius: 4, borderSkipped: false as const,
    }],
  };

  const hourlyData = {
    labels: encByHour.map((h: any) => { const hr = h.hour; return hr < 12 ? `${hr || 12}AM` : `${hr === 12 ? 12 : hr - 12}PM`; }),
    datasets: [{
      label: "Encounters",
      data: encByHour.map((h: any) => h.count),
      backgroundColor: "rgba(6,182,212,0.6)", borderRadius: 4, borderSkipped: false as const,
    }],
  };

  const chartOpt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(0,0,0,0.04)" } } } };
  const dOpt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

  // KPI cards
  const kpis = [
    { label: "Total Revenue", value: fmtK(totalRevenue), icon: "💰", bg: "from-emerald-500 to-teal-600", sub: "All time" },
    { label: "Revenue This Month", value: fmtK(revenueMonth), icon: "📈", bg: "from-blue-500 to-indigo-600", sub: new Date().toLocaleString("default", { month: "long" }) },
    { label: "Total Encounters", value: fmt(totalEnc), icon: "🏥", bg: "from-violet-500 to-purple-600", sub: `${fmt(encMonth)} this month` },
    { label: "Total Patients", value: fmt(totalPat), icon: "👥", bg: "from-cyan-500 to-blue-600", sub: `${fmt(newPatMonth)} new this month` },
    { label: "POS Revenue", value: fmtK(totalPosSales), icon: "🛒", bg: "from-rose-500 to-pink-600", sub: `${sales.length} transactions` },
    { label: "Outstanding", value: fmtK(totalPending), icon: "⏳", bg: "from-amber-500 to-orange-600", sub: `${pendingInv.length} invoices` },
    { label: "Avg/Encounter", value: fmtK(avgPerEnc), icon: "📊", bg: "from-fuchsia-500 to-pink-600", sub: "Revenue per visit" },
    { label: "Collection Rate", value: `${collRate.toFixed(1)}%`, icon: "✅", bg: "from-lime-500 to-green-600", sub: `${paidInv.length}/${invoices.length} paid` },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading revenue data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-xl shadow-lg">💰</div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Revenue Tracking</h1>
            <p className="text-xs text-slate-500">Comprehensive financial analytics & insights</p>
          </div>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-200">
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards - 4x2 grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-lg transition-all group">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.bg} flex items-center justify-center text-base shadow-md mb-3 group-hover:scale-110 transition-transform`}>{k.icon}</div>
            <div className="text-xl font-extrabold text-slate-800">{k.value}</div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{k.label}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Summary Cards - 3 gradient */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">💵</div><span className="text-sm text-emerald-100">Cash Revenue</span></div>
          <div className="text-2xl font-extrabold">{fmtK(totalCash)}</div>
          <p className="text-xs text-emerald-200 mt-1">{cashSales.length} cash transactions</p>
          <div className="mt-2 h-1.5 bg-white/20 rounded-full"><div className="h-full bg-white/60 rounded-full" style={{ width: `${totalPosSales > 0 ? totalCash / totalPosSales * 100 : 0}%` }} /></div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">📱</div><span className="text-sm text-indigo-200">M-Pesa/Paybill</span></div>
          <div className="text-2xl font-extrabold">{fmtK(totalMpesa)}</div>
          <p className="text-xs text-indigo-200 mt-1">{mpesaSales.length} mobile payments</p>
          <div className="mt-2 h-1.5 bg-white/20 rounded-full"><div className="h-full bg-white/60 rounded-full" style={{ width: `${totalPosSales > 0 ? totalMpesa / totalPosSales * 100 : 0}%` }} /></div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">⏳</div><span className="text-sm text-amber-200">Outstanding</span></div>
          <div className="text-2xl font-extrabold">{fmtK(totalPending)}</div>
          <p className="text-xs text-amber-200 mt-1">{pendingInv.length} pending invoices</p>
          <div className="mt-2 h-1.5 bg-white/20 rounded-full"><div className="h-full bg-white/60 rounded-full" style={{ width: `${totalInvoiced > 0 ? totalPending / totalInvoiced * 100 : 0}%` }} /></div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
        <button onClick={() => setActiveSection("charts")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${activeSection === "charts" ? "bg-emerald-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>📊 Charts & Visualizations</button>
        <button onClick={() => setActiveSection("tables")} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${activeSection === "tables" ? "bg-emerald-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>📋 Tables & Breakdowns</button>
      </div>

      {activeSection === "charts" && (
        <>
          {/* Row 1: Encounters by Type + Revenue by Payment Method */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Total Encounters by Visit Type</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-44 h-44">
                  <Doughnut data={encTypeData} options={dOpt} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-800">{fmt(totalEnc)}</span>
                    <span className="text-[10px] text-slate-500">TOTAL</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  {encByType.map((e: any, i: number) => {
                    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
                    const pct = totalEnc > 0 ? (e.count / totalEnc * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: colors[i % 6] }} />{e.type}</span>
                          <span className="font-bold">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % 6] }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Revenue by Payment Method</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-44 h-44">
                  <Doughnut data={billsByMethodData} options={dOpt} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold text-slate-800">{fmtK(totalPosSales + totalPending)}</span>
                    <span className="text-[10px] text-slate-500">TOTAL</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  {[
                    { label: "Cash", color: "#10B981", value: totalCash },
                    { label: "M-Pesa/Paybill", color: "#6366F1", value: totalMpesa },
                    { label: "Outstanding", color: "#F59E0B", value: totalPending },
                  ].map((item) => {
                    const total = totalPosSales + totalPending || 1;
                    const pct = item.value / total * 100;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />{item.label}</span>
                          <span className="font-bold">{fmtK(item.value)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Monthly bar + Encounters line */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Bills, Total Amount by Department, Monthly</h3>
              <div className="flex gap-4 mb-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />Encounters</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Patients</span>
              </div>
              <div className="h-56"><Bar data={monthlyBarData} options={chartOpt} /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Encounters & New Patients, Monthly</h3>
              <div className="flex gap-4 mb-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Encounters</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />New Patients</span>
              </div>
              <div className="h-56"><Line data={encLineData} options={chartOpt} /></div>
            </div>
          </div>

          {/* Row 3: Top Products + Hourly */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-2">💊 Top Revenue Products</h3>
              <div className="h-56"><Bar data={topProdBarData} options={{ ...chartOpt, indexAxis: "y" as const }} /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-2">⏰ Activity by Hour of Day</h3>
              <div className="h-56"><Bar data={hourlyData} options={chartOpt} /></div>
            </div>
          </div>
        </>
      )}

      {activeSection === "tables" && (
        <>
          {/* Bill Payment Grouped by Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Bill Payment, Grouped by Payment Method</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left py-2.5 px-3 text-blue-700 font-semibold rounded-l-lg">Payment Method</th>
                    {pmMonths.map(m => <th key={m} className="text-right py-2.5 px-3 text-blue-700 font-semibold">{m}</th>)}
                    <th className="text-right py-2.5 px-3 text-blue-700 font-semibold rounded-r-lg">Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {["Cash", "M-Pesa"].map(method => (
                    <tr key={method} className="border-b border-slate-50 hover:bg-blue-50/30">
                      <td className="py-2.5 px-3 font-medium text-slate-700">{method}</td>
                      {pmMonths.map(m => <td key={m} className="text-right py-2.5 px-3 text-slate-600">{fmt(method === "Cash" ? salesByMonth[m]?.cash || 0 : salesByMonth[m]?.mpesa || 0)}</td>)}
                      <td className="text-right py-2.5 px-3 font-bold text-slate-800">{fmtK(method === "Cash" ? totalCash : totalMpesa)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-2.5 px-3 text-slate-800">Grand Totals</td>
                    {pmMonths.map(m => <td key={m} className="text-right py-2.5 px-3 text-slate-800">{fmt(salesByMonth[m]?.total || 0)}</td>)}
                    <td className="text-right py-2.5 px-3 text-emerald-700">{fmtK(totalPosSales)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount generated by practitioner */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Amount Generated by Practitioner</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-violet-50">
                    <th className="text-left py-2.5 px-3 text-violet-700 font-semibold rounded-l-lg">Practitioner Name</th>
                    <th className="text-center py-2.5 px-3 text-violet-700 font-semibold">Arrived</th>
                    <th className="text-center py-2.5 px-3 text-violet-700 font-semibold">Cancelled</th>
                    <th className="text-right py-2.5 px-3 text-violet-700 font-semibold rounded-r-lg">Total Encounters</th>
                  </tr>
                </thead>
                <tbody>
                  {(encByProvider.length > 0 ? encByProvider : [{ name: "No data yet", arrived: 0, cancelled: 0 }]).map((p: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-violet-50/30">
                      <td className="py-2.5 px-3 font-medium text-slate-700">{p.name}</td>
                      <td className="text-center py-2.5 px-3 text-emerald-600 font-semibold">{p.arrived || 0}</td>
                      <td className="text-center py-2.5 px-3 text-red-500 font-semibold">{p.cancelled || 0}</td>
                      <td className="text-right py-2.5 px-3 font-bold text-slate-800">{(p.arrived || 0) + (p.cancelled || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Revenue Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3">📦 Product Revenue Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="text-left py-2.5 px-3 font-semibold text-emerald-700 rounded-l-lg">#</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-emerald-700">Product</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-emerald-700">Qty Sold</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-emerald-700">Revenue</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-emerald-700 rounded-r-lg">% Share</th>
                  </tr>
                </thead>
                <tbody>
                  {(topProducts.length > 0 ? topProducts : [{ name: "No data", qty: 0, revenue: 0 }]).map((p: any, i: number) => {
                    const total = topProducts.reduce((s: number, x: any) => s + (x.revenue || 0), 0) || 1;
                    const pct = (p.revenue || 0) / total * 100;
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30">
                        <td className="py-2.5 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{p.name}</td>
                        <td className="text-center py-2.5 px-3 text-slate-600">{(p.qty || 0).toLocaleString()}</td>
                        <td className="text-right py-2.5 px-3 font-bold text-emerald-700">{fmtK(p.revenue || 0)}</td>
                        <td className="text-right py-2.5 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-14 h-1.5 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                            <span className="text-xs font-semibold text-slate-600">{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Diagnoses */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3">🩺 Top Diagnoses</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-rose-50">
                    <th className="text-left py-2.5 px-3 font-semibold text-rose-700 rounded-l-lg">#</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-rose-700">Diagnosis</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-rose-700 rounded-r-lg">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {(topDiagnoses.length > 0 ? topDiagnoses : [{ name: "No data", count: 0 }]).map((d: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-rose-50/30">
                      <td className="py-2.5 px-3 text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{d.name}</td>
                      <td className="text-right py-2.5 px-3 font-bold text-slate-800">{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Received Payments / POS Sales History */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Received Payments by Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-cyan-50">
                    <th className="text-left py-2.5 px-3 font-semibold text-cyan-700 rounded-l-lg">Created At</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-cyan-700">Receipt #</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-cyan-700">Patient</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-cyan-700">Payment Method</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-cyan-700 rounded-r-lg">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {(sales.length > 0 ? sales.slice(0, 30) : [{ created_at: null, receipt_no: "-", patient: null, payment_method: "-", total_amount: 0 }]).map((sale: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-cyan-50/30">
                      <td className="py-2.5 px-3 text-slate-600">{sale.created_at ? new Date(sale.created_at).toLocaleString("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{sale.receipt_no || "-"}</td>
                      <td className="py-2.5 px-3 font-medium text-blue-600">{sale.patient ? `${sale.patient.firstName || ""} ${sale.patient.lastName || ""}` : "-"}</td>
                      <td className="text-center py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sale.payment_method === "Cash" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>{sale.payment_method || "-"}</span>
                      </td>
                      <td className="text-right py-2.5 px-3 font-bold text-slate-800">{fmt(Number(sale.total_amount) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
