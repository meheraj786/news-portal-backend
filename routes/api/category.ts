import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../../controllers/categoryController";
import { verifyAuthToken } from "../../middleware/authMiddleware";

const categoryRoutes = express.Router();

// Public routes
categoryRoutes.get("/", getAllCategories);
categoryRoutes.get("/:id", getCategoryById);
categoryRoutes.get("/:slug", getCategoryBySlug);

// Protected routes (admin only)
categoryRoutes.post("/", verifyAuthToken, createCategory);
categoryRoutes.put("/:id", verifyAuthToken, updateCategory);
categoryRoutes.patch("/:id/toggle", verifyAuthToken, toggleCategoryStatus);
categoryRoutes.delete("/:id", verifyAuthToken, deleteCategory);

export default categoryRoutes;
