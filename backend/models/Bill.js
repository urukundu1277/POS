const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categoryName: { type: String, default: "" },
    portionUnit: { type: String, default: "" },
    unit: { type: String, default: "piece" },
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
    businessName: { type: String, default: "" },
    businessAddress: { type: String, default: "" },
    businessMobile: { type: String, default: "" },
    businessLogo: { type: String, default: "" },
    items: [billItemSchema],
    totalItems: { type: Number, required: true },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "upi", "card", "other"], default: "cash" },
    status: { type: String, enum: ["paid", "cancelled", "refunded", "pending"], default: "paid" },
  },
  { timestamps: true }
);

billSchema.index({ businessId: 1, billNumber: 1 }, { unique: true });
billSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model("Bill", billSchema);
