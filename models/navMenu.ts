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
          ref: "Category",
        },
      ],
      validate: [(val: Types.ObjectId[]) => val.length <= 10, "Nav menu limit is 10 items"],
      default: [],
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

export const NavMenu = model<INavMenu>("NavMenu", navMenuSchema);
