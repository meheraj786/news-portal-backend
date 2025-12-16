import { Request, Response } from "express";
import { postSchema } from "../validators/post";
import { Post } from "../models/postSchema";



export const createPost = async (req: Request, res: Response) => {
  try {
    const parsedData = postSchema.parse(req.body);

    const post = await Post.create({
      ...parsedData,
      views: 0,
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const getPosts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({
      data: posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    res.status(500).json({ message: "Something went wrong" });
  }
};


export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }, // 👈 increment views
      { new: true }
    ).populate("category");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch {
    res.status(500).json({ message: "Something went wrong" });
  }
};


export const updatePost = async (req: Request, res: Response) => {
  try {
    const parsedData = postSchema.partial().parse(req.body);

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      parsedData,
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully" });
  } catch {
    res.status(500).json({ message: "Something went wrong" });
  }
};


export const getTrendingPosts = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const posts = await Post.find({ isDraft: false })
      .sort({ views: -1 })
      .limit(limit)
      .populate("category");

    res.json({
      data: posts,
    });
  } catch {
    res.status(500).json({ message: "Something went wrong" });
  }
};
