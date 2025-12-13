import { Request, Response, NextFunction } from "express";

type Controller = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: Controller) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};
