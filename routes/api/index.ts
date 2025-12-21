import express from "express";
import authRoutes from "./auth";
import categoryRoutes from "./category";
import postRoutes from "./post";
import navMenuRoutes from "./navMenu";
import tagRoutes from "./tag";
import adRoutes from "./ad";
import subscriptionRoutes from "./subscription";
import dashboardRoutes from "./dashboard";

const router = express.Router();

router.use("/admin", authRoutes);
router.use("/nav-menu", navMenuRoutes);
router.use("/category", categoryRoutes);
router.use("/post", postRoutes);
router.use("/tag", tagRoutes);
router.use("/ad", adRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/dashboard", dashboardRoutes);
export default router;
