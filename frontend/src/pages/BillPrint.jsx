import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { formatCurrency, formatDateTime } from "../utils/format";

export default function BillPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printType, setPrintType] = useState("80mm");

  useEffect(() => {
    loadBill();
  }, [id]);

  const loadBill = async () => {
    try {
      const [bRes, bizRes] = await Promise.all([
        api.get(`/bills/${id}`),
        api.get("/business/"),
      ]);
      setBill(bRes.data.bill);
      setBusiness(bizRes.data.business);
    } catch (err) {
      toast.error("Bill not found");
      navigate("/sales");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF("p", "mm", printType === "58mm" ? [58, 200] : [80, 200]);
    const receiptEl = document.getElementById("receipt");
    if (!receiptEl) return;
    doc.html(receiptEl, {
      x: 5,
      y: 5,
      width: printType === "58mm" ? 48 : 70,
      windowWidth: printType === "58mm" ? 58 : 80,
    }).then(() => {
      doc.save(`bill-${bill.billNumber}.pdf`);
    });
  };

  if (loading) return <div className="flex h-full items-center justify-center">Loading...</div>;
  if (!bill) return null;

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate("/sales")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <select
            value={printType}
            onChange={(e) => setPrintType(e.target.value)}
            className="select w-32"
          >
            <option value="80mm">80mm Thermal</option>
            <option value="58mm">58mm Thermal</option>
            <option value="a4">A4 Paper</option>
          </select>
          <button onClick={handleDownloadPDF} className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 px-3 py-2 text-sm">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div id="receipt" className={`receipt mx-auto p-4 border border-black ${
        printType === "58mm" ? "w-[220px]" : printType === "a4" ? "w-[210mm]" : "w-[320px]"
      }`}>
        <div className="text-center border-b-2 border-black pb-2 mb-4">
          <h2 className="text-lg font-bold">{business?.businessName || bill.businessName}</h2>
          <div className="text-sm">{business?.address || bill.businessAddress}</div>
        </div>

        <div className="flex justify-between text-sm mb-2">
          <span>Bill #: {bill.billNumber}</span>
          <span>{formatDateTime(bill.createdAt)}</span>
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left pb-1">Item</th>
              <th className="text-center pb-1">Qty</th>
              <th className="text-right pb-1">Price</th>
              <th className="text-right pb-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((it) => (
              <tr key={it.itemName + it.quantity} className="border-b border-b-gray-200">
                <td className="pb-1 text-left">{it.itemName}</td>
                <td className="pb-1 text-center">{it.quantity}</td>
                <td className="pb-1 text-right">₹{it.price.toFixed(2)}</td>
                <td className="pb-1 text-right">₹{it.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-black pt-2 mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Total Items</span>
            <span>{bill.totalItems}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Grand Total</span>
            <span>₹{bill.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 text-center text-sm font-bold">Thank You! Visit Again</div>
      </div>

      <div className="no-print mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          Tip: Use "Print" to send to a thermal printer. Select the paper size (58mm/80mm/A4) before printing.
        </p>
      </div>
    </div>
  );
}
