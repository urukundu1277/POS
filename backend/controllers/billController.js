const Bill = require("../models/Bill");
const MenuItem = require("../models/MenuItem");
const Business = require("../models/Business");

exports.createBill = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty. Add items before generating a bill." });
    }

    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    const businessName = business.businessName || "";
    const businessAddress = business.address || "";
    const businessMobile = business.mobile || "";
    const businessLogo = business.logo || "";

    const processedItems = [];
    let grandTotal = 0;
    let totalItems = 0;

    for (const item of items) {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const itemTotal = price * quantity;

      let categoryId = item.categoryId || null;
      let categoryName = item.categoryName || "";

      if (!categoryId && item.itemId) {
        const menuItem = await MenuItem.findById(item.itemId);
        if (menuItem) {
          categoryId = menuItem.categoryId;
          categoryName = menuItem.categoryName || "";
        }
      }

      processedItems.push({
        itemName: item.itemName,
        categoryId,
        categoryName,
        portionUnit: item.portionUnit || "",
        unit: item.size || item.unit || item.portionUnit || "piece",
        price,
        quantity,
        total: itemTotal,
      });
      grandTotal += itemTotal;
      totalItems += quantity;
    }

    const billCount = await Bill.countDocuments({ businessId: req.user.businessId });
    const billNumber = `BILL-${String(billCount + 1).padStart(5, "0")}`;

    const subtotal = Number(req.body.subtotal) || grandTotal;
    const discount = Number(req.body.discount) || 0;
    const tax = Number(req.body.tax) || 0;
    const finalGrandTotal = Number(req.body.grandTotal) || grandTotal;
    const paymentMethod = req.body.paymentMethod || "cash";
    const status = req.body.status || "paid";

    const bill = await Bill.create({
      businessId: req.user.businessId,
      billNumber,
      items: processedItems,
      totalItems,
      subtotal,
      discount,
      tax,
      grandTotal: finalGrandTotal,
      paymentMethod,
      status,
      businessName: businessName,
      businessAddress: businessAddress,
      businessMobile: businessMobile,
      businessLogo: businessLogo,
    });

    res.status(201).json({
      message: "Bill generated successfully.",
      bill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBills = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { businessId: req.user.businessId };
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }
    const bills = await Bill.find(filter).sort({ createdAt: -1 });
    res.json({ bills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });
    if (!bill) {
      return res.status(404).json({ message: "Bill not found." });
    }
    res.json({ bill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
