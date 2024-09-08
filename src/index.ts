import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import { frontendBaseUrl, port } from "./config";
import sequelize from "./db";
import router from "./routes";
import "./models/association";
const app: Application = express();
const PORT = port || 8000;
app.use(
  cors({
    origin: frontendBaseUrl,
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    methods: ["GET", "PUT", "POST"],
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", router);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (res.statusCode === 200) {
    res.status(500);
  }
  res.send(err.message);
});
try {
  app.listen(PORT, (): void => {
    sequelize
      .authenticate()
      .then(() => {
        return sequelize.sync({});
      })
      .then(() => {
        console.log(`Server Running here 👉 https://localhost:${PORT}`);
      })
      .catch((err) => {
        throw err;
      });
  });
} catch (err) {
  console.error(err);
}
export default app;
