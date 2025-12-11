"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../../controllers/adminController");
const authRoutes = express_1.default.Router();
authRoutes.post("/login", adminController_1.login);
// authRoutes.delete("/logout", (req, res) => {});
exports.default = authRoutes;
