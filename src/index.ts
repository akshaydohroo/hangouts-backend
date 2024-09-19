import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import { frontendBaseUrl, hostDomainName, port } from "./config";
import sequelize from "./db";
import router from "./routes";
import "./models/association";
import { populateDB } from "./data/scripts/populateDB";
import dotenv from "dotenv";
dotenv.config();

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
         return populateDB(sequelize.sync({force:false}));
      })
      .then((status) => {
        console.log("Database connection has been established successfully.");
        console.log(status);
      })
      .then(() => {
        console.log(`Server Running here 👉 http://${hostDomainName}:${PORT}`);
      })
      .catch((err) => {
        console.error("Unable to connect to the database:", err);
      });
  });
} catch (err) {
  console.error(err);
}
export default app;
