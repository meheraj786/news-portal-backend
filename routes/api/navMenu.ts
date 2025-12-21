import { Router } from "express";
import { getNavMenu, updateNavMenu } from "../../controllers/navMenuController";
import { verifyAuthToken } from "../../middleware/authMiddleware";

const router = Router();

router.route("/").get(getNavMenu).put(verifyAuthToken, updateNavMenu);

export default router;
