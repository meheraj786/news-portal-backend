import { Request, Response } from "express";
import { createError } from "../utils/createError";
import { uploadToCloudinary } from "../utils/cloudinary";
import { asyncHandler } from "../utils/asyncHandler";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  // 1. Grab the file array (Multer puts files here when using upload.any())
  const files = req.files as Express.Multer.File[];

  // 2. Check if the array exists and has at least one file
  if (!files || files.length === 0) {
    throw createError("No image file provided", 400);
  }

  // 3. Select the first file (Treat it as your "single object")
  const file = files[0];

  // 4. Upload using the helper
  const result = await uploadToCloudinary(file.path, "news-posts");

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    data: result,
  });
});
