const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    ownerName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    businessType: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", businessSchema);
