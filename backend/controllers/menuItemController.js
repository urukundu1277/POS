const MenuItem = require("../models/MenuItem");
const Category = require("../models/Category");

exports.createMenuItem = async (req, res) => {
  try {
    const { itemName, categoryId, description, price, status, portionUnit } = req.body;

    if (!itemName || !categoryId || price === undefined || price === null) {
      return res.status(400).json({ message: "Item name, category, and price are required." });
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
      price: Number(price),
      image,
      status: status || "active",
      portionUnit: portionUnit || "piece",
    });

    res.status(201).json({ message: "Menu item created successfully.", menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMenuItems = async (req, res) => {
  try {
    const { categoryId, status, search } = req.query;
    const filter = { businessId: req.user.businessId };
    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;
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
    const { itemName, categoryId, description, price, status, portionUnit } = req.body;

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
    if (price !== undefined && price !== null) menuItem.price = Number(price);
    if (status) menuItem.status = status;
    if (portionUnit !== undefined) menuItem.portionUnit = portionUnit;

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
