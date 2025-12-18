import express from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  searchPosts,
  updatePost,
} from "../../controllers/postController";
import { upload } from "../../middleware/uploadMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyAuthToken } from "../../middleware/authMddleware";

const postRoutes = express.Router();

// ================= PUBLIC ROUTES =================

// 1. Get All Posts
postRoutes.get("/", getAllPosts);

// 2. Search Posts (MUST BE BEFORE /:postId)
// Example URL: /api/v1/posts/search?query=bitcoin&categoryName=tech
postRoutes.get("/search", searchPosts);

// 3. Get Single Post by ID (Dynamic Route)
// This catches anything that looks like an ID, so it must be last in the GET list.
postRoutes.get("/:postId", getPostById);

// ================= PROTECTED ROUTES =================

// Create Post (Verify Token -> Upload File -> Controller)
postRoutes.post("/", verifyAuthToken, upload.any(), createPost);

// Update Post
postRoutes.put("/:postId", verifyAuthToken, upload.any(), updatePost);

// Delete Post
postRoutes.delete("/:postId", verifyAuthToken, deletePost);

export default postRoutes;
