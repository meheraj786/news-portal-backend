import express from "express";
import { createPost, deletePost, getPostById, getPosts, getTrendingPosts, updatePost } from "../../controllers/postController";
import { verifyAuthToken } from "../../middleware/authMiddleware";


const postRoutes = express.Router();

postRoutes.get("/trending", getTrendingPosts); 
postRoutes.get("/", getPosts);
postRoutes.get("/:id",  getPostById);
postRoutes.post("/", verifyAuthToken,  createPost);
postRoutes.put("/:id", verifyAuthToken, updatePost);
postRoutes.delete("/:id", verifyAuthToken, deletePost);

export default postRoutes;
