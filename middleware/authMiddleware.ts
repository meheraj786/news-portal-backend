import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { createError } from "../utils/createError";
import Admin from "../models/adminSchema"; // <--- Import Admin Model

// 1. Extend Express Request globally
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        username: string;
      };
    }
  }
}

export const verifyAuthToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(createError("Not authorized. Please login.", 401));
    }

    // 3. Verify Token
    // We cast to 'any' because standard JwtPayload doesn't know about our 'id' field
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // 4. SECURITY FIX: Check if user still exists in DB!
    // This prevents deleted admins from accessing the system using an old token.
    const adminExists = await Admin.findById(decoded.id);

    if (!adminExists) {
      return next(createError("Account access revoked. Please contact support.", 403));
    }

    // Attach user to request
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    };

    next();
  } catch (err) {
    // 5. Safer Error Handling
    if (err instanceof TokenExpiredError) {
      return next(createError("Token expired. Please login again.", 401));
    }

    if (err instanceof JsonWebTokenError) {
      return next(createError("Invalid token. Authentication failed.", 401));
    }

    // Generic error
    return next(createError("Authentication error", 500));
  }
};
