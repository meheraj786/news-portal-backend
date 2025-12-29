import express from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  searchPosts,
  getTrendingPosts,
  updatePost,
  getPostsByFilter,
  getBreakingNews,
  removeFromBreakingNews, // 👈 Import the new controller
} from "../../controllers/postController";
import upload from "../../middleware/uploadMiddleware";
import { trackPostView } from "../../middleware/viewCountMiddleware";
import { verifyAuthToken } from "../../middleware/authMiddleware";
import { searchLimiter } from "../../middleware/rateLimiter";

const postRoutes = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
postRoutes.get("/search", searchLimiter, searchPosts);
postRoutes.get("/trending", getTrendingPosts);
postRoutes.get("/breaking", getBreakingNews);

postRoutes.get("/", getAllPosts);
postRoutes.get("/filter/:id", getPostsByFilter);
postRoutes.get("/:postId", trackPostView, getPostById);

// ==========================================
// PROTECTED ROUTES (Admin Only)
// ==========================================

postRoutes.post("/", verifyAuthToken, upload.any(), createPost);
postRoutes.put("/:postId", verifyAuthToken, upload.any(), updatePost);

// 👇 NEW ROUTE: Remove from Breaking News (Must be BEFORE generic delete)
postRoutes.delete("/breaking/:postId", verifyAuthToken, removeFromBreakingNews);

// Generic Delete Post
postRoutes.delete("/:postId", verifyAuthToken, deletePost);

export default postRoutes;
