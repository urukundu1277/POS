import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { formatCurrency, formatDateTime } from "../utils/format";
import { Printer as Print, Clock, Calendar, Search } from "lucide-react";

export default function SalesHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadBills();
  }, [filter, startDate, endDate]);

  const loadBills = async () => {
    try {
      let params = "";
      if (filter === "custom" && startDate && endDate) {
        params = `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(`/bills/${params}`);
      setBills(res.data.bills);
    } catch (err) {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const dateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  };

  const applyQuickFilter = (type) => {
    setFilter(type);
    setStartDate("");
    setEndDate("");
    if (type === "today") {
      const d = new Date().toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
    } else if (type === "yesterday") {
      const { start, end } = dateRange(1);
      setStartDate(start);
      setEndDate(end);
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

  const reprintBill = (bill) => {
    const printContent = generateReceiptHTML(bill);
    const win = window.open("", "_blank");
    win.document.write(printContent);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const generateReceiptHTML = (bill) => {
    const itemsHTML = bill.items
      .map(
        (it) => `
        <tr>
          <td style="padding:4px 0; border-bottom:1px solid #ddd;">${it.itemName}</td>
          <td style="padding:4px 0; border-bottom:1px solid #ddd; text-align:center;">${it.quantity}</td>
          <td style="padding:4px 0; border-bottom:1px solid #ddd; text-align:right;">₹${it.price.toFixed(2)}</td>
          <td style="padding:4px 0; border-bottom:1px solid #ddd; text-align:right;">₹${it.total.toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    return `
    <html><head><style>
      body{font-family:Arial,sans-serif;font-size:12px;padding:10px;color:#000;}
      .receipt{max-width:320px;margin:0 auto;border:2px solid #000;padding:12px;}
      .header{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px;}
      .logo{width:60px;height:60px;margin:0 auto 6px;object-fit:cover;}
      .business-name{font-size:18px;font-weight:bold;}
      .business-details{font-size:12px;line-height:1.4;}
      .bill-details{font-size:11px;margin-bottom:10px;display:flex;justify-content:space-between;}
      table{width:100%;border-collapse:collapse;font-size:12px;}
      th{text-align:left;padding:4px 0;font-weight:bold;border-bottom:1px solid #000;}
      td{padding:4px 0;}
      .summary{margin-top:10px;border-top:2px solid #000;padding-top:8px;font-size:13px;}
      .summary-row{display:flex;justify-content:space-between;margin:3px 0;}
      .total{font-weight:bold;font-size:15px;border-top:1px solid #000;padding-top:6px;margin-top:6px;}
      .thankyou{text-align:center;margin-top:12px;font-size:13px;font-weight:bold;}
      .no-print{display:none;}
    </style></head><body>
      <div class="receipt">
        <div class="header">
          ${bill.businessLogo ? `<img class="logo" src="${bill.businessLogo}" alt="logo">` : ""}
          <div class="business-name">${bill.businessName || "Business"}</div>
          <div class="business-details">
            ${bill.businessAddress || ""}<br/>
            ${bill.businessMobile || ""}
          </div>
        </div>
        <div class="bill-details">
          <div><strong>Bill #:</strong> ${bill.billNumber}</div>
          <div><strong>Date:</strong> ${formatDateTime(bill.createdAt)}</div>
        </div>
        <table>
          <thead>
            <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div class="summary">
          <div class="summary-row"><span>Total Items</span><span>${bill.totalItems}</span></div>
          <div class="summary-row"><span>Grand Total</span><span>₹${bill.grandTotal.toFixed(2)}</span></div>
          <div class="total">Amount Payable: ₹${bill.grandTotal.toFixed(2)}</div>
        </div>
        <div class="thankyou">Thank You! Visit Again</div>
      </div>
    </body></html>
    `;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" /> Sales History
        </h1>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
          <div className="flex gap-2">
            <button onClick={() => applyQuickFilter("today")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "today" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Today</button>
            <button onClick={() => applyQuickFilter("yesterday")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "yesterday" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Yesterday</button>
            <button onClick={() => applyQuickFilter("week")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "week" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>This Week</button>
            <button onClick={() => applyQuickFilter("month")} className={`px-3 py-1.5 rounded text-sm transition ${filter === "month" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>This Month</button>
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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No bills found.</td></tr>
              ) : (
                filtered.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">#{bill.billNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(bill.createdAt)}</td>
                    <td className="px-4 py-3">{bill.totalItems}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(bill.grandTotal)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => reprintBill(bill)} className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1">
                        <Print className="w-3 h-3" /> Reprint
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
  );
}
