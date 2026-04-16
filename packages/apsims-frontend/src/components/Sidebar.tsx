import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    GraduationCap,
    CreditCard,
    Wallet,
    Calendar,
    BookOpen,
    Banknote,
    LogOut,
    Users,
    UserCog,
    ChevronDown,
    Menu,
    X,
    FolderOpen
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const sidebarItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Students", path: "/students", icon: Users },
    { name: "Exams", path: "/exams", icon: GraduationCap },
    { name: "Fees", path: "/fees", icon: CreditCard },
    { name: "Income", path: "/income", icon: Banknote },
    { name: "Timetable", path: "/timetable", icon: Calendar },
    { name: "Remedial", path: "/remedial", icon: BookOpen },
    { name: "Pocket Money", path: "/pocket-money", icon: Wallet },
    { name: "Teaching Staff", path: "/staff", icon: UserCog },
    { name: "Sub Staff", path: "/subordinate-staff", icon: UserCog },
    { name: "Reports", path: "/reports", icon: FolderOpen }, // Assuming reports page exists or will exist soon
];

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
    const location = useLocation();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 transform bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Brand Header */}
                <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                            <span className="text-lg font-bold">A</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 leading-tight">APSIMS</h1>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Manager</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-md p-1 hover:bg-slate-100 lg:hidden"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar h-[calc(100vh-8rem)]">
                    <nav className="space-y-1">
                        {sidebarItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)} // Close on mobile click
                                    className={cn(
                                        "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "h-5 w-5 shrink-0 transition-colors",
                                            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                        )}
                                    />
                                    {item.name}
                                    {isActive && (
                                        <div className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer / User Profile Snippet (Optional or Logout) */}
                <div className="absolute bottom-0 w-full border-t border-slate-100 bg-white p-4">
                    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
