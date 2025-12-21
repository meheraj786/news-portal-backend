import rateLimit from "express-rate-limit";

// 1. LOGIN LIMITER (Strict)
// Prevents brute-force password guessing
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  skipSuccessfulRequests: true, // Only count failures
  message: {
    success: false,
    message: "Too many failed login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. OTP/EMAIL LIMITER (Strict)
// Prevents email bombing/spamming
export const otpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Allow only 3 OTP requests per hour per IP
  message: {
    success: false,
    message: "Too many verification requests. Please try again in an hour.",
  },
});

// 3. SEARCH LIMITER (Moderate)
// Prevents database exhaustion from search spam
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    message: "Too many search requests. Please slow down.",
  },
});

// 4. ADMIN LIMITER (Moderate)
// Extra layer of security for admin actions
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
  message: {
    success: false,
    message: "Too many admin operations. Please slow down.",
  },
});

// 5. GENERAL API LIMITER (Generous)
// Base protection for all other routes
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});
