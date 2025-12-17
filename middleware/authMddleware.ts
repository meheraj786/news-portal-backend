import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "../utils/createError";

interface JwtPayload {
  id: string;
  email: string;
  username: string;
}

interface AuthRequest extends Request {
  admin?: JwtPayload;
}

export const verifyAuthToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(createError("Not authorized. Please login.", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    req.admin = decoded as JwtPayload;

    next();
  } catch (err: any) {
    const errorMsg =
      err.name === "TokenExpiredError"
        ? "Token expired. Please login again."
        : err.name === "JsonWebTokenError"
        ? "Invalid token"
        : "Authentication error";

    res.status(errorMsg === "Authentication error" ? 500 : 401).json({
      success: false,
      message: errorMsg,
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};
