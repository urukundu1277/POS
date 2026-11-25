const Expense = require("../models/Expense");

exports.createExpense = async (req, res) => {
  try {
    const { description, amount, category, date, paymentMethod, notes } = req.body;

    if (!description) {
      return res.status(400).json({ message: "Description is required." });
    }
    if (amount == null || amount < 0) {
      return res.status(400).json({ message: "Valid amount is required." });
    }
    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const expense = await Expense.create({
      businessId: req.user.businessId,
      description: description.trim(),
      amount: Number(amount),
      category: category || "Other",
      date: new Date(date),
      paymentMethod: paymentMethod || "cash",
      notes: (notes || "").trim(),
      status: "active",
    });

    res.status(201).json({ message: "Expense added successfully.", expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, search, status } = req.query;
    const filter = { businessId: req.user.businessId, status: status || "active" };
    if (startDate) filter.date = { ...filter.date, $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }
    res.json({ expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { description, amount, category, date, paymentMethod, notes } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    if (description !== undefined) expense.description = description.trim();
    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = new Date(date);
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (notes !== undefined) expense.notes = notes.trim();

    await expense.save();
    res.json({ message: "Expense updated successfully.", expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId, status: "active" },
      { status: "deleted" },
      { new: true }
    );
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }
    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { businessId: req.user.businessId, status: "active" };
    if (startDate) filter.date = { ...filter.date, $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

    const expenses = await Expense.find(filter);

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;

    const categoryBreakdown = {};
    expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    const methodBreakdown = {};
    expenses.forEach((e) => {
      methodBreakdown[e.paymentMethod] = (methodBreakdown[e.paymentMethod] || 0) + e.amount;
    });

    res.json({
      total,
      count,
      categoryBreakdown,
      methodBreakdown,
      expenses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
