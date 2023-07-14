import { Router } from "express";
import { getAuthUser, getFollowOptions } from "../controllers/users";
import { protectRoutes } from "../utils/functions/auth";

const router = Router({ mergeParams: true });
router.use(protectRoutes);
router.get("/follow/options", getFollowOptions);
router.get("/data", getAuthUser);
export default router;
