import mongoose, { Schema, Document } from "mongoose";

export interface IAd extends Document {
  title: string;
  image: {
    url: string;
    publicId: string;
  };
  type: "horizontal" | "square";
  link: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adSchema = new Schema<IAd>(
  {
    title: {
      type: String,
      required: [true, "Ad title is required"],
      trim: true,
    },
    image: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
    type: {
      type: String,
      enum: ["horizontal", "square"],
      required: [true, "Ad type is required (horizontal or square)"],
    },
    link: {
      type: String,
      required: [true, "Sponsor link is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

export const Ad = mongoose.model<IAd>("Ad", adSchema);
