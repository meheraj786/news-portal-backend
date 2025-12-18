import { Request, Response } from "express";
import { createError } from "../utils/createError";
import Category from "../models/categorySchema";
import SubCategory from "../models/subCategorySchema";
import { asyncHandler } from "../utils/asyncHandler";

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) throw createError("Category name is required", 400);

  const existing = await Category.findOne({ name });
  if (existing) throw createError("Category already exists", 400);

  const category = new Category({
    name,
    description: description || null,
    subCategories: [],
  });

  await category.save();
  res.status(201).json({ success: true, message: "Category created", data: category });
});

export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true })
    .populate("subCategories", "name slug isActive")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: categories.length, data: categories });
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id).populate("subCategories");
  if (!category) throw createError("Category not found", 404);
  res.status(200).json({ success: true, data: category });
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params.slug }).populate("subCategories");
  if (!category) throw createError("Category not found", 404);
  res.status(200).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, isActive } = req.body;
  const category = await Category.findById(req.params.id);
  if (!category) throw createError("Category not found", 404);

  if (name) category.name = name;
  if (description) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  res.status(200).json({ success: true, message: "Updated successfully", data: category });
});

export const toggleCategoryStatus = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw createError("Category not found", 404);

  category.isActive = !category.isActive;
  await category.save();
  res.status(200).json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await Category.findById(id);
  if (!category) throw createError("Category not found", 404);

  const subCount = await SubCategory.countDocuments({ category: id });
  if (subCount > 0) {
    throw createError("Cannot delete category with existing subcategories.", 400);
  }

  await Category.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "Deleted successfully" });
});
