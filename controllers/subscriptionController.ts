import { Request, Response } from "express";
import { Subscription } from "../models/subscriptionSchema";
import { createError } from "../utils/createError";
import { asyncHandler } from "../utils/asyncHandler";

// 1. Subscribe (Public)
export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) throw createError("Email is required", 400);

  const existing = await Subscription.findOne({ email });
  if (existing) throw createError("This email is already subscribed", 400);

  const newSubscription = await Subscription.create({ email });

  res.status(201).json({
    success: true,
    message: "Subscribed successfully",
    data: newSubscription,
  });
});

// 2. Get All Emails (Admin)
export const getAllSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const subscriptions = await Subscription.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

  const total = await Subscription.countDocuments();

  res.status(200).json({
    success: true,
    data: subscriptions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

// 3. Delete Subscription (Admin)
export const deleteSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const subscription = await Subscription.findByIdAndDelete(id);

  if (!subscription) throw createError("Subscription not found", 404);

  res.status(200).json({
    success: true,
    message: "Email removed from subscription list",
  });
});
