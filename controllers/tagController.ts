import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/createError";
import { Tag } from "../models/tagSchema";

// 1. Get All Tags
export const getAllTags = async (req: Request, res: Response, next: NextFunction) => {
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
};

// 2. Get Single Tag
export const getTagById = async (req: Request, res: Response, next: NextFunction) => {
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
};

// 3. Search Tags
export const searchTags = async (req: Request, res: Response, next: NextFunction) => {
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
};

// 4. Get Posts by Tag
export const getPostsByTag = async (req: Request, res: Response, next: NextFunction) => {
  const { tagName } = req.query;
  if (!tagName || typeof tagName !== "string") {
    throw createError("Tag name is required", 400);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const tag = await Tag.findOne({
    name: tagName.trim().toLowerCase(),
  }).populate({
    path: "posts",
    match: { isDraft: false },
    options: { sort: { createdAt: -1 }, skip, limit },
    populate: [{ path: "category" }, { path: "subcategory" }, { path: "tags" }],
  });

  if (!tag) {
    return res.status(200).json({
      success: true,
      tag: null,
      posts: [],
      postCount: 0,
      pagination: { total: 0, pages: 0, currentPage: page, limit },
    });
  }

  res.status(200).json({
    success: true,
    tag: { _id: tag._id, name: tag.name, postCount: tag.posts.length },
    posts: tag.posts,
    pagination: { total: tag.posts.length, pages: Math.ceil(tag.posts.length / limit), currentPage: page, limit },
  });
};

// 5. Get Popular Tags
export const getPopularTags = async (req: Request, res: Response, next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const tags = await Tag.find().select("name posts createdAt").sort({ posts: -1 }).limit(limit);

  const tagsWithCount = tags.map((tag) => ({
    _id: tag._id,
    name: tag.name,
    postCount: tag.posts.length,
    createdAt: tag.createdAt,
  }));

  res.status(200).json({ success: true, data: tagsWithCount });
};
