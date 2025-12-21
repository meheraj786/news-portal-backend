/*
import { Request, Response } from "express";
import { createError } from "../utils/createError";
import SubCategory from "../models/subCategorySchema";
import Category from "../models/categorySchema";
import { Post } from "../models/postSchema";
import { asyncHandler } from "../utils/asyncHandler";

// 1. Create SubCategory
export const createSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, categoryId, description } = req.body;

  if (!name || !categoryId) throw createError("Name and Category ID are required", 400);

  // Validate Parent Category
  const parent = await Category.findById(categoryId);
  if (!parent) throw createError("Parent category not found", 404);

  // Check Duplicate (Name must be unique)
  const existing = await SubCategory.findOne({ name });
  if (existing) throw createError("SubCategory name already exists", 409);

  const subCategory = new SubCategory({
    name,
    category: categoryId,
    description: description || null,
  });

  await subCategory.save();
  res.status(201).json({ success: true, message: "SubCategory created", data: subCategory });
});

// 2. Get All SubCategories (Filter by Parent Optional)
export const getAllSubCategories = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.query;
  const filter = categoryId ? { category: categoryId } : {};

  const subCategories = await SubCategory.find(filter)
    .populate("category", "name slug") // Populate parent info
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: subCategories.length, data: subCategories });
});

// 3. Update SubCategory
export const updateSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, categoryId, isActive } = req.body;

  const subCategory = await SubCategory.findById(id);
  if (!subCategory) throw createError("SubCategory not found", 404);

  // If changing name, check duplicate
  if (name && name !== subCategory.name) {
    const existing = await SubCategory.findOne({ name });
    if (existing) throw createError("SubCategory name already exists", 409);
    subCategory.name = name; // Pre-save hook will handle slug
  }

  // If changing parent
  if (categoryId) {
    const parent = await Category.findById(categoryId);
    if (!parent) throw createError("New parent category not found", 404);
    subCategory.category = categoryId;
  }

  if (description !== undefined) subCategory.description = description;
  if (isActive !== undefined) subCategory.isActive = isActive;

  await subCategory.save();
  res.status(200).json({ success: true, message: "Updated successfully", data: subCategory });
});

// 4. Delete SubCategory
export const deleteSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if used in Posts
  const postCount = await Post.countDocuments({ subCategory: id });
  if (postCount > 0) {
    throw createError(`Cannot delete: This subcategory is used in ${postCount} posts.`, 400);
  }

  const deleted = await SubCategory.findByIdAndDelete(id);
  if (!deleted) throw createError("SubCategory not found", 404);

  res.status(200).json({ success: true, message: "SubCategory deleted successfully" });
});
*/
