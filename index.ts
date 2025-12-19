import dotenv from "dotenv";
dotenv.config();
import express from "express";
import routers from "./routes/index";
import { dbConnect } from "./configs/db.config";
import { errorHandler } from "./middleware/errorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";
import { seedNavMenu } from "./utils/navMenuSeed";

const app = express();
const PORT = process.env.PORT || 5000;

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

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Something went wrong:", error);
    process.exit(1); // Exit process on critical failure
  }
})();
