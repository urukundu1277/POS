const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categoryName: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    billNumber: { type: String, required: true },
    items: [billItemSchema],
    totalItems: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
  },
  { timestamps: true }
);

billSchema.index({ businessId: 1, billNumber: 1 }, { unique: true });
billSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model("Bill", billSchema);
