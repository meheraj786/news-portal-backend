import express from "express";
import {
  createSubCategory,
  deleteSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  getSubCategoryBySlug,
  toggleSubCategoryStatus,
  updateSubCategory,
} from "../../controllers/subCategoryController";
import { verifyAuthToken } from "../../middleware/authMddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const subCategoryRoutes = express.Router();

// Public routes
subCategoryRoutes.get("/", asyncHandler(getAllSubCategories));
subCategoryRoutes.get("/:id", asyncHandler(getSubCategoryById));
// Note: This matches the controller logic (slug + categoryId)
subCategoryRoutes.get("/slug/:categoryId/:slug", asyncHandler(getSubCategoryBySlug));

// Protected routes (admin only)
subCategoryRoutes.post("/", verifyAuthToken, asyncHandler(createSubCategory));
subCategoryRoutes.put("/:id", verifyAuthToken, asyncHandler(updateSubCategory));
subCategoryRoutes.patch("/:id/toggle", verifyAuthToken, asyncHandler(toggleSubCategoryStatus));
subCategoryRoutes.delete("/:id", verifyAuthToken, asyncHandler(deleteSubCategory));

export default subCategoryRoutes;
