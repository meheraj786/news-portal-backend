import express, { Router } from "express";
import { login, logout, requestVerification, resetPassword, verifyOTP } from "../../controllers/adminAuthController";
import { asyncHandler } from "../../utils/asyncHandler";
import { loginRateLimiter, otpRateLimiter } from "../../middleware/rateLimiter";
import { verifyAuthToken } from "../../middleware/authMddleware";

const authRoutes: Router = express.Router();

authRoutes.post("/login", loginRateLimiter, asyncHandler(login));
authRoutes.post("/request-verification", asyncHandler(requestVerification));
authRoutes.post("/verify-otp", otpRateLimiter, asyncHandler(verifyOTP));
authRoutes.post("/reset-password", asyncHandler(resetPassword));

authRoutes.delete("/logout", verifyAuthToken, logout);

export default authRoutes;
