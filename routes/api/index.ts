import express from "express";
import authRoutes from "./auth";

const router = express.Router();

router.use("/admin", authRoutes);

export default router;
