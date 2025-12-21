import express from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  searchPosts,
  getTrendingPosts,
  updatePost,
} from "../../controllers/postController";
import upload from "../../middleware/uploadMiddleware";
import { trackPostView } from "../../middleware/viewCountMiddleware";
import { verifyAuthToken } from "../../middleware/authMiddleware";

const postRoutes = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// 1. Search & Trending (MUST be defined before /:postId)
postRoutes.get("/search", searchPosts);
postRoutes.get("/trending", getTrendingPosts);

postRoutes.get("/", getAllPosts);
postRoutes.get("/:postId", trackPostView, getPostById);

// Create: Accept any field name. Middleware blocks non-images.
postRoutes.post("/", verifyAuthToken, upload.any(), createPost);
postRoutes.put("/:postId", verifyAuthToken, upload.any(), updatePost);
postRoutes.delete("/:postId", verifyAuthToken, deletePost);

export default postRoutes;
