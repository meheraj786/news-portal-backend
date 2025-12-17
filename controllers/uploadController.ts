import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/createError";
import fs from "fs";
import cloudinary from "../configs/cloudinary.config";

export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(createError("No image file provided", 400));
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "news-posts",
      transformation: [{ width: 1200, height: 630, crop: "limit" }],
    });

    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};
