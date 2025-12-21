import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPostView extends Document {
  post: Types.ObjectId;
  ip: string;
  userAgent: string;
  createdAt: Date;
}

const postViewSchema = new Schema<IPostView>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 1. Uniqueness Check (Used by Middleware)
postViewSchema.index({ post: 1, ip: 1, userAgent: 1 });

// 2. Dashboard Performance (CRITICAL ADDITION)
// This makes queries like "Get total views for last 24h" instant.
postViewSchema.index({ createdAt: -1 });

// 3. Auto-Delete Logs after 7 days
postViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const PostView = mongoose.model<IPostView>("PostView", postViewSchema);
