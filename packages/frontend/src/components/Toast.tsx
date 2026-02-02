import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const toastConfig = {
    success: {
        emoji: '✅',
        bg: 'from-emerald-500 to-teal-500',
        border: 'border-emerald-400',
        iconBg: 'bg-emerald-600',
    },
    error: {
        emoji: '❌',
        bg: 'from-red-500 to-rose-500',
        border: 'border-red-400',
        iconBg: 'bg-red-600',
    },
    warning: {
        emoji: '⚠️',
        bg: 'from-amber-500 to-orange-500',
        border: 'border-amber-400',
        iconBg: 'bg-amber-600',
    },
    info: {
        emoji: 'ℹ️',
        bg: 'from-blue-500 to-indigo-500',
        border: 'border-blue-400',
        iconBg: 'bg-blue-600',
    },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast = { ...toast, id };

        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after duration
        setTimeout(() => {
            removeToast(id);
        }, toast.duration || 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => {
                    const config = toastConfig[toast.type];
                    return (
                        <div
                            key={toast.id}
                            className={`
                pointer-events-auto
                min-w-[320px] max-w-[420px]
                bg-gradient-to-r ${config.bg}
                backdrop-blur-xl
                rounded-2xl
                shadow-2xl shadow-slate-900/20
                border ${config.border}
                p-4
                flex items-start gap-4
                animate-slide-in-right
                relative
                overflow-hidden
              `}
                            style={{
                                animation: 'slideInRight 0.4s ease-out forwards',
                            }}
                        >
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>

                            {/* Icon */}
                            <div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>
                                {config.emoji}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-sm tracking-tight">{toast.title}</h4>
                                {toast.message && (
                                    <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{toast.message}</p>
                                )}
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white/80 hover:text-white transition-all text-xs flex-shrink-0"
                            >
                                ✕
                            </button>

                            {/* Progress Bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                <div
                                    className="h-full bg-white/60 rounded-full"
                                    style={{
                                        animation: `shrink ${toast.duration || 4000}ms linear forwards`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CSS Animations */}
            <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
        </ToastContext.Provider>
    );
};

// Helper hook for quick toast calls
export const useNotification = () => {
    const { showToast } = useToast();

    return {
        success: (title: string, message?: string) =>
            showToast({ type: 'success', title, message }),
        error: (title: string, message?: string) =>
            showToast({ type: 'error', title, message }),
        warning: (title: string, message?: string) =>
            showToast({ type: 'warning', title, message }),
        info: (title: string, message?: string) =>
            showToast({ type: 'info', title, message }),
    };
};
