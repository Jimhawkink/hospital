import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import api from "../api/axios";

interface Staff {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  activeStatus: boolean;
  role?: string;
}

interface NewEncounterModalProps {
  patient: {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
  };
  onClose: () => void;
  onStart: () => void;
}

// Quick date presets
const datePresets = [
  { label: "Today", emoji: "📅", days: 0 },
  { label: "Tomorrow", emoji: "🌅", days: 1 },
  { label: "+1 Week", emoji: "📆", days: 7 },
];

// Encounter type options with emojis
const encounterTypes = [
  { value: "Consultation", label: "Consultation", emoji: "🩺", color: "from-blue-500 to-indigo-500" },
  { value: "Delivery", label: "Delivery", emoji: "👶", color: "from-pink-500 to-rose-500" },
  { value: "Check-up", label: "Check-up", emoji: "✅", color: "from-green-500 to-emerald-500" },
  { value: "Surgery", label: "Surgery", emoji: "🏥", color: "from-red-500 to-orange-500" },
  { value: "Treatment", label: "Treatment", emoji: "💊", color: "from-purple-500 to-violet-500" },
  { value: "Visit", label: "Visit", emoji: "🏠", color: "from-cyan-500 to-teal-500" },
];

// Priority type options with emojis and colors
const priorityTypes = [
  { value: "High", label: "High Priority", emoji: "🔴", color: "bg-red-500", textColor: "text-red-600", bgLight: "bg-red-50 border-red-200" },
  { value: "Normal", label: "Normal", emoji: "🟢", color: "bg-green-500", textColor: "text-green-600", bgLight: "bg-green-50 border-green-200" },
  { value: "Serious", label: "Serious", emoji: "🟠", color: "bg-orange-500", textColor: "text-orange-600", bgLight: "bg-orange-50 border-orange-200" },
  { value: "Can wait", label: "Can Wait", emoji: "🔵", color: "bg-blue-500", textColor: "text-blue-600", bgLight: "bg-blue-50 border-blue-200" },
  { value: "Admission", label: "Will Come", emoji: "🟣", color: "bg-purple-500", textColor: "text-purple-600", bgLight: "bg-purple-50 border-purple-200" },
];

// Insurance type options
const insuranceTypes = [
  { value: "Self Payment", label: "Self Payment", emoji: "💵", color: "text-green-600", bgLight: "bg-green-50 border-green-200" },
  { value: "SHA", label: "SHA (Social Health Authority)", emoji: "🏛️", color: "text-blue-600", bgLight: "bg-blue-50 border-blue-200" },
  { value: "UAP", label: "UAP Insurance", emoji: "🛡️", color: "text-purple-600", bgLight: "bg-purple-50 border-purple-200" },
  { value: "Jubilee", label: "Jubilee Insurance", emoji: "🔰", color: "text-orange-600", bgLight: "bg-orange-50 border-orange-200" },
  { value: "AAR", label: "AAR Insurance", emoji: "🏆", color: "text-indigo-600", bgLight: "bg-indigo-50 border-indigo-200" },
  { value: "NHIF", label: "NHIF", emoji: "🏥", color: "text-teal-600", bgLight: "bg-teal-50 border-teal-200" },
  { value: "Other", label: "Other Insurance", emoji: "📋", color: "text-slate-600", bgLight: "bg-slate-50 border-slate-200" },
];

export const NewEncounterModal: React.FC<NewEncounterModalProps> = ({
  patient,
  onClose,
  onStart,
}) => {
  const [doctorId, setDoctorId] = useState<number | "">("");
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [encounterDate, setEncounterDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [encounterTime, setEncounterTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [encounterType, setEncounterType] = useState<string>("Consultation");
  const [priorityType, setPriorityType] = useState<string>("Normal");
  const [insuranceType, setInsuranceType] = useState<string>("Self Payment");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [createdEncounter, setCreatedEncounter] = useState<any>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Organization info - fetched from API
  const [orgInfo, setOrgInfo] = useState({
    name: "Healthcare Facility",
    address: "",
    phone: "",
    email: ""
  });

  // Generate encounter number
  const generateEncounterNumber = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `ENC-${timestamp}-${random}`;
  };

  // Fetch organisation settings
  const fetchOrgInfo = async () => {
    try {
      const response = await api.get("/organisation-settings");
      if (response.data) {
        const data = response.data as any;
        setOrgInfo({
          name: data.organisation_name || "Healthcare Facility",
          address: data.address || `${data.town || ''}, ${data.county || ''}`.trim().replace(/^,|,$/g, '') || "Address not set",
          phone: data.phone || "",
          email: data.email || ""
        });
      }
    } catch (err) {
      console.log("Could not fetch org settings, using defaults");
    }
  };

  // Fetch staff members
  const fetchDoctors = async () => {
    setIsLoadingDoctors(true);
    setError(null);

    try {
      const response = await api.get("/staff");
      if (response && Array.isArray(response.data)) {
        const activeStaff = response.data.filter(
          (staff: Staff) => staff.activeStatus === true
        );
        setDoctors(activeStaff);
        if (activeStaff.length === 0) {
          setError("No active staff members found.");
        }
      }
    } catch (err: any) {
      console.error("Error fetching staff:", err);
      setError("Failed to load staff members.");
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchOrgInfo();
  }, []);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorId) {
      setError("Please select a staff member.");
      return;
    }

    if (!encounterDate) {
      setError("Please select an encounter date.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const patientIdNum = Number(patient.id);
      const providerIdNum = Number(doctorId);

      if (isNaN(patientIdNum) || patientIdNum <= 0) {
        throw new Error("Invalid patient ID");
      }

      if (isNaN(providerIdNum) || providerIdNum <= 0) {
        throw new Error("Invalid provider ID");
      }

      const encounterNumber = generateEncounterNumber();
      const encounterData = {
        encounter_number: encounterNumber,
        encounter_type: encounterType,
        priority_type: priorityType,
        insurance_type: insuranceType,
        notes: "",
        patient_id: patientIdNum,
        provider_id: providerIdNum,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("📝 Encounter data being sent:", encounterData);

      const response = await api.post("/encounters", encounterData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 30000,
      });

      console.log("✅ Encounter created successfully:", response.data);

      // Store created encounter for receipt
      setCreatedEncounter({
        ...encounterData,
        id: (response.data as any)?.id || encounterNumber,
        encounter_number: encounterNumber,
        createdAt: new Date().toISOString(),
      });

      // Show receipt preview
      setShowReceiptPreview(true);

    } catch (err: any) {
      console.error("Error starting encounter:", err);

      let errorMessage = "Failed to start encounter. ";

      if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your connection and try again.";
      } else if (err.code === "NETWORK_ERROR" || err.message === "Network Error") {
        errorMessage = "Network connection failed. Please check your internet connection.";
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid data provided. ";
        if (err.response.data?.error) {
          errorMessage += err.response.data.error;
        } else if (err.response.data?.message) {
          errorMessage += err.response.data.message;
        } else {
          errorMessage += "Please check all required fields.";
        }
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to perform this action.";
      } else if (err.response?.status === 404) {
        errorMessage = "Endpoint not found. Please contact system administrator.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error occurred. Please try again later.";
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Please try again.";
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryFetch = () => {
    fetchDoctors();
  };

  const getFullName = () =>
    [patient.firstName, patient.middleName, patient.lastName]
      .filter(Boolean)
      .join(" ");

  const getDoctorDisplayName = (doctor: Staff) => {
    return `${doctor.title || ""} ${doctor.firstName} ${doctor.lastName}`.trim();
  };

  const getSelectedDoctor = () => doctors.find(d => d.id === doctorId);

  // Date helpers
  const setDateFromPreset = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setEncounterDate(date.toISOString().split("T")[0]);
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatReceiptDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + " " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const getSelectedEncounterType = () => encounterTypes.find(t => t.value === encounterType);
  const getSelectedPriority = () => priorityTypes.find(p => p.value === priorityType);
  const getSelectedInsurance = () => insuranceTypes.find(i => i.value === insuranceType);

  // Print receipt
  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Encounter Receipt</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            padding: 3mm;
            font-size: 11px;
            line-height: 1.4;
          }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .logo { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
          .subtitle { font-size: 9px; color: #666; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .label { color: #666; font-size: 10px; }
          .value { font-weight: bold; text-align: right; max-width: 55%; }
          .center { text-align: center; }
          .highlight { background: #f5f5f5; padding: 6px; border-radius: 4px; margin: 6px 0; }
          .enc-num { font-size: 14px; font-weight: bold; text-align: center; margin: 8px 0; letter-spacing: 1px; }
          .footer { text-align: center; font-size: 9px; color: #666; margin-top: 12px; border-top: 1px dashed #000; padding-top: 8px; }
          .emoji { font-size: 14px; }
          .insurance-badge { background: #e0f2fe; padding: 4px 8px; border-radius: 4px; display: inline-block; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏥 ${orgInfo.name}</div>
          <div class="subtitle">${orgInfo.address}</div>
          <div class="subtitle">📞 ${orgInfo.phone}</div>
        </div>

        <div class="center" style="margin: 10px 0;">
          <div style="font-size: 13px; font-weight: bold;">🎫 ENCOUNTER RECEIPT</div>
        </div>

        <div class="divider"></div>

        <div class="enc-num">
          ${createdEncounter?.encounter_number || 'N/A'}
        </div>

        <div class="divider"></div>

        <div class="row">
          <span class="label">👤 Patient:</span>
          <span class="value">${getFullName()}</span>
        </div>

        <div class="row">
          <span class="label">📅 Date & Time:</span>
          <span class="value">${formatReceiptDate(createdEncounter?.createdAt || new Date().toISOString())}</span>
        </div>

        <div class="row">
          <span class="label">🩺 Type:</span>
          <span class="value">${encounterType}</span>
        </div>

        <div class="row">
          <span class="label">🚨 Priority:</span>
          <span class="value">${priorityType}</span>
        </div>

        <div class="row">
          <span class="label">👨‍⚕️ Provider:</span>
          <span class="value">${getSelectedDoctor() ? getDoctorDisplayName(getSelectedDoctor()!) : 'N/A'}</span>
        </div>

        <div class="divider"></div>

        <div class="highlight">
          <div class="row">
            <span class="label">💳 Payment Method:</span>
            <span class="insurance-badge">${getSelectedInsurance()?.emoji || '💵'} ${insuranceType}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for visiting!</p>
          <p style="margin-top: 4px;">Get well soon 💚</p>
          <p style="margin-top: 8px; font-size: 8px;">Printed: ${new Date().toLocaleString()}</p>
        </div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  // Close receipt and continue
  const handleCloseReceipt = () => {
    setShowReceiptPreview(false);
    onStart();
    onClose();
  };

  // Receipt Preview Modal
  if (showReceiptPreview && createdEncounter) {
    return (
      <Dialog.Root open onOpenChange={() => { }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-slate-900/70 backdrop-blur-md z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧾</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">Receipt Preview</h2>
                    <p className="text-emerald-100 text-sm">Thermal printer format</p>
                  </div>
                </div>
              </div>

              {/* Receipt Preview */}
              <div className="p-4">
                <div
                  ref={receiptRef}
                  className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 font-mono text-xs max-h-96 overflow-y-auto"
                  style={{ width: '280px', margin: '0 auto' }}
                >
                  {/* Header */}
                  <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                    <div className="text-base font-bold">🏥 {orgInfo.name}</div>
                    <div className="text-[10px] text-slate-500">{orgInfo.address}</div>
                    <div className="text-[10px] text-slate-500">📞 {orgInfo.phone}</div>
                  </div>

                  <div className="text-center font-bold mb-3">
                    🎫 ENCOUNTER RECEIPT
                  </div>

                  <div className="text-center bg-slate-100 rounded py-2 mb-3 font-bold text-sm tracking-wider">
                    {createdEncounter.encounter_number}
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">👤 Patient:</span>
                      <span className="font-semibold text-right">{getFullName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">📅 Date & Time:</span>
                      <span className="font-semibold text-right">{formatReceiptDate(createdEncounter.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">🩺 Type:</span>
                      <span className="font-semibold">{encounterType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">🚨 Priority:</span>
                      <span className="font-semibold">{priorityType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">👨‍⚕️ Provider:</span>
                      <span className="font-semibold text-right">{getSelectedDoctor() ? getDoctorDisplayName(getSelectedDoctor()!) : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 my-3"></div>

                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">💳 Payment:</span>
                      <span className="font-bold text-blue-700">{getSelectedInsurance()?.emoji} {insuranceType}</span>
                    </div>
                  </div>

                  <div className="text-center mt-4 pt-3 border-t border-dashed border-slate-300">
                    <p className="text-slate-500">Thank you for visiting!</p>
                    <p className="text-emerald-600 mt-1">Get well soon 💚</p>
                    <p className="text-[9px] text-slate-400 mt-2">Printed: {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-slate-50 flex gap-3">
                <button
                  onClick={handleCloseReceipt}
                  className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  ✕ Skip Print
                </button>
                <button
                  onClick={handlePrintReceipt}
                  className="flex-[2] px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  🖨️ Print Receipt
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/60 backdrop-blur-md z-50 animate-in fade-in duration-300" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[90vh] overflow-y-auto z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* 🏥 Premium Header */}
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-5 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-lg backdrop-blur-sm">
                    🏥
                  </div>
                  <div>
                    <Dialog.Title className="text-xl font-bold text-white tracking-tight">
                      New Encounter
                    </Dialog.Title>
                    <p className="text-emerald-100 flex items-center gap-2 mt-0.5">
                      <span className="text-lg">👤</span>
                      <span className="font-medium">{getFullName()}</span>
                    </p>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
                    disabled={isSubmitting}
                  >
                    ✕
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* ⚠️ Error Message */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <div className="font-semibold text-red-800 text-sm">Error</div>
                      <div className="text-red-700 text-sm mt-1">{error}</div>
                      {(error.includes("Failed to load staff") || error.includes("Network")) && (
                        <button
                          onClick={error.includes("Failed to load staff") ? handleRetryFetch : () => window.location.reload()}
                          className="mt-3 px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                          disabled={isLoadingDoctors || isSubmitting}
                        >
                          🔄 {error.includes("Failed to load staff") ? "Retry" : "Refresh Page"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ Staff Available Badge */}
              {!isLoadingDoctors && doctors.length > 0 && !error && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl px-4 py-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">
                    👥
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-800 text-sm">
                      {doctors.length} Staff Member{doctors.length !== 1 ? "s" : ""} Available
                    </div>
                    <div className="text-emerald-600 text-xs">Ready to start new encounter</div>
                  </div>
                  <div className="ml-auto w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 👨‍⚕️ Staff Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">👨‍⚕️</span> Select Staff Member
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 text-sm text-slate-700 transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 appearance-none cursor-pointer hover:border-slate-300"
                      disabled={isLoadingDoctors || isSubmitting}
                      required
                    >
                      <option value="">
                        {isLoadingDoctors
                          ? "⏳ Loading staff..."
                          : doctors.length === 0
                            ? "❌ No staff available"
                            : "👆 Select a staff member"}
                      </option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {getDoctorDisplayName(doctor)} {doctor.jobTitle ? `• ${doctor.jobTitle}` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

                {/* 📋 Encounter Type Selection - Card Grid */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">📋</span> Encounter Type
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {encounterTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setEncounterType(type.value)}
                        disabled={isSubmitting}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${encounterType === type.value
                          ? `bg-gradient-to-r ${type.color} text-white border-transparent shadow-lg`
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        <div className="text-2xl mb-1">{type.emoji}</div>
                        <div className={`text-xs font-medium ${encounterType === type.value ? "text-white" : "text-slate-600"}`}>
                          {type.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 💳 Insurance Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">💳</span> Insurance / Payment Type
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={insuranceType}
                      onChange={(e) => setInsuranceType(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 text-sm text-slate-700 transition-all duration-200 appearance-none cursor-pointer hover:border-slate-300"
                      disabled={isSubmitting}
                    >
                      {insuranceTypes.map((ins) => (
                        <option key={ins.value} value={ins.value}>
                          {ins.emoji} {ins.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                  {/* Selected Insurance Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getSelectedInsurance()?.bgLight} ${getSelectedInsurance()?.color} border`}>
                    {getSelectedInsurance()?.emoji} {insuranceType}
                  </div>
                </div>

                {/* 📅 Date & Time Section */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">📅</span> Encounter Date & Time
                    <span className="text-red-500">*</span>
                  </label>

                  {/* Quick Date Presets */}
                  <div className="flex gap-2">
                    {datePresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setDateFromPreset(preset.days)}
                        className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 ${encounterDate === new Date(Date.now() + preset.days * 86400000).toISOString().split("T")[0]
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-lg"
                          : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                          }`}
                      >
                        <span>{preset.emoji}</span>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Date & Time Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative" ref={calendarRef}>
                      <div
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-700 cursor-pointer hover:border-emerald-300 hover:bg-white transition-all duration-200 flex items-center gap-3"
                      >
                        <span className="text-xl">🗓️</span>
                        <span className="flex-1 font-medium">{formatDisplayDate(encounterDate)}</span>
                      </div>
                      {showCalendar && (
                        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-top-2 duration-200">
                          <input
                            type="date"
                            value={encounterDate}
                            onChange={(e) => {
                              setEncounterDate(e.target.value);
                              setShowCalendar(false);
                            }}
                            className="w-full border-2 border-emerald-200 rounded-xl p-3 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                          />
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">⏰</div>
                      <input
                        type="time"
                        value={encounterTime}
                        onChange={(e) => setEncounterTime(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-200"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* 🚨 Priority Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-lg">🚨</span> Priority Level
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {priorityTypes.map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setPriorityType(priority.value)}
                        disabled={isSubmitting}
                        className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 ${priorityType === priority.value
                          ? `${priority.bgLight} ${priority.textColor} border-current shadow-md`
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                      >
                        <span>{priority.emoji}</span>
                        <span>{priority.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 📊 Summary Preview */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📊</span>
                    <span className="text-sm font-semibold text-slate-700">Encounter Summary</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                      <span className="text-slate-500">Patient</span>
                      <span className="font-medium text-slate-700">👤 {getFullName()}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                      <span className="text-slate-500">Type</span>
                      <span className="font-medium text-slate-700">{getSelectedEncounterType()?.emoji} {encounterType}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                      <span className="text-slate-500">Priority</span>
                      <span className={`font-medium ${getSelectedPriority()?.textColor}`}>
                        {getSelectedPriority()?.emoji} {priorityType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                      <span className="text-slate-500">Insurance</span>
                      <span className={`font-medium ${getSelectedInsurance()?.color}`}>
                        {getSelectedInsurance()?.emoji} {insuranceType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                      <span className="text-slate-500">Date & Time</span>
                      <span className="font-medium text-slate-700">📅 {formatDisplayDate(encounterDate)} at {encounterTime}</span>
                    </div>
                  </div>
                </div>

                {/* 🎯 Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
                      disabled={isSubmitting}
                    >
                      ❌ Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="flex-[2] px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 hover:scale-[1.02]"
                    disabled={
                      isLoadingDoctors ||
                      doctors.length === 0 ||
                      isSubmitting ||
                      !doctorId ||
                      !encounterDate
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        🚀 Start Encounter
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
