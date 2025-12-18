import express, { Router } from "express";
import { login, logout, requestVerification, resetPassword, verifyOTP } from "../../controllers/adminAuthController";
import { loginRateLimiter, otpRateLimiter } from "../../middleware/rateLimiter";
import { verifyAuthToken } from "../../middleware/authMddleware";

const authRoutes: Router = express.Router();

authRoutes.post("/login", loginRateLimiter, login);
authRoutes.post("/request-verification", requestVerification);
authRoutes.post("/verify-otp", otpRateLimiter, verifyOTP);
authRoutes.post("/reset-password", resetPassword);

authRoutes.delete("/logout", verifyAuthToken, logout);

export default authRoutes;
