import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Kenyan counties and sub-counties
const counties: Record<string, string[]> = {
  Bomet: ["Bomet East", "Bomet Central", "Chepalungu", "Konoin", "Sotik"],
  Nairobi: ["Westlands", "Lang'ata", "Embakasi", "Dagoretti", "Kasarani", "Starehe"],
  Mombasa: ["Mvita", "Nyali", "Kisauni", "Likoni", "Changamwe", "Jomvu"],
  Kisumu: ["Kisumu East", "Kisumu West", "Kisumu Central", "Seme", "Nyando"],
  Nakuru: ["Nakuru Town East", "Nakuru Town West", "Naivasha", "Gilgil", "Subukia"],
  Uasin_Gishu: ["Ainabkoi", "Kapseret", "Kesses", "Moiben", "Soy", "Turbo"],
  Kiambu: ["Githunguri", "Juja", "Kabete", "Kiambu Town", "Kikuyu", "Limuru", "Thika Town"],
  Machakos: ["Machakos Town", "Mavoko", "Kangundo", "Kathiani", "Masinga", "Matungulu", "Mwala", "Yatta"],
};

interface PatientFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  dob: string;
  patient_status: string;
  phone: string;
  email: string;
  occupation: string;
  heard_about_facility: string;
  patient_number: string;
  sha_number: string;
  county: string;
  sub_county: string;
  area_of_residence: string;
  next_of_kin_first_name: string;
  next_of_kin_last_name: string;
  next_of_kin_phone: string;
}

// Form Field Component - defined OUTSIDE the main component to prevent re-creation on every render
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  emoji?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  value,
  emoji = "📝",
  onChange,
  ...props
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
      <span>{emoji}</span> {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm"
      {...props}
    />
  </div>
);

// Select Field Component - defined OUTSIDE the main component to prevent re-creation on every render
interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  options: (string | { value: string; label: string })[];
  emoji?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  options,
  emoji = "📋",
  onChange
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
      <span>{emoji}</span> {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm"
    >
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const lbl = typeof opt === 'string' ? opt : opt.label;
        return <option key={val} value={val}>{lbl}</option>;
      })}
    </select>
  </div>
);

export default function PatientRegistrationPage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isGeneratingPatientNumber, setIsGeneratingPatientNumber] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PatientFormData>({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "Male",
    dob: "",
    patient_status: "Alive",
    phone: "",
    email: "",
    occupation: "",
    heard_about_facility: "Social Media",
    patient_number: "",
    sha_number: "",
    county: "Bomet",
    sub_county: "",
    area_of_residence: "",
    next_of_kin_first_name: "",
    next_of_kin_last_name: "",
    next_of_kin_phone: "",
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getHospitalInitials = (): string => {
    return "DL"; // Davis Luke Hospital
  };

  const generatePatientNumber = async (): Promise<string> => {
    try {
      setIsGeneratingPatientNumber(true);
      const hospitalInitials = getHospitalInitials();
      let count = 0;

      try {
        const res = await api.get("/patients/count");
        const data = res.data as { total?: number; count?: number };
        count = data?.total || data?.count || 0;
      } catch {
        const patientsRes = await api.get("/patients");
        count = Array.isArray(patientsRes.data) ? patientsRes.data.length : 0;
      }

      const nextNumber = (count + 1).toString().padStart(4, '0');
      return `${hospitalInitials}${nextNumber}`;
    } catch (error) {
      const fallback = Math.floor(Math.random() * 9999 + 1).toString().padStart(4, '0');
      return `DL${fallback}`;
    } finally {
      setIsGeneratingPatientNumber(false);
    }
  };

  useEffect(() => {
    (async () => {
      const patientNumber = await generatePatientNumber();
      setFormData(prev => ({ ...prev, patient_number: patientNumber }));
    })();
  }, []);

  const regeneratePatientNumber = async () => {
    const newNumber = await generatePatientNumber();
    setFormData(prev => ({ ...prev, patient_number: newNumber }));
    toast.success("✅ New patient number generated");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const phoneRegex = /^(?:\+254|0)(?:7\d{8}|1\d{8})$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("📞 Invalid phone number format");
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("📧 Invalid email format");
      return;
    }

    if (!formData.patient_number) {
      toast.error("🔢 Patient number is required");
      return;
    }

    const payload = {
      firstName: formData.first_name,
      middleName: formData.middle_name,
      lastName: formData.last_name,
      gender: formData.gender.toLowerCase(),
      dob: formData.dob,
      phone: formData.phone,
      email: formData.email,
      address: formData.area_of_residence,
      patientStatus: formData.patient_status,
      heardAboutFacility: formData.heard_about_facility,
      patientNumber: formData.patient_number,
      shaNumber: formData.sha_number,
      county: formData.county,
      subCounty: formData.sub_county,
      nextOfKinFirstName: formData.next_of_kin_first_name,
      nextOfKinLastName: formData.next_of_kin_last_name,
      nextOfKinPhone: formData.next_of_kin_phone,
      occupation: formData.occupation,
    };

    try {
      setIsSubmitting(true);
      await api.post("/patients", payload);
      toast.success("✅ Patient registered successfully!");

      // Reset form
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        gender: "Male",
        dob: "",
        patient_status: "Alive",
        phone: "",
        email: "",
        occupation: "",
        heard_about_facility: "Social Media",
        patient_number: "",
        sha_number: "",
        county: "Bomet",
        sub_county: "",
        area_of_residence: "",
        next_of_kin_first_name: "",
        next_of_kin_last_name: "",
        next_of_kin_phone: "",
      });

      // Generate new patient number
      setTimeout(async () => {
        const newNumber = await generatePatientNumber();
        setFormData(prev => ({ ...prev, patient_number: newNumber }));
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error("❌ Error registering patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🏥 Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">👤</div>
            <div>
              <h1 className="text-2xl font-bold">New Patient Registration</h1>
              <p className="text-emerald-100">Complete the form to register a new patient</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-lg">🕐</span>
              <span className="font-medium">{currentTime.toLocaleTimeString()}</span>
            </div>
            <button
              onClick={() => navigate('/dashboard/patients')}
              className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/20 transition-colors"
            >
              <span>📋</span>
              <span className="font-medium">View All Patients</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 👤 Personal Details Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">👤</div>
              <div>
                <h2 className="font-semibold text-slate-800">Personal Details</h2>
                <p className="text-xs text-slate-500">Basic patient information</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="First Name" name="first_name" placeholder="Enter first name" value={formData.first_name} required emoji="👤" onChange={handleChange} />
            <FormField label="Middle Name" name="middle_name" placeholder="Enter middle name" value={formData.middle_name} emoji="📝" onChange={handleChange} />
            <FormField label="Last Name" name="last_name" placeholder="Enter last name" value={formData.last_name} required emoji="👤" onChange={handleChange} />
            <SelectField label="Gender" name="gender" value={formData.gender} emoji="👥" onChange={handleChange} options={[
              { value: "Male", label: "👨 Male" },
              { value: "Female", label: "👩 Female" },
              { value: "Other", label: "🧑 Other" },
            ]} />
            <FormField label="Date of Birth" name="dob" type="date" value={formData.dob} required emoji="🎂" onChange={handleChange} />
            <SelectField label="Patient Status" name="patient_status" value={formData.patient_status} emoji="💓" onChange={handleChange} options={[
              { value: "Alive", label: "🟢 Alive" },
              { value: "Deceased", label: "⚫ Deceased" },
            ]} />
            <FormField label="Mobile Phone" name="phone" placeholder="0700..." value={formData.phone} required emoji="📞" onChange={handleChange} />
            <FormField label="Email Address" name="email" type="email" placeholder="email@example.com" value={formData.email} emoji="📧" onChange={handleChange} />
            <FormField label="Occupation" name="occupation" placeholder="Enter occupation" value={formData.occupation} emoji="💼" onChange={handleChange} />
            <SelectField label="How did you hear about us?" name="heard_about_facility" value={formData.heard_about_facility} emoji="📣" onChange={handleChange} options={[
              "Social Media", "Friend", "Google Search", "News", "Physical Search", "Other"
            ]} />
          </div>
        </div>

        {/* 🆔 Patient Identification Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">🆔</div>
              <div>
                <h2 className="font-semibold text-slate-800">Patient Identification</h2>
                <p className="text-xs text-slate-500">Unique identifiers and insurance</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <span>🔢</span> Patient Number <span className="text-xs text-green-600 ml-1">(Auto-generated)</span>
              </label>
              <div className="relative">
                <input
                  name="patient_number"
                  value={formData.patient_number}
                  placeholder={isGeneratingPatientNumber ? "Generating..." : "Auto-generated"}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-700"
                />
                {isGeneratingPatientNumber && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={regeneratePatientNumber}
                disabled={isGeneratingPatientNumber}
                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1"
              >
                🔄 Regenerate Number
              </button>
            </div>
            <FormField label="SHA Number" name="sha_number" placeholder="Enter SHA number" value={formData.sha_number} emoji="🏥" onChange={handleChange} />
          </div>
        </div>

        {/* 📍 Physical Address Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">📍</div>
              <div>
                <h2 className="font-semibold text-slate-800">Physical Address</h2>
                <p className="text-xs text-slate-500">Location and residence information</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField label="County" name="county" value={formData.county} emoji="🗺️" onChange={handleChange} options={Object.keys(counties)} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <span>📌</span> Sub County
              </label>
              <select
                name="sub_county"
                value={formData.sub_county}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm"
              >
                <option value="">Select sub county</option>
                {(counties[formData.county] || []).map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>
            <FormField label="Area of Residence" name="area_of_residence" placeholder="Enter area" value={formData.area_of_residence} emoji="🏠" onChange={handleChange} />
          </div>
        </div>

        {/* 👨‍👩‍👧 Next of Kin Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">👨‍👩‍👧</div>
              <div>
                <h2 className="font-semibold text-slate-800">Next of Kin</h2>
                <p className="text-xs text-slate-500">Emergency contact information</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="First Name" name="next_of_kin_first_name" placeholder="Enter first name" value={formData.next_of_kin_first_name} emoji="👤" onChange={handleChange} />
            <FormField label="Last Name" name="next_of_kin_last_name" placeholder="Enter last name" value={formData.next_of_kin_last_name} emoji="👤" onChange={handleChange} />
            <FormField label="Mobile Phone" name="next_of_kin_phone" placeholder="0700..." value={formData.next_of_kin_phone} emoji="📞" onChange={handleChange} />
          </div>
        </div>

        {/* 💾 Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/patients')}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            ❌ Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isGeneratingPatientNumber || !formData.patient_number}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>✅ Save Patient</>
            )}
          </button>
        </div>
      </form>

      <ToastContainer position="top-right" theme="colored" />
    </div>
  );
}