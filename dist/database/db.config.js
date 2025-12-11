"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnect = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dbConnect = async () => {
    const mongoUri = process.env.DB_URL;
    console.log(mongoUri);
    if (!mongoUri) {
        console.error("MONGO_URI is not defined in .env");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log("Database connected successfully");
    }
    catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};
exports.dbConnect = dbConnect;
