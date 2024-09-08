import { Router } from "express";
import { protectRoutes } from "../utils/functions/auth";
import { multerUpload } from "../config";
import { createUserStory, getStories, likeStory } from "../controllers/story";

const router = Router({ mergeParams: true });
router.use(protectRoutes);
router.get("/user", getStories);
router.get("/following:id", getStories);
router.get("/like/:id", likeStory);
router.post("/create", multerUpload.single("picture"), createUserStory);
router.get("/delete/:id");
export default router;
