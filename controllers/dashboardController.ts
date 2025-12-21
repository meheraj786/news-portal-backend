import { Request, Response } from "express";
import { Post } from "../models/postSchema";
import { PostView } from "../models/postViewSchema";
import Category from "../models/categorySchema";
import { asyncHandler } from "../utils/asyncHandler";

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  // ==========================================
  // 1. Define Time Ranges
  // ==========================================
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // ==========================================
  // 2. Fetch Data in Parallel (Fastest Way)
  // ==========================================
  const [totalPosts, totalCategories, totalViews, viewsLast24h, viewsPrev24h] = await Promise.all([
    // A. Basic Counts
    Post.countDocuments(),
    Category.countDocuments(),

    // B. FIX: Total Views (Sum of 'views' from Post model)
    // We use Aggregate here because PostView deletes logs after 7 days.
    // The Post model holds the persistent "All-Time" view count.
    Post.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]).then((result) => result[0]?.total || 0),

    // C. Traffic Analytics
    // Views in the last 24 hours (Specific logs are fine here)
    PostView.countDocuments({
      createdAt: { $gte: oneDayAgo },
    }),

    // Views from 48h ago to 24h ago (for comparison)
    PostView.countDocuments({
      createdAt: { $gte: twoDaysAgo, $lt: oneDayAgo },
    }),
  ]);

  // ==========================================
  // 3. Calculate Growth Percentage
  // ==========================================
  let growthPercent = 0;

  if (viewsPrev24h === 0) {
    // If yesterday had 0 views, and today has views, growth is 100%
    growthPercent = viewsLast24h > 0 ? 100 : 0;
  } else {
    // Formula: ((New - Old) / Old) * 100
    growthPercent = ((viewsLast24h - viewsPrev24h) / viewsPrev24h) * 100;
  }

  // Round to 1 decimal place (e.g., 15.4)
  growthPercent = Math.round(growthPercent * 10) / 10;

  // ==========================================
  // 4. Send Response
  // ==========================================
  res.status(200).json({
    success: true,
    data: {
      totalPosts,
      totalCategories,
      totalViews, // Now returns correct All-Time views
      traffic24h: {
        count: viewsLast24h,
        previousCount: viewsPrev24h,
        growthPercent: growthPercent,
        isPositive: growthPercent >= 0, // Frontend can use this for Green/Red arrows
      },
    },
  });
});
