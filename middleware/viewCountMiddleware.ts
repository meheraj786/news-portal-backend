import { Request, Response, NextFunction } from "express";
import { Post } from "../models/postSchema";
import { PostView } from "../models/postViewSchema";
import { asyncHandler } from "../utils/asyncHandler";

export const trackPostView = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { postId } = req.params;

  // Safety: If postId is not a valid 24-char MongoDB ID (e.g. "search" or "trending"), skip logic
  // This prevents the app from crashing if the route order is slightly wrong or user types garbage
  if (!postId || !postId.match(/^[0-9a-fA-F]{24}$/)) {
    return next();
  }

  // Get IP (Handles standard headers or connection IP)
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Logic: Check for unique view in last 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1. Check Log Book: Has this IP visited this specific post recently?
  const existingView = await PostView.findOne({
    post: postId,
    ip: ip,
    createdAt: { $gte: twentyFourHoursAgo },
  });

  // 2. If it is a NEW unique view
  if (!existingView) {
    // Run updates in parallel for speed
    await Promise.all([
      // A. Add to Log Book (For Trending calculation)
      PostView.create({ post: postId, ip: ip }),

      // B. Increment the Permanent Counter (For "Total Views" display)
      Post.findByIdAndUpdate(postId, { $inc: { views: 1 } }),
    ]);
  }

  // 3. Continue to the controller to fetch the data
  next();
});
