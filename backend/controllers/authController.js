const User = require("../models/User");
const Business = require("../models/Business");
const jwt = require("jsonwebtoken");

const generateToken = (id, businessId) => {
  return jwt.sign({ id, businessId }, process.env.JWT_SECRET, { expiresIn: "7d" });
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

    const token = generateToken(user._id, business._id);

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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user._id, user.businessId);

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
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
