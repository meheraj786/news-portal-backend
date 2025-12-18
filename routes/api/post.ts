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
import { verifyAuthToken } from "../../middleware/authMddleware";

const postRoutes = express.Router();

// ================= PUBLIC ROUTES =================

// 1. Get All
postRoutes.get("/", getAllPosts);

// 2. Search (MUST be before /:postId)
postRoutes.get("/search", searchPosts);

// 3. Get Single (Dynamic ID)
postRoutes.get("/:postId", getPostById);

// ================= PROTECTED ROUTES =================

// Order: Auth Check -> File Handling -> Controller
postRoutes.post("/", verifyAuthToken, upload.any(), createPost);

postRoutes.put("/:postId", verifyAuthToken, upload.any(), updatePost);

postRoutes.delete("/:postId", verifyAuthToken, deletePost);

export default postRoutes;
