"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuthController_1 = require("../../controllers/adminAuthController");
const asyncHandler_1 = require("../../utils/asyncHandler");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const authRoutes = express_1.default.Router();
authRoutes.post("/login", rateLimiter_1.loginRateLimiter, (0, asyncHandler_1.asyncHandler)(adminAuthController_1.login));
authRoutes.post("/request-verification", (0, asyncHandler_1.asyncHandler)(adminAuthController_1.requestVerification));
authRoutes.post("/verify-otp", rateLimiter_1.otpRateLimiter, (0, asyncHandler_1.asyncHandler)(adminAuthController_1.verifyOTP));
authRoutes.post("/reset-password", (0, asyncHandler_1.asyncHandler)(adminAuthController_1.resetPassword));
authRoutes.delete("/logout", adminAuthController_1.logout);
exports.default = authRoutes;
