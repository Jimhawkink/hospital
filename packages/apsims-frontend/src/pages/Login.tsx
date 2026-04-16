import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, School, CheckCircle2 } from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import api from "../utils/api";

const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            navigate("/");
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white">
            {/* Left Side - Brand & Value Prop */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-blue-600 overflow-hidden items-center justify-center p-12">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 opacity-90 z-10" />
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500 blur-3xl opacity-50 z-0" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-500 blur-3xl opacity-50 z-0" />

                <div className="relative z-20 w-full max-w-lg text-white">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
                            <School className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">APSIMS Manager</span>
                    </div>

                    <h1 className="text-4xl font-bold leading-tight mb-6">
                        Streamline Your School Management Today.
                    </h1>
                    <p className="text-blue-100 text-lg mb-10 leading-relaxed">
                        Experience the next generation of school administration. Manage students, fees, exams, and staff in one unified, secure platform designed for excellence.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition-transform hover:translate-x-2 duration-300">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <ShieldCheck className="h-6 w-6 text-emerald-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Secure & Reliable</h3>
                                <p className="text-sm text-blue-200">Bank-grade data protection</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition-transform hover:translate-x-2 duration-300">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <CheckCircle2 className="h-6 w-6 text-amber-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Real-Time Analytics</h3>
                                <p className="text-sm text-blue-200">Instant insights at a glance</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex items-center gap-2 text-sm text-blue-200">
                        <span>&copy; 2024 Alpha Plus Systems. All rights reserved.</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100">
                    <div className="text-center lg:text-left">
                        <div className="inline-flex lg:hidden items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white mb-6 shadow-lg shadow-blue-600/20">
                            <LogIn className="h-6 w-6" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
                        <p className="mt-2 text-slate-500">Please enter your credentials to access the dashboard.</p>
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="p-1 bg-red-100 rounded-full text-red-600 shrink-0">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div className="text-sm text-red-700 font-medium pt-0.5">
                                    {error}
                                </div>
                            </div>
                        )}

                        <div className="space-y-5">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="name@school.com"
                                icon={<Mail className="h-5 w-5 text-slate-400" />}
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            />

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-slate-700">Password</label>
                                    <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline">
                                        Forgot password?
                                    </a>
                                </div>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    icon={<Lock className="h-5 w-5 text-slate-400" />}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                                Remember me for 30 days
                            </label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-300"
                            isLoading={isLoading}
                        >
                            Sign In to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Don't have an account?{" "}
                        <a href="#" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline decoration-2 underline-offset-2">
                            Contact System Admin
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
