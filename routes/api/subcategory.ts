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
subCategoryRoutes.get("/", getAllSubCategories);
subCategoryRoutes.get("/:id", getSubCategoryById);
// Note: This matches the controller logic (slug + categoryId)
subCategoryRoutes.get("/slug/:categoryId/:slug", getSubCategoryBySlug);

// Protected routes (admin only)
subCategoryRoutes.post("/", verifyAuthToken, createSubCategory);
subCategoryRoutes.put("/:id", verifyAuthToken, updateSubCategory);
subCategoryRoutes.patch("/:id/toggle", verifyAuthToken, toggleSubCategoryStatus);
subCategoryRoutes.delete("/:id", verifyAuthToken, deleteSubCategory);

export default subCategoryRoutes;
