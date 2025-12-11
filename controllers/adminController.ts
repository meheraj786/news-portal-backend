import { NextFunction, Request, Response } from "express";
import Admin from "../models/adminSchema";
import { createError } from "../utils/createError";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) res.status(400).json({ message: "Email and Password are required." });

  const user = await Admin.findOne({ email }).select("+password");
  if (!user) return next(createError("Invalid email or password.", 401));
  console.log(user);
  // const isMatch = user.comparePassword;
};
