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

// 2. Process Tags (OPTIMIZED: Uses BulkWrite)
// Fixes the N+1 problem by saving all tags in 2 DB calls instead of loop.
const processTags = async (tags: string | string[]): Promise<Types.ObjectId[]> => {
  if (!tags) return [];

  // A. Parse Input
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

  // B. Normalize (Trim, Lowercase, Unique)
  const uniqueNames = [...new Set(tagList.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0))];

  if (uniqueNames.length === 0) return [];

  // C. BulkWrite (Upsert all tags at once)
  const bulkOps = uniqueNames.map((name) => ({
    updateOne: {
      filter: { name },
      update: { $set: { name } },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await Tag.bulkWrite(bulkOps);
  }

  // D. Fetch IDs (Get all IDs in one read)
  const foundTags = await Tag.find({ name: { $in: uniqueNames } }).select("_id");

  return foundTags.map((tag) => tag._id as Types.ObjectId);
};

// 3. Regex Escape (Still needed for Category Name search)
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

// 5. Get All Posts (No Pagination - Feed)
export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
  const filter: any = {};

  // We ONLY keep the 'isDraft' filter for Admin/Public safety
  if (req.query.isDraft) {
    filter.isDraft = req.query.isDraft === "true";
  } else {
    // Default: Only show published posts to public
    filter.isDraft = false;
  }

  // Fetch ALL posts (Sorted by Newest)
  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("tags", "name");

  res.status(200).json({
    success: true,
    count: posts.length, // Helpful for frontend
    data: posts,
  });
});

// 6. Search Posts (Optimized with $text index)
export const searchPosts = asyncHandler(async (req: Request, res: Response) => {
  const { query, categoryName } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const searchFilter: any = { isDraft: false };

  // A. TEXT SEARCH (Uses Index - Fast)
  if (query) {
    searchFilter.$text = { $search: query as string };
  }

  // B. CATEGORY FILTER (Uses Regex - Safe for small collections)
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

  // C. Sorting Strategy
  let postsQuery = Post.find(searchFilter);

  if (query) {
    // Relevance Sort if searching by text
    postsQuery = postsQuery.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
  } else {
    // Date Sort if just filtering by category
    postsQuery = postsQuery.sort({ createdAt: -1 });
  }

  const posts = await postsQuery.skip(skip).limit(limit).populate("category", "name slug").populate("tags", "name");

  const total = await Post.countDocuments(searchFilter);
  res.status(200).json({
    success: true,
    data: posts,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

// 7. Get Trending Posts (Cascading: 24h -> 7 Days -> Latest)
export const getTrendingPosts = asyncHandler(async (req: Request, res: Response) => {
  // Define Time Windows
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let finalPosts: any[] = [];
  let collectedIds: Types.ObjectId[] = [];

  // ==========================================
  // HELPER: Aggregation Query Builder
  // ==========================================
  const fetchTrending = async (startTime: Date, excludeIds: Types.ObjectId[], limit: number) => {
    return PostView.aggregate([
      // 1. Filter by Time Window & Exclude already found posts
      {
        $match: {
          createdAt: { $gte: startTime },
          post: { $nin: excludeIds }, // Don't fetch duplicates
        },
      },
      // 2. Group by Post & Count Views
      { $group: { _id: "$post", viewCount: { $sum: 1 } } },
      // 3. Sort by Highest Views
      { $sort: { viewCount: -1 } },
      // 4. Limit
      { $limit: limit },
      // 5. Populate Details
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "_id",
          as: "postDetails",
        },
      },
      { $unwind: "$postDetails" },
      // 6. Ensure Post is NOT a draft
      { $match: { "postDetails.isDraft": false } },
      // 7. Populate Category
      {
        $lookup: {
          from: "categories",
          localField: "postDetails.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      // 8. Format Output
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
  };

  // ==========================================
  // STEP 1: LAST 24 HOURS (The "Hot" List)
  // ==========================================
  const trending24h = await fetchTrending(twentyFourHoursAgo, [], 4);

  finalPosts = [...trending24h];
  collectedIds = finalPosts.map((p) => p._id);

  // ==========================================
  // STEP 2: LAST 7 DAYS (The "Warm" List)
  // ==========================================
  // Only run if we don't have 4 posts yet
  if (finalPosts.length < 4) {
    const needed = 4 - finalPosts.length;
    const trending7d = await fetchTrending(sevenDaysAgo, collectedIds, needed);

    finalPosts = [...finalPosts, ...trending7d];
    collectedIds = finalPosts.map((p) => p._id);
  }

  // ==========================================
  // STEP 3: LATEST POSTS (The "Fresh" Fallback)
  // ==========================================
  // Only run if we STILL don't have 4 posts (Brand new site or zero traffic)
  if (finalPosts.length < 4) {
    const needed = 4 - finalPosts.length;

    const fallbackPosts = await Post.find({
      _id: { $nin: collectedIds },
      isDraft: false,
    })
      .sort({ createdAt: -1 })
      .limit(needed)
      .populate("category", "name slug");

    // Format fallback to match aggregation structure
    const formattedFallback = fallbackPosts.map((post: any) => ({
      _id: post._id,
      viewCount: 0,
      postDetails: {
        title: post.title,
        image: post.image,
        createdAt: post.createdAt,
        slug: post.slug, // Ensure slug is included if your schema has it (or generated on frontend)
      },
      category: {
        name: post.category?.name || "Uncategorized",
        slug: post.category?.slug || "",
      },
    }));

    finalPosts = [...finalPosts, ...formattedFallback];
  }

  res.status(200).json({ success: true, data: finalPosts });
});

// 8. Get Posts by Filter (Smart Endpoint: All / Category / Tag)
// Route: GET /api/posts/filter/:id
// Features: Auto-detects Category vs Tag, handles "all", Pagination enabled.
export const getPostsByFilter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // 1. Initialize Default Filter (Show all public posts)
  let filter: any = { isDraft: false };
  let filterType = "all";
  let filterName = "All Posts";

  // 2. Logic Handler
  if (id === "all") {
    // Keep defaults (returns all posts)
  } else {
    // Validate MongoDB ID format
    if (!Types.ObjectId.isValid(id)) {
      throw createError("Invalid ID format. Must be a valid MongoDB ObjectId or 'all'.", 400);
    }

    // A. Check if it's a CATEGORY
    const category = await Category.findById(id);

    if (category) {
      filter.category = category._id;
      filterType = "category";
      filterName = category.name;
    } else {
      // B. If not Category, check if it's a TAG
      const tag = await Tag.findById(id);

      if (tag) {
        filter.tags = tag._id;
        filterType = "tag";
        filterName = tag.name;
      } else {
        // C. Neither found
        throw createError("No Category or Tag found with this ID", 404);
      }
    }
  }

  // 3. Fetch Posts with Pagination
  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("tags", "name");

  const total = await Post.countDocuments(filter);

  // 4. Response with Metadata
  res.status(200).json({
    success: true,
    data: posts,
    meta: {
      filterType, // "category", "tag", or "all"
      filterName, // e.g., "Sports" or "Tech"
      filterId: id,
    },
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});
