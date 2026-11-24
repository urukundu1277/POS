const MenuItem = require("../models/MenuItem");
const Category = require("../models/Category");

exports.createMenuItem = async (req, res) => {
  try {
    const { itemName, categoryId, description, price, fullPrice, status, portionUnit, itemType, sizes } = req.body;

    if (!itemName || !categoryId) {
      return res.status(400).json({ message: "Item name and category are required." });
    }

    let parsedSizes = [];
    if (sizes) {
      try {
        parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      } catch (e) {
        return res.status(400).json({ message: "Invalid sizes format." });
      }
      if (!parsedSizes || parsedSizes.length === 0) {
        return res.status(400).json({ message: "At least one size with price is required." });
      }
      for (const s of parsedSizes) {
        if (!s.size || s.price === undefined || s.price === null || s.price < 0) {
          return res.status(400).json({ message: "Each size must have a name and valid price." });
        }
      }
    } else if (itemType !== "beverage") {
      if (price === undefined || price === null || price < 0) {
        return res.status(400).json({ message: "Item price is required." });
      }
    }

    const category = await Category.findOne({
      _id: categoryId,
      businessId: req.user.businessId,
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    let image = "";
    if (req.file) {
      image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const menuItem = await MenuItem.create({
      businessId: req.user.businessId,
      categoryId,
      itemName,
      description: description || "",
      itemType: itemType || "fast_food",
      price: itemType === "fast_food" && !parsedSizes.length ? Number(price) : undefined,
      fullPrice: itemType === "fast_food" && !parsedSizes.length ? (Number(fullPrice) || 0) : undefined,
      portionUnit: itemType === "fast_food" && !parsedSizes.length ? (portionUnit || "piece") : undefined,
      sizes: parsedSizes.length ? parsedSizes : [],
      image,
      status: status || "active",
    });

    res.status(201).json({ message: "Menu item created successfully.", menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMenuItems = async (req, res) => {
  try {
    const { categoryId, status, search, itemType } = req.query;
    const filter = { businessId: req.user.businessId };
    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;
    if (itemType) filter.itemType = itemType;
    if (search) {
      filter.itemName = { $regex: search, $options: "i" };
    }
    const menuItems = await MenuItem.find(filter)
      .populate("categoryId", "categoryName")
      .sort({ createdAt: -1 });
    res.json({ menuItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    }).populate("categoryId", "categoryName");
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found." });
    }
    res.json({ menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { itemName, categoryId, description, price, fullPrice, status, portionUnit, itemType, sizes } = req.body;

    const menuItem = await MenuItem.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        businessId: req.user.businessId,
      });
      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }
      menuItem.categoryId = categoryId;
    }

    if (itemName) menuItem.itemName = itemName;
    if (description !== undefined) menuItem.description = description;
    if (itemType) menuItem.itemType = itemType;

    let parsedSizes = menuItem.sizes;
    if (sizes) {
      try {
        parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      } catch (e) {
        return res.status(400).json({ message: "Invalid sizes format." });
      }
      if (!parsedSizes || parsedSizes.length === 0) {
        return res.status(400).json({ message: "At least one size with price is required." });
      }
      for (const s of parsedSizes) {
        if (!s.size || s.price === undefined || s.price === null || s.price < 0) {
          return res.status(400).json({ message: "Each size must have a name and valid price." });
        }
      }
    } else if (menuItem.itemType !== "beverage") {
      if (price !== undefined && price !== null) menuItem.price = Number(price);
      if (fullPrice !== undefined && fullPrice !== null) menuItem.fullPrice = Number(fullPrice);
      if (portionUnit !== undefined) menuItem.portionUnit = portionUnit;
      parsedSizes = [];
    }

    menuItem.price = parsedSizes.length ? undefined : menuItem.price;
    menuItem.fullPrice = parsedSizes.length ? undefined : menuItem.fullPrice;
    menuItem.portionUnit = parsedSizes.length ? undefined : menuItem.portionUnit;
    menuItem.sizes = parsedSizes;

    if (status) menuItem.status = status;

    if (req.file) {
      menuItem.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    await menuItem.save();
    await menuItem.populate("categoryId", "categoryName");

    res.json({ message: "Menu item updated successfully.", menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      businessId: req.user.businessId,
    });
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found." });
    }
    res.json({ message: "Menu item deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
