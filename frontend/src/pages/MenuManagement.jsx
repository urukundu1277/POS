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
  Search,
  SlidersHorizontal,
  Droplet,
  Minus,
} from "lucide-react";
import { formatCurrency } from "../utils/format";

const DEFAULT_SIZES = ["250 ml", "300 ml", "500 ml", "600 ml", "750 ml", "1 L", "1.5 L", "2 L"];

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    itemName: "",
    categoryId: "",
    description: "",
    itemType: "fast_food",
    price: "",
    fullPrice: "",
    portionUnit: "piece",
    sizes: [],
    status: "active",
    image: "",
  });
  const [editing, setEditing] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterItemType, setFilterItemType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        api.get("/menu-items/"),
        api.get("/categories/"),
      ]);
      setMenuItems(mRes.data.menuItems);
      setCategories(cRes.data.categories);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...form.sizes];
    newSizes[index][field] = value;
    setForm({ ...form, sizes: newSizes });
  };

  const addSize = () => {
    setForm({ ...form, sizes: [...form.sizes, { size: "", price: "" }] });
  };

  const removeSize = (index) => {
    setForm({ ...form, sizes: form.sizes.filter((_, i) => i !== index) });
  };

  const handleItemTypeChange = (value) => {
    setForm({ ...form, itemType: value });
    if (value === "beverage") {
      setForm({ ...form, sizes: DEFAULT_SIZES.map((s) => ({ size: s, price: "" })) });
    } else {
      setForm({ ...form, sizes: [] });
    }
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
    setForm({ itemName: "", categoryId: "", description: "", itemType: "fast_food", price: "", fullPrice: "", portionUnit: "piece", sizes: [], status: "active", image: "" });
    setImagePreview("");
    setModalOpen(true);
  };

  const openAddBeverage = () => {
    setEditing(null);
    setForm({ itemName: "", categoryId: "", description: "", itemType: "beverage", price: "", fullPrice: "", portionUnit: "", sizes: DEFAULT_SIZES.map((s) => ({ size: s, price: "" })), status: "active", image: "" });
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item._id);
    setForm({
      itemName: item.itemName,
      categoryId: item.categoryId,
      description: item.description,
      itemType: item.itemType || "fast_food",
      price: item.price || "",
      fullPrice: item.fullPrice || "",
      portionUnit: item.portionUnit || "",
      sizes: item.sizes || [],
      status: item.status,
      image: item.image,
    });
    setImagePreview(item.image || "");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("itemName", form.itemName);
      formData.append("categoryId", form.categoryId);
      formData.append("description", form.description);
      formData.append("itemType", form.itemType);
      formData.append("status", form.status);
      if (form.itemType === "fast_food") {
        formData.append("price", form.price);
        formData.append("fullPrice", form.fullPrice);
        formData.append("portionUnit", form.portionUnit);
      } else {
        formData.append("sizes", JSON.stringify(form.sizes));
      }
      if (imagePreview && imagePreview.startsWith("data:")) {
        const blob = await (await fetch(imagePreview)).blob();
        formData.append("image", blob, "image.png");
      }
      if (editing) {
        await api.put(`/menu-items/${editing}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Menu item updated");
      } else {
        await api.post("/menu-items/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Menu item created");
      }
      closeModal();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (item) => {
    try {
      await api.put(`/menu-items/${item._id}`, { status: item.status === "active" ? "inactive" : "active" });
      toast.success(`Item ${item.status === "active" ? "disabled" : "enabled"}`);
      loadData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await api.delete(`/menu-items/${id}`);
      toast.success("Menu item deleted");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const closeModal = () => {
    setEditing(null);
    setImagePreview("");
    setModalOpen(false);
  };

  const categoryMap = {};
  categories.forEach((c) => { categoryMap[c._id] = c.categoryName; });

  const filtered = (menuItems || []).filter(
    (item) =>
      item && item.itemName &&
      item.itemName.toLowerCase().includes(search.toLowerCase()) &&
      (!filterCategory || item.categoryId === filterCategory) &&
      (!filterItemType || item.itemType === filterItemType)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Plus className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">Menu Management</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAdd}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Fast Food
          </button>
          <button
            onClick={openAddBeverage}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Droplet className="w-4 h-4" /> Add Beverage
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {(categories || []).map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.categoryName || c.name || "Category"}</option>
            ))}
          </select>
          <select
            className="select"
            value={form.status}
            onChange={(e) => {}}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Active
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-b border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Prices</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
              ) : (!categories || categories.length === 0) ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading categories...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No items found.</td></tr>
              ) : (
                filtered.map((item) => {
                  if (!item) return null;
                  const catName = (item.categoryId && typeof item.categoryId === 'object' && item.categoryId.categoryName) || (categoryMap[item.categoryId]) || "—";
                  const isBeverage = item.itemType === "beverage";
                  return (
                    <tr key={item._id || item.itemName} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.itemName} className="w-8 h-8 rounded object-cover border border-gray-200" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                              <SlidersHorizontal className="w-4 h-4" />
                            </div>
                          )}
                          <div className="font-medium text-gray-900">{item.itemName || "Item"}</div>
                        </div>
                        <p className="text-xs text-gray-500">{item.description || ""}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className={`badge ${item.itemType === "beverage" ? "badge-active" : "badge-inactive"}`}>
                          {item.itemType === "beverage" ? "Beverage" : "Fast Food"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{catName}</td>
                      <td className="px-4 py-3">
                        {isBeverage ? (
                          <div className="space-y-1">
                            {(item.sizes || []).map((s, idx) => (
                              <div key={idx} className="text-xs">
                                {s.size}: {formatCurrency(s.price)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs">Single: {item.price != null ? formatCurrency(item.price) : "—"}</div>
                            {item.fullPrice != null ? <div className="text-xs">Full: {formatCurrency(item.fullPrice)}</div> : null}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${item.status === "active" ? "badge-active" : "badge-inactive"}`}>
                          {item.status || "active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleStatus(item)}
                          className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          {item.status === "active" ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="ml-2 text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item._id)}
                          className="ml-2 text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">{editing ? "Edit Menu Item" : "Add Menu Item"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Item Name</label>
              <input
                name="itemName"
                className="input"
                placeholder="e.g. Burger"
                value={form.itemName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="categoryId"
                className="select"
                value={form.categoryId}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.categoryName}</option>
                ))}
              </select>
              <p className="text-xs text-red-500">Every item must belong to a category.</p>
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
              <label className="block text-sm font-medium text-gray-700">Item Type</label>
              <select
                name="itemType"
                className="select"
                value={form.itemType}
                onChange={(e) => handleItemTypeChange(e.target.value)}
              >
                <option value="fast_food">Fast Food</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>
            {form.itemType === "fast_food" ? (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-gray-500">Price per single portion</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Full Price (₹)</label>
                  <input
                    name="fullPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={form.fullPrice}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500">Optional full portion price</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    name="portionUnit"
                    className="select"
                    value={form.portionUnit}
                    onChange={handleChange}
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Liter</option>
                    <option value="gram">Gram</option>
                    <option value="ml">Ml</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Beverage Sizes & Prices</label>
                  <p className="text-xs text-gray-500">Configure each available size with its price.</p>
                  <div className="space-y-2">
                    {form.sizes.map((size, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          name={`sizes[${index}].size`}
                          type="text"
                          placeholder="e.g. 250 ml"
                          value={size.size}
                          onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                          className="input text-sm"
                          placeholder="Size"
                        />
                        <input
                          name={`sizes[${index}].price`}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={size.price}
                          onChange={(e) => handleSizeChange(index, "price", e.target.value)}
                          className="input text-sm w-24"
                          placeholder="Price"
                        />
                        <button
                          type="button"
                          onClick={() => removeSize(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSize}
                      className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Size
                    </button>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Item Image (optional)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-600" />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-24 h-24 rounded object-cover border border-gray-200" />
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Availability Status</label>
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
