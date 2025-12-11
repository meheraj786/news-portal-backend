"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong.";
    // log error only in development
    if (statusCode === 500 && process.env.NODE_ENV === "development")
        console.error("Error: ", err);
    // 1. Mongoose Bad ObjectId (CastError)
    if (err.name === "CastError") {
        statusCode = 404;
        message = `Resource not found with id: ${err.value}`;
    }
    // 2. Mongoose dublicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const value = err.keyValue[field];
        statusCode = 409;
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    }
    // 13. Too Many Requests
    if (statusCode === 429) {
        message = err.message || "Too many requests. Please try again later.";
    }
    res.status(statusCode).json({
        success: false,
        message: message,
        // Include error details only in development
        ...(process.env.NODE_ENV === "development" && {
            error: err.message,
            stack: err.stack, // where error occurred
        }),
    });
};
exports.errorHandler = errorHandler;
