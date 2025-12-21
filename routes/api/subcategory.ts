/*
import express from "express";
import {
  createSubCategory,
  deleteSubCategory,
  getAllSubCategories,
  updateSubCategory,
} from "../../controllers/subCategoryController";
import { verifyAuthToken } from "../../middleware/authMiddleware";

const subCategoryRoutes = express.Router();

// Public
subCategoryRoutes.get("/", getAllSubCategories);

// Protected
subCategoryRoutes.post("/", verifyAuthToken, createSubCategory);
subCategoryRoutes.put("/:id", verifyAuthToken, updateSubCategory);
subCategoryRoutes.delete("/:id", verifyAuthToken, deleteSubCategory);

export default subCategoryRoutes;
*/
