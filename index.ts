// 1. Load dotenv FIRST
import dotenv from "dotenv";
dotenv.config();

// 2. Validate Env SECOND (Before importing app or db)
import { validateEnv } from "./utils/validateEnv";
validateEnv();

// 3. Now import the rest
import express from "express";
import routers from "./routes/index";
import { dbConnect } from "./configs/db.config";
import { errorHandler } from "./middleware/errorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || "api/v1";

(async () => {
  try {
    // Crucial for Render: Allows Express to trust the HTTPS proxy
    app.set("trust proxy", 1);

    app.use(
      cors({
        // Dynamic origin: Uses your ENV variable in production, falls back to localhost for dev
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
      })
    );

    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(routers);

    app.use(errorHandler);

    // Connect to DB before listening
    await dbConnect();

    app.listen(PORT, () => console.log(`✅ Server running - http://localhost:${PORT}${BASE_URL}`));
  } catch (error) {
    console.error("Something went wrong:", error);
    process.exit(1); // Exit process on critical failure
  }
})();
