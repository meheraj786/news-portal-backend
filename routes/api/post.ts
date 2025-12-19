import express from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  searchPosts,
  updatePost,
  getTrendingPosts,
} from "../../controllers/postController";
import { upload } from "../../middleware/uploadMiddleware";
import { trackPostView } from "../../middleware/viewCountMiddleware";
import { verifyAuthToken } from "../../middleware/authMddleware";

const postRoutes = express.Router();

// ================= PUBLIC ROUTES =================

// 1. Get All
postRoutes.get("/", getAllPosts);

// 2. Search (Must be before /:postId)
postRoutes.get("/search", searchPosts);

// 3. Trending (Must be before /:postId)
postRoutes.get("/trending", getTrendingPosts);

// 4. Get Single Post (Dynamic ID)
// Middleware 'trackPostView' runs first to count the view
postRoutes.get("/:postId", trackPostView, getPostById);

// ================= PROTECTED ROUTES =================

postRoutes.post("/", verifyAuthToken, upload.any(), createPost);

postRoutes.put("/:postId", verifyAuthToken, upload.any(), updatePost);

postRoutes.delete("/:postId", verifyAuthToken, deletePost);

export default postRoutes;
