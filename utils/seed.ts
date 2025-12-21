import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/adminSchema";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) {
      console.error("❌ Error: DB_URL is missing in .env file");
      process.exit(1);
    }

    await mongoose.connect(dbUrl);
    console.log("Database connected for seeding...");

    const superAdminEmail = process.env.ADMIN_EMAIL;
    if (!superAdminEmail) {
      console.error("❌ Error: ADMIN_EMAIL is missing in .env file");
      process.exit(1);
    }

    const exists = await Admin.findOne({ email: superAdminEmail });

    if (exists) {
      console.log("⚠️ Super Admin already exists. No action taken.");
      process.exit(0);
    }

    // Create Admin
    // (Password hashing is handled automatically by your Admin Model pre-save hook)
    await Admin.create({
      username: "Super Admin",
      email: superAdminEmail,
      password: "12345678", // You must change this after first login!
    });

    console.log("✅ Super Admin Created Successfully!");
    console.log(`📧 Email: ${superAdminEmail}`);
    console.log(`🔑 Temporary Password: 12345678`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeder Failed:", error);
    process.exit(1);
  }
};

seedSuperAdmin();
