import { Request, Response } from "express";
import { createError } from "../utils/createError"; // Importing your custom error handler
import { NavMenu } from "../models/navMenu";
import { asyncHandler } from "../utils/asyncHandler";

// @desc    Get the main navigation menu
// @route   GET /api/navmenu
// @access  Public
export const getNavMenu = asyncHandler(async (req: Request, res: Response) => {
  const menu = await NavMenu.findOne({}).populate("categoryIds", "name slug");

  if (!menu) {
    // Return empty array if not set up yet
    res.status(200).json([]);
    return;
  }

  // FIX: Safe access with fallback to empty array
  // Prevents crash if 'categoryIds' is undefined/null in the DB
  const categories = (menu.categoryIds || []).filter(Boolean);

  res.status(200).json(categories);
});

// @desc    Update navigation categories (Max 10)
// @route   PUT /api/navmenu
// @access  Private/Admin
export const updateNavMenu = asyncHandler(async (req: Request, res: Response) => {
  const { categoryIds } = req.body;

  if (!categoryIds || categoryIds.length > 10) {
    // Using your custom error util
    throw createError("You can only select up to 10 categories.", 400);
  }

  const menu = await NavMenu.findOneAndUpdate(
    {},
    { categoryIds },
    { new: true, upsert: true, runValidators: true }
  ).populate("categoryIds", "name slug");

  res.status(200).json(menu.categoryIds);
});
