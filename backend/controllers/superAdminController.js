const SuperAdmin = require("../models/SuperAdmin");
const Business = require("../models/Business");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateSuperAdminToken = (id) => {
  return jwt.sign({ id, role: "super_admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

exports.registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingAdmin = await SuperAdmin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Super Admin already exists with this email." });
    }

    const admin = await SuperAdmin.create({ name, email, password });

    const token = generateSuperAdminToken(admin._id);

    res.status(201).json({
      message: "Super Admin registered successfully.",
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const admin = await SuperAdmin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (admin.status !== "active") {
      return res.status(403).json({ message: "Super Admin account is inactive. Please contact support." });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateSuperAdminToken(admin._id);

    res.json({
      message: "Super Admin login successful.",
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSuperAdminProfile = async (req, res) => {
  try {
    const admin = await SuperAdmin.findById(req.user.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Super Admin not found." });
    }
    res.json({ admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBusiness = async (req, res) => {
  try {
    const {
      businessName,
      address,
      mobile,
      email,
      businessType,
      ownerName,
      gstNumber,
      loginEmail,
      loginPassword,
      loginName,
      status,
    } = req.body;

    if (!businessName || !address || !mobile || !email || !businessType || !ownerName || !loginEmail || !loginPassword || !loginName) {
      return res.status(400).json({ message: "All business and login account fields are required." });
    }

    const existingBusiness = await Business.findOne({ email });
    if (existingBusiness) {
      return res.status(400).json({ message: "Business already exists with this email." });
    }

    const existingUser = await User.findOne({ email: loginEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Login account already exists with this email." });
    }

    const business = await Business.create({
      businessName,
      address,
      mobile,
      email,
      businessType,
      ownerName,
      gstNumber: gstNumber || "",
      status: status || "active",
    });

    const user = await User.create({
      name: loginName,
      email: loginEmail,
      password: loginPassword,
      businessId: business._id,
      status: status || "active",
    });

    res.status(201).json({
      message: "Business and login account created successfully.",
      business: {
        id: business._id,
        businessName: business.businessName,
        email: business.email,
        status: business.status,
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find().sort({ createdAt: -1 });
    
    // Get all users grouped by businessId to show login account info
    const users = await User.find().select("-password");
    const usersByBusiness = {};
    users.forEach((u) => {
      const bid = u.businessId.toString();
      if (!usersByBusiness[bid]) usersByBusiness[bid] = [];
      usersByBusiness[bid].push(u);
    });

    const businessesWithUsers = businesses.map((b) => ({
      ...b.toObject(),
      users: usersByBusiness[b._id.toString()] || [],
    }));

    const totalBusinesses = businesses.length;
    const activeBusinesses = businesses.filter((b) => b.status === "active").length;
    const inactiveBusinesses = businesses.filter((b) => b.status === "inactive").length;

    const totalUsers = await User.countDocuments();

    res.json({
      businesses: businessesWithUsers,
      stats: {
        totalBusinesses,
        activeBusinesses,
        inactiveBusinesses,
        totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    const users = await User.find({ businessId: business._id }).select("-password");

    res.json({ business, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const { businessName, ownerName, mobile, email, address, businessType, gstNumber } = req.body;

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    if (businessName) business.businessName = businessName;
    if (ownerName) business.ownerName = ownerName;
    if (mobile) business.mobile = mobile;
    if (email) business.email = email;
    if (address) business.address = address;
    if (businessType) business.businessType = businessType;
    if (gstNumber !== undefined) business.gstNumber = gstNumber;

    await business.save();

    res.json({ message: "Business updated successfully.", business });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleBusinessStatus = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    business.status = business.status === "active" ? "inactive" : "active";
    await business.save();

    // Deactivate all users when business is deactivated, reactivate when business is activated
    if (business.status === "inactive") {
      await User.updateMany({ businessId: business._id }, { status: "inactive" });
    } else {
      await User.updateMany({ businessId: business._id }, { status: "active" });
    }

    res.json({
      message: `Business ${business.status} successfully.`,
      business,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    // Delete all users of this business
    await User.deleteMany({ businessId: business._id });
    // Delete business
    await Business.findByIdAndDelete(req.params.id);

    res.json({ message: "Business and all associated users deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.password = newPassword;
    user.status = "active";
    await user.save();

    res.json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSuperAdminStats = async (req, res) => {
  try {
    const totalBusinesses = await Business.countDocuments();
    const activeBusinesses = await Business.countDocuments({ 
      $or: [{ status: "active" }, { status: { $exists: false } }] 
    });
    const inactiveBusinesses = await Business.countDocuments({ status: "inactive" });
    const totalUsers = await User.countDocuments();

    res.json({
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses,
      totalUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
