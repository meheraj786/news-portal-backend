import { Request, Response } from "express";
import { createError } from "../utils/createError";
import Category from "../models/categorySchema";
import { Post } from "../models/postSchema";
import { asyncHandler } from "../utils/asyncHandler";

// 1. Create Category
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) throw createError("Category name is required", 400);

  const existing = await Category.findOne({ name });
  if (existing) throw createError("Category already exists", 409);

  const category = new Category({
    name,
    description: description || null,
  });

  await category.save();
  res.status(201).json({ success: true, message: "Category created", data: category });
});

// 2. Get All Categories (NO Pagination - Returns List)
export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  // Simply fetch all active categories
  const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

// 3. Get Category By ID
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw createError("Category not found", 404);
  res.status(200).json({ success: true, data: category });
});

// 4. Get Category By Slug
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) throw createError("Category not found", 404);
  res.status(200).json({ success: true, data: category });
});

// 5. Update Category
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, isActive } = req.body;
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) throw createError("Category not found", 404);

  // Check Duplicates if name changes
  if (name && name !== category.name) {
    const duplicate = await Category.findOne({ name });
    if (duplicate) throw createError("Category name already exists", 409);
    category.name = name; // Slug updates automatically in Model hook
  }

  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  res.status(200).json({ success: true, message: "Updated successfully", data: category });
});

// 6. Toggle Status
export const toggleCategoryStatus = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw createError("Category not found", 404);

  category.isActive = !category.isActive;
  await category.save();

  res.status(200).json({
    success: true,
    message: `Category is now ${category.isActive ? "Active" : "Inactive"}`,
    data: category,
  });
});

// 7. Delete Category (Safe Mode)
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) throw createError("Category not found", 404);

  // Safety: Check if Posts exist (We still check this to prevent orphaned posts)
  const postCount = await Post.countDocuments({ category: id });
  if (postCount > 0) {
    throw createError(`Cannot delete: This category is used in ${postCount} posts.`, 400);
  }

  await Category.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "Category deleted successfully" });
});
