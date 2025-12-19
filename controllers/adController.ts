import { Request, Response } from "express";
import fs from "fs";
import { Ad } from "../models/adSchema";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";
import { createError } from "../utils/createError";
import { asyncHandler } from "../utils/asyncHandler";

// Interface for Request with Files
interface CustomRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Helper: Get file
const getFile = (req: CustomRequest): Express.Multer.File | undefined => {
  if (Array.isArray(req.files) && req.files.length > 0) return req.files[0];
  if (req.files && typeof req.files === "object") {
    const values = Object.values(req.files);
    if (values.length > 0 && values[0].length > 0) return values[0][0];
  }
  return undefined;
};

// 1. Create Ad
export const createAd = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { title, type, link, isActive } = req.body;
  const file = getFile(req);

  if (!title || !type || !link) {
    throw createError("Title, type, and link are required", 400);
  }

  // Validate Enum manually if needed, though Mongoose does it too
  if (!["horizontal", "square"].includes(type)) {
    throw createError("Invalid type. Must be 'horizontal' or 'square'", 400);
  }

  if (!file) {
    throw createError("Ad image is required", 400);
  }

  // Upload to a separate folder for ads
  const imageData = await uploadToCloudinary(file.path, "news-ads");
  if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

  try {
    const ad = await Ad.create({
      title,
      type,
      link,
      image: imageData,
      isActive: isActive === "true" || isActive === true,
    });

    res.status(201).json({ success: true, message: "Ad created successfully", data: ad });
  } catch (error) {
    // Cleanup image if DB fails
    await deleteFromCloudinary(imageData.publicId);
    throw error;
  }
});

// 2. Get All Ads (Public & Admin)
export const getAllAds = asyncHandler(async (req: Request, res: Response) => {
  const { type, isActive } = req.query;

  const filter: any = {};
  if (type) filter.type = type;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  // Ads usually don't need pagination as there are few of them,
  // but we sort by newest first.
  const ads = await Ad.find(filter).sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: ads.length, data: ads });
});

// 3. Update Ad
export const updateAd = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { title, type, link, isActive } = req.body;
  const file = getFile(req);

  const ad = await Ad.findById(id);
  if (!ad) throw createError("Ad not found", 404);

  let imageData = ad.image;

  try {
    if (file) {
      // Delete old image
      await deleteFromCloudinary(ad.image.publicId);
      // Upload new
      imageData = await uploadToCloudinary(file.path, "news-ads");
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    const updatedAd = await Ad.findByIdAndUpdate(
      id,
      {
        title,
        type,
        link,
        image: imageData,
        isActive: isActive !== undefined ? isActive : ad.isActive,
      },
      { new: true }
    );

    res.status(200).json({ success: true, message: "Ad updated", data: updatedAd });
  } catch (error) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw error;
  }
});

// 4. Delete Ad
export const deleteAd = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ad = await Ad.findById(id);

  if (!ad) throw createError("Ad not found", 404);

  await deleteFromCloudinary(ad.image.publicId);
  await Ad.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Ad deleted successfully" });
});

// 5. Toggle Status
export const toggleAdStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ad = await Ad.findById(id);

  if (!ad) throw createError("Ad not found", 404);

  ad.isActive = !ad.isActive;
  await ad.save();

  res.status(200).json({ success: true, message: "Ad status updated", data: ad });
});
