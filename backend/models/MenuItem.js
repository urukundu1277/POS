const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    fullPrice: { type: Number, min: 0, default: 0 },
    image: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    portionUnit: { type: String, enum: ["piece", "kg", "liter", "gram", "ml", "dozen"], default: "piece", required: true },
  },
  { timestamps: true }
);

menuItemSchema.index({ businessId: 1, categoryId: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);
