import express from "express";
import { createPost, deletePost, getAllPosts, getPostById, updatePost } from "../../controllers/postController";
import { upload } from "../../middleware/uploadMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const postRoutes = express.Router();

// Public
postRoutes.get("/", asyncHandler(getAllPosts));
postRoutes.get("/:postId", asyncHandler(getPostById));

// Protected / Admin
// We use upload.any() so you don't get "Field name missing" errors.
// You can use any key name for the file in Postman.
postRoutes.post("/", upload.any(), asyncHandler(createPost));
postRoutes.put("/:postId", upload.any(), asyncHandler(updatePost));
postRoutes.delete("/:postId", asyncHandler(deletePost));

export default postRoutes;
