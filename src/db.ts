import { Sequelize } from "sequelize";
import { dbHost, dbName, dbUser, dbPass, dbPort } from "./config";

export default new Sequelize(
  dbName as string,
  dbUser as string,
  dbPass as string,
  {
    host: dbHost,
    dialect: "mysql",
    port: Number(dbPort),
  }
);
