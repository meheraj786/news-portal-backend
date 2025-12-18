import { Request, Response } from "express";
import { NavMenu } from "../models/navMenu";

/**
 * GET: Fetch the nav menu with full category data
 */
export const getNavMenu = async (req: Request, res: Response) => {
  try {
    // Find the single config document and populate category details
    const menu = await NavMenu.findOne({}).populate("categoryIds", "name slug image"); // Adjust fields as needed

    if (!menu) {
      return res.status(200).json({ categoryIds: [] });
    }

    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: "Error fetching navigation menu", error });
  }
};

/**
 * PUT/POST: Update the navigation categories (Max 10)
 */
export const updateNavMenu = async (req: Request, res: Response) => {
  try {
    const { categoryIds } = req.body;

    // 1. Manual check for the limit
    if (!Array.isArray(categoryIds) || categoryIds.length > 10) {
      return res.status(400).json({ message: "Provide an array of max 10 IDs." });
    }

    // 2. Update the existing document or create it if it doesn't exist (upsert)
    const updatedMenu = await NavMenu.findOneAndUpdate(
      {},
      { categoryIds },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(updatedMenu);
  } catch (error: any) {
    res.status(500).json({ message: "Error updating navigation menu", error: error.message });
  }
};
