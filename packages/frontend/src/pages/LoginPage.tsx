import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ── Inline styles for elements that need CSS features beyond Tailwind ── */
const bgImageStyle: React.CSSProperties = {
  backgroundImage:
    "url('https://images.unsplash.com/photo-1590490360182-c33d955f7f65?w=1400&q=85')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

/* shimmer / shine sweep on button hover */
const shimmerKf = `
@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes pulseDot{0%,100%{box-shadow:0 0 6px rgba(52,211,153,.5)}50%{box-shadow:0 0 18px rgba(52,211,153,.3)}}
`;

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@hospital.test");
  const [password, setPassword] = useState("1234");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "waiter">("admin");
  const [currentTime, setCurrentTime] = useState(new Date());
  const nav = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const data = res.data as any;
      localStorage.setItem("hms_token", data.token);
      localStorage.setItem("hms_user", JSON.stringify(data.user));
      onLogin();
      toast.success("🎉 Welcome back! Login successful");
      nav("/NewDashboardLayout", { state: { fromLogin: true } });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
      toast.error(`❌ ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* inject keyframes */}
      <style>{shimmerKf}</style>

      <div className="min-h-screen flex bg-[#f0f2ff] relative overflow-hidden">

        {/* ═══════════════ LEFT PANEL — Hotel Image ═══════════════ */}
        <div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
          style={bgImageStyle}
        >
          {/* warm subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-purple-200/10 to-indigo-300/15" />

          {/* brand card – bottom-left floating glass card */}
          <div className="absolute bottom-12 left-12 right-12 z-10">
            <div
              className="max-w-sm p-8 rounded-[28px] border border-white/40 shadow-2xl"
              style={{
                background: "rgba(255,255,255,0.68)",
                backdropFilter: "blur(20px) saturate(1.4)",
                WebkitBackdropFilter: "blur(20px) saturate(1.4)",
              }}
            >
              <div className="text-5xl mb-3">💎</div>
              <h1 className="text-3xl font-extrabold text-indigo-950 mb-1 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Alpha Plus
              </h1>
              <p className="text-sm text-gray-500 mb-5 font-medium">Premium Hotel Management System</p>

              {/* feature pills */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 border border-blue-200/60">
                  🚀 Fast &amp; Reliable
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-violet-100/80 text-violet-800 border border-violet-200/60">
                  🔒 Secure
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200/60">
                  📊 Analytics
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-800 border border-amber-200/60">
                  🏨 24 / 7
                </span>
              </div>
            </div>
          </div>

          {/* live time */}
          <div className="absolute top-6 left-6 z-10">
            <div
              className="px-5 py-2.5 rounded-2xl text-xs font-medium text-white flex items-center gap-2"
              style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)" }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" style={{ animation: "pulseDot 2s infinite" }} />
              {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              {" · "}
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* ═══════════════ RIGHT PANEL — Login Form ═══════════════ */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 relative z-10">

          {/* decorative soft blobs */}
          <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-violet-300/25 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-8 w-56 h-56 rounded-full bg-sky-300/20 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-32 right-10 w-40 h-40 rounded-full bg-amber-200/15 blur-[60px] pointer-events-none" />

          {/* decorative rings */}
          <div className="absolute top-8 left-[-60px] w-56 h-56 rounded-full border-2 border-indigo-200/15 pointer-events-none" />
          <div className="absolute bottom-14 right-8 w-28 h-28 rounded-full border-2 border-violet-200/20 pointer-events-none" />

          {/* floating sparkles */}
          <span className="absolute top-[14%] right-[16%] text-lg opacity-30 pointer-events-none" style={{ animation: "floatY 5s ease-in-out infinite" }}>✨</span>
          <span className="absolute bottom-[20%] left-[10%] text-sm opacity-25 pointer-events-none" style={{ animation: "floatY 5s ease-in-out infinite 1.5s" }}>💫</span>
          <span className="absolute top-[44%] right-[8%] text-xl opacity-15 pointer-events-none" style={{ animation: "floatY 5s ease-in-out infinite 3s" }}>⭐</span>

          {/* ── Glass Login Card ── */}
          <div className="w-full max-w-[420px] relative">
            <div
              className="rounded-[32px] p-9 border border-white/60 shadow-xl"
              style={{
                background: "rgba(255,255,255,0.78)",
                backdropFilter: "blur(28px) saturate(1.3)",
                WebkitBackdropFilter: "blur(28px) saturate(1.3)",
                boxShadow: "0 20px 60px rgba(100,80,180,0.08), 0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              {/* ── Mobile brand (hidden on desktop) ── */}
              <div className="lg:hidden text-center mb-7">
                <div className="text-4xl mb-2">💎</div>
                <h1 className="text-xl font-extrabold text-indigo-950">Alpha Plus Hotel</h1>
                <p className="text-xs text-gray-400 mt-0.5">Premium Hotel Management System</p>
              </div>

              {/* ── Brand icon + name (desktop) ── */}
              <div className="hidden lg:flex flex-col items-center mb-6">
                <div className="text-4xl mb-1">💎</div>
                <span className="text-base font-bold text-indigo-900">Alpha Plus Hotel</span>
              </div>

              {/* ── Tabs ── */}
              <div className="flex gap-1.5 bg-gray-100/80 rounded-2xl p-1.5 mb-7">
                <button
                  type="button"
                  onClick={() => setActiveTab("admin")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[14px] text-sm font-semibold transition-all duration-200 ${activeTab === "admin"
                      ? "bg-white text-indigo-700 shadow-md shadow-indigo-100/60"
                      : "text-gray-400 hover:text-indigo-500"
                    }`}
                >
                  👤 Admin Portal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("waiter")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[14px] text-sm font-semibold transition-all duration-200 ${activeTab === "waiter"
                      ? "bg-white text-indigo-700 shadow-md shadow-indigo-100/60"
                      : "text-gray-400 hover:text-indigo-500"
                    }`}
                >
                  🍽️ Waiter Station
                </button>
              </div>

              {/* ── Welcome ── */}
              <div className="text-center mb-7">
                <h2 className="text-2xl font-extrabold text-indigo-950">Welcome Back 👋</h2>
                <p className="text-sm text-gray-400 mt-1">Sign in to your dashboard</p>
              </div>

              {/* ── Error ── */}
              {error && (
                <div className="mb-5 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">❌</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* ── Form ── */}
              <form onSubmit={submit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2 ml-1">
                    <span>📧</span> Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-indigo-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-[14px] rounded-2xl border-2 border-gray-200/80 bg-white/70 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/40 hover:border-indigo-200 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2 ml-1">
                    <span>🔐</span> Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-indigo-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-[14px] rounded-2xl border-2 border-gray-200/80 bg-white/70 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/40 hover:border-indigo-200 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-indigo-300 hover:text-indigo-500 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-[18px] h-[18px] rounded-md border-2 border-indigo-200 text-indigo-600 focus:ring-indigo-300 focus:ring-2 cursor-pointer accent-indigo-600"
                    />
                    <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors font-medium">Remember me</span>
                  </label>
                  <button type="button" className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                    Forgot password? 🔑
                  </button>
                </div>

                {/* ── Sign In Button ── */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full py-4 rounded-2xl font-bold text-white text-[15px] overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-lg hover:shadow-indigo-300/30 hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)",
                    boxShadow: "0 6px 24px rgba(129,140,248,0.30)",
                  }}
                >
                  {/* shine sweep */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                      animation: "shimmer 1.5s infinite",
                    }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <span className="text-lg group-hover:translate-x-1 transition-transform duration-300 inline-block">→</span>
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-300 font-medium whitespace-nowrap">🛡️ Secured by enterprise encryption</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* ── Footer status ── */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 inline-block"
                    style={{ animation: "pulseDot 2s infinite" }}
                  />
                  All Systems Online
                </div>
                <p className="text-[10px] text-gray-300 mt-2">© 2025 Alpha Plus Hotel · v2.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </>
  );
}