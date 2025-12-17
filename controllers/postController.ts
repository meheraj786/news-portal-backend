import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import fs from "fs";
import { Post } from "../models/postSchema";
import { Tag } from "../models/tagSchema";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";
import { createError } from "../utils/createError";

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

// Helper: Process tags
const processTags = async (tags: string | string[]): Promise<Types.ObjectId[]> => {
  if (!tags) return [];
  const tagList = Array.isArray(tags) ? tags : [tags];
  if (tagList.length === 0) return [];

  const tagIds = await Promise.all(
    tagList.map(async (tagName) => {
      const tag = await Tag.findOneAndUpdate(
        { name: tagName.trim().toLowerCase() },
        { name: tagName.trim().toLowerCase() },
        { upsert: true, new: true }
      );
      if (!tag) throw createError("Error processing tags", 500);
      return tag._id as Types.ObjectId;
    })
  );
  return tagIds;
};

// 1. Create Post
export const createPost = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { title, content, category, subCategory, tags, isDraft, isFavourite } = req.body;
  const file = getFile(req);

  if (!title || !content || !category || !subCategory) {
    throw createError("Title, content, category and subCategory are required", 400);
  }

  if (!file) {
    throw createError("Image file is required", 400);
  }

  // 1. Upload Image
  const imageData = await uploadToCloudinary(file.path, "news-posts");
  if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

  // 2. Process Tags & Save (Wrapped in try-catch ONLY for cleanup safety)
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
      subCategory,
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
    // CLEANUP: If DB fails, delete the image we just uploaded
    await deleteFromCloudinary(imageData.publicId);
    throw error; // Pass to global error handler
  }
};

// 2. Update Post
export const updatePost = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  const { title, content, category, subCategory, tags, isDraft } = req.body;
  const file = getFile(req);

  const oldPost = await Post.findById(postId);
  if (!oldPost) throw createError("Post not found", 404);

  let imageData = oldPost.image;

  // We use a mini try-catch here just for image replacement logic safety
  try {
    if (file) {
      if (oldPost.image?.publicId) await deleteFromCloudinary(oldPost.image.publicId);
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
};

// 3. Delete Post
export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) throw createError("Post not found", 404);

  if (post.image?.publicId) await deleteFromCloudinary(post.image.publicId);

  await Post.findByIdAndDelete(postId);
  await Tag.updateMany({ _id: { $in: post.tags } }, { $pull: { posts: postId } });

  res.status(200).json({ success: true, message: "Post deleted successfully" });
};

// 4. Get Post By ID
export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  const post = await Post.findByIdAndUpdate(req.params.postId, { $inc: { views: 1 } }, { new: true }).populate([
    "category",
    "subCategory",
    "tags",
  ]);

  if (!post) throw createError("Post not found", 404);
  res.status(200).json({ success: true, data: post });
};

// 5. Get All
export const getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
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
};
