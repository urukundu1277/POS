const User = require("../models/User");
const Business = require("../models/Business");
const Session = require("../models/Session");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateToken = (id, businessId, sessionId) => {
  return jwt.sign({ id, businessId, sessionId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, businessName, ownerName, mobile, address, businessType } = req.body;

    if (!name || !email || !password || !businessName || !ownerName || !mobile || !address || !businessType) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const existingBusiness = await Business.findOne({ email });
    if (existingBusiness) {
      return res.status(400).json({ message: "Business already exists with this email." });
    }

    const business = await Business.create({
      businessName,
      ownerName,
      mobile,
      email,
      address,
      businessType,
    });

    const user = await User.create({
      name,
      email,
      password,
      businessId: business._id,
    });

    const session = await Session.create({
      userId: user._id,
      deviceId: crypto.randomUUID(),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    const token = generateToken(user._id, business._id, session._id);

    res.status(201).json({
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
      },
      business,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "Your account is inactive. Please contact the administrator." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const business = await Business.findById(user.businessId);
    if (!business) {
      return res.status(404).json({ message: "Business profile not found." });
    }

    if (business.status !== "active") {
      return res.status(403).json({ message: "Your business account is inactive. Please contact the administrator." });
    }

    const session = await Session.create({
      userId: user._id,
      deviceId: crypto.randomUUID(),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    const token = generateToken(user._id, user.businessId, session._id);

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
        status: user.status,
      },
      business: {
        id: business._id,
        businessName: business.businessName,
        status: business.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found." });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });
    user.password = newPassword;
    await user.save();
    await Session.deleteMany({ userId: user._id });
    res.json({ message: "Password changed successfully. Please log in again." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sessionCount = async (req, res) => {
  try {
    const count = await Session.countDocuments({ userId: req.user.id });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user?.sessionId) {
      await Session.deleteOne({ _id: req.user.sessionId });
    }
    res.json({ message: "Logged out successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
