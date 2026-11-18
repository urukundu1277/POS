import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../services/adminApi";

export default function SuperAdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi.post("/admin/login", form);
      localStorage.setItem("admin_token", res.data.token);
      localStorage.setItem("admin_user", JSON.stringify(res.data.admin));
      toast.success(res.data.message);
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Super Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-700 rounded-lg flex items-center justify-center mx-auto mb-3">
              <LockKeyhole className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Super Admin Login</h2>
            <p className="text-gray-500 text-sm">System administrator sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? "Signing in..." : "Sign In as Super Admin"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Super Admin accounts are created through secure database seed process.
          </p>
        </div>
      </div>
    </div>
  );
}
