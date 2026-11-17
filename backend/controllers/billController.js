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
        price,
        quantity,
        total: itemTotal,
      });
      grandTotal += itemTotal;
      totalItems += quantity;
    }

    const billCount = await Bill.countDocuments({ businessId: req.user.businessId });
    const billNumber = `BILL-${String(billCount + 1).padStart(5, "0")}`;

    const bill = await Bill.create({
      businessId: req.user.businessId,
      billNumber,
      items: processedItems,
      totalItems,
      grandTotal,
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
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
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
