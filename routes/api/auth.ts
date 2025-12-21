import express, { Router } from "express";
import {
  changePassword,
  getMe,
  login,
  logout,
  requestVerification,
  resetPassword,
  updateSocialLinks,
  verifyOTP,
} from "../../controllers/adminAuthController";
import { loginRateLimiter, otpRateLimiter } from "../../middleware/rateLimiter";
import { verifyAuthToken } from "../../middleware/authMiddleware";

const authRoutes: Router = express.Router();

authRoutes.post("/login", loginRateLimiter, login);
authRoutes.post("/request-verification", requestVerification);
authRoutes.post("/verify-otp", otpRateLimiter, verifyOTP);
authRoutes.post("/reset-password", resetPassword);

authRoutes.delete("/logout", verifyAuthToken, logout);

authRoutes.get("/me", verifyAuthToken, getMe);
authRoutes.put("/socials", verifyAuthToken, updateSocialLinks);
authRoutes.put("/change-password", verifyAuthToken, changePassword);

export default authRoutes;
