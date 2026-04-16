import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Bell, User } from "lucide-react";
import Sidebar from "../components/Sidebar";

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Helper to get current page title
    const getPageTitle = (pathname: string) => {
        if (pathname === "/") return "Dashboard";
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length === 0) return "Dashboard";

        // Capitalize and clean up (e.g., 'student-admission' -> 'Student Admission')
        return parts[0]
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Wrapper */}
            <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out">
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md transition-all lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="rounded-md p-2 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            <Menu className="h-6 w-6 text-slate-600" />
                        </button>

                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                            {getPageTitle(location.pathname)}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative rounded-full p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200">
                            <Bell className="h-5 w-5 text-slate-600" />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                        </button>

                        <div className="hidden md:flex h-8 w-[1px] bg-slate-200 mx-2"></div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-900 leading-none">John Doe</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">Administrator</p>
                            </div>
                            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200">
                                <User className="h-5 w-5 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content Scrollable Area */}
                <main className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
