"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const adminSchema_1 = __importDefault(require("../models/adminSchema"));
require("dotenv").config();
const seedSuperAdmin = async () => {
    try {
        await mongoose_1.default.connect(process.env.DB_URL);
        const superAdminEmail = process.env.ADMIN_EMAIL;
        const exists = await adminSchema_1.default.findOne({ email: superAdminEmail });
        if (exists) {
            console.log("Super Admin already exists. No new user created.");
            process.exit(0);
        }
        await adminSchema_1.default.create({
            username: "Super Admin",
            email: superAdminEmail,
            password: "12345678",
        });
        console.log("✅ Super Admin Created Successfully!");
        process.exit(0); // normal exit
    }
    catch (error) {
        console.error("❌ Seeder Failed:", error);
        process.exit(1); // exit with failure
    }
};
seedSuperAdmin();
