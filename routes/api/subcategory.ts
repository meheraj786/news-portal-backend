import express from "express";
import {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  getSubCategoryBySlug,
  updateSubCategory,
  toggleSubCategoryStatus,
  deleteSubCategory,
} from "../../controllers/subCategoryController";
import { verifyAuthToken } from "../../middleware/authMiddleware";

const subCategoryRoutes = express.Router();

// Public routes
subCategoryRoutes.get("/", getAllSubCategories);
subCategoryRoutes.get("/:id", getSubCategoryById);
subCategoryRoutes.get("/slug/:categoryId/:slug", getSubCategoryBySlug);

// Protected routes (admin only)
subCategoryRoutes.post("/", verifyAuthToken, createSubCategory);
subCategoryRoutes.put("/:id", verifyAuthToken, updateSubCategory);
subCategoryRoutes.patch("/:id/toggle", verifyAuthToken, toggleSubCategoryStatus);
subCategoryRoutes.delete("/:id", verifyAuthToken, deleteSubCategory);

export default subCategoryRoutes;
