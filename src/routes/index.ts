import { NextFunction, Request, Response, Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./user";
const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(req.path);
  next();
});
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/", (req, res) => {
  res.status(404).send("Resource doesnt exist");
});
export default router;
