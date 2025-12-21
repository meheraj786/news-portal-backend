import express from "express";
import { getDashboardStats } from "../../controllers/dashboardController";
import { verifyAuthToken } from "../../middleware/authMiddleware";

const dashboardRoutes = express.Router();

// Protected: Only Admin can see the dashboard stats
dashboardRoutes.get("/stats", verifyAuthToken, getDashboardStats);

export default dashboardRoutes;
