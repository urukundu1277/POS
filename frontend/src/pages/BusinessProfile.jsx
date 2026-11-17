import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Building,
} from "lucide-react";
import { formatCurrency } from "../utils/format";

export default function BusinessProfile() {
  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    mobile: "",
    email: "",
    address: "",
    businessType: "",
  });
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      const res = await api.get("/business/");
      setBusiness(res.data.business);
      setForm({
        businessName: res.data.business.businessName || "",
        ownerName: res.data.business.ownerName || "",
        mobile: res.data.business.mobile || "",
        email: res.data.business.email || "",
        address: res.data.business.address || "",
        businessType: res.data.business.businessType || "",
      });
      setLogo(res.data.business.logo || "");
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogo(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("businessName", form.businessName);
      formData.append("ownerName", form.ownerName);
      formData.append("mobile", form.mobile);
      formData.append("email", form.email);
      formData.append("address", form.address);
      formData.append("businessType", form.businessType);
      if (logo && logo.startsWith("data:")) {
        const blob = await (await fetch(logo)).blob();
        formData.append("logo", blob, "logo.png");
      }
      await api.put("/business/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Business profile updated");
      loadBusiness();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex items-center gap-4">
        <Building className="w-6 h-6 text-indigo-600" />
        <h1 className="text-xl font-bold text-gray-900">Business Profile</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div className="col-span-1 md:col-span-2 flex flex-col items-center">
            <div className="relative mb-4">
              {logo ? (
                <img src={logo} alt="Logo" className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-4 border-gray-200">
                  <Building className="w-10 h-10" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700">
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </label>
            </div>
            <p className="text-xs text-gray-500">Business logo (displayed on bills)</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <input
              name="businessName"
              className="input"
              placeholder="e.g. Sunny Bakery"
              value={form.businessName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Owner Name</label>
            <input
              name="ownerName"
              className="input"
              value={form.ownerName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input
              name="mobile"
              className="input"
              placeholder="+91 98765 43210"
              value={form.mobile}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Business Address</label>
            <input
              name="address"
              className="input"
              placeholder="123 Main Street, City"
              value={form.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Business Type</label>
            <select
              name="businessType"
              className="select"
              value={form.businessType}
              onChange={handleChange}
              required
            >
              <option value="">Select type</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Cafe">Cafe</option>
              <option value="Bakery">Bakery</option>
              <option value="Retail Store">Retail Store</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="col-span-1 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary py-2.5"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
