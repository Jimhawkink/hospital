import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Plus,
  Upload,
  Edit2,
  Trash2,
  X,
  Save,
  Undo2,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// TypeScript interfaces
interface OrganisationData {
  organisation_name?: string;
  country?: string;
  city?: string;
  town?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  logo_url?: string;
  phone?: string;
  address?: string;
  email?: string;
  payment_method_id?: string;
}

interface PaymentMethod {
  id: number;
  name: string;
  active_on_pos: boolean | number | string;
  transaction_code: boolean | number | string;
}

interface UserRole {
  id: number;
  role_name: string;
  description: string | null;
  is_active: boolean;
}

interface RolePermission {
  id: number;
  permission_name: string;
  permission_key: string;
  category: string | null;
  has_create: boolean;
  has_edit: boolean;
  has_view: boolean;
  has_archive: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_view: boolean;
  can_archive: boolean;
}

export default function OrganisationSettingsForm() {


  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedSubCounty, setSelectedSubCounty] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [formData, setFormData] = useState({
    organisation_name: "",
    country: "",
    city: "",
    town: "",
    phone: "",
    address: "",
    email: "",
    payment_method_id: "",
  });
  const [originalData, setOriginalData] = useState<OrganisationData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    name: "",
    active: false,
    transaction_code: false,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Roles & Permissions state
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [originalRolePermissions, setOriginalRolePermissions] = useState<RolePermission[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const countiesData: { [county: string]: string[] } = {
    Bomet: ["Bomet Central", "Bomet East", "Chepalungu", "Konoin", "Sotik"],
  };

  const wardsData: { [subCounty: string]: string[] } = {
    "Bomet Central": ["Silibwet", "Singorwet", "Ndarawetta", "Chesoen", "Mutarakwa"],
    "Bomet East": ["Longisa", "Kembu", "Chemaner", "Merigi", "Kipreres"],
    Chepalungu: ["Sigor", "Kongasis", "Chebunyo", "Nyongores", "Siongiroi"],
    Konoin: ["Chepchabas", "Mogogosiek", "Embomos", "Boito", "Kimulot"],
    Sotik: ["Ndanai/Abosi", "Kipsonoi", "Kapletundo", "Chemagel", "Manaret/Rongena"],
  };

  const fetchOrganisationSettings = async () => {
    try {
      const res = await api.get<OrganisationData>("/organisation-settings");
      if (res.data) {
        const fetchedData: OrganisationData = {
          organisation_name: res.data.organisation_name || "",
          country: res.data.country || "",
          city: res.data.city || "",
          town: res.data.town || "",
          county: res.data.county || "",
          sub_county: res.data.sub_county || "",
          ward: res.data.ward || "",
          logo_url: res.data.logo_url || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          email: res.data.email || "",
          payment_method_id: res.data.payment_method_id || "",
        };

        setFormData({
          organisation_name: fetchedData.organisation_name || "",
          country: fetchedData.country || "",
          city: fetchedData.city || "",
          town: fetchedData.town || "",
          phone: fetchedData.phone || "",
          address: fetchedData.address || "",
          email: fetchedData.email || "",
          payment_method_id: fetchedData.payment_method_id || "",
        });
        setSelectedCounty(fetchedData.county || "");
        setSelectedSubCounty(fetchedData.sub_county || "");
        setSelectedWard(fetchedData.ward || "");
        setOriginalData(fetchedData);

        if (fetchedData.logo_url) {
          const cleanUrl = fetchedData.logo_url.startsWith("http")
            ? fetchedData.logo_url
            : `/${fetchedData.logo_url.replace(/^\/+/, "")}`;
          setLogoPreview(cleanUrl);
        }
      } else {
        // If no data exists, set empty original data to allow saving
        const emptyData: OrganisationData = {
          organisation_name: "",
          country: "",
          city: "",
          town: "",
          county: "",
          sub_county: "",
          ward: "",
          logo_url: "",
          phone: "",
          address: "",
          email: "",
          payment_method_id: "",
        };
        setOriginalData(emptyData);
      }
    } catch (err) {
      console.error("Error fetching organisation settings:", err);
      toast.error("❌ Failed to load organisation settings");
      // Set empty original data if fetch fails
      const emptyData: OrganisationData = {
        organisation_name: "",
        country: "",
        city: "",
        town: "",
        county: "",
        sub_county: "",
        ward: "",
        logo_url: "",
        phone: "",
        address: "",
        email: "",
        payment_method_id: "",
      };
      setOriginalData(emptyData);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await api.get<PaymentMethod[]>("/organization/payment-methods");
      setPaymentMethods(res.data || []);
    } catch (err) {
      console.error("Error fetching payment methods:", err);
      toast.error("❌ Failed to load payment methods");
    }
  };

  const fetchUserRoles = async () => {
    try {
      const res = await api.get<UserRole[]>("/organization/roles");
      setUserRoles(res.data || []);
      // Auto-select first role if available
      if (res.data && res.data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(res.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching user roles:", err);
      toast.error("❌ Failed to load user roles");
    }
  };

  const fetchRolePermissions = async (roleId: number) => {
    try {
      const res = await api.get<RolePermission[]>(`/organization/roles/${roleId}/permissions`);
      const permissions = res.data || [];
      setRolePermissions(permissions);
      setOriginalRolePermissions(JSON.parse(JSON.stringify(permissions)));
    } catch (err) {
      console.error("Error fetching role permissions:", err);
      toast.error("❌ Failed to load role permissions");
    }
  };

  useEffect(() => {
    fetchOrganisationSettings();
    fetchPaymentMethods();
    fetchUserRoles();
    const onDocClick = () => setOpenMenuId(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Fetch permissions when role changes
  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
      setLogoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCounty(e.target.value);
    setSelectedSubCounty("");
    setSelectedWard("");
  };

  const handleSubCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubCounty(e.target.value);
    setSelectedWard("");
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      toast.info("ℹ️ No changes detected");
      return;
    }

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      data.append("county", selectedCounty);
      data.append("sub_county", selectedSubCounty);
      data.append("ward", selectedWard);
      if (logo) data.append("logo", logo);

      await api.post("/organisation-settings/save", data);
      toast.success("✅ Organisation settings updated successfully");

      setLogo(null);

      fetchOrganisationSettings();
    } catch (error) {
      console.error("Error saving organisation settings:", error);
      toast.error("❌ Failed to update organisation settings");
    }
  };


  // Fixed hasChanges function with better null/undefined handling
  const hasChanges = () => {
    if (!originalData) return true; // Allow saving if no original data

    const trimmedFormData = {
      organisation_name: formData.organisation_name.trim(),
      country: formData.country.trim(),
      city: formData.city.trim(),
      town: formData.town.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      email: formData.email.trim(),
      payment_method_id: formData.payment_method_id.trim(),
    };

    const trimmedOriginalData = {
      organisation_name: (originalData.organisation_name || "").trim(),
      country: (originalData.country || "").trim(),
      city: (originalData.city || "").trim(),
      town: (originalData.town || "").trim(),
      phone: (originalData.phone || "").trim(),
      address: (originalData.address || "").trim(),
      email: (originalData.email || "").trim(),
      payment_method_id: (originalData.payment_method_id || "").trim(),
    };

    // Check if any field has changed
    const formFieldsChanged =
      trimmedFormData.organisation_name !== trimmedOriginalData.organisation_name ||
      trimmedFormData.country !== trimmedOriginalData.country ||
      trimmedFormData.city !== trimmedOriginalData.city ||
      trimmedFormData.town !== trimmedOriginalData.town ||
      trimmedFormData.phone !== trimmedOriginalData.phone ||
      trimmedFormData.address !== trimmedOriginalData.address ||
      trimmedFormData.email !== trimmedOriginalData.email ||
      trimmedFormData.payment_method_id !== trimmedOriginalData.payment_method_id;

    // Check if location fields have changed
    const locationFieldsChanged =
      selectedCounty !== (originalData.county || "") ||
      selectedSubCounty !== (originalData.sub_county || "") ||
      selectedWard !== (originalData.ward || "");

    // Check if logo has been selected
    const logoChanged = logo !== null;

    // Check if any form fields have content (for new records)
    const hasFormContent =
      trimmedFormData.organisation_name !== "" ||
      trimmedFormData.country !== "" ||
      trimmedFormData.city !== "" ||
      trimmedFormData.town !== "" ||
      trimmedFormData.phone !== "" ||
      trimmedFormData.address !== "" ||
      trimmedFormData.email !== "" ||
      trimmedFormData.payment_method_id !== "" ||
      selectedCounty !== "" ||
      selectedSubCounty !== "" ||
      selectedWard !== "" ||
      logoChanged;

    console.log("Change detection:", {
      formFieldsChanged,
      locationFieldsChanged,
      logoChanged,
      hasFormContent,
      originalData: originalData,
      currentForm: trimmedFormData,
      currentLocation: { selectedCounty, selectedSubCounty, selectedWard }
    });

    return formFieldsChanged || locationFieldsChanged || logoChanged || hasFormContent;
  };

  const handleDiscard = async () => {
    try {
      await api.delete("/organisation-settings/discard");
      toast.success("✅ Discarded successfully");

      // Reset form to empty state
      setFormData({
        organisation_name: "",
        country: "",
        city: "",
        town: "",
        phone: "",
        address: "",
        email: "",
        payment_method_id: "",
      });
      setSelectedCounty("");
      setSelectedSubCounty("");
      setSelectedWard("");
      setLogo(null);
      setLogoPreview("");

      fetchOrganisationSettings();
    } catch (e) {
      console.error("Discard failed:", e);
      toast.error("❌ Failed to discard changes");
    }
  };

  const handleAddPaymentMethod = () => {
    setEditingId(null);
    setPaymentForm({ name: "", active: false, transaction_code: false });
    setIsModalOpen(true);
  };

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setEditingId(method.id);
    setPaymentForm({
      name: method.name,
      active:
        method.active_on_pos === true ||
        method.active_on_pos === 1 ||
        method.active_on_pos === "1",
      transaction_code:
        method.transaction_code === true ||
        method.transaction_code === 1 ||
        method.transaction_code === "1",
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeletePaymentMethod = async (id: number) => {
    try {
      await api.delete(`/organization/payment-methods/${id}`);
      await fetchPaymentMethods();
      toast.success("✅ Payment method deleted successfully");
    } catch (e) {
      console.error("Delete failed:", e);
      toast.error("❌ Failed to delete payment method");
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleConfirmPaymentMethod = async () => {
    try {
      const payload = {
        name: paymentForm.name,
        active: paymentForm.active ? 1 : 0,
        active_on_pos: paymentForm.active ? 1 : 0,
        transaction_code: paymentForm.transaction_code ? 1 : 0,
        enabled: 1,
      };

      if (editingId) {
        await api.put(
          `/organization/payment-methods/${editingId}`,
          payload
        );
        toast.success("✅ Payment method updated successfully");
      } else {
        await api.post("/organization/payment-methods", payload);
        toast.success("✅ Payment method added successfully");
      }

      await fetchPaymentMethods();
      setIsModalOpen(false);
      setPaymentForm({ name: "", active: false, transaction_code: false });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("❌ Error saving payment method");
    }
  };

  const BoolIcon = ({ value }: { value: boolean | number | string }) =>
    value === true || value === 1 || value === "1" ? (
      <CheckCircle2 className="w-5 h-5 text-green-600 inline-block" />
    ) : (
      <X className="w-5 h-5 text-red-600 inline-block" />
    );

  // Handle permission checkbox toggle
  const handlePermissionToggle = (permissionId: number, field: 'can_create' | 'can_edit' | 'can_view' | 'can_archive') => {
    setRolePermissions(prev =>
      prev.map(p =>
        p.id === permissionId
          ? { ...p, [field]: !p[field] }
          : p
      )
    );
  };

  // Check if permissions have changed
  const permissionsHaveChanges = () => {
    if (rolePermissions.length !== originalRolePermissions.length) return true;
    return rolePermissions.some((perm, idx) => {
      const orig = originalRolePermissions[idx];
      return perm.can_create !== orig.can_create ||
        perm.can_edit !== orig.can_edit ||
        perm.can_view !== orig.can_view ||
        perm.can_archive !== orig.can_archive;
    });
  };

  // Save role permissions
  const handleSavePermissions = async () => {
    if (!selectedRoleId || !permissionsHaveChanges()) return;

    setSavingPermissions(true);
    try {
      const payload = rolePermissions.map(p => ({
        permission_id: p.id,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_view: p.can_view,
        can_archive: p.can_archive,
      }));

      await api.post(`/organization/roles/${selectedRoleId}/permissions`, {
        permissions: payload
      });

      toast.success("✅ Role permissions saved successfully");
      setOriginalRolePermissions(JSON.parse(JSON.stringify(rolePermissions)));
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("❌ Failed to save role permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Organisation Settings</h1>
                <p className="text-sm text-slate-600 mt-1">Configure your organisation details and payment methods</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 text-slate-600 text-sm transition-all duration-200 flex items-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges()}
                className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm flex items-center gap-2 ${!hasChanges() ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Organisation Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-800">Organisation Details</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {["organisation_name", "country", "city", "phone", "address", "email"].map((field, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{field.replace("_", " ").toUpperCase()}</label>
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={formData[field as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Payment Method</label>
                <select
                  value={formData.payment_method_id}
                  onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">County</label>
                <select
                  value={selectedCounty}
                  onChange={handleCountyChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                >
                  <option value="">Select county</option>
                  {Object.keys(countiesData).map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Sub-county</label>
                <select
                  value={selectedSubCounty}
                  onChange={handleSubCountyChange}
                  disabled={!selectedCounty}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                >
                  <option value="">Select sub county</option>
                  {selectedCounty &&
                    countiesData[selectedCounty].map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Ward</label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  disabled={!selectedSubCounty}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                >
                  <option value="">Select ward</option>
                  {selectedSubCounty &&
                    wardsData[selectedSubCounty]?.map((ward) => (
                      <option key={ward} value={ward}>
                        {ward}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Town</label>
                <input
                  type="text"
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Logo</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl h-40 w-full cursor-pointer hover:bg-blue-50 transition-all duration-200">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 text-sm">
                      <Upload className="w-6 h-6 mb-1" />
                      <p>Click to upload</p>
                      <p>or drag and drop</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-slate-800">Payment Methods</h2>
              </div>
              <button
                type="button"
                onClick={handleAddPaymentMethod}
                className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Payment Method
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Name</th>
                    <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Active on POS</th>
                    <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Transaction Code</th>
                    <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paymentMethods.map((pm) => (
                    <tr key={pm.id} className="hover:bg-blue-50">
                      <td className="py-3 px-6 text-slate-700 text-sm">{pm.name}</td>
                      <td className="py-3 px-6 text-slate-700 text-sm text-center">
                        <BoolIcon value={pm.active_on_pos} />
                      </td>
                      <td className="py-3 px-6 text-slate-700 text-sm text-center">
                        <BoolIcon value={pm.transaction_code} />
                      </td>
                      <td className="py-3 px-6 relative">
                        <button
                          type="button"
                          className="p-1.5 hover:bg-blue-100 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId((prev) => (prev === pm.id ? null : pm.id));
                          }}
                        >
                          <MoreVertical className="w-5 h-5 text-slate-600" />
                        </button>
                        {openMenuId === pm.id && (
                          <div
                            className="absolute right-2 mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-blue-50 text-blue-700 text-sm"
                              onClick={() => handleEditPaymentMethod(pm)}
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-blue-50 text-red-600 text-sm"
                              onClick={() => handleDeletePaymentMethod(pm.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Organisation Roles & Permissions */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Organisation Roles & Permissions</h2>
                  <p className="text-xs text-slate-500">Configure what each role can access</p>
                </div>
              </div>
              {permissionsHaveChanges() && (
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {savingPermissions ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Permissions
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {/* Role Selector */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Select user role to edit</label>
              <select
                value={selectedRoleId || ""}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="w-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
              >
                <option value="">Select a role</option>
                {userRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Permissions Table */}
            {selectedRoleId && rolePermissions.length > 0 && (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Permissions</th>
                      <th className="text-center py-3 px-6 font-medium text-slate-700 text-sm w-24">Create</th>
                      <th className="text-center py-3 px-6 font-medium text-slate-700 text-sm w-24">Edit</th>
                      <th className="text-center py-3 px-6 font-medium text-slate-700 text-sm w-24">View</th>
                      <th className="text-center py-3 px-6 font-medium text-slate-700 text-sm w-24">Archive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rolePermissions.map((perm) => (
                      <tr key={perm.id} className="hover:bg-purple-50/50">
                        <td className="py-3 px-6 text-slate-700 text-sm font-medium">
                          {perm.permission_name}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {perm.has_create ? (
                            <input
                              type="checkbox"
                              checked={perm.can_create}
                              onChange={() => handlePermissionToggle(perm.id, 'can_create')}
                              className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {perm.has_edit ? (
                            <input
                              type="checkbox"
                              checked={perm.can_edit}
                              onChange={() => handlePermissionToggle(perm.id, 'can_edit')}
                              className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {perm.has_view ? (
                            <input
                              type="checkbox"
                              checked={perm.can_view}
                              onChange={() => handlePermissionToggle(perm.id, 'can_view')}
                              className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {perm.has_archive ? (
                            <input
                              type="checkbox"
                              checked={perm.can_archive}
                              onChange={() => handlePermissionToggle(perm.id, 'can_archive')}
                              className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedRoleId && rolePermissions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>Loading permissions...</p>
              </div>
            )}

            {!selectedRoleId && (
              <div className="text-center py-8 text-slate-500">
                <p>Select a role to view and edit permissions</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingId ? "Edit Payment Method" : "Add Payment Method"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-md">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <input
                    type="text"
                    value={paymentForm.name}
                    onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={paymentForm.active}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, active: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-slate-700">Active on POS</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={paymentForm.transaction_code}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          transaction_code: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-slate-700">Transaction Code</label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 text-slate-600 text-sm transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPaymentMethod}
                    className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 text-sm flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}