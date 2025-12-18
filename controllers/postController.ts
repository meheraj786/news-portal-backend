import { Request, Response } from "express";
import { Types } from "mongoose";
import fs from "fs";
import { Post } from "../models/postSchema";
import { Tag } from "../models/tagSchema";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";
import { createError } from "../utils/createError";
import Category from "../models/categorySchema";
import { asyncHandler } from "../utils/asyncHandler";

// Interface for Request with Files
interface CustomRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Helper: Get file (Auto-detection)
const getFile = (req: CustomRequest): Express.Multer.File | undefined => {
  if (Array.isArray(req.files) && req.files.length > 0) return req.files[0];
  if (req.files && typeof req.files === "object") {
    const values = Object.values(req.files);
    if (values.length > 0 && values[0].length > 0) return values[0][0];
  }
  return undefined;
};

// Helper: Process tags (FIXED to handle JSON Strings)
const processTags = async (tags: string | string[]): Promise<Types.ObjectId[]> => {
  if (!tags) return [];

  let tagList: string[] = [];

  // Case 1: Input is already an array (e.g. ["news", "tech"])
  if (Array.isArray(tags)) {
    tagList = tags;
  }
  // Case 2: Input is a string (e.g. "['news','tech']" OR "news, tech")
  else if (typeof tags === "string") {
    try {
      // Try to parse it as JSON (This fixes your issue)
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        tagList = parsed;
      } else {
        tagList = [tags];
      }
    } catch (error) {
      // If JSON parse fails, assume it is comma-separated (e.g. "news, politics")
      tagList = tags.split(",");
    }
  }

  // Clean up: Trim whitespace and remove empty strings
  tagList = tagList.map((t) => t.trim()).filter((t) => t.length > 0);

  if (tagList.length === 0) return [];

  const tagIds = await Promise.all(
    tagList.map(async (tagName) => {
      const tag = await Tag.findOneAndUpdate(
        { name: tagName.toLowerCase() }, // Removed .trim() here as we did it above
        { name: tagName.toLowerCase() },
        { upsert: true, new: true }
      );
      if (!tag) throw createError("Error processing tags", 500);
      return tag._id as Types.ObjectId;
    })
  );
  return tagIds;
};

// 1. Create Post
export const createPost = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { title, content, category, subCategory, tags, isDraft, isFavourite } = req.body;
  const file = getFile(req);

  if (!title || !content || !category) {
    throw createError("Title, content and category are required", 400);
  }

  if (!file) {
    throw createError("Image file is required", 400);
  }

  // 1. Upload Image
  const imageData = await uploadToCloudinary(file.path, "news-posts");
  if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

  // 2. Process Tags & Save
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

    if (tagIds.length > 0) {
      await Tag.updateMany({ _id: { $in: tagIds } }, { $push: { posts: post._id } });
    }

    res.status(201).json({ success: true, message: "Post created successfully", data: post });
  } catch (error) {
    // SAFETY: If DB fails, delete the image we just uploaded
    await deleteFromCloudinary(imageData.publicId);
    throw error;
  }
});

// 2. Update Post
export const updatePost = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { postId } = req.params;
  const { title, content, category, subCategory, tags, isDraft } = req.body;
  const file = getFile(req);

  const oldPost = await Post.findById(postId);
  if (!oldPost) throw createError("Post not found", 404);

  let imageData = oldPost.image;

  try {
    if (file) {
      // Delete old image
      if (oldPost.image?.publicId) await deleteFromCloudinary(oldPost.image.publicId);
      // Upload new image
      imageData = await uploadToCloudinary(file.path, "news-posts");
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    let newTagIds: Types.ObjectId[] = [];
    if (tags) {
      newTagIds = await processTags(tags);
    } else {
      newTagIds = (oldPost.tags as unknown as Types.ObjectId[]) || [];
    }

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
      { new: true }
    ).populate(["category", "subCategory", "tags"]);

    // Sync Tags
    const oldTagIds = oldPost.tags;
    await Tag.updateMany({ _id: { $in: oldTagIds } }, { $pull: { posts: postId } });
    await Tag.updateMany({ _id: { $in: newTagIds } }, { $push: { posts: postId } });

    res.status(200).json({ success: true, message: "Post updated successfully", data: updatedPost });
  } catch (error) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw error;
  }
});

// 3. Delete Post
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) throw createError("Post not found", 404);

  // Always delete image from Cloudinary
  if (post.image?.publicId) {
    await deleteFromCloudinary(post.image.publicId);
  }

  await Post.findByIdAndDelete(postId);
  await Tag.updateMany({ _id: { $in: post.tags } }, { $pull: { posts: postId } });

  res.status(200).json({ success: true, message: "Post deleted successfully" });
});

// 4. Get Post By ID
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findByIdAndUpdate(req.params.postId, { $inc: { views: 1 } }, { new: true }).populate([
    "category",
    "subCategory",
    "tags",
  ]);
  if (!post) throw createError("Post not found", 404);
  res.status(200).json({ success: true, data: post });
});

// 5. Get All
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
    .populate(["category", "subCategory", "tags"]);

  const total = await Post.countDocuments(filter);
  res.status(200).json({
    success: true,
    data: posts,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

// 6. Search Posts
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
    .populate(["category", "subCategory", "tags"]);

  const total = await Post.countDocuments(searchFilter);
  res.status(200).json({
    success: true,
    data: posts,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});
