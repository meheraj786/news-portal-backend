"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = createError;
function createError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}
