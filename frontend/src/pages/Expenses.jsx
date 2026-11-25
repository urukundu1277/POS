import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatCurrency, formatDate, formatDateTime } from "../utils/format";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  Clock,
  Calendar,
  CreditCard,
  Smartphone,
  Filter,
  PieChart,
  Activity,
} from "lucide-react";

const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salary",
  "Inventory",
  "Marketing",
  "Transport",
  "Maintenance",
  "Other",
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: CreditCard },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "other", label: "Other", icon: Calendar },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "Other",
    date: "",
    paymentMethod: "cash",
    notes: "",
  });
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadExpenses();
    loadSummary();
  }, [filter, startDate, endDate, filterCategory, search]);

  const loadExpenses = async () => {
    try {
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (filterCategory) params.push(`category=${filterCategory}`);
      if (search) params.push(`search=${search}`);
      const queryString = params.length > 0 ? `?${params.join("&")}` : "";
      const res = await api.get(`/expenses/${queryString}`);
      setExpenses(res.data.expenses);
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      const queryString = params.length > 0 ? `?${params.join("&")}` : "";
      const res = await api.get(`/expenses/summary/${queryString}`);
      setSummary(res.data);
    } catch (err) {
      // summary failure is non-fatal
    }
  };

  const dateRange = (days) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - days);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  };

  const applyQuickFilter = (type) => {
    setFilter(type);
    setStartDate("");
    setEndDate("");
    const d = new Date().toISOString().split("T")[0];
    if (type === "today") {
      setStartDate(d);
      setEndDate(d);
    } else if (type === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setStartDate(yesterday.toISOString().split("T")[0]);
      setEndDate(yesterday.toISOString().split("T")[0]);
    } else if (type === "week") {
      const { start, end } = dateRange(7);
      setStartDate(start);
      setEndDate(end);
    } else if (type === "month") {
      const { start, end } = dateRange(30);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ description: "", amount: "", category: "Other", date: new Date().toISOString().split("T")[0], paymentMethod: "cash", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditing(expense._id);
    setForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date ? expense.date.split("T")[0] : "",
      paymentMethod: expense.paymentMethod,
      notes: expense.notes,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/expenses/${editing}`, form);
        toast.success("Expense updated");
      } else {
        await api.post("/expenses/", form);
        toast.success("Expense added");
      }
      closeModal();
      loadExpenses();
      loadSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Expense deleted");
      loadExpenses();
      loadSummary();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const closeModal = () => {
    setEditing(null);
    setModalOpen(false);
  };

  const filtered = expenses.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    (e.notes || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalExpense = summary ? summary.total : expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCount = summary ? summary.count : expenses.length;

  const todayTotal = expenses.reduce((sum, e) => {
    const d = new Date(e.date).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return d === today ? sum + e.amount : sum;
  }, 0);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-[var(--theme-primary)]" />
          <h1 className="text-xl font-bold text-gray-900">Daily Expenses</h1>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayTotal)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Avg / Entry</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount > 0 ? formatCurrency(totalExpense / totalCount) : formatCurrency(0)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
          <div className="flex gap-2">
            <button onClick={() => applyQuickFilter("today")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "today" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Today</button>
            <button onClick={() => applyQuickFilter("yesterday")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "yesterday" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Yesterday</button>
            <button onClick={() => applyQuickFilter("week")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "week" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>This Week</button>
            <button onClick={() => applyQuickFilter("month")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "month" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>This Month</button>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="text-gray-500 text-xs">to</span>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button onClick={loadExpenses} className="btn-secondary px-3 py-2 text-sm">Apply</button>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              className="select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="relative w-48 ml-auto">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input className="input pl-9" placeholder="Search description/notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-b border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Date</th>
                <th className="px-4 py-3 text-center">Payment</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No expenses found.</td></tr>
              ) : (
                filtered.map((expense) => {
                  const method = PAYMENT_METHODS.find((m) => m.value === expense.paymentMethod);
                  const Icon = method ? method.icon : Calendar;
                  return (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{expense.description}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">- {formatCurrency(expense.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${expense.category === "Other" ? "bg-gray-100 text-gray-700" : "bg-blue-50 text-blue-700"}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="flex items-center justify-center gap-1">
                          <Icon className="w-3 h-3 text-gray-600" />
                          {expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{expense.notes || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(expense)}
                          className="ml-2 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => deleteExpense(expense._id)}
                          disabled={deletingId === expense._id}
                          className="ml-2 text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1"
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 overflow-x-hidden overflow-y-auto"
          onClick={closeModal}
        >
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editing ? "Edit Expense" : "Add Expense"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  name="description"
                  className="input"
                  placeholder="e.g. Shop rent"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  name="category"
                  className="select"
                  value={form.category}
                  onChange={handleChange}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  name="date"
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const PaymentIcon = m.icon;
                    return (
                      <label
                        key={m.value}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${form.paymentMethod === m.value ? "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={m.value}
                          checked={form.paymentMethod === m.value}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600"
                        />
                        <PaymentIcon className="w-4 h-4" /> {m.label}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                <input
                  name="notes"
                  className="input"
                  placeholder="Additional details"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-outline flex-1">
                  <X className="w-4 h-4 mr-2" /> Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <Save className="w-4 h-4 mr-2" /> : ""} {editing ? "Update" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
