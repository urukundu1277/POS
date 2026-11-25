const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: ["Rent", "Utilities", "Salary", "Inventory", "Marketing", "Transport", "Maintenance", "Other"], default: "Other" },
    date: { type: Date, required: true, index: true },
    paymentMethod: { type: String, enum: ["cash", "upi", "card", "other"], default: "cash" },
    notes: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

expenseSchema.index({ businessId: 1, date: -1 });
expenseSchema.index({ businessId: 1, category: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
