import express, { Router } from "express";
import { login } from "../../controllers/adminController";

const authRoutes: Router = express.Router();

authRoutes.post("/login", login);
// authRoutes.delete("/logout", (req, res) => {});

export default authRoutes;
