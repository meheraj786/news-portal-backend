import express from "express";
import { getAllTags, getPopularTags, getPostsByTag, getTagById, searchTags } from "../../controllers/tagController";

const tagRoutes = express.Router();

// Public Routes

// 1. Get all tags (with pagination)
tagRoutes.get("/", getAllTags);

// 2. Search tags (query param: ?name=tech)
// Example: /api/v1/tags/search?name=java
tagRoutes.get("/search", searchTags);

// 3. Get popular tags
// Example: /api/v1/tags/popular?limit=5
tagRoutes.get("/popular", getPopularTags);

// 4. Get posts by specific tag name (query param: ?tagName=tech)
// Example: /api/v1/tags/posts?tagName=javascript
tagRoutes.get("/posts", getPostsByTag);

// 5. Get single tag details by ID
// This must be last so it doesn't catch "search" or "popular" as an ID
tagRoutes.get("/:tagId", getTagById);

export default tagRoutes;
