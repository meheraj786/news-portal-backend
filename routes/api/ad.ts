import express from "express";
import { createAd, deleteAd, getAllAds, toggleAdStatus, updateAd } from "../../controllers/adController";
import { verifyAuthToken } from "../../middleware/authMiddleware";
import upload from "../../middleware/uploadMiddleware";

const adRoutes = express.Router();

// Public: Get ads to display
adRoutes.get("/", getAllAds);

// Protected: Admin operations
adRoutes.post("/", verifyAuthToken, upload.any(), createAd);
adRoutes.put("/:id", verifyAuthToken, upload.any(), updateAd);
adRoutes.patch("/:id/toggle", verifyAuthToken, toggleAdStatus);
adRoutes.delete("/:id", verifyAuthToken, deleteAd);

export default adRoutes;
