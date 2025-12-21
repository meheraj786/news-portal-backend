import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong.";

  // LOGGING: Only show full error details in development
  if (statusCode === 500 && process.env.NODE_ENV === "development") {
    console.error("🔥 [Server Error]: ", err);
  }

  // =========================================================
  // 1. MONGOOSE / DATABASE ERRORS
  // =========================================================

  // Invalid ID (e.g., /posts/123 instead of ObjectId)
  if (err.name === "CastError") {
    statusCode = 404;
    message = `Resource not found. Invalid ID: ${err.value}`;
  }

  // Duplicate Key (e.g., Registering with existing email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    statusCode = 409; // Conflict
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
  }

  // Validation Error (e.g., Missing 'title' or 'content')
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(", ");
  }

  // Database Connection Failed (New from your old code)
  if (err.name === "MongoNetworkError" || err.name === "MongooseServerSelectionError") {
    statusCode = 503; // Service Unavailable
    message = "Database connection failed. Please try again later.";
  }

  // =========================================================
  // 2. AUTHENTICATION ERRORS (JWT)
  // =========================================================

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your token has expired. Please log in again.";
  }

  // =========================================================
  // 3. FILE UPLOAD ERRORS (MULTER)
  // =========================================================

  if (err instanceof MulterError) {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size too large. Maximum size is 5MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Invalid file type. Only images are allowed.";
    } else {
      message = err.message;
    }
  }

  // =========================================================
  // 4. RATE LIMITING
  // =========================================================
  if (statusCode === 429) {
    message = "Too many requests. Please try again later.";
  }

  // =========================================================
  // FINAL RESPONSE
  // =========================================================
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
};
