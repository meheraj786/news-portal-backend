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

// Public Routes
categoryRoutes.get("/", getAllCategories);
categoryRoutes.get("/slug/:slug", getCategoryBySlug); // Specific route first
categoryRoutes.get("/:id", getCategoryById); // Generic ID route last

// Protected Routes (Admin)
categoryRoutes.post("/", verifyAuthToken, createCategory);
categoryRoutes.put("/:id", verifyAuthToken, updateCategory);
categoryRoutes.patch("/:id/toggle", verifyAuthToken, toggleCategoryStatus);
categoryRoutes.delete("/:id", verifyAuthToken, deleteCategory);

export default categoryRoutes;
