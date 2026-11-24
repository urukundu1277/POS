const Category = require("../models/Category");
const MenuItem = require("../models/MenuItem");

exports.createCategory = async (req, res) => {
  try {
    const { categoryName, description, status, itemIds } = req.body;

    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required." });
    }

    const existing = await Category.findOne({
      businessId: req.user.businessId,
      categoryName,
    });
    if (existing) {
      return res.status(400).json({ message: "Category already exists." });
    }

    let image = "";
    if (req.file) {
      image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    const category = await Category.create({
      businessId: req.user.businessId,
      categoryName,
      description: description || "",
      image,
      status: status || "active",
    });

    // Assign items to category
    if (itemIds) {
      const itemIdsArray = typeof itemIds === "string" ? JSON.parse(itemIds) : itemIds;
      await MenuItem.updateMany(
        { _id: { $in: itemIdsArray }, businessId: req.user.businessId },
        { categoryId: category._id }
      );
    }

    res.status(201).json({ message: "Category created successfully.", category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category already exists." });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { businessId: req.user.businessId };
    if (status) filter.status = status;
    const categories = await Category.find(filter).sort({ createdAt: -1 });

    // Add item count to each category
    const categoriesWithItems = await Promise.all(categories.map(async (cat) => {
      const itemCount = await MenuItem.countDocuments({ categoryId: cat._id, businessId: req.user.businessId });
      return {
        ...cat.toObject(),
        itemCount,
        itemIds: cat.itemIds || [],
      };
    }));

    res.json({ categories: categoriesWithItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }
    const itemCount = await MenuItem.countDocuments({ categoryId: category._id, businessId: req.user.businessId });
    res.json({ category: { ...category.toObject(), itemCount } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryName, description, status, itemIds } = req.body;

    const category = await Category.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    if (categoryName) category.categoryName = categoryName;
    if (description !== undefined) category.description = description;
    if (status) category.status = status;

    if (req.file) {
      category.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    await category.save();

    // Update item assignments
    if (itemIds !== undefined) {
      const itemIdsArray = typeof itemIds === "string" ? JSON.parse(itemIds) : itemIds;
      // First, remove this category from all items that were previously assigned
      await MenuItem.updateMany(
        { categoryId: category._id, businessId: req.user.businessId },
        { categoryId: null }
      );
      // Then assign new items to this category
      if (itemIdsArray && itemIdsArray.length > 0) {
        await MenuItem.updateMany(
          { _id: { $in: itemIdsArray }, businessId: req.user.businessId },
          { categoryId: category._id }
        );
      }
    }

    res.json({ message: "Category updated successfully.", category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category name already exists." });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      businessId: req.user.businessId,
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Remove category association from items
    await MenuItem.updateMany(
      { categoryId: category._id, businessId: req.user.businessId },
      { categoryId: null }
    );

    res.json({ message: "Category deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
