import { NextFunction, Request, Response } from "express";
import { createError } from "../utils/createError";
import Category from "../models/categorySchema";
import SubCategory from "../models/subCategorySchema";

export const createSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { name, categoryId, isActive } = req.body;

  if (!name) return next(createError("Subcategory name is required", 400));
  if (!categoryId) return next(createError("Category ID is required", 400));

  const category = await Category.findById(categoryId);
  if (!category) return next(createError("Category not found", 404));

  const subCategory = new SubCategory({
    name,
    category: categoryId,
    isActive: isActive !== undefined ? isActive : true,
  });
  await subCategory.save();

  res.status(201).json({
    success: true,
    message: "Subcategory created successfully",
    data: subCategory,
  });
};

export const getAllSubCategories = async (req: Request, res: Response, next: NextFunction) => {
  const { isActive, categoryId } = req.query;

  const filter: any = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (categoryId) filter.category = categoryId;

  const subCategories = await SubCategory.find(filter).populate("category", "name slug").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: subCategories.length,
    data: subCategories,
  });
};

export const getSubCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const subCategory = await SubCategory.findById(id).populate("category", "name slug");
  if (!subCategory) return next(createError("Subcategory not found", 404));

  res.status(200).json({
    success: true,
    data: subCategory,
  });
};

export const getSubCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const { slug, categoryId } = req.params;

  const subCategory = await SubCategory.findOne({ slug, category: categoryId }).populate("category", "name slug");
  if (!subCategory) return next(createError("Subcategory not found", 404));

  res.status(200).json({
    success: true,
    data: subCategory,
  });
};

export const updateSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, categoryId, isActive } = req.body;

  const subCategory = await SubCategory.findById(id);
  if (!subCategory) return next(createError("Subcategory not found", 404));

  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) return next(createError("Category not found", 404));
    subCategory.category = categoryId;
  }

  if (name) subCategory.name = name;
  if (isActive !== undefined) subCategory.isActive = isActive;

  await subCategory.save();

  res.status(200).json({
    success: true,
    message: "Subcategory updated successfully",
    data: subCategory,
  });
};

export const toggleSubCategoryStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const subCategory = await SubCategory.findById(id);
  if (!subCategory) return next(createError("Subcategory not found", 404));

  subCategory.isActive = !subCategory.isActive;
  await subCategory.save();

  res.status(200).json({
    success: true,
    message: `Subcategory ${subCategory.isActive ? "activated" : "deactivated"} successfully`,
    data: subCategory,
  });
};

export const deleteSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const subCategory = await SubCategory.findById(id);
  if (!subCategory) return next(createError("Subcategory not found", 404));

  await SubCategory.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Subcategory deleted successfully",
  });
};
