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
import { verifyAuthToken } from "../../middleware/authMiddleware";

const categoryRoutes = express.Router();

// Public
categoryRoutes.get("/", getAllCategories);
categoryRoutes.get("/slug/:slug", getCategoryBySlug);
categoryRoutes.get("/:id", getCategoryById);

// Protected
categoryRoutes.post("/", verifyAuthToken, createCategory);
categoryRoutes.put("/:id", verifyAuthToken, updateCategory);
categoryRoutes.patch("/:id/toggle", verifyAuthToken, toggleCategoryStatus);
categoryRoutes.delete("/:id", verifyAuthToken, deleteCategory);

export default categoryRoutes;
