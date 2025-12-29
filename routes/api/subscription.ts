import express from "express";
import { verifyAuthToken } from "../../middleware/authMiddleware";
import { deleteSubscription, getAllSubscriptions, subscribe } from "../../controllers/subscriptionController";

const subscriptionRoutes = express.Router();

// Public: User subscribes
subscriptionRoutes.post("/", subscribe);

// Protected: Admin views and deletes
subscriptionRoutes.get("/", verifyAuthToken, getAllSubscriptions);
subscriptionRoutes.delete("/:id", verifyAuthToken, deleteSubscription);

export default subscriptionRoutes;
