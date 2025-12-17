import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITag extends Document {
  name: string;
  posts: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [50, "Tag name cannot exceed 50 characters"],
      minlength: [2, "Tag name must be at least 2 characters"],
    },
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
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

// Virtual for post count
tagSchema.virtual("postCount").get(function () {
  return this.posts.length;
});

// Ensure virtuals are included in JSON
tagSchema.set("toJSON", { virtuals: true });

export const Tag = mongoose.model<ITag>("Tag", tagSchema);
