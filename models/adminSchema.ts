import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;

  // NEW: Social Links
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };

  // OTP fields
  otp: string | null;
  otpExpiry: Date | null;
  lastOtpRequest: Date | null;
  otpAttempts: number;
  lockedUntil: Date | null;

  resetSessionActive: boolean;
  resetSessionExpiry: Date | null;
  otpVerified: boolean;
  compareField: (field: string, value: string) => Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
  {
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

    // NEW: Social Links (Optional)
    socialLinks: {
      facebook: { type: String, trim: true, default: "" },
      twitter: { type: String, trim: true, default: "" },
      linkedin: { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
      youtube: { type: String, trim: true, default: "" },
    },

    // OTP fields
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    lastOtpRequest: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },

    // Reset password
    resetSessionActive: { type: Boolean, default: false, select: false },
    resetSessionExpiry: { type: Date, select: false },
    otpVerified: { type: Boolean, default: false, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
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
  }
);

// Password and OTP hashing middleware
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password") && !this.isModified("otp")) return next();
  try {
    if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 10);
    if (this.otp && this.isModified("otp")) this.otp = await bcrypt.hash(this.otp, 10);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Custom instance method to compare password or otp
adminSchema.methods.compareField = async function (field: "password" | "otp", value: string): Promise<boolean> {
  if (field === "password") {
    return await bcrypt.compare(value, this.password);
  } else if (field === "otp") {
    if (this.otp) {
      return await bcrypt.compare(value, this.otp);
    } else {
      return false;
    }
  }
  return false;
};

const Admin = mongoose.model<IAdmin>("Admin", adminSchema);
export default Admin;
