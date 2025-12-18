import { Request, Response } from "express";
import { createError } from "../utils/createError";
import { Tag } from "../models/tagSchema";
import { asyncHandler } from "../utils/asyncHandler";

// 1. Get All Tags
export const getAllTags = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const tags = await Tag.find().select("name posts createdAt").skip(skip).limit(limit);
  const total = await Tag.countDocuments();

  const tagsWithCount = tags.map((tag) => ({
    _id: tag._id,
    name: tag.name,
    postCount: tag.posts.length,
    createdAt: tag.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: tagsWithCount,
    pagination: { total, pages: Math.ceil(total / limit), currentPage: page, limit },
  });
});

// 2. Get Single Tag
export const getTagById = asyncHandler(async (req: Request, res: Response) => {
  const { tagId } = req.params;
  const tag = await Tag.findById(tagId).populate({
    path: "posts",
    match: { isDraft: false },
    populate: [{ path: "category" }, { path: "subcategory" }],
  });

  if (!tag) throw createError("Tag not found", 404);

  res.status(200).json({
    success: true,
    data: {
      _id: tag._id,
      name: tag.name,
      postCount: tag.posts.length,
      posts: tag.posts,
      createdAt: tag.createdAt,
    },
  });
});

// 3. Search Tags
export const searchTags = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.query;
  if (!name || typeof name !== "string") {
    throw createError("Tag name is required for search", 400);
  }

  const tags = await Tag.find({
    name: { $regex: name.toLowerCase(), $options: "i" },
  }).select("name posts createdAt");

  const tagsWithCount = tags.map((tag) => ({
    _id: tag._id,
    name: tag.name,
    postCount: tag.posts.length,
    createdAt: tag.createdAt,
  }));

  res.status(200).json({ success: true, count: tagsWithCount.length, data: tagsWithCount });
});

// 4. Get Posts by Tag (FIXED PAGINATION LOGIC)
export const getPostsByTag = asyncHandler(async (req: Request, res: Response) => {
  const { tagName } = req.query;
  if (!tagName || typeof tagName !== "string") {
    throw createError("Tag name is required", 400);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // 1. Find the tag first (without population) to check existence and get total ID count
  const tag = await Tag.findOne({ name: tagName.trim().toLowerCase() });

  if (!tag) {
    return res.status(200).json({
      success: true,
      tag: null,
      posts: [],
      postCount: 0,
      pagination: { total: 0, pages: 0, currentPage: page, limit },
    });
  }

  // 2. Get the REAL total count of posts for this tag
  const total = tag.posts.length;

  // 3. Now Populate only the specific page of posts we need
  await tag.populate({
    path: "posts",
    match: { isDraft: false },
    options: { sort: { createdAt: -1 }, skip, limit },
    populate: [{ path: "category" }, { path: "subcategory" }, { path: "tags" }],
  });

  res.status(200).json({
    success: true,
    tag: { _id: tag._id, name: tag.name, postCount: total }, // Return correct total
    posts: tag.posts,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    },
  });
});

// 5. Get Popular Tags
export const getPopularTags = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  // MongoDB doesn't sort by array length easily in standard find().
  // We fetch tags, sort in JS (fine for small datasets) or use aggregation.
  // Standard find() approach (Simple, but strictly sorts by 'posts' field content not length,
  // unless using aggregate. For now, assuming you want simple logic):

  // BETTER APPROACH: Use Aggregation for accurate "Popular" sorting by size
  const tags = await Tag.aggregate([
    {
      $project: {
        name: 1,
        posts: 1,
        createdAt: 1,
        postCount: { $size: "$posts" }, // Calculate size
      },
    },
    { $sort: { postCount: -1 } }, // Sort by size descending
    { $limit: limit },
  ]);

  res.status(200).json({ success: true, data: tags });
});
