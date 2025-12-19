import { Request, Response } from "express";
import { Tag } from "../models/tagSchema";
import { Post } from "../models/postSchema";
import { createError } from "../utils/createError";
import { asyncHandler } from "../utils/asyncHandler";

// 1. Get All Tags (with Post Count calculated on the fly)
export const getAllTags = asyncHandler(async (req: Request, res: Response) => {
  const tags = await Tag.find().sort({ createdAt: -1 });

  const tagsWithCount = await Promise.all(
    tags.map(async (tag) => {
      // We calculate the count here instead of storing it
      const count = await Post.countDocuments({ tags: tag._id });
      return {
        _id: tag._id,
        name: tag.name,
        postCount: count,
      };
    })
  );

  res.status(200).json({ success: true, data: tagsWithCount });
});

// 2. Get Single Tag (Find tag -> Find posts with that tag)
export const getPostsByTag = asyncHandler(async (req: Request, res: Response) => {
  const { tagName } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  if (!tagName) throw createError("Tag name is required", 400);

  const tag = await Tag.findOne({ name: (tagName as string).toLowerCase().trim() });

  if (!tag) {
    return res.status(200).json({
      success: true,
      tagName: tagName,
      data: [],
      pagination: { total: 0, page, limit, pages: 0 },
    });
  }

  // Find posts where the 'tags' array contains this tag._id
  const posts = await Post.find({ tags: tag._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("category", "name slug")
    .populate("tags", "name");

  const total = await Post.countDocuments({ tags: tag._id });

  res.status(200).json({
    success: true,
    tagName: tag.name,
    data: posts,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});
