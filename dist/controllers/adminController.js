"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = void 0;
const adminSchema_1 = __importDefault(require("../models/adminSchema"));
const createError_1 = require("../utils/createError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and Password are required." });
    }
    const user = await adminSchema_1.default.findOne({ email }).select("+password");
    if (!user)
        return next((0, createError_1.createError)("Invalid email or password.", 401));
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
        return next((0, createError_1.createError)("Invalid email or password"));
    //generate jwt
    const payload = { userId: user._id, email: user.email };
    if (!process.env.JWT_SECRET) {
        return next((0, createError_1.createError)("JWT_SECRET environment variable is not defined", 500));
    }
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "10y",
    });
    //set cookie
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1hr
    });
    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: user,
    });
};
exports.login = login;
const logout = (req, res) => {
    // Clear the access token cookie by setting it with an expired date
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // CSRF protection
        path: "/",
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};
exports.logout = logout;
