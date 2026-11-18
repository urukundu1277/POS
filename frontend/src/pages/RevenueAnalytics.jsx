import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import {
  Clock,
  Calendar,
  Search,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CreditCard,
  Smartphone,
  Laptop,
  LayoutList,
} from "lucide-react";
import {
  Bar,
  Pie,
  Line,
} from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function RevenueAnalytics() {
  const [loading, setLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);
  const [summary, setSummary] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    yesterdayRevenue: 0,
    thisMonthRevenue: 0,
    thisMonthOrders: 0,
    prevMonthRevenue: 0,
    todayChangePercent: 0,
    monthChangePercent: 0,
    avgOrderValue: 0,
  });
  const [dailyData, setDailyData] = useState({
    date: "",
    totalRevenue: 0,
    totalOrders: 0,
    totalItems: 0,
    paymentBreakdown: {},
    hourlyBreakdown: [],
  });
  const [monthlyData, setMonthlyData] = useState({
    month: 0,
    year: 0,
    currentMonthRevenue: 0,
    prevMonthRevenue: 0,
    totalOrders: 0,
    totalItems: 0,
    avgDailyRevenue: 0,
    highestDay: { date: "", revenue: 0 },
    lowestDay: { date: "", revenue: 0 },
    dailyBreakdown: [],
  });
  const [categoryData, setCategoryData] = useState({
    totalRevenue: 0,
    categories: [],
  });
  const [itemData, setItemData] = useState({
    totalRevenue: 0,
    totalQuantity: 0,
    items: [],
    bestSelling: null,
    highestRevenue: null,
  });
  const [paymentData, setPaymentData] = useState({
    totalAmount: 0,
    paymentMethods: [],
  });
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadAllData();
  }, [filter, startDate, endDate, selectedMonth, selectedYear]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (filter) params.push(`filter=${filter}`);
      if (selectedMonth) params.push(`month=${selectedMonth}`);
      if (selectedYear) params.push(`year=${selectedYear}`);
      const queryString = params.length > 0 ? `?${params.join("&")}` : "";

      const [summaryRes, dailyRes, monthlyRes, categoryRes, itemRes, paymentRes] =
        await Promise.all([
          api.get(`/revenue/analytics/summary${queryString}`),
          api.get(`/revenue/analytics/daily${queryString}`),
          api.get(`/revenue/analytics/monthly${queryString}`),
          api.get(`/revenue/analytics/category${queryString}`),
          api.get(`/revenue/analytics/items${queryString}`),
          api.get(`/revenue/analytics/payments${queryString}`),
        ]);

      setSummary(summaryRes.data);
      setDailyData(dailyRes.data);
      setMonthlyData(monthlyRes.data);
      setCategoryData(categoryRes.data);
      setItemData(itemRes.data);
      setPaymentData(paymentRes.data);
      setChartKey((prev) => prev + 1);
    } catch (err) {
      console.error("Analytics error:", err);
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
    } else if (type === "thisMonth") {
      setFilter("thisMonth");
    } else if (type === "previousMonth") {
      setFilter("previousMonth");
    } else if (type === "year") {
      setFilter("year");
    }
  };

  const applyCustomDate = () => {
    setFilter("custom");
  };

  const changePctColor = (val) => {
    if (val > 0) return "text-green-600";
    if (val < 0) return "text-red-600";
    return "text-gray-600";
  };

  const changePctIcon = (val) => {
    if (val > 0) return TrendingUp;
    if (val < 0) return TrendingDown;
    return Clock;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Chart data
  const monthlyChartData = {
    labels: monthlyData.dailyBreakdown.map((d) => d._id),
    datasets: [
      {
        label: "Daily Revenue",
        data: monthlyData.dailyBreakdown.map((d) => d.total),
        backgroundColor: "rgba(99, 102, 241, 0.5)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const categoryChartData = {
    labels: categoryData.categories.map((c) => c.categoryName),
    datasets: [
      {
        label: "Revenue by Category",
        data: categoryData.categories.map((c) => c.revenue),
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const paymentChartData = {
    labels: paymentData.paymentMethods.map((p) => p.method === "upi" ? "UPI" : p.method.charAt(0).toUpperCase() + p.method.slice(1)),
    datasets: [
      {
        label: "Payment Methods",
        data: paymentData.paymentMethods.map((p) => p.amount),
        backgroundColor: [
          "rgba(16, 185, 129, 0.7)",
          "rgba(59, 130, 246, 0.7)",
          "rgba(245, 158, 11, 0.7)",
          "rgba(139, 92, 246, 0.7)",
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(139, 92, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const hourlyChartData = {
    labels: dailyData.hourlyBreakdown.map((h) => h.time),
    datasets: [
      {
        label: "Revenue",
        data: dailyData.hourlyBreakdown.map((h) => h.revenue),
        backgroundColor: "rgba(99, 102, 241, 0.5)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 11 } } },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => "₹" + val,
          font: { size: 10 },
        },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      x: {
        ticks: { font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Revenue Analytics
          </h1>
          <p className="text-gray-500 text-sm">Track sales, revenue, and performance</p>
        </div>
        <button
          onClick={() => navigate("/sales")}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          ← Back to Sales History
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Today's Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.todayRevenue)}</p>
            </div>
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{summary.todayOrders} orders today</p>
          <div className={`flex items-center gap-1 mt-2 ${changePctColor(summary.todayChangePercent)}`}>
            <span className="text-xs font-semibold">
              {summary.todayChangePercent >= 0 ? "+" : ""}{summary.todayChangePercent}%
            </span>
            <span className="text-[10px]">vs Yesterday</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Yesterday's Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.yesterdayRevenue)}</p>
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Previous day</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">This Month Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.thisMonthRevenue)}</p>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{summary.thisMonthOrders} orders</p>
          <div className={`flex items-center gap-1 mt-2 ${changePctColor(summary.monthChangePercent)}`}>
            <span className="text-xs font-semibold">
              {summary.monthChangePercent >= 0 ? "+" : ""}{summary.monthChangePercent}%
            </span>
            <span className="text-[10px]">vs Last Month</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Prev. Month Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.prevMonthRevenue)}</p>
            </div>
            <TrendingDown className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Last month</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">{summary.todayOrders}</p>
            </div>
            <LayoutList className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Orders placed today</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.avgOrderValue)}</p>
            </div>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Per order average</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">This Month Orders</p>
              <p className="text-2xl font-bold text-gray-900">{summary.thisMonthOrders}</p>
            </div>
            <Smartphone className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Orders this month</p>
        </div>
      </div>

      {/* Daily Revenue Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" /> Daily Revenue
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(dailyData.totalRevenue)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Total Orders</p>
                <p className="text-lg font-bold text-gray-900">{dailyData.totalOrders}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Items Sold</p>
                <p className="text-lg font-bold text-gray-900">{dailyData.totalItems}</p>
              </div>
            </div>
            <div className="h-[300px]">
              <Bar
                key={chartKey}
                data={hourlyChartData}
                options={chartOptions}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(dailyData.paymentBreakdown).map(([method, data]) => {
                  const pct = dailyData.totalRevenue > 0 ? ((data.amount / dailyData.totalRevenue) * 100).toFixed(1) : 0;
                  return (
                    <tr key={method} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          {method === "cash" && <CreditCard className="w-4 h-4 text-gray-400" />}
                          {method === "upi" && <Smartphone className="w-4 h-4 text-gray-400" />}
                          {method === "card" && <Laptop className="w-4 h-4 text-gray-400" />}
                          {method.charAt(0).toUpperCase() + method.slice(1) === "Upi" ? "UPI" : method.charAt(0).toUpperCase() + method.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{data.count}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(data.amount)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{pct}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center">{dailyData.totalOrders}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(dailyData.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" /> Monthly Revenue
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Month Revenue</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(monthlyData.currentMonthRevenue)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Avg Daily</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(monthlyData.avgDailyRevenue)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Highest Day</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(monthlyData.highestDay.revenue)}</p>
              </div>
            </div>
            <div className="h-[300px]">
              <Line
                key={chartKey}
                data={monthlyChartData}
                options={chartOptions}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyData.dailyBreakdown.map((d) => {
                  const isHighest = d._id === monthlyData.highestDay.date;
                  const isLowest = d._id === monthlyData.lowestDay.date;
                  return (
                    <tr key={d._id} className={`hover:bg-gray-50 ${isHighest ? "bg-green-50" : isLowest ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3">{formatDate(d._id)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(d.total)}</td>
                      <td className="px-4 py-3 text-center">{d.count}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            isHighest
                              ? "bg-green-100 text-green-700"
                              : isLowest
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isHighest ? "Peak" : isLowest ? "Low" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Revenue Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-600" /> Category Revenue
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="h-[300px]">
              <Pie
                key={chartKey}
                data={categoryChartData}
                options={chartOptions}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Items Sold</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categoryData.categories.map((c) => (
                  <tr key={c.categoryId || c.categoryName} className="hover:bg-gray-50 cursor-pointer group">
                    <td className="px-4 py-3 font-medium">{c.categoryName}</td>
                    <td className="px-4 py-3 text-center">{c.itemsSold}</td>
                    <td className="px-4 py-3 text-center">{c.orders}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{c.percent}%</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center">{categoryData.categories.reduce((s, c) => s + c.itemsSold, 0)}</td>
                  <td className="px-4 py-3 text-center">{categoryData.categories.reduce((s, c) => s + c.orders, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(categoryData.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Item Revenue Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <LayoutList className="w-5 h-5 text-indigo-600" /> Item Performance
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Qty Sold</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {itemData.items.map((item) => (
                  <tr key={item.itemName} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.itemName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.categoryName}</td>
                    <td className="px-4 py-3 text-center">{item.quantitySold}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-sm text-gray-600"></td>
                  <td className="px-4 py-3 text-center">{itemData.totalQuantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(itemData.totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Best Selling</p>
                <p className="text-lg font-bold text-gray-900">{itemData.bestSelling?.itemName || "—"}</p>
                <p className="text-xs text-gray-500">{itemData.bestSelling?.quantitySold || 0} sold</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Top Revenue</p>
                <p className="text-lg font-bold text-gray-900">{itemData.highestRevenue?.itemName || "—"}</p>
                <p className="text-xs text-gray-500">{formatCurrency(itemData.highestRevenue?.revenue || 0)}</p>
              </div>
            </div>
            <div className="h-[200px]">
              <Bar
                key={chartKey}
                data={{
                  labels: itemData.items.slice(0, 10).map((i) => i.itemName),
                  datasets: [
                    {
                      label: "Revenue",
                      data: itemData.items.slice(0, 10).map((i) => i.revenue),
                      backgroundColor: "rgba(99, 102, 241, 0.7)",
                      borderColor: "rgba(99, 102, 241, 1)",
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  ...chartOptions,
                  indexAxis: "y",
                  plugins: {
                    ...chartOptions.plugins,
                    legend: { display: false },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Analytics Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-600" /> Payment Methods
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="h-[300px]">
              <Pie
                key={chartKey}
                data={paymentChartData}
                options={chartOptions}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-center">Transactions</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paymentData.paymentMethods.map((p) => (
                  <tr key={p.method} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        {p.method === "cash" && <CreditCard className="w-4 h-4 text-gray-400" />}
                        {p.method === "upi" && <Smartphone className="w-4 h-4 text-gray-400" />}
                        {p.method === "card" && <Laptop className="w-4 h-4 text-gray-400" />}
                         {p.method.charAt(0).toUpperCase() + p.method.slice(1) === "Upi" ? "UPI" : p.method.charAt(0).toUpperCase() + p.method.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{p.count}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.percent}%</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center">
                    {paymentData.paymentMethods.reduce((s, p) => s + p.count, 0)}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(paymentData.totalAmount)}</td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
