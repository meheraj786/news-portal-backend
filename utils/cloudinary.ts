import fs from "fs";
import cloudinary from "../configs/cloudinary.config";
import { createError } from "./createError";

// Helper: Upload image to Cloudinary & Delete local file
export const uploadToCloudinary = async (
  filePath: string,
  folder: string = "general"
): Promise<{ url: string; publicId: string }> => {
  try {
    // 1. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      // Resize to standard News Portal dimensions
      transformation: [{ width: 1200, height: 630, crop: "limit" }],
    });

    // 2. Delete local file after successful upload
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsError) {
      console.error("Warning: Failed to delete local file:", filePath);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    // Attempt to clean up local file even if upload failed
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        /* ignore */
      }
    }

    console.error("Cloudinary Upload Error:", error.message || error);
    throw createError("Image upload to cloud failed. Please try again.", 500);
  }
};

// Helper: Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    // We don't throw here so that the main delete process continues
    // (e.g. deleting a post should succeed even if the image delete fails)
  }
};
