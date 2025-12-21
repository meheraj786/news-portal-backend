import { Request, Response } from "express";
import { Types } from "mongoose";
import fs from "fs";
import { Post } from "../models/postSchema";
import { Tag } from "../models/tagSchema";
import { PostView } from "../models/postViewSchema";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";
import { createError } from "../utils/createError";
import Category from "../models/categorySchema";
import { asyncHandler } from "../utils/asyncHandler";

interface CustomRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// ==========================================
// HELPERS
// ==========================================

// 1. Extract file from 'upload.any()' or named fields
const getFile = (req: CustomRequest): Express.Multer.File | undefined => {
  if (Array.isArray(req.files) && req.files.length > 0) return req.files[0];
  if (req.files && typeof req.files === "object") {
    const values = Object.values(req.files);
    if (values.length > 0 && values[0].length > 0) return values[0][0];
  }
  return undefined;
};

// 2. Process Tags (Handle JSON string or Comma-separated)
const processTags = async (tags: string | string[]): Promise<Types.ObjectId[]> => {
  if (!tags) return [];
  let tagList: string[] = [];

  if (Array.isArray(tags)) {
    tagList = tags;
  } else if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      tagList = Array.isArray(parsed) ? parsed : [tags];
    } catch (error) {
      tagList = tags.split(",");
    }
  }

  tagList = tagList.map((t) => t.trim()).filter((t) => t.length > 0);
  if (tagList.length === 0) return [];

  return Promise.all(
    tagList.map(async (tagName) => {
      const tag = await Tag.findOneAndUpdate(
        { name: tagName.toLowerCase() },
        { name: tagName.toLowerCase() },
        { upsert: true, new: true }
      );
      if (!tag) throw createError("Error processing tags", 500);
      return tag._id as Types.ObjectId;
    })
  );
};

// 3. Regex Escape (Prevents crash on search characters like "(", ")", "+")
const escapeRegex = (text: string) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// ==========================================
// CONTROLLERS
// ==========================================

// 1. Create Post
export const createPost = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { title, content, category, subCategory, tags, isDraft, isFavourite } = req.body;
  const file = getFile(req);

  // --- VALIDATION ---
  if (!title || !content || !category) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError("Required fields missing: title, content, category", 400);
  }

  if (title.length < 10) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError("Title must be at least 10 characters long", 400);
  }

  if (!file) throw createError("Image file is required", 400);

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError("Invalid Category ID", 400);
  }

  // --- UPLOAD ---
  const imageData = await uploadToCloudinary(file.path, "news-posts");
  if (fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (e) {}
  }

  try {
    const tagIds = await processTags(tags);

    // FIX: Handle FormData "null"/"undefined" strings for subCategory
    let cleanSubCategory = subCategory;
    if (!subCategory || subCategory === "null" || subCategory === "undefined" || subCategory === "") {
      cleanSubCategory = null;
    }

    const post = new Post({
      title,
      content,
      image: imageData,
      category,
      subCategory: cleanSubCategory,
      tags: tagIds,
      isDraft: isDraft === "true" || isDraft === true,
      isFavourite: isFavourite === "true" || isFavourite === true,
    });

    await post.save();
    res.status(201).json({ success: true, message: "Post created", data: post });
  } catch (error) {
    await deleteFromCloudinary(imageData.publicId);
    throw error;
  }
});

// 2. Update Post (Partial / Dynamic Update)
export const updatePost = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { postId } = req.params;
  const { title, content, category, subCategory, tags, isDraft, isFavourite } = req.body;
  const file = getFile(req);

  // 1. Check if Post Exists
  const oldPost = await Post.findById(postId);
  if (!oldPost) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError("Post not found", 404);
  }

  // 2. Initialize Dynamic Update Object
  const updateData: any = {};

  // --- FIELD PROCESSING ---
  if (title) {
    if (title.length < 10) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw createError("Title must be at least 10 characters long", 400);
    }
    updateData.title = title;
  }

  if (content) updateData.content = content;

  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw createError("Invalid Category ID", 400);
    }
    updateData.category = category;
  }

  // Handle Removal or Update of SubCategory
  if (subCategory !== undefined) {
    if (subCategory === "null" || subCategory === "undefined" || subCategory === "") {
      updateData.subCategory = null;
    } else {
      updateData.subCategory = subCategory;
    }
  }

  if (tags) {
    updateData.tags = await processTags(tags);
  }

  if (isDraft !== undefined) {
    updateData.isDraft = isDraft === "true" || isDraft === true;
  }

  if (isFavourite !== undefined) {
    updateData.isFavourite = isFavourite === "true" || isFavourite === true;
  }

  // --- IMAGE PROCESSING ---
  let imageData = oldPost.image;
  let newImageUploaded = false;

  try {
    if (file) {
      imageData = await uploadToCloudinary(file.path, "news-posts");
      newImageUploaded = true;
      updateData.image = imageData;

      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      }
    }

    // --- PERFORM UPDATE ---
    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true, runValidators: true })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("tags", "name");

    // Cleanup: Delete OLD image if NEW one uploaded
    if (newImageUploaded && oldPost.image?.publicId) {
      await deleteFromCloudinary(oldPost.image.publicId);
    }

    res.status(200).json({ success: true, message: "Post updated", data: updatedPost });
  } catch (error) {
    if (newImageUploaded && imageData.publicId) {
      await deleteFromCloudinary(imageData.publicId);
    }
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw error;
  }
});

// 3. Delete Post
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) throw createError("Post not found", 404);

  if (post.image?.publicId) {
    await deleteFromCloudinary(post.image.publicId);
  }

  await Post.findByIdAndDelete(postId);
  res.status(200).json({ success: true, message: "Post deleted successfully" });
});

// 4. Get Post By ID
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.postId)
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("tags", "name");

  if (!post) throw createError("Post not found", 404);
  res.status(200).json({ success: true, data: post });
});

// 5. Get All Posts (AND Get Posts by Category)
// Supports: ?category=ID OR ?category=slug-name
export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};

  // A. Category Filter (Handles both ID and Slug)
  if (req.query.category) {
    const catInput = req.query.category as string;

    if (Types.ObjectId.isValid(catInput)) {
      filter.category = catInput;
    } else {
      const categoryDoc = await Category.findOne({ slug: catInput });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      } else {
        // Return empty if slug not found
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { total: 0, page, limit, pages: 0 },
        });
      }
    }
  }

  // B. Draft Filter
  if (req.query.isDraft) filter.isDraft = req.query.isDraft === "true";

  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("tags", "name");

  const total = await Post.countDocuments(filter);
  res.status(200).json({
    success: true,
    data: posts,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

// 6. Search Posts (Global Search Bar)
// Searches Title + Category Name (Optional)
export const searchPosts = asyncHandler(async (req: Request, res: Response) => {
  const { query, categoryName } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const searchFilter: any = { isDraft: false };

  if (query) {
    const safeQuery = escapeRegex(query as string);
    searchFilter.title = { $regex: safeQuery, $options: "i" };
  }

  if (categoryName) {
    const safeCat = escapeRegex(categoryName as string);
    const category = await Category.findOne({
      name: { $regex: safeCat, $options: "i" },
    });
    if (category) {
      searchFilter.category = category._id;
    } else {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page, limit, pages: 0 },
      });
    }
  }

  const posts = await Post.find(searchFilter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("category", "name slug")
    .populate("tags", "name");

  const total = await Post.countDocuments(searchFilter);
  res.status(200).json({
    success: true,
    data: posts,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

// 7. Get Trending Posts
export const getTrendingPosts = asyncHandler(async (req: Request, res: Response) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const trendingStats = await PostView.aggregate([
    { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
    { $group: { _id: "$post", viewCount: { $sum: 1 } } },
    { $sort: { viewCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "_id",
        as: "postDetails",
      },
    },
    { $unwind: "$postDetails" },
    {
      $lookup: {
        from: "categories",
        localField: "postDetails.category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        viewCount: 1,
        "postDetails.title": 1,
        "postDetails.image": 1,
        "postDetails.createdAt": 1,
        "postDetails.slug": 1,
        category: {
          name: "$categoryDetails.name",
          slug: "$categoryDetails.slug",
        },
      },
    },
  ]);

  res.status(200).json({ success: true, data: trendingStats });
});

// 8. Get Posts By Category (Dedicated Route)
// Usage: GET /api/posts/category/:slugOrId
export const getPostsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { slugOrId } = req.params; // We expect the route to be /category/:slugOrId
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  let categoryId: any;

  // 1. Determine if input is an ID or a Slug
  if (Types.ObjectId.isValid(slugOrId)) {
    // It's a valid ObjectId, assume it's an ID
    categoryId = slugOrId;
  } else {
    // It's a Slug (e.g., "international-news")
    const category = await Category.findOne({ slug: slugOrId });
    if (!category) {
      throw createError("Category not found", 404);
    }
    categoryId = category._id;
  }

  // 2. Fetch Posts for this Category
  // We strictly filter by this category and usually exclude drafts for public view
  const filter = { category: categoryId, isDraft: false };

  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("tags", "name");

  const total = await Post.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: posts,
    categoryName: slugOrId, // Helpful for frontend to know which category was fetched
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});
