import dotenv from "dotenv";
dotenv.config();
import express from "express";
import routers from "./routes/index";
import { dbConnect } from "./configs/db.config";
import { errorHandler } from "./middleware/errorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // This allows us to see the Real IP if behind Nginx/Heroku/Vercel
    app.set("trust proxy", true);

    app.use(
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      })
    );

    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(routers);

    app.use(errorHandler);

    await dbConnect();

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Something went wrong:", error);
  }
})();
