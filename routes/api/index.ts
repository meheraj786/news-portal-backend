import express from "express";
import authRoutes from "./auth";
import categoryRoutes from "./category";
import subCategoryRoutes from "./subcategory";

const router = express.Router();

router.use("/admin", authRoutes);
router.use("/category", categoryRoutes);
router.use("/sub-category", subCategoryRoutes);

export default router;
