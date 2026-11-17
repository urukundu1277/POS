import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import {
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  Save,
  X,
} from "lucide-react";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ categoryName: "", description: "", status: "active", image: "" });
  const [editing, setEditing] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get("/categories/");
      setCategories(res.data.categories);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ categoryName: "", description: "", status: "active", image: "" });
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat._id);
    setForm({ categoryName: cat.categoryName, description: cat.description, status: cat.status, image: cat.image });
    setImagePreview(cat.image || "");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("categoryName", form.categoryName);
      formData.append("description", form.description);
      formData.append("status", form.status);
      if (imagePreview && imagePreview.startsWith("data:")) {
        const blob = await (await fetch(imagePreview)).blob();
        formData.append("image", blob, "image.png");
      }
      if (editing) {
        await api.put(`/categories/${editing}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Category updated");
      } else {
        await api.post("/categories/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Category created");
      }
      closeModal();
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (cat) => {
    try {
      await api.put(`/categories/${cat._id}`, { status: cat.status === "active" ? "inactive" : "active" });
      toast.success(`Category ${cat.status === "active" ? "disabled" : "enabled"}`);
      loadCategories();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category? Menu items under it may be affected.")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const closeModal = () => {
    setEditing(null);
    setImagePreview("");
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Plus className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">Category Management</h1>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-b border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No categories found.</td></tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{cat.categoryName}</div>
                      {cat.image && (
                        <img src={cat.image} alt={cat.categoryName} className="mt-1 w-10 h-10 rounded object-cover border border-gray-200" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cat.description || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${cat.status === "active" ? "badge-active" : "badge-inactive"}`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(cat)}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {cat.status === "active" ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => openEdit(cat)}
                        className="ml-2 text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(cat._id)}
                        className="ml-2 text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={closeModal}
      >
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{editing ? "Edit Category" : "Add Category"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category Name</label>
              <input
                name="categoryName"
                className="input"
                placeholder="e.g. Beverages"
                value={form.categoryName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                name="description"
                className="input"
                placeholder="Optional description"
                value={form.description}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category Image (optional)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-600" />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-24 h-24 rounded object-cover border border-gray-200" />
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                className="select"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={closeModal} className="btn-outline flex-1">
                <X className="w-4 h-4 mr-2" /> Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <Save className="w-4 h-4 mr-2" /> : ""} {editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
