import dotenv from "dotenv";
dotenv.config();
import express, { Application } from "express";
import routers from "./routes/index";
import { dbConnect } from "./database/db.config";
import { errorHandler } from "./middleware/errorHandler";

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(routers);
app.use(errorHandler);

(async () => {
  try {
    await dbConnect();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Something went wrong:", error);
  }
})();
