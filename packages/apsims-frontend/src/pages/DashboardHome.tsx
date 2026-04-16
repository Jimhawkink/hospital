import React, { useEffect, useState } from "react";
import {
    Users,
    CreditCard,
    GraduationCap,
    TrendingUp,
    ArrowUpRight,
    MoreHorizontal,
    Plus,
    CalendarCheck,
    FileText
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { cn } from "../utils/cn";
import api from "../utils/api";

const DashboardHome = () => {
    const [statsData, setStatsData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats/dashboard');
                setStatsData(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const stats = [
        {
            name: "Total Students",
            value: isLoading ? "..." : statsData?.totalStudents?.toLocaleString() || "0",
            change: isLoading ? "" : `+${statsData?.studentsChange || 0}%`,
            trend: "up",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-100/50",
            subtext: "Active enrollments"
        },
        {
            name: "Fees Collected",
            value: isLoading ? "..." : `KES ${statsData?.feesCollected?.toLocaleString() || "0"}`,
            change: isLoading ? "" : `+${statsData?.feesChange || 0}%`,
            trend: "up",
            icon: CreditCard,
            color: "text-emerald-600",
            bg: "bg-emerald-100/50",
            subtext: "Current Term"
        },
        {
            name: "Upcoming Exams",
            value: isLoading ? "..." : statsData?.upcomingExams?.toString() || "0",
            change: "Starts in 2 days", // Dynamic logic could improve this
            trend: "neutral",
            icon: GraduationCap,
            color: "text-purple-600",
            bg: "bg-purple-100/50",
            subtext: "Term 2 Mid-Term"
        },
        {
            name: "Total Income",
            value: isLoading ? "..." : `KES ${statsData?.totalIncome?.toLocaleString() || "0"}`,
            change: isLoading ? "" : `+${statsData?.incomeChange || 0}%`,
            trend: "up",
            icon: TrendingUp,
            color: "text-amber-600",
            bg: "bg-amber-100/50",
            subtext: "Including Farm/Donations"
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500">Overview of your school's performance and recent activities.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <CalendarCheck className="mr-2 h-4 w-4" /> View Calendar
                    </Button>
                    <Button size="sm">
                        <FileText className="mr-2 h-4 w-4" /> Generate Report
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.name} className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="p-6">
                            <div className="flex items-center justify-between pb-4">
                                <div className={cn("rounded-xl p-2.5 shadow-sm ring-1 ring-black/5", stat.bg)}>
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                                    stat.trend === "up" ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-600"
                                )}>
                                    {stat.change}
                                    {stat.trend === "up" && !isLoading && <ArrowUpRight className="h-3 w-3" />}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-slate-500">{stat.name}</h3>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold tracking-tight text-slate-900">
                                        {stat.value}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">{stat.subtext}</p>
                            </div>
                        </div>
                        {/* Decorative background shape */}
                        <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-current opacity-[0.03]" />
                    </Card>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid gap-6 lg:grid-cols-3">

                {/* Recent Payments Table */}
                <Card className="col-span-2 border-none shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white p-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Recent Fee Payments</h3>
                            <p className="text-xs text-slate-500">Latest successful transactions</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                            View All
                        </Button>
                    </div>
                    <div className="overflow-x-auto bg-white">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50">
                                <tr className="text-slate-500">
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Student</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Class</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Amount</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    JD
                                                </div>
                                                John Doe {i}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">Form 4 East</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">KES 15,000</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                Paid
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 text-xs">Oct 24, 2024</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Quick Actions Panel */}
                <div className="space-y-6">
                    <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 p-6">
                        <h3 className="mb-4 font-bold text-lg text-slate-900">Quick Actions</h3>
                        <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start h-12 bg-white hover:bg-slate-50 border-slate-200">
                                <CreditCard className="mr-3 h-4 w-4 text-emerald-600" /> Record Fee Payment
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 bg-white hover:bg-slate-50 border-slate-200">
                                <Users className="mr-3 h-4 w-4 text-blue-600" /> Admit New Student
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 bg-white hover:bg-slate-50 border-slate-200">
                                <GraduationCap className="mr-3 h-4 w-4 text-purple-600" /> Enter Exam Results
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 bg-white hover:bg-slate-50 border-slate-200">
                                <Plus className="mr-3 h-4 w-4 text-slate-600" /> Create Expense
                            </Button>
                        </div>
                    </Card>

                    <Card className="border-none shadow-md bg-blue-600 text-white p-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Need Support?</h3>
                            <p className="text-blue-100 text-sm mb-4">Contact our support team for help with any issues or setup.</p>
                            <Button variant="secondary" size="sm" className="bg-white text-blue-700 hover:bg-blue-50 border-none shadow-none">
                                Contact Support
                            </Button>
                        </div>
                        {/* Decorative background shape */}
                        <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10" />
                        <div className="absolute -right-2 -top-8 h-24 w-24 rounded-full bg-white/10" />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
