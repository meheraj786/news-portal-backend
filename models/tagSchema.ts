import mongoose, { Document, Schema } from "mongoose";

export interface ITag extends Document {
  name: string;
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

export const Tag = mongoose.model<ITag>("Tag", tagSchema);
