import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Building, Shield, Lock, LogOut, DollarSign, Activity } from "lucide-react";
import adminApi from "../services/adminApi";
import toast from "react-hot-toast";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    inactiveBusinesses: 0,
    totalUsers: 0,
  });
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    address: "",
    mobile: "",
    email: "",
    businessType: "",
    ownerName: "",
    gstNumber: "",
    status: "active",
    loginEmail: "",
    loginPassword: "",
    loginName: "",
  });
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/admin/login");
  };

  const loadStats = async () => {
    try {
      const res = await adminApi.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      toast.error("Failed to load stats");
    }
  };

  const loadBusinesses = async () => {
    try {
      const res = await adminApi.get("/admin/businesses");
      setBusinesses(res.data.businesses);
    } catch (err) {
      toast.error("Failed to load businesses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadBusinesses();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await adminApi.post("/admin/businesses", form);
      toast.success(res.data.message);
      setShowCreateForm(false);
      setForm({
        businessName: "",
        address: "",
        mobile: "",
        email: "",
        businessType: "",
        ownerName: "",
        gstNumber: "",
        status: "active",
        loginEmail: "",
        loginPassword: "",
        loginName: "",
      });
      loadBusinesses();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create business");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await adminApi.patch(`/admin/businesses/${id}/toggle-status`);
      toast.success(`Business ${currentStatus === "active" ? "deactivated" : "activated"} successfully.`);
      loadBusinesses();
      loadStats();
    } catch (err) {
      toast.error("Failed to toggle business status");
    }
  };

  const deleteBusiness = async (id) => {
    if (!window.confirm("Are you sure you want to delete this business and all its users?")) return;
    try {
      await adminApi.delete(`/admin/businesses/${id}`);
      toast.success("Business deleted successfully.");
      loadBusinesses();
      loadStats();
    } catch (err) {
      toast.error("Failed to delete business");
    }
  };

  const resetPassword = async (businessId) => {
    const newPassword = window.prompt("Enter new password for this user:");
    if (!newPassword) return;
    try {
      // First get the business details to find the user
      const businessRes = await adminApi.get(`/admin/businesses/${businessId}`);
      const users = businessRes.data.users || [];
      if (users.length === 0) {
        toast.error("No user found for this business.");
        return;
      }
      const userId = users[0]._id;
      await adminApi.put(`/admin/users/${userId}/reset-password`, { newPassword });
      toast.success("Password reset successfully.");
    } catch (err) {
      toast.error("Failed to reset password: " + (err.response?.data?.message || "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--theme-primary)]" /> Super Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm">Manage all business accounts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Create Business
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Businesses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBusinesses}</p>
            </div>
            <Building className="w-8 h-8 text-gray-200" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Active Businesses</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeBusinesses}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-100" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Inactive Businesses</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactiveBusinesses}</p>
            </div>
            <Lock className="w-8 h-8 text-red-100" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Users</p>
              <p className="text-2xl font-bold text-[var(--theme-primary)]">{stats.totalUsers}</p>
            </div>
            <Activity className="w-8 h-8 text-indigo-100" />
          </div>
        </div>
      </div>

      {/* Create Business Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--theme-primary)]" /> Create New Business
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  name="businessName"
                  className="input"
                  placeholder="e.g. VS Cake Factory"
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
                  placeholder="e.g. John Smith"
                  value={form.ownerName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Business Email</label>
                <input
                  name="email"
                  type="email"
                  className="input"
                  placeholder="business@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
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
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  name="address"
                  className="input"
                  placeholder="123 Main Street"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Business Type</label>
                <select name="businessType" className="select" value={form.businessType} onChange={handleChange}>
                  <option value="">Select type</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Retail Store">Retail Store</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">GST Number (Optional)</label>
                <input
                  name="gstNumber"
                  className="input"
                  placeholder="GSTIN"
                  value={form.gstNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Account Status</label>
                <select name="status" className="select" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Login Account</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Login Name</label>
                  <input
                    name="loginName"
                    className="input"
                    placeholder="e.g. John Smith"
                    value={form.loginName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Login Email</label>
                  <input
                    name="loginEmail"
                    type="email"
                    className="input"
                    placeholder="owner@business.com"
                    value={form.loginEmail}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    name="loginPassword"
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={form.loginPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-outline px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="btn-primary px-4 py-2 text-sm"
              >
                {formLoading ? "Creating..." : "Create Business"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Businesses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">All Businesses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                <th className="px-4 py-3">Business Name</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Login User</th>
                <th className="px-4 py-3">Login Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr>
              ) : businesses.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No businesses found.</td></tr>
              ) : (
                businesses.map((b) => {
                  const loginUser = b.users && b.users.length > 0 ? b.users[0] : null;
                  return (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{b.businessName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{b.ownerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{loginUser?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{loginUser?.email || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{b.mobile}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            b.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(b._id, b.status)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          b.status === "active"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {b.status === "active" ? "Deactivate" : "Activate"}
                      </button>{" "}
                      <button
                        onClick={() => resetPassword(b._id)}
                        className="text-xs px-2 py-1 rounded bg-[var(--theme-bg-secondary)] text-[var(--theme-primary)] hover:bg-indigo-100 ml-1"
                      >
                        Reset Password
                      </button>{" "}
                      <button
                        onClick={() => deleteBusiness(b._id)}
                        className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 ml-1"
                      >
                        Delete
                      </button>
                      </td>
                    </tr>
                    )
                  })
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
