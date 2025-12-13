// middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

// For login attempts - prevent password guessing
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 5,
  skipSuccessfulRequests: true, //only counts failed logins
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true, // send rate limit info in headers
  legacyHeaders: false,
});

// For OTP requests - prevent email bombing
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  skipSuccessfulRequests: true, //only counts failed attempts
  message: {
    success: false,
    message: "Too many OTP requests. Please try again in 15 minutes.",
  },
});

// For cart operations - prevent cart spam
const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Max 20 cart operations per minute
  message: {
    success: false,
    message: "Too many cart operations. Please slow down.",
  },
});

// For order creation - prevent fake orders
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 orders per hour
  message: {
    success: false,
    message: "Too many orders. Please contact support if you need help.",
  },
});

// ============================================
// 4. SEARCH/BROWSE LIMITERS
// ============================================

// For product search - prevent DB overload
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    message: "Too many search requests. Please wait a moment.",
  },
});

// General API access - base protection
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute (generous)
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

// ============================================
// 5. ADMIN LIMITERS
// ============================================

// For admin operations - prevent abuse
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 admin operations per minute
  message: {
    success: false,
    message: "Too many admin operations. Please slow down.",
  },
});
