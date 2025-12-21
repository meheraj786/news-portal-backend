import mongoose from "mongoose";

export const dbConnect = async (): Promise<void> => {
  const mongoUri = process.env.DB_URL;

  if (!mongoUri) {
    console.error("FATAL ERROR: DB_URL is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10, // Prevent overwhelming the DB (10 parallel connections max)
      minPoolSize: 2, // Keep 2 connections ready for instant response
      socketTimeoutMS: 45000, // Kill "zombie" connections after 45s of silence
    });

    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};
