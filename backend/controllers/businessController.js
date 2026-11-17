const Business = require("../models/Business");

exports.getBusinessProfile = async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }
    res.json({ business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBusinessProfile = async (req, res) => {
  try {
    const { businessName, ownerName, mobile, email, address, businessType } = req.body;

    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    if (businessName) business.businessName = businessName;
    if (ownerName) business.ownerName = ownerName;
    if (mobile) business.mobile = mobile;
    if (email) business.email = email;
    if (address) business.address = address;
    if (businessType) business.businessType = businessType;

    if (req.file) {
      business.logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    await business.save();

    res.json({ message: "Business profile updated successfully.", business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
