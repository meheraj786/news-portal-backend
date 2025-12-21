import { Request, Response, NextFunction } from "express";
import requestIp from "request-ip";
import mongoose from "mongoose";
import { Post } from "../models/postSchema";
import { PostView } from "../models/postViewSchema";
import { asyncHandler } from "../utils/asyncHandler";

export const trackPostView = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // WRAP IN TRY/CATCH: So DB errors don't block the user from reading the post
  try {
    const postId = req.params.id || req.params.postId;

    // Safety: Skip if ID is missing or invalid MongoID
    if (!postId || !mongoose.isValidObjectId(postId)) {
      return next();
    }

    // 1. Get User Identity
    const userAgent = req.headers["user-agent"] || "unknown";
    let clientIp = requestIp.getClientIp(req) || "unknown";

    // Normalize IP
    if (clientIp === "::1") clientIp = "127.0.0.1";
    if (clientIp.startsWith("::ffff:")) clientIp = clientIp.replace("::ffff:", "");

    // 2. Check Uniqueness (Last 24 Hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existingView = await PostView.findOne({
      post: postId,
      ip: clientIp,
      userAgent: userAgent,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    // 3. Record View
    if (!existingView) {
      await Promise.all([
        // Log for Dashboard/Trending
        PostView.create({
          post: postId,
          ip: clientIp,
          userAgent: userAgent,
        }),
        // Increment Count for Post Details
        Post.findByIdAndUpdate(postId, { $inc: { views: 1 } }),
      ]);
    }
  } catch (error) {
    // SILENT FAIL: Log error but allow request to proceed
    console.error("View Tracking Error (Ignored):", error);
  }

  // Always proceed to the controller
  next();
});
