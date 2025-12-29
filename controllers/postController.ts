import { Request, Response } from "express";
import { Types } from "mongoose";
import fs from "fs";
import { Post } from "../models/postSchema";
import { Tag } from "../models/tagSchema";
import { PostView } from "../models/postViewSchema";
import { BreakingNews } from "../models/breakingNewsSchema";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";
import { createError } from "../utils/createError";
import Category from "../models/categorySchema";
import { asyncHandler } from "../utils/asyncHandler";

interface CustomRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// ==========================================
// INTERNAL HELPER: Add to Breaking News List
// ==========================================
const addToBreakingNewsList = async (postId: Types.ObjectId | string) => {
  let breaking = await BreakingNews.findOne();
  if (!breaking) {
    breaking = await BreakingNews.create({ posts: [] });
  }

  const currentList = breaking.posts.map((p) => p.toString());
  const newId = postId.toString();

  const filteredList = currentList.filter((id) => id !== newId);
  filteredList.unshift(newId);

  const finalList = filteredList.slice(0, 5);

  breaking.posts = finalList as any;
  await breaking.save();
};

// ==========================================
// OTHER HELPERS
// ==========================================
const safeDelete = (path: string) => {
  fs.unlink(path, (err) => {
    if (err) console.error(`Failed to delete file at ${path}:`, err);
  });
};

const getFile = (req: CustomRequest): Express.Multer.File | undefined => {
  if (Array.isArray(req.files) && req.files.length > 0) return req.files[0];
  if (req.files && typeof req.files === "object") {
    const values = Object.values(req.files);
    if (values.length > 0 && values[0].length > 0) return values[0][0];
  }
  return undefined;
};

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
  const uniqueNames = [...new Set(tagList.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0))];
  if (uniqueNames.length === 0) return [];
  const bulkOps = uniqueNames.map((name) => ({
    updateOne: { filter: { name }, update: { $set: { name } }, upsert: true },
  }));
  if (bulkOps.length > 0) await Tag.bulkWrite(bulkOps);
  const foundTags = await Tag.find({ name: { $in: uniqueNames } }).select("_id");
  return foundTags.map((tag) => tag._id as Types.ObjectId);
};

const escapeRegex = (text: string) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// ==========================================
// CONTROLLERS
// ==========================================

// 1. Create Post
export const createPost = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { title, content, category, tags, addToBreaking } = req.body;
  const file = getFile(req);

  if (!title || !content || !category) {
    if (file) safeDelete(file.path);
    throw createError("Required fields missing", 400);
  }

  if (title.length < 10) {
    if (file) safeDelete(file.path);
    throw createError("Title must be at least 10 characters long", 400);
  }

  if (!file) throw createError("Image file is required", 400);
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    if (file) safeDelete(file.path);
    throw createError("Invalid Category ID", 400);
  }

  const imageData = await uploadToCloudinary(file.path, "news-posts");
  if (file) safeDelete(file.path);

  try {
    const tagIds = await processTags(tags);
    const post = new Post({
      title,
      content,
      image: imageData,
      category,
      tags: tagIds,
    });

    await post.save();

    if (addToBreaking === "true" || addToBreaking === true) {
      await addToBreakingNewsList(post._id as Types.ObjectId);
    }

    res.status(201).json({ success: true, message: "Post created", data: post });
  } catch (error) {
    await deleteFromCloudinary(imageData.publicId);
    throw error;
  }
});

// 2. Update Post
export const updatePost = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { postId } = req.params;
  const { title, content, category, tags, addToBreaking } = req.body;
  const file = getFile(req);

  const oldPost = await Post.findById(postId);
  if (!oldPost) {
    if (file) safeDelete(file.path);
    throw createError("Post not found", 404);
  }

  const updateData: any = {};
  if (title) {
    if (title.length < 10) throw createError("Title must be 10+ chars", 400);
    updateData.title = title;
  }
  if (content) updateData.content = content;
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) throw createError("Invalid Category", 400);
    updateData.category = category;
  }

  if (tags) updateData.tags = await processTags(tags);

  let imageData = oldPost.image;
  let newImageUploaded = false;

  try {
    if (file) {
      imageData = await uploadToCloudinary(file.path, "news-posts");
      newImageUploaded = true;
      updateData.image = imageData;
      if (file) safeDelete(file.path);
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true, runValidators: true })
      .populate("category", "name slug")
      .populate("tags", "name");

    if (addToBreaking === "true" || addToBreaking === true) {
      if (updatedPost) await addToBreakingNewsList(updatedPost._id as Types.ObjectId);
    }

    if (newImageUploaded && oldPost.image?.publicId) {
      await deleteFromCloudinary(oldPost.image.publicId);
    }

    res.status(200).json({ success: true, message: "Post updated", data: updatedPost });
  } catch (error) {
    if (newImageUploaded && imageData.publicId) await deleteFromCloudinary(imageData.publicId);
    if (file) safeDelete(file.path);
    throw error;
  }
});

// 3. Delete Post
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) throw createError("Post not found", 404);
  if (post.image?.publicId) await deleteFromCloudinary(post.image.publicId);
  await Post.findByIdAndDelete(postId);
  res.status(200).json({ success: true, message: "Post deleted" });
});

// 4. Get Post By ID
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.postId).populate("category tags");
  if (!post) throw createError("Post not found", 404);
  res.status(200).json({ success: true, data: post });
});

// 5. Get All Posts (NO PAGINATION)
export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
  const posts = await Post.find().sort({ createdAt: -1 }).populate("category tags");

  res.status(200).json({ success: true, count: posts.length, data: posts });
});

// 6. Search Posts (NO PAGINATION)
export const searchPosts = asyncHandler(async (req: Request, res: Response) => {
  const { query, categoryName } = req.query;

  const searchFilter: any = {};

  if (query) searchFilter.$text = { $search: query as string };
  if (categoryName) {
    const safeCat = escapeRegex(categoryName as string);
    const category = await Category.findOne({ name: { $regex: safeCat, $options: "i" } });
    if (category) searchFilter.category = category._id;
    else return res.status(200).json({ success: true, data: [] });
  }

  let postsQuery = Post.find(searchFilter);
  if (query) postsQuery = postsQuery.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
  else postsQuery = postsQuery.sort({ createdAt: -1 });

  const posts = await postsQuery.populate("category tags");

  res.status(200).json({
    success: true,
    data: posts,
  });
});

// 7. Get Trending Posts
export const getTrendingPosts = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let finalPosts: any[] = [];
  let collectedIds: Types.ObjectId[] = [];

  const fetchTrending = async (startTime: Date, excludeIds: Types.ObjectId[], limit: number) => {
    return PostView.aggregate([
      { $match: { createdAt: { $gte: startTime }, post: { $nin: excludeIds } } },
      { $group: { _id: "$post", viewCount: { $sum: 1 } } },
      { $sort: { viewCount: -1 } },
      { $limit: limit },
      { $lookup: { from: "posts", localField: "_id", foreignField: "_id", as: "postDetails" } },
      { $unwind: "$postDetails" },
      {
        $lookup: { from: "categories", localField: "postDetails.category", foreignField: "_id", as: "categoryDetails" },
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
          category: { name: "$categoryDetails.name", slug: "$categoryDetails.slug" },
        },
      },
    ]);
  };

  const trending24h = await fetchTrending(twentyFourHoursAgo, [], 3);
  finalPosts = [...trending24h];
  collectedIds = finalPosts.map((p) => p._id);

  if (finalPosts.length < 3) {
    const trending7d = await fetchTrending(sevenDaysAgo, collectedIds, 3 - finalPosts.length);
    finalPosts = [...finalPosts, ...trending7d];
    collectedIds = finalPosts.map((p) => p._id);
  }

  if (finalPosts.length < 3) {
    const fallbackPosts = await Post.find({ _id: { $nin: collectedIds } })
      .sort({ createdAt: -1 })
      .limit(3 - finalPosts.length)
      .populate("category", "name slug");
    finalPosts = [
      ...finalPosts,
      ...fallbackPosts.map((p: any) => ({
        _id: p._id,
        viewCount: 0,
        postDetails: { title: p.title, image: p.image, createdAt: p.createdAt, slug: p.slug },
        category: { name: p.category?.name, slug: p.category?.slug },
      })),
    ];
  }

  res.status(200).json({ success: true, data: finalPosts });
});

// 8. Get Posts by Filter (NO PAGINATION)
export const getPostsByFilter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  let filter: any = {};
  let filterType = "all";
  let filterName = "All Posts";

  if (id !== "all") {
    if (!Types.ObjectId.isValid(id)) throw createError("Invalid ID", 400);
    const category = await Category.findById(id);
    if (category) {
      filter.category = category._id;
      filterType = "category";
      filterName = category.name;
    } else {
      const tag = await Tag.findById(id);
      if (tag) {
        filter.tags = tag._id;
        filterType = "tag";
        filterName = tag.name;
      } else throw createError("Not found", 404);
    }
  }

  const posts = await Post.find(filter).sort({ createdAt: -1 }).populate("category tags");

  res.status(200).json({
    success: true,
    data: posts,
    meta: { filterType, filterName, filterId: id },
  });
});

// 9. Get Breaking News
export const getBreakingNews = asyncHandler(async (req: Request, res: Response) => {
  const breaking = await BreakingNews.findOne().populate("posts", "title slug image createdAt");

  if (!breaking) {
    return res.status(200).json({ success: true, data: [] });
  }
  res.status(200).json({ success: true, data: breaking.posts });
});

// 10. Remove From Breaking News
export const removeFromBreakingNews = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;

  const breaking = await BreakingNews.findOne();

  if (!breaking) {
    return res.status(404).json({ success: false, message: "Breaking news list not found" });
  }

  const originalLength = breaking.posts.length;
  breaking.posts = breaking.posts.filter((id) => id.toString() !== postId) as any;

  if (breaking.posts.length !== originalLength) {
    await breaking.save();
  }

  res.status(200).json({ success: true, message: "Removed from Breaking News", data: breaking.posts });
});
