import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Save, Undo2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import StyledButton from "../components/StyledButton";



type Form = {
  title: string;
  first_name: string;
  last_name: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  job_title: string;
  username: string;
  password: string;
  is_active: boolean;
};

const empty: Form = {
  title: "Dr.",
  first_name: "",
  last_name: "",
  gender: "",
  email: "",
  phone: "",
  address: "",
  role: "",
  job_title: "",
  username: "",
  password: "",
  is_active: true
};

export default function AddStaff() {
  const [roles, setRoles] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);

  const nav = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    (async () => {
      const [rRes, jRes] = await Promise.all([
        api.get<string[]>("/roles"),
        api.get<string[]>("/job-titles")
      ]);
      setRoles(rRes.data);
      setTitles(jRes.data);
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await api.get(`/staff/${id}`);
      const s = res.data as any; // Type assertion for API response
      setForm({
        title: s.title || "",
        first_name: s.first_name || "",
        last_name: s.last_name || "",
        gender: s.gender || "",
        email: s.email || "",
        phone: s.phone || "",
        address: s.address || "",
        role: s.role || "",
        job_title: s.job_title || "",
        username: s.username || "",
        password: s.password || "",
        is_active: !!s.is_active
      });
    })();
  }, [id]);

  const save = async () => {
    if (!form.first_name || !form.last_name || !form.role) {
      alert("Please fill in First name, Last name and Role");
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await api.put(`/staff/${id}`, form);
      } else {
        await api.post("/staff", form);
      }
      nav("/staff");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Failed to save staff");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (confirm("Discard changes?")) nav("/staff");
  };

  const input = "block rounded-md border border-gray-300 px-3 py-2 text-sm w-full";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{id ? "Edit staff" : "Add new staff"}</h1>
        <div className="flex gap-2">
          <StyledButton icon={<Undo2 className="w-4 h-4" />} onClick={discard}>
            Discard
          </StyledButton>
          <StyledButton
            variant="solid"
            icon={<Save className="w-4 h-4" />}
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </StyledButton>
        </div>
      </div>

      <div className="mt-6 space-y-6 rounded-md border p-6">
        {/* Name */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-sm text-gray-700">Name*</label>
          <select
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className={`${input} col-span-2`}
          >
            {["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            className={`${input} col-span-4`}
            placeholder="First name"
            value={form.first_name}
            onChange={e => setForm({ ...form, first_name: e.target.value })}
          />
          <input
            className={`${input} col-span-4`}
            placeholder="Last name"
            value={form.last_name}
            onChange={e => setForm({ ...form, last_name: e.target.value })}
          />
        </div>

        {/* Gender */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-sm text-gray-700">Gender*</label>
          <select
            className={`${input} col-span-4`}
            value={form.gender}
            onChange={e => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">Select Gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Email / Phone */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-sm text-gray-700">Email*</label>
          <input
            className={`${input} col-span-5`}
            placeholder="example@domain.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <label className="col-span-1 text-right text-sm text-gray-700">Phone*</label>
          <input
            className={`${input} col-span-4`}
            placeholder="+254 ..."
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        {/* Address */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-sm text-gray-700">Address*</label>
          <input
            className={`${input} col-span-10`}
            placeholder="e.g. Kisumu West"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
          />
        </div>

        {/* Role + Job title */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-sm text-gray-700">Role*</label>
          <select
            className={`${input} col-span-4`}
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="">Select Option</option>
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <label className="col-span-2 text-right text-sm text-gray-700">Job title*</label>
          <select
            className={`${input} col-span-4`}
            value={form.job_title}
            onChange={e => setForm({ ...form, job_title: e.target.value })}
          >
            <option value="">Select Option</option>
            {titles.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Username / Password */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-sm text-gray-700">Username*</label>
          <input
            className={`${input} col-span-4`}
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
          <label className="col-span-2 text-right text-sm text-gray-700">Password*</label>
          <input
            type="password"
            className={`${input} col-span-4`}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
