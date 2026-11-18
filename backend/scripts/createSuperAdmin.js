const mongoose = require("mongoose");
const path = require("path");
const SuperAdmin = require("../models/SuperAdmin");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "urukundu779@gmail.com";
    const password = "admin@123";

    const existingAdmin = await SuperAdmin.findOne({ email });
    if (existingAdmin) {
      console.log("Super Admin already exists with this email.");
      process.exit(0);
    }

    const admin = await SuperAdmin.create({
      name: "Super Admin",
      email,
      password,
      status: "active",
    });

    console.log("Super Admin created successfully:");
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${password}`);
    console.log(`  ID: ${admin._id}`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating Super Admin:", error.message);
    process.exit(1);
  }
};

createSuperAdmin();
