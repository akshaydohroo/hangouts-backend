import { NextFunction, Request, Response, Router } from "express";
import authRoutes from "./auth";
import followRoutes from "./follow";
import userRoutes from "./user";
import notificationRoutes from "./notification";
import storyRoutes from "./story";
const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(req.path);
  next();
});
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/follow", followRoutes);
router.use("/notification", notificationRoutes);
router.use("/story", storyRoutes);

router.use("/", (req, res) => {
  res.status(404).send("Resource doesnt exist");
});
export default router;
