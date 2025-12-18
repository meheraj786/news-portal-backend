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

const categoryRoutes = express.Router();

// Public routes
categoryRoutes.get("/", getAllCategories);

// IMPORTANT: Moved Slug route to "/slug/:slug" to avoid conflict with "/:id"
categoryRoutes.get("/slug/:slug", getCategoryBySlug);
categoryRoutes.get("/:id", getCategoryById);

// Protected routes (admin only)
categoryRoutes.post("/", verifyAuthToken, createCategory);
categoryRoutes.put("/:id", verifyAuthToken, updateCategory);
categoryRoutes.patch("/:id/toggle", verifyAuthToken, toggleCategoryStatus);
categoryRoutes.delete("/:id", verifyAuthToken, deleteCategory);

export default categoryRoutes;
