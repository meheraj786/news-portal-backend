import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  image: {
    url: string;
    publicId: string;
  };
  category: Types.ObjectId;
  subCategory?: Types.ObjectId;
  tags: Types.ObjectId[];
  views: number;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      minlength: [50, "Content must be at least 50 characters"],
    },
    image: {
      url: {
        type: String,
        required: [true, "Post image URL is required"],
      },
      publicId: {
        type: String,
        required: [true, "Post image public ID is required"],
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      index: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    views: {
      type: Number,
      default: 0,
      min: 0,
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

// --- INDEXES ---
postSchema.index({ createdAt: -1 });

// IMPORTANT: Kept the Text Index for your Search Controller
postSchema.index({ title: "text", content: "text" });

export const Post = mongoose.model<IPost>("Post", postSchema);
