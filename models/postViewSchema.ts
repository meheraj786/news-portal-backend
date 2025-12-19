import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPostView extends Document {
  post: Types.ObjectId;
  ip: string;
  createdAt: Date;
}

const postViewSchema = new Schema<IPostView>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    ip: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 1. Search Index: Fast lookup for "Did this IP view this Post?"
postViewSchema.index({ post: 1, ip: 1 });

// 2. TTL Index: AUTO-DELETE logs after 7 days (604,800 seconds)
// This ensures your database never fills up with old logs.
postViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const PostView = mongoose.model<IPostView>("PostView", postViewSchema);
