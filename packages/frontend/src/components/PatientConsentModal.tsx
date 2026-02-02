import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import api from "../api/axios";

interface Patient {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    gender?: string;
    dob?: string | null;
    phone?: string;
}

interface ConsentType {
    id: number;
    code: string;
    title: string;
    description: string;
    emoji: string;
    is_mandatory: boolean;
    requires_otp: boolean;
}

interface PatientConsent {
    consent_type_id: number;
    is_granted: boolean;
    otp_verified?: boolean;
}

interface PatientConsentModalProps {
    patient: Patient;
    onClose: () => void;
    onSave?: () => void;
}

// Default consent types for demo
const defaultConsentTypes: ConsentType[] = [
    {
        id: 1,
        code: "MEDICAL_INFO_RECORDING",
        title: "Medical Information Recording",
        description: "Consent to have medical information recorded in the electronic health record system.",
        emoji: "📝",
        is_mandatory: true,
        requires_otp: false,
    },
    {
        id: 2,
        code: "DATA_ANALYSIS",
        title: "De-identified Data Analysis",
        description: "Consent to use de-identified, aggregated data for analysis and research purposes.",
        emoji: "📊",
        is_mandatory: false,
        requires_otp: false,
    },
    {
        id: 3,
        code: "RESEARCH_CONTACT",
        title: "Research Contact",
        description: "Consent that my care provider may contact me to participate in patient benefit and clinical research initiatives.",
        emoji: "🔬",
        is_mandatory: false,
        requires_otp: false,
    },
    {
        id: 4,
        code: "SMS_NOTIFICATIONS",
        title: "SMS Notifications",
        description: "Consent to receive SMS notifications about appointments, test results, and health reminders.",
        emoji: "📱",
        is_mandatory: false,
        requires_otp: false,
    },
    {
        id: 5,
        code: "THIRD_PARTY_SHARING",
        title: "Third Party Data Sharing",
        description: "Consent to share medical records with authorized third parties for insurance claims and referrals.",
        emoji: "🤝",
        is_mandatory: false,
        requires_otp: true,
    },
];

export const PatientConsentModal: React.FC<PatientConsentModalProps> = ({
    patient,
    onClose,
    onSave,
}) => {
    const [consentTypes, setConsentTypes] = useState<ConsentType[]>(defaultConsentTypes);
    const [consents, setConsents] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // OTP State
    const [otpCode, setOtpCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState(0);

    const getFullName = () =>
        [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ");

    const getInitials = () =>
        [patient.firstName?.[0], patient.lastName?.[0]].filter(Boolean).join("").toUpperCase();

    const calculateAge = () => {
        if (!patient.dob) return null;
        const birthDate = new Date(patient.dob);
        const diff = Date.now() - birthDate.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    const formatDob = () => {
        if (!patient.dob) return "N/A";
        return new Date(patient.dob).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch consent types
                try {
                    const typesRes = await api.get("/consent-types");
                    if (typesRes.data && Array.isArray(typesRes.data)) {
                        setConsentTypes(typesRes.data);
                    }
                } catch { /* Use defaults */ }

                // Fetch patient's current consents
                try {
                    const consentsRes = await api.get(`/patients/${patient.id}/consents`);
                    if (consentsRes.data && Array.isArray(consentsRes.data)) {
                        const consentMap: Record<number, boolean> = {};
                        consentsRes.data.forEach((c: PatientConsent) => {
                            consentMap[c.consent_type_id] = c.is_granted;
                        });
                        setConsents(consentMap);
                    }
                } catch { /* No consents yet */ }
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [patient.id]);

    // OTP Countdown timer
    useEffect(() => {
        if (otpCountdown > 0) {
            const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [otpCountdown]);

    // Toggle consent
    const handleToggleConsent = (typeId: number) => {
        setConsents(prev => ({
            ...prev,
            [typeId]: !prev[typeId],
        }));
    };

    // Check if OTP is required for any selected consent
    const otpRequired = consentTypes.some(
        type => type.requires_otp && consents[type.id]
    );

    // Send OTP
    const handleSendOtp = async () => {
        if (!patient.phone) {
            setError("Patient phone number is required for OTP verification");
            return;
        }

        setOtpLoading(true);
        setError(null);

        try {
            await api.post(`/patients/${patient.id}/send-consent-otp`, {
                phone: patient.phone,
            });
            setOtpSent(true);
            setOtpCountdown(60);
            setSuccessMessage("📱 OTP sent to " + patient.phone);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length < 4) {
            setError("Please enter a valid OTP code");
            return;
        }

        setOtpLoading(true);
        setError(null);

        try {
            await api.post(`/patients/${patient.id}/verify-consent-otp`, {
                otp: otpCode,
            });
            setOtpVerified(true);
            setSuccessMessage("✅ OTP verified successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid OTP code");
        } finally {
            setOtpLoading(false);
        }
    };

    // Save consents
    const handleSave = async (skipOtp: boolean = false) => {
        if (otpRequired && !otpVerified && !skipOtp) {
            setError("Please verify OTP before saving consents that require verification");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const consentData = Object.entries(consents).map(([typeId, isGranted]) => ({
                consent_type_id: Number(typeId),
                is_granted: isGranted,
                otp_verified: otpVerified,
            }));

            await api.post(`/patients/${patient.id}/consents`, { consents: consentData });

            setSuccessMessage("✅ Consents saved successfully!");
            setTimeout(() => {
                onSave?.();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save consents");
        } finally {
            setIsSaving(false);
        }
    };

    const grantedCount = Object.values(consents).filter(Boolean).length;

    return (
        <Dialog.Root open onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/60 backdrop-blur-md z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
                    {/* Main Card */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                        {/* ✅ Premium Header */}
                        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 px-6 py-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-lg backdrop-blur-sm">
                                        ✅
                                    </div>
                                    <div>
                                        <Dialog.Title className="text-xl font-bold text-white tracking-tight">
                                            Digital Consent
                                        </Dialog.Title>
                                        <p className="text-emerald-100 text-sm mt-0.5">
                                            Review and confirm patient consents
                                        </p>
                                    </div>
                                </div>
                                <Dialog.Close asChild>
                                    <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105">
                                        ✕
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {/* Patient Info Card */}
                            <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-2xl p-4 border border-slate-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {getInitials()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800 text-lg">{getFullName()}</h3>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                                            <span>{patient.gender === 'Male' ? '👨' : '👩'} {patient.gender?.toUpperCase() || 'N/A'}</span>
                                            <span>•</span>
                                            <span>🎂 {calculateAge() || 'N/A'} years</span>
                                            <span>•</span>
                                            <span>📅 {formatDob()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500">Consents Granted</div>
                                        <div className="text-2xl font-bold text-emerald-600">{grantedCount}/{consentTypes.length}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            {error && (
                                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-2xl">⚠️</span>
                                    <div className="flex-1">
                                        <div className="font-semibold text-red-800 text-sm">Error</div>
                                        <div className="text-red-700 text-sm">{error}</div>
                                    </div>
                                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
                                </div>
                            )}

                            {successMessage && (
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-2xl">✅</span>
                                    <div className="text-emerald-700 font-medium text-sm">{successMessage}</div>
                                </div>
                            )}

                            {/* 📋 Consent Items */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <span className="text-lg">📋</span> Consent Options
                                </h3>

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {consentTypes.map((type) => (
                                            <div
                                                key={type.id}
                                                onClick={() => handleToggleConsent(type.id)}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${consents[type.id]
                                                    ? 'bg-emerald-50 border-emerald-300'
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Checkbox */}
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${consents[type.id]
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-slate-300 bg-white'
                                                        }`}>
                                                        {consents[type.id] && <span className="text-sm">✓</span>}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl">{type.emoji}</span>
                                                            <span className="font-semibold text-slate-800">{type.title}</span>
                                                            {type.is_mandatory && (
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                                                    Required
                                                                </span>
                                                            )}
                                                            {type.requires_otp && (
                                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-medium rounded-full flex items-center gap-1">
                                                                    🔐 OTP Required
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-600 mt-1">{type.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 🔐 OTP Section */}
                            {otpRequired && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-2xl p-5 border border-amber-200 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🔐</span>
                                        <h3 className="font-semibold text-slate-800">OTP Verification Required</h3>
                                        {otpVerified && (
                                            <span className="ml-auto px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                ✅ Verified
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-600">
                                        Some selected consents require OTP verification. Please enter the OTP sent to the patient's registered phone number.
                                    </p>

                                    {!otpVerified && (
                                        <>
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                        placeholder="Enter OTP code..."
                                                        maxLength={6}
                                                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleSendOtp}
                                                    disabled={otpLoading || otpCountdown > 0}
                                                    className="px-4 py-3 bg-white border-2 border-amber-300 text-amber-700 font-medium rounded-xl hover:bg-amber-50 transition-all disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    {otpLoading ? (
                                                        <span className="flex items-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                            Sending...
                                                        </span>
                                                    ) : otpCountdown > 0 ? (
                                                        `Resend (${otpCountdown}s)`
                                                    ) : otpSent ? (
                                                        "🔄 Resend OTP"
                                                    ) : (
                                                        "📱 Send OTP"
                                                    )}
                                                </button>
                                            </div>

                                            <button
                                                onClick={handleVerifyOtp}
                                                disabled={otpLoading || !otpCode || otpCode.length < 4}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {otpLoading ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>🔓 Verify OTP</>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 🎯 Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                {otpRequired && !otpVerified && (
                                    <button
                                        onClick={() => handleSave(true)}
                                        disabled={isSaving}
                                        className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        ⏭️ Proceed without OTP
                                    </button>
                                )}
                                <Dialog.Close asChild>
                                    <button
                                        className="flex-1 px-6 py-3.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        ❌ Cancel
                                    </button>
                                </Dialog.Close>
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving || (otpRequired && !otpVerified)}
                                    className="flex-[2] px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>✅ Confirm and Save</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
