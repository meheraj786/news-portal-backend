import express from "express";
import { getAllTags, getPostsByTag } from "../../controllers/tagController";

const tagRoutes = express.Router();

// 1. Get All Tags (Returns tag list with post counts)
// URL: GET /api/tags
tagRoutes.get("/", getAllTags);

// 2. Get Posts by Tag Name
// URL: GET /api/tags/posts?tagName=politics&page=1
tagRoutes.get("/posts", getPostsByTag);

export default tagRoutes;
