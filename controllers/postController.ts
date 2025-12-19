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

// Helper to extract file from request
const getFile = (req: CustomRequest): Express.Multer.File | undefined => {
  if (Array.isArray(req.files) && req.files.length > 0) return req.files[0];
  if (req.files && typeof req.files === "object") {
    const values = Object.values(req.files);
    if (values.length > 0 && values[0].length > 0) return values[0][0];
  }
  return undefined;
};

// Helper to process tags into IDs
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

// ==========================================
// 1. Create Post
// ==========================================
export const createPost = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { title, content, category, subCategory, tags, isDraft, isFavourite } = req.body;
  const file = getFile(req);

  // --- VALIDATION START ---
  // 1. Check required fields
  if (!title || !content || !category) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError("Required fields missing: title, content, category", 400);
  }

  // 2. Check Title Length
  if (title.length < 10) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError("Title must be at least 10 characters long", 400);
  }

  // 3. Check Image presence
  if (!file) throw createError("Image file is required", 400);

  // 4. Check Category Validity
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError("Invalid Category ID", 400);
  }
  // --- VALIDATION END ---

  // Upload to Cloudinary
  const imageData = await uploadToCloudinary(file.path, "news-posts");

  // Clean up local file immediately
  if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

  try {
    let tagIds: Types.ObjectId[] = [];
    if (tags) {
      tagIds = await processTags(tags);
    }

    const post = new Post({
      title,
      content,
      image: imageData,
      category,
      subCategory: subCategory !== undefined ? subCategory : null,
      tags: tagIds,
      isDraft: isDraft === "true" || isDraft === true,
      isFavourite: isFavourite === "true" || isFavourite === true,
    });

    await post.save();

    res.status(201).json({ success: true, message: "Post created", data: post });
  } catch (error) {
    // Rollback: If DB save fails, remove image from Cloudinary
    await deleteFromCloudinary(imageData.publicId);
    throw error;
  }
});

// ==========================================
// 2. Update Post
// ==========================================
export const updatePost = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { postId } = req.params;
  const { title, content, category, subCategory, tags, isDraft } = req.body;
  const file = getFile(req);

  // --- VALIDATION START ---
  // 1. Check Title Length (only if title is being updated)
  if (title && title.length < 10) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError("Title must be at least 10 characters long", 400);
  }

  const oldPost = await Post.findById(postId);
  if (!oldPost) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw createError("Post not found", 404);
  }

  // 2. Check Category Validity (only if category is being updated)
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw createError("Invalid Category ID", 400);
    }
  }
  // --- VALIDATION END ---

  let imageData = oldPost.image;
  let newImageUploaded = false;

  try {
    // Handle New Image Upload
    if (file) {
      imageData = await uploadToCloudinary(file.path, "news-posts");
      newImageUploaded = true;
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    // Handle Tags
    let newTagIds: Types.ObjectId[] = [];
    if (tags) {
      newTagIds = await processTags(tags);
    } else {
      // Keep existing tags if not provided
      newTagIds = (oldPost.tags as unknown as Types.ObjectId[]) || [];
    }

    // Perform Update
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        title,
        content,
        image: imageData,
        category,
        subCategory,
        tags: newTagIds,
        isDraft: isDraft !== undefined ? isDraft : oldPost.isDraft,
      },
      // IMPORTANT: runValidators ensures Schema rules (minlength, etc.) apply
      { new: true, runValidators: true }
    )
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("tags", "name");

    // Cleanup: Delete OLD image from Cloudinary if a NEW one was uploaded
    if (file && oldPost.image?.publicId) {
      await deleteFromCloudinary(oldPost.image.publicId);
    }

    res.status(200).json({ success: true, message: "Post updated", data: updatedPost });
  } catch (error) {
    // Rollback: If DB update fails, delete the NEW image we just uploaded
    if (newImageUploaded && imageData.publicId) {
      await deleteFromCloudinary(imageData.publicId);
    }
    // Ensure local file is gone
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw error;
  }
});

// ==========================================
// 3. Delete Post
// ==========================================
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) throw createError("Post not found", 404);

  // Delete image from Cloudinary
  if (post.image?.publicId) {
    await deleteFromCloudinary(post.image.publicId);
  }

  await Post.findByIdAndDelete(postId);

  res.status(200).json({ success: true, message: "Post deleted successfully" });
});

// ==========================================
// 4. Get Post By ID
// ==========================================
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.postId)
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("tags", "name");

  if (!post) throw createError("Post not found", 404);
  res.status(200).json({ success: true, data: post });
});

// ==========================================
// 5. Get All Posts (Paginated + Filter)
// ==========================================
export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.category) filter.category = req.query.category;
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

// ==========================================
// 6. Search Posts
// ==========================================
export const searchPosts = asyncHandler(async (req: Request, res: Response) => {
  const { query, categoryName } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const searchFilter: any = { isDraft: false };

  if (query) {
    searchFilter.title = { $regex: query, $options: "i" };
  }

  if (categoryName) {
    const category = await Category.findOne({
      name: { $regex: categoryName, $options: "i" },
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
    .populate("subCategory", "name slug")
    .populate("tags", "name");

  const total = await Post.countDocuments(searchFilter);
  res.status(200).json({
    success: true,
    data: posts,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

// ==========================================
// 7. Get Trending Posts
// ==========================================
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
      $project: {
        _id: 1,
        viewCount: 1,
        "postDetails.title": 1,
        "postDetails.image": 1,
        "postDetails.category": 1,
        "postDetails.createdAt": 1,
      },
    },
  ]);

  res.status(200).json({ success: true, data: trendingStats });
});
