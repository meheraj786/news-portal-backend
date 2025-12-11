"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const adminSchema_1 = __importDefault(require("../models/adminSchema"));
const createError_1 = require("../utils/createError");
const login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password)
        res.status(400).json({ message: "Email and Password are required." });
    const user = await adminSchema_1.default.findOne({ email }).select("+password");
    if (!user)
        next((0, createError_1.createError)("Invalid email or password.", 401));
    console.log(user);
    // const isMatch = user.comparePassword;
};
exports.login = login;
