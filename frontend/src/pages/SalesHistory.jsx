import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatCurrency, formatDateTime } from "../utils/format";
import { Printer as Print, Clock, Calendar, Search, CreditCard, Smartphone, Eye } from "lucide-react";

export default function SalesHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [previewBillData, setPreviewBillData] = useState(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadBills();
  }, [filter, startDate, endDate]);

  const loadBills = async () => {
    try {
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      const queryString = params.length > 0 ? `?${params.join("&")}` : "";
      const res = await api.get(`/bills/${queryString}`);
      setBills(res.data.bills);
    } catch (err) {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
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
      yesterday.setHours(23, 59, 59, 999);
      const yStart = new Date();
      yStart.setDate(yStart.getDate() - 1);
      yStart.setHours(0, 0, 0, 0);
      setStartDate(yStart.toISOString().split("T")[0]);
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

  const filtered = bills.filter((b) =>
    b.billNumber.toLowerCase().includes(search.toLowerCase())
  );

  const previewBill = (bill) => {
    setPreviewBillData(bill);
  };

  const closePreview = () => {
    setPreviewBillData(null);
  };

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-[var(--theme-primary)]" /> Sales History
        </h1>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
          <div className="flex gap-2">
            <button onClick={() => applyQuickFilter("today")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "today" ? "bg-[var(--theme-primary)] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Today</button>
            <button onClick={() => applyQuickFilter("yesterday")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "yesterday" ? "bg-[var(--theme-primary)] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Yesterday</button>
            <button onClick={() => applyQuickFilter("week")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "week" ? "bg-[var(--theme-primary)] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>This Week</button>
            <button onClick={() => applyQuickFilter("month")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "month" ? "bg-[var(--theme-primary)] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>This Month</button>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="text-gray-500 text-xs">to</span>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button onClick={loadBills} className="btn-secondary px-3 py-2 text-sm">Apply</button>
          </div>
          <div className="relative w-48 ml-auto">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search bill number..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-b border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                <th className="px-4 py-3">Bill Number</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Total Items</th>
                <th className="px-4 py-3">Grand Total</th>
                <th className="px-4 py-3 text-center">Payment Method</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No bills found.</td></tr>
              ) : (
                filtered.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">#{bill.billNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(bill.createdAt)}</td>
                    <td className="px-4 py-3">{bill.totalItems}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(bill.grandTotal)}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className="flex items-center gap-1">
                        {bill.paymentMethod === "cash" && <CreditCard className="w-3 h-3 text-gray-600" />}
                        {bill.paymentMethod === "upi" && <Smartphone className="w-3 h-3 text-gray-600" />}
                        {bill.paymentMethod === "card" && <CreditCard className="w-3 h-3 text-gray-600" />}
                        {bill.paymentMethod === "other" && <CreditCard className="w-3 h-3 text-gray-600" />}
                        {bill.paymentMethod === "upi" ? "UPI" : bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => previewBill(bill)}
                        className="text-xs px-2 py-1 rounded bg-[var(--theme-bg-secondary)] text-[var(--theme-primary)] hover:bg-indigo-100 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {previewBillData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closePreview}>
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{previewBillData.businessName || "Business"}</h3>
              <p className="text-xs text-gray-600">{previewBillData.businessAddress || ""}</p>
            </div>
            <button onClick={closePreview} className="text-gray-400 hover:text-gray-600">
              <span className="w-5 h-5">&times;</span>
            </button>
          </div>
          <hr className="border-black mb-4" />
          <p className="text-sm text-gray-600 mb-4">Bill #{previewBillData.billNumber} - {formatCurrency(previewBillData.grandTotal)}</p>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewBillData.items.map((item) => (
                  <tr key={item.itemName + item.quantity} className="text-sm">
                    <td className="px-2 py-2 text-gray-900">{item.itemName}</td>
                    <td className="px-2 py-2 text-center text-gray-600">{item.quantity}</td>
                    <td className="px-2 py-2 text-right text-gray-600">₹{Number(item.price).toFixed(2)}</td>
                    <td className="px-2 py-2 text-right text-gray-900">₹{Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200 mb-4">
            <span>Grand Total</span>
            <span>₹{Number(previewBillData.grandTotal).toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPrinting(true);
                setTimeout(() => { window.print(); setPrinting(false); }, 100);
              }}
              className="btn-primary flex-1 text-xs"
            >
              <Print className="w-4 h-4 mr-2" /> Print
            </button>
            <button onClick={closePreview} className="btn-secondary flex-1 text-xs">
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
