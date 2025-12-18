import { Request, Response } from "express";
import { createError } from "../utils/createError";
import Category from "../models/categorySchema";
import SubCategory from "../models/subCategorySchema";
import { asyncHandler } from "../utils/asyncHandler";

// CREATE
export const createSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, categoryId, isActive } = req.body;
  if (!name || !categoryId) throw createError("Name and Category ID required", 400);

  const category = await Category.findById(categoryId);
  if (!category) throw createError("Parent Category not found", 404);

  const subCategory = new SubCategory({
    name,
    category: categoryId,
    isActive: isActive ?? true,
  });
  await subCategory.save();

  await Category.findByIdAndUpdate(categoryId, {
    $push: { subCategories: subCategory._id },
  });

  res.status(201).json({ success: true, data: subCategory });
});

// DELETE
export const deleteSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const subCategory = await SubCategory.findById(id);
  if (!subCategory) throw createError("Subcategory not found", 404);

  await Category.findByIdAndUpdate(subCategory.category, {
    $pull: { subCategories: subCategory._id },
  });

  await SubCategory.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Deleted successfully" });
});

// UPDATE
export const updateSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, categoryId, isActive } = req.body;

  const subCategory = await SubCategory.findById(id);
  if (!subCategory) throw createError("Subcategory not found", 404);

  if (categoryId && categoryId !== subCategory.category.toString()) {
    await Category.findByIdAndUpdate(subCategory.category, {
      $pull: { subCategories: subCategory._id },
    });
    await Category.findByIdAndUpdate(categoryId, {
      $push: { subCategories: subCategory._id },
    });
    subCategory.category = categoryId;
  }

  if (name) subCategory.name = name;
  if (isActive !== undefined) subCategory.isActive = isActive;

  await subCategory.save();
  res.status(200).json({ success: true, data: subCategory });
});

// GET ALL
export const getAllSubCategories = asyncHandler(async (req: Request, res: Response) => {
  const { isActive, categoryId } = req.query;
  const filter: any = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (categoryId) filter.category = categoryId;

  const subCategories = await SubCategory.find(filter).populate("category", "name slug").sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: subCategories.length, data: subCategories });
});

// GET BY ID
export const getSubCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const subCategory = await SubCategory.findById(req.params.id).populate("category", "name slug");
  if (!subCategory) throw createError("Not found", 404);
  res.status(200).json({ success: true, data: subCategory });
});

// GET BY SLUG
export const getSubCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug, categoryId } = req.params;
  const subCategory = await SubCategory.findOne({ slug, category: categoryId }).populate("category", "name slug");
  if (!subCategory) throw createError("Not found", 404);
  res.status(200).json({ success: true, data: subCategory });
});

// TOGGLE STATUS
export const toggleSubCategoryStatus = asyncHandler(async (req: Request, res: Response) => {
  const subCategory = await SubCategory.findById(req.params.id);
  if (!subCategory) throw createError("Not found", 404);
  subCategory.isActive = !subCategory.isActive;
  await subCategory.save();
  res.status(200).json({ success: true, data: subCategory });
});
