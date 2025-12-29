import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBreakingNews extends Document {
  posts: Types.ObjectId[];
}

const breakingNewsSchema = new Schema<IBreakingNews>(
  {
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  { timestamps: true }
);

export const BreakingNews = mongoose.model<IBreakingNews>("BreakingNews", breakingNewsSchema);
