import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  category: Types.ObjectId;
  image: string;
  isDraft?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  views?: number;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      minlength: 2,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 2,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    image: {
      type: String,
      required: true,
      minlength: 2,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, 
  }
);

export const Post = mongoose.model<IPost>("Post", postSchema);
