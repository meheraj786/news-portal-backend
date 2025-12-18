import { Router } from "express";
import { getNavMenu, updateNavMenu } from "../../controllers/navMenuController";

const navMenuRoutes = Router();

navMenuRoutes.get("/", getNavMenu);
navMenuRoutes.put("/", updateNavMenu);

export default navMenuRoutes;
