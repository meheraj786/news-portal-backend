import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

const adminSchema = new Schema<IAdmin>({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//password hashing middleware
// adminSchema.pre("save", async function (this: any, next: NextFunction) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

//custom instance method to compare password
adminSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
