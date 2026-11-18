const mongoose = require("mongoose");
const Bill = require("../models/Bill");
const MenuItem = require("../models/MenuItem");
const Category = require("../models/Category");

const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// Helper to construct a UTC date from YYYY-MM-DD string (avoids local timezone issues)
const utcDate = (dateStr, hours = 0, minutes = 0, seconds = 0, ms = 0) => {
  const parts = dateStr.split("-").map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], hours, minutes, seconds, ms));
};

const getDateRange = (filter, startDate, endDate) => {
  const now = new Date();
  const todayStart = utcDate(formatDate(now), 0, 0, 0);
  const todayEnd = utcDate(formatDate(now), 23, 59, 59, 999);

  if (filter === "today") {
    return { start: formatDate(todayStart), end: formatDate(todayEnd) };
  } else if (filter === "yesterday") {
    const yStart = new Date(todayStart);
    yStart.setUTCDate(yStart.getUTCDate() - 1);
    const yEnd = new Date(todayEnd);
    yEnd.setUTCDate(yEnd.getUTCDate() - 1);
    return { start: formatDate(yStart), end: formatDate(yEnd) };
  } else if (filter === "week") {
    const s = new Date(todayStart);
    s.setUTCDate(s.getUTCDate() - 7);
    return { start: formatDate(s), end: formatDate(todayEnd) };
  } else if (filter === "month") {
    const s = new Date(todayStart);
    s.setUTCDate(s.getUTCDate() - 30);
    return { start: formatDate(s), end: formatDate(todayEnd) };
  } else if (filter === "thisMonth") {
    const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return { start: formatDate(s), end: formatDate(todayEnd) };
  } else if (filter === "previousMonth") {
    const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const e = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    return { start: formatDate(s), end: formatDate(e) };
  } else if (filter === "year") {
    const s = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    return { start: formatDate(s), end: formatDate(todayEnd) };
  } else if (filter === "custom" && startDate && endDate) {
    return { start: startDate, end: endDate };
  }
  return { start: formatDate(todayStart), end: formatDate(todayEnd) };
};
// Helper to convert string businessId from JWT to ObjectId for MongoDB queries
const getBusinessId = (req) => {
  const bid = req.user?.businessId;
  if (!bid) return null;
  if (mongoose.Types.ObjectId.isValid(bid)) {
    return new mongoose.Types.ObjectId(bid);
  }
  return bid;
};

exports.getAnalyticsSummary = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate);
    const businessId = getBusinessId(req);
    console.log('DEBUG getAnalyticsSummary:', { filter, startDate, endDate, start, end, businessId: businessId?.toString(), userId: req.user?.id, userBusinessId: req.user?.businessId });

    const startDateObj = new Date(start);
    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = new Date(end);
    endDateObj.setHours(23, 59, 59, 999);

    const filterMatch = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: startDateObj, $lte: endDateObj },
    };

    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayMatch = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: today, $lte: todayEnd },
    };

    // Yesterday's revenue
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);
    const yesterdayMatch = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
    };

    // This month
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthMatch = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: thisMonthStart, $lte: todayEnd },
    };

    // Previous month
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const prevMonthMatch = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
    };

    const [
      todayResult,
      yesterdayResult,
      thisMonthResult,
      prevMonthResult,
    ] = await Promise.all([
      Bill.aggregate([
        { $match: todayMatch },
        { $group: { _id: null, total: { $sum: "$grandTotal" }, count: { $sum: 1 } } },
      ]),
      Bill.aggregate([
        { $match: yesterdayMatch },
        { $group: { _id: null, total: { $sum: "$grandTotal" }, count: { $sum: 1 } } },
      ]),
      Bill.aggregate([
        { $match: thisMonthMatch },
        { $group: { _id: null, total: { $sum: "$grandTotal" }, count: { $sum: 1 } } },
      ]),
      Bill.aggregate([
        { $match: prevMonthMatch },
        { $group: { _id: null, total: { $sum: "$grandTotal" }, count: { $sum: 1 } } },
      ]),
    ]);

    const todayTotal = todayResult[0]?.total || 0;
    const todayCount = todayResult[0]?.count || 0;
    const yesterdayTotal = yesterdayResult[0]?.total || 0;
    const thisMonthTotal = thisMonthResult[0]?.total || 0;
    const thisMonthCount = thisMonthResult[0]?.count || 0;
    const prevMonthTotal = prevMonthResult[0]?.total || 0;

    const todayChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
    const monthChange = prevMonthTotal > 0 ? ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;

    res.json({
      todayRevenue: todayTotal,
      todayOrders: todayCount,
      yesterdayRevenue: yesterdayTotal,
      thisMonthRevenue: thisMonthTotal,
      thisMonthOrders: thisMonthCount,
      prevMonthRevenue: prevMonthTotal,
      todayChangePercent: Math.round(todayChange * 100) / 100,
      monthChangePercent: Math.round(monthChange * 100) / 100,
      avgOrderValue: todayCount > 0 ? Math.round((todayTotal / todayCount) * 100) / 100 : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDailyRevenue = async (req, res) => {
  try {
    const { date } = req.query;
    const businessId = getBusinessId(req);

    const selectedDate = date || new Date().toISOString().split("T")[0];
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    const match = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: startDate, $lte: endDate },
    };

    const bills = await Bill.find(match).sort({ createdAt: 1 });

    const totalRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalOrders = bills.length;
    const totalItems = bills.reduce((sum, b) => sum + b.totalItems, 0);

    // Payment method breakdown
    const paymentBreakdown = bills.reduce(
      (acc, b) => {
        if (!acc[b.paymentMethod]) acc[b.paymentMethod] = { count: 0, amount: 0 };
        acc[b.paymentMethod].count += 1;
        acc[b.paymentMethod].amount += b.grandTotal;
        return acc;
      },
      {}
    );

    // Hourly breakdown
    const hourlyData = {};
    for (let h = 0; h < 24; h++) {
      hourlyData[h] = { orders: 0, revenue: 0 };
    }
    bills.forEach((b) => {
      const hour = new Date(b.createdAt).getHours();
      hourlyData[hour].orders += 1;
      hourlyData[hour].revenue += b.grandTotal;
    });

    const hourlyBreakdown = Object.entries(hourlyData).map(([hour, data]) => ({
      time: `${hour}:00 - ${parseInt(hour) + 1}:00`,
      orders: data.orders,
      revenue: data.revenue,
    }));

    res.json({
      date: selectedDate,
      totalRevenue,
      totalOrders,
      totalItems,
      paymentBreakdown,
      hourlyBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMonthlyRevenue = async (req, res) => {
  try {
    const { month, year } = req.query;
    const businessId = getBusinessId(req);

    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth();
    const y = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(y, m, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(y, m + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // Previous month
    const prevMonthStart = new Date(y, m - 1, 1);
    prevMonthStart.setHours(0, 0, 0, 0);
    const prevMonthEnd = new Date(y, m, 0);
    prevMonthEnd.setHours(23, 59, 59, 999);

    const match = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: startDate, $lte: endDate },
    };
    const prevMatch = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
    };

    const [currentResult, prevResult] = await Promise.all([
      Bill.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$grandTotal" }, count: { $sum: 1 }, items: { $sum: "$totalItems" } } },
      ]),
      Bill.aggregate([
        { $match: prevMatch },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
    ]);

    const currentTotal = currentResult[0]?.total || 0;
    const currentOrders = currentResult[0]?.count || 0;
    const currentItems = currentResult[0]?.items || 0;
    const prevTotal = prevResult[0]?.total || 0;

    // Daily breakdown for the month
    const dailyBreakdown = await Bill.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$grandTotal" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Find highest and lowest revenue days
    let highestDay = { date: "", revenue: 0 };
    let lowestDay = { date: "", revenue: Infinity };
    dailyBreakdown.forEach((d) => {
      if (d.total > highestDay.revenue) highestDay = { date: d._id, revenue: d.total };
      if (d.total < lowestDay.revenue) lowestDay = { date: d._id, revenue: d.total };
    });
    if (lowestDay.revenue === Infinity) lowestDay.revenue = 0;

    const avgDailyRevenue = dailyBreakdown.length > 0 ? currentTotal / dailyBreakdown.length : 0;

    res.json({
      month: m,
      year: y,
      currentMonthRevenue: currentTotal,
      prevMonthRevenue: prevTotal,
      totalOrders: currentOrders,
      totalItems: currentItems,
      avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
      highestDay,
      lowestDay,
      dailyBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryRevenue = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate);
    const businessId = getBusinessId(req);

    const startDateObj = new Date(start);
    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = new Date(end);
    endDateObj.setHours(23, 59, 59, 999);

    const match = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: startDateObj, $lte: endDateObj },
    };

    // Get category-wise revenue by unwinding items
    const categoryRevenue = await Bill.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.categoryId",
          categoryName: { $first: "$items.categoryName" },
          revenue: { $sum: "$items.total" },
          quantity: { $sum: "$items.quantity" },
          orders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 1,
          categoryName: 1,
          revenue: 1,
          quantity: 1,
          orders: { $size: "$orders" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const totalRevenue = categoryRevenue.reduce((sum, c) => sum + c.revenue, 0);

    const result = categoryRevenue.map((c) => ({
      categoryId: c._id,
      categoryName: c.categoryName || "Uncategorized",
      itemsSold: c.quantity,
      orders: c.orders,
      revenue: c.revenue,
      percent: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100 * 100) / 100 : 0,
    }));

    res.json({
      totalRevenue,
      categories: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getItemRevenue = async (req, res) => {
  try {
    const { filter, startDate, endDate, categoryId, sortBy } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate);
    const businessId = getBusinessId(req);

    const startDateObj = new Date(start);
    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = new Date(end);
    endDateObj.setHours(23, 59, 59, 999);

    const match = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: startDateObj, $lte: endDateObj },
    };

    if (categoryId) {
      match["items.categoryId"] = categoryId;
    }

    const itemRevenue = await Bill.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.categoryId",
          itemName: { $first: "$items.itemName" },
          categoryName: { $first: "$items.categoryName" },
          revenue: { $sum: "$items.total" },
          quantity: { $sum: "$items.quantity" },
        },
      },
    ]);

    const sortField = sortBy === "quantity" ? "quantity" : "revenue";
    itemRevenue.sort((a, b) => b[sortField] - a[sortField]);

    const totalRevenue = itemRevenue.reduce((sum, i) => sum + i.revenue, 0);
    const totalQuantity = itemRevenue.reduce((sum, i) => sum + i.quantity, 0);

    const result = itemRevenue.map((i) => ({
      itemName: i.itemName || "Unknown Item",
      categoryName: i.categoryName || "Uncategorized",
      quantitySold: i.quantity,
      revenue: i.revenue,
    }));

    res.json({
      totalRevenue,
      totalQuantity,
      items: result,
      bestSelling: result[0] || null,
      highestRevenue: result[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentAnalytics = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate);
    const businessId = getBusinessId(req);

    const startDateObj = new Date(start);
    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = new Date(end);
    endDateObj.setHours(23, 59, 59, 999);

    const match = {
      businessId,
      status: { $ne: "cancelled" },
      createdAt: { $gte: startDateObj, $lte: endDateObj },
    };

    const paymentAnalytics = await Bill.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $toLower: { $ifNull: ["$paymentMethod", "cash"] } },
          amount: { $sum: "$grandTotal" },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const totalAmount = paymentAnalytics.reduce((sum, p) => sum + p.amount, 0);

    const result = paymentAnalytics.map((p) => ({
      method: p._id || "cash",
      amount: p.amount,
      count: p.count,
      percent: totalAmount > 0 ? Math.round((p.amount / totalAmount) * 100 * 100) / 100 : 0,
    }));

    res.json({
      totalAmount,
      paymentMethods: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
