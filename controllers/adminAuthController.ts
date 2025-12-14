import { NextFunction, Request, Response } from "express";
import Admin from "../models/adminSchema";
import { createError } from "../utils/createError";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) return next(createError("Email and Password are required.", 400));

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) return next(createError("Invalid email or password.", 401));

  const isMatch = await admin.compareField("password", password);
  if (!isMatch) return next(createError("Invalid email or password", 401));

  //generate jwt
  const payload = { id: admin._id, email: admin.email, username: admin.username };
  if (!process.env.JWT_SECRET) {
    return next(createError("JWT_SECRET environment variable is not defined", 500));
  }
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "365d",
  });

  //set cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: admin,
  });
};

export const requestVerification = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  //assuming client side did the rejex part
  if (!email) return next(createError("Email is required.", 400));

  const admin = await Admin.findOne({ email }).select(
    "+otp +otpExpiry +otpAttempts +lastOtpRequest +lockedUntil +resetSessionActive +resetSessionExpiry +otpVerified"
  );
  if (!admin) return next(createError("Admin not found.", 404));
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    const remainingTime = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
    return next(createError(`Account is locked. Try again after ${remainingTime} minutes.`, 403));
  }

  //check for verify
  if (admin.otpVerified && admin.resetSessionActive) {
    return next(
      createError(
        "You are already verified and your reset session is still valid. Please go to the resetPassword page.",
        400
      )
    );
  }

  // 1min cooldown
  if (admin.lastOtpRequest) {
    const timeSinceLastRequest = (Date.now() - admin.lastOtpRequest.getTime()) / 1000; // in sec
    // 429 - too  many requests
    if (timeSinceLastRequest < 60) {
      return next(
        createError(
          `Please wait ${60 - Math.floor(timeSinceLastRequest)} second${
            timeSinceLastRequest > 1 ? "s" : ""
          } before requesting a new OTP.`,
          429
        )
      );
    }
  }

  // generate 6 digit OTP - string
  const otp = crypto.randomInt(100000, 999999).toString();

  // update in db
  admin.otp = otp;
  admin.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5min
  admin.lastOtpRequest = new Date();
  admin.otpAttempts = 0;
  admin.lockedUntil = null;
  admin.resetSessionActive = true;
  admin.resetSessionExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15min
  admin.otpVerified = false;
  await admin.save();

  // send email
  await sendEmail(email, "verification", otp);

  res.status(200).json({
    success: true,
    message: "OTP sent to your email",
  });
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;
  //assuming client side did the rejex part
  if (!email || !otp) return next(createError("Email and OTP are required.", 400));

  const admin = await Admin.findOne({ email }).select(
    "+otp +otpExpiry +otpAttempts +lastOtpRequest +lockedUntil +resetSessionActive +resetSessionExpiry +otpVerified"
  );
  if (!admin) return next(createError("Admin not found.", 404));

  if (admin.otpVerified) return next(createError("You are already verified", 400));

  // check reset password seassion
  if (!admin.resetSessionActive) {
    return next(createError("No active reset password session. Please request OTP first", 400));
  }
  if (!admin.resetSessionExpiry || admin.resetSessionExpiry < new Date()) {
    admin.resetSessionActive = false;
    admin.otp = null;
    admin.otpExpiry = null;
    admin.otpVerified = false;
    await admin.save();

    return next(createError("Reset session expired. Please request a new OTP", 400));
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return next(createError(`Account is locked. Please try again later.`, 403));
  }

  // otp expiry
  if (!admin.otpExpiry || admin.otpExpiry < new Date()) {
    return next(createError("OTP has expired. Please request a new one.", 400));
  }

  // check otp match
  const isMatch = await admin.compareField("otp", otp);
  // on wrong attempt
  if (!isMatch) {
    admin.otpAttempts = (admin.otpAttempts || 0) + 1;

    // lock after 3 failed attempt
    if (admin.otpAttempts >= 3) {
      admin.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30min
      admin.otpAttempts = 0;
      admin.otp = null;
      admin.otpExpiry = null;
      admin.resetSessionActive = false;
      admin.otpVerified = false;
      await admin.save();

      return next(createError("Too many failed attempts. Account locked for 30 minutes", 429));
    }
    await admin.save();

    return next(createError(`Wrong OTP. ${3 - admin.otpAttempts} attempts remaining`, 400));
  }

  // on success
  admin.otp = null;
  admin.lockedUntil = null;
  admin.otpExpiry = null;
  admin.otpAttempts = 0;
  admin.otpVerified = true;
  await admin.save();

  res.status(200).json({
    success: true,
    message: "OTP verified successfully. You can now reset your password",
  });
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) return next(createError("Email and password are required", 400));
  if (password.length < 8) return next(createError("Password must be at least 8 characters", 400));

  const admin = await Admin.findOne({ email }).select("+password +resetSessionActive +resetSessionExpiry +otpVerified");
  if (!admin) return next(createError("Admin not found.", 404));

  // verify check
  if (!admin.otpVerified) return next(createError("Please verify your email first.", 403));

  // check for valid reset seassion
  if (!admin.resetSessionActive) {
    return next(createError("No active password reset session. Please verify OTP first", 400));
  }
  if (!admin.resetSessionExpiry || admin.resetSessionExpiry < new Date()) {
    admin.resetSessionActive = false;
    await admin.save();
    return next(createError("Reset session expired. Please start over with OTP verification.", 400));
  }

  // update password and clear the reset seassion
  admin.password = password;
  admin.resetSessionActive = false;
  admin.resetSessionExpiry = null;
  admin.otpVerified = false;
  await admin.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful. You can now login with your new password.",
  });
};

export const logout = (req: Request, res: Response) => {
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
