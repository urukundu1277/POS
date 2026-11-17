const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    categoryName: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

categorySchema.index({ businessId: 1, categoryName: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
