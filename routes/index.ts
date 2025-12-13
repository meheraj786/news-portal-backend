import express from "express";
import apiRoutes from "./api";

const router = express.Router();

router.use(process.env.BASE_URL!, apiRoutes);

export default router;
