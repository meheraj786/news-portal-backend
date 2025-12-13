import mongoose from "mongoose";
import Admin from "../models/adminSchema";

require("dotenv").config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);

    const superAdminEmail = process.env.ADMIN_EMAIL;

    const exists = await Admin.findOne({ email: superAdminEmail });

    if (exists) {
      console.log("Super Admin already exists. No new user created.");
      process.exit(0);
    }

    await Admin.create({
      username: "Super Admin",
      email: superAdminEmail,
      password: "12345678",
    });

    console.log("✅ Super Admin Created Successfully!");
    process.exit(0); // normal exit
  } catch (error) {
    console.error("❌ Seeder Failed:", error);
    process.exit(1); // exit with failure
  }
};

seedSuperAdmin();
