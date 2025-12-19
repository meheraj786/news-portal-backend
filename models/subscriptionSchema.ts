import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  email: string;
  createdAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Prevents duplicate subscriptions
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // We only need createdAt
    toJSON: {
      transform: function (doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema);
