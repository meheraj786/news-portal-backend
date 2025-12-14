import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/createError";
import Category from "../models/categorySchema";
import SubCategory from "../models/subCategorySchema";

// ==================== CATEGORY CONTROLLERS ====================

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description } = req.body;

  if (!name) return next(createError("Category name is required", 400));

  const category = new Category({
    name,
    description: description || null,
  });
  await category.save();

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
};

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) return next(createError("Category not found", 404));

  res.status(200).json({
    success: true,
    data: category,
  });
};

export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug });
  if (!category) return next(createError("Category not found", 404));

  res.status(200).json({
    success: true,
    data: category,
  });
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const category = await Category.findById(id);
  if (!category) return next(createError("Category not found", 404));

  if (name) category.name = name;
  if (description) category.description = description;
  if (isActive) category.isActive = isActive;

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
};

export const toggleCategoryStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) return next(createError("Category not found", 404));

  category.isActive = !category.isActive;
  await category.save();

  res.status(200).json({
    success: true,
    message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
    data: category,
  });
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) return next(createError("Category not found", 404));

  const subCategoriesCount = await SubCategory.countDocuments({ category: id });
  if (subCategoriesCount > 0) {
    return next(createError("Cannot delete category with existing subcategories", 400));
  }

  await Category.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
};
