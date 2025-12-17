import express from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  toggleCategoryStatus,
  updateCategory,
} from "../../controllers/categoryController";
import { verifyAuthToken } from "../../middleware/authMddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const categoryRoutes = express.Router();

// Public routes
categoryRoutes.get("/", asyncHandler(getAllCategories));

// IMPORTANT: Moved Slug route to "/slug/:slug" to avoid conflict with "/:id"
categoryRoutes.get("/slug/:slug", asyncHandler(getCategoryBySlug));
categoryRoutes.get("/:id", asyncHandler(getCategoryById));

// Protected routes (admin only)
categoryRoutes.post("/", verifyAuthToken, asyncHandler(createCategory));
categoryRoutes.put("/:id", verifyAuthToken, asyncHandler(updateCategory));
categoryRoutes.patch("/:id/toggle", verifyAuthToken, asyncHandler(toggleCategoryStatus));
categoryRoutes.delete("/:id", verifyAuthToken, asyncHandler(deleteCategory));

export default categoryRoutes;
