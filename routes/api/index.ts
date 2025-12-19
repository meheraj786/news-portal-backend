import express from "express";
import authRoutes from "./auth";
import categoryRoutes from "./category";
import subCategoryRoutes from "./subcategory";
import postRoutes from "./post";
import navMenuRoutes from "./navMenu";
import tagRoutes from "./tag";
import adRoutes from "./ad";
import subscriptionRoutes from "./subscription";

const router = express.Router();

router.use("/admin", authRoutes);
router.use("/nav-menu", navMenuRoutes);
router.use("/category", categoryRoutes);
router.use("/sub-category", subCategoryRoutes);
router.use("/post", postRoutes);
router.use("/tag", tagRoutes);
router.use("/ad", adRoutes);
router.use("/subscription", subscriptionRoutes);

export default router;
