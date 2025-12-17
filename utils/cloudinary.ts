import cloudinary from "../configs/cloudinary.config";
import { createError } from "./createError";

// Helper: Upload image
export const uploadToCloudinary = async (
  filePath: string,
  folder: string = "general"
): Promise<{ url: string; publicId: string }> => {
  try {
    // FIX: Changed COUDINARY to CLOUDINARY to match your .env and config file
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.error("❌ Cloudinary Config Missing! Check your .env file.");
      throw createError("Cloudinary configuration missing", 500);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      transformation: [{ width: 1200, height: 630, crop: "limit" }],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error.message || error);
    // Use your custom error to ensure it hits the global handler correctly
    throw createError("Image upload failed", 500);
  }
};

// Helper: Delete image
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    // We usually don't throw here to prevent crashing the whole request
    // just because a cleanup deletion failed.
  }
};
