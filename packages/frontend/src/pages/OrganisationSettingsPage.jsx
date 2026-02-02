import React, { useState } from "react";

const OrganisationSettingsPage = () => {
  const [form, setForm] = useState({
    name: "Prod Ops Test Clinic",
    country: "Kenya",
    city: "Mombasa",
    county: "Mombasa",
    subCounty: "Nyali",
    ward: "Mkomani",
    town: "Greenwood",
    logo: null
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo") {
      setForm((prev) => ({ ...prev, logo: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    console.log("Saving settings:", form);
    // TODO: Connect to backend API later
  };

  const handleDiscard = () => {
    console.log("Discard changes");
    // TODO: Reset to original data from backend later
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organisation Settings</h1>
        <div className="space-x-2">
          <button
            onClick={handleDiscard}
            className="px-4 py-2 border rounded-md"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Save changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Name of organisation</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Country</label>
          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">City</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">County</label>
          <select
            name="county"
            value={form.county}
            onChange={handleChange}
            className="mt-1 p-2 border rounded w-full"
          >
            <option>Mombasa</option>
            <option>Nairobi</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Sub county</label>
          <select
            name="subCounty"
            value={form.subCounty}
            onChange={handleChange}
            className="mt-1 p-2 border rounded w-full"
          >
            <option>Nyali</option>
            <option>Kisauni</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Ward</label>
          <select
            name="ward"
            value={form.ward}
            onChange={handleChange}
            className="mt-1 p-2 border rounded w-full"
          >
            <option>Mkomani</option>
            <option>Kongowea</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Town</label>
          <input
            name="town"
            value={form.town}
            onChange={handleChange}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">Logo</label>
        <div className="border-2 border-dashed rounded p-4 text-center">
          <input
            type="file"
            name="logo"
            accept="image/png, image/jpeg"
            onChange={handleChange}
            className="hidden"
            id="logoUpload"
          />
          <label
            htmlFor="logoUpload"
            className="cursor-pointer text-blue-600"
          >
            Click to upload or drag and drop (PNG, JPG min. 800×400px)
          </label>
        </div>
      </div>
    </div>
  );
};

export default OrganisationSettingsPage;
