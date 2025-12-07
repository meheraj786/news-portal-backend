const mongoose = require("mongoose");
const User = require("../models/user.model"); 
require("dotenv").config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(" DB Connected");

    const superAdminEmail = "superadmin@system.com";

    const exists = await User.findOne({ email: superAdminEmail });

    if (exists) {
      console.log("Super Admin already exists. No new user created.");
      process.exit(0);
    }

    await User.create({
      name: "Super Admin",
      email: superAdminEmail,
      password: "12345678", 
      roleName: "SUPER_ADMIN",   
      location: "Head Office",
      phone: "01000000000",
    });

    console.log("✅ Super Admin Created Successfully!");
    process.exit(1);
  } catch (error) {
    console.error("❌ Seeder Failed:", error);
    process.exit(1);
  }
};

seedSuperAdmin();
