import mongoose, { Schema } from "mongoose";
import slugify from "slugify";

const subCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "subcategory name is required"],
      trim: true,
      minlength: [2, "subcategory name must be at least 2 characters"],
      maxlength: [50, "subcategory name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: {
      transform: function (doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-generate slug before saving
subCategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

subCategorySchema.index({ slug: 1, category: 1 }, { unique: true });

const SubCategory = mongoose.model("SubCategory", subCategorySchema);
export default SubCategory;
