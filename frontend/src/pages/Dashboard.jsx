import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Printer,
  Download,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { formatCurrency } from "../utils/format";

export default function Dashboard() {
  const [business, setBusiness] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [printing, setPrinting] = useState(false);
  const [billPreview, setBillPreview] = useState(null);
  const [sizeSelection, setSizeSelection] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bRes, cRes, mRes] = await Promise.all([
        api.get("/business/"),
        api.get("/categories/?status=active"),
        api.get("/menu-items/?status=active"),
      ]);
      setBusiness(bRes.data.business);
      setCategories(cRes.data.categories);
      if (cRes.data.categories && cRes.data.categories.length > 0) {
        setSelectedCategory(cRes.data.categories[0]._id);
      }
      setMenuItems(mRes.data.menuItems);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryId = (item) => {
    if (!item || !item.categoryId) return null;
    if (typeof item.categoryId === "object") return item.categoryId._id;
    return item.categoryId;
  };

  const filteredItems = (menuItems || []).filter(
    (item) =>
      item && item.itemName &&
      (!selectedCategory || getCategoryId(item) === selectedCategory) &&
      item.itemName.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item, size, price, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item._id && c.size === size);
      if (existing) {
        return prev.map((c) =>
          c.itemId === item._id && c.size === size
            ? { ...c, quantity: c.quantity + quantity }
            : c
        );
      }
      return [...prev, {
        itemId: item._id,
        itemName: item.itemName,
        itemType: item.itemType || "fast_food",
        categoryId: getCategoryId(item),
        categoryName: item.categoryId && typeof item.categoryId === "object" ? item.categoryId.categoryName : "",
        price: price,
        quantity: quantity,
        size: size,
        unitPrice: price,
        portionUnit: item.portionUnit || "",
      }];
    });
    toast.success(`${item.itemName} (${size}) x${quantity} added to cart`);
  };

  const increaseQty = (itemId, size) => {
    setCart((prev) => prev.map((c) =>
      c.itemId === itemId && c.size === size
        ? { ...c, quantity: c.quantity + 1 } : c
    ));
  };

  const decreaseQty = (itemId, size) => {
    setCart((prev) => {
      const next = prev.map((c) =>
        c.itemId === itemId && c.size === size
          ? { ...c, quantity: c.quantity - 1 } : c
      );
      return next.filter((c) => c.quantity > 0);
    });
  };

  const removeItem = (itemId, size) => {
    setCart((prev) => prev.filter((c) => !(c.itemId === itemId && c.size === size)));
  };

  const setQuantity = (itemId, size, value) => {
    const qty = parseInt(value) || 0;
    if (qty <= 0) {
      removeItem(itemId, size);
      return;
    }
    setCart((prev) => prev.map((c) =>
      c.itemId === itemId && c.size === size
        ? { ...c, quantity: qty } : c
    ));
  };

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleGenerateBill = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    const billNumber = `BILL-${Math.floor(1000 + Math.random() * 9000)}`;
    const previewItems = cart.map((c) => ({
      ...c,
      total: c.price * c.quantity,
    }));
    const grandTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
    setBillPreview({
      billNumber,
      items: previewItems,
      grandTotal,
      totalItems,
      createdAt: new Date().toISOString(),
      paymentMethod,
    });
  };

  const handlePrintBill = async () => {
    setPrinting(true);
    try {
      const res = await api.post("/bills/", { items: cart, paymentMethod: paymentMethod });
      toast.success("Bill saved to sales history");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save bill");
    } finally {
      setPrinting(false);
      window.print();
      setBillPreview(null);
      clearCart();
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  if (loading) return <div className="flex h-full items-center justify-center">Loading...</div>;

  const categoryList = categories.map((c) => ({ id: c._id, name: c.categoryName }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{business?.businessName || "POS Dashboard"}</h1>
          <p className="text-gray-500 text-sm">{business?.address || ""}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <div className="relative w-48">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  className="input pl-9"
                  placeholder="Search menu items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2 min-w-fit">
                {categoryList.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                        active
                          ? "bg-blue-700 border-blue-800 text-white shadow-md"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No items found</p>
                  <p className="text-xs text-gray-400 mt-1">Try another category or search</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border border-gray-200 rounded-xl bg-white shadow-sm">
                    <thead>
                      <tr className="bg-[var(--theme-bg-secondary)] border-b border-[var(--theme-border)]">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase w-32">Size</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase w-24">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase text-center w-20">Add</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredItems.map((item) => {
                        const selectedSize = sizeSelection[item._id] || ((item.sizes || [])[0]?.size || "");
                        const selectedSizePrice = (item.sizes || []).find((s) => s.size === selectedSize)?.price || 0;
                        return (
                          <tr key={item._id} className="hover:bg-[var(--theme-bg-secondary)] transition-all duration-200 border-b border-gray-50 last:border-0">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900 text-sm">{item.itemName}</div>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {(item.sizes || []).map((s, idx) => (
                                <label key={idx} className="flex items-center gap-1 cursor-pointer text-sm whitespace-nowrap">
                                  <input
                                    type="radio"
                                    name={`size-${item._id}`}
                                    value={s.size}
                                    checked={selectedSize === s.size}
                                    onChange={() => setSizeSelection({ ...sizeSelection, [item._id]: s.size })}
                                    className="w-3 h-3 text-[var(--theme-primary)] border-gray-300 focus:ring-indigo-500"
                                  />
                                  {s.size}
                                </label>
                              ))}
                              {(item.sizes || []).length === 0 && (
                                <span className="text-xs text-gray-500">No sizes</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">{formatCurrency(selectedSizePrice)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => addToCart(item, selectedSize, selectedSizePrice, 1)}
                                disabled={!selectedSize}
                                className="px-3 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1"
                              >
                                <span className="w-3 h-3">+</span> Add
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="card p-5 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[var(--theme-primary)]" /> Billing Cart
            </h2>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>Your cart is empty</p>
                  <p className="text-xs text-gray-400">Add items from the menu</p>
                </div>
              ) : (
                cart.map((item) => {
                  const sizeLabel = item.size || "Single";
                  return (
                    <div key={`${item.itemId}-${item.size}`} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
                           <span className="text-xs text-gray-500">{sizeLabel} ×{item.quantity}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatCurrency(item.price)} each</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => decreaseQty(item.itemId, item.size)}
                          className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.itemId, item.size, e.target.value)}
                          className="w-8 text-center text-sm border border-gray-300 rounded px-1"
                        />
                        <button
                          onClick={() => increaseQty(item.itemId, item.size)}
                          className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.itemId, item.size)}
                          className="ml-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Total Items</span>
                <span className="font-medium text-gray-900">{totalItems}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--theme-primary)] pt-2 border-t border-gray-200">
                <span>Grand Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 uppercase mb-2">Payment Method</label>
                <div className="flex gap-2">
                  <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${paymentMethod === "cash" ? "bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-primary)] ring-1 ring-indigo-500" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`} onClick={() => setPaymentMethod("cash")}>
                    <CreditCard className="w-4 h-4" /> Cash
                  </label>
                  <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${paymentMethod === "upi" ? "bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-primary)] ring-1 ring-indigo-500" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`} onClick={() => setPaymentMethod("upi")}>
                    <Smartphone className="w-4 h-4" /> UPI
                  </label>
                  <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${paymentMethod === "card" ? "bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-primary)] ring-1 ring-indigo-500" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`} onClick={() => setPaymentMethod("card")}>
                    <CreditCard className="w-4 h-4" /> Card
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={handleGenerateBill}
                disabled={cart.length === 0}
                className="btn-primary py-2 text-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                Generate Bill
              </button>
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="btn-outline py-2 text-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {billPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setBillPreview(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">{business?.businessName || "Business"}</h3>
              <p className="text-xs text-gray-600">{business?.address || ""}</p>
            </div>
            <hr className="border-black mb-4" />
            <p className="text-sm text-gray-600 mb-4">Bill #{billPreview.billNumber} - {formatCurrency(billPreview.grandTotal)}</p>

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
                  {billPreview.items.map((item) => (
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
              <span>₹{Number(billPreview.grandTotal).toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={handlePrintBill} className="btn-primary flex-1">
                <Printer className="w-4 h-4 mr-2" /> Print Bill
              </button>
              <button onClick={() => setBillPreview(null)} className="btn-secondary flex-1">
                Modify Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
