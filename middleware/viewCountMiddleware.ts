import { Request, Response, NextFunction } from "express";
import requestIp from "request-ip";
import { Post } from "../models/postSchema";
import { PostView } from "../models/postViewSchema";
import { asyncHandler } from "../utils/asyncHandler";

export const trackPostView = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { postId } = req.params;

  // Safety Check: skip if ID is invalid
  if (!postId || !postId.match(/^[0-9a-fA-F]{24}$/)) {
    return next();
  }

  // 1. Get the Raw IP (This might be ::1, ::ffff:127.0.0.1, or 103.239...)
  let clientIp = requestIp.getClientIp(req) || "unknown";

  // ============================================================
  // IP NORMALIZATION (Force IPv4 style)
  // ============================================================

  // Case A: Localhost IPv6 -> Convert to standard 127.0.0.1
  if (clientIp === "::1") {
    clientIp = "127.0.0.1";
  }

  // Case B: IPv4-Mapped-IPv6 (e.g., ::ffff:192.168.1.1) -> Remove prefix
  // This happens when an IPv4 user connects to a Node server listening on IPv6
  if (clientIp.startsWith("::ffff:")) {
    clientIp = clientIp.replace("::ffff:", "");
  }

  // ============================================================

  // Logic: Check for unique view in last 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existingView = await PostView.findOne({
    post: postId,
    ip: clientIp, // Now we search using the Clean IPv4
    createdAt: { $gte: twentyFourHoursAgo },
  });

  if (!existingView) {
    await Promise.all([
      PostView.create({ post: postId, ip: clientIp }),
      Post.findByIdAndUpdate(postId, { $inc: { views: 1 } }),
    ]);
  }

  next();
});
