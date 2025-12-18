import express from "express";
import authRoutes from "./auth";
import categoryRoutes from "./category";
import subCategoryRoutes from "./subcategory";
import postRoutes from "./post";
import navMenuRoutes from "./navMenu";

const router = express.Router();

router.use("/admin", authRoutes);
router.use("/category", categoryRoutes);
router.use("/sub-category", subCategoryRoutes);
router.use("/post", postRoutes);
router.use("/nav-menu", navMenuRoutes);

export default router;
