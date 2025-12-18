import { Schema, model, Document, Types } from "mongoose";

export interface INavMenu extends Document {
  categoryIds: Types.ObjectId[];
}

const navMenuSchema = new Schema<INavMenu>(
  {
    categoryIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Category", // Ensure this matches your Category model name
        },
      ],
      validate: [arrayLimit, "{PATH} exceeds the limit of 10"],
      default: [],
    },
  },
  { timestamps: true }
);

// Validation to ensure design stays consistent
function arrayLimit(val: Types.ObjectId[]) {
  return val.length <= 10;
}

export const NavMenu = model<INavMenu>("NavMenu", navMenuSchema);
