"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const adminSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: true,
        minlength: [2, "username must be at least 2 characters"],
        maxlength: [30, "username cannot exceed 30 characters"],
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, "Email is required"],
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "password must be at least 8 characters"],
        select: false,
    },
    // otp fields
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    lastOtpRequest: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },
    //reset password
    resetSessionActive: { type: Boolean, default: false, select: false },
    resetSessionExpiry: { type: Date, select: false },
    otpVerified: { type: Boolean, default: false, select: false },
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.otp;
            delete ret.otpExpiry;
            delete ret.otpAttempts;
            delete ret.lockedUntil;
            delete ret.lastOtpRequest;
            delete ret.resetSessionActive;
            delete ret.resetSessionExpiry;
            delete ret.otpVerified;
            delete ret.__v;
            return ret;
        },
    },
});
//password and otp hashing middleware
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password") && !this.isModified("otp"))
        return next();
    try {
        if (this.isModified("password"))
            this.password = await bcrypt_1.default.hash(this.password, 10);
        if (this.otp && this.isModified("otp"))
            this.otp = await bcrypt_1.default.hash(this.otp, 10);
        next();
    }
    catch (error) {
        next(error);
    }
});
//custom instance method to compare password or otp
adminSchema.methods.compareField = async function (fieldType, value) {
    if (fieldType === "password") {
        return await bcrypt_1.default.compare(value, this.password);
    }
    else if (fieldType === "otp") {
        if (this.otp) {
            return await bcrypt_1.default.compare(value, this.otp);
        }
        else {
            return false;
        }
    }
    return false;
};
const Admin = mongoose_1.default.model("Admin", adminSchema);
exports.default = Admin;
