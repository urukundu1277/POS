const Category = require("../models/Category");

exports.createCategory = async (req, res) => {
  try {
    const { categoryName, description, status } = req.body;

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
    res.json({ categories });
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
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryName, description, status } = req.body;

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
    res.json({ message: "Category deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
