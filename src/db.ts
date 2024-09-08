import { Sequelize } from "sequelize";
import { dbHost, dbName, dbUser, dbPass, dbPort } from "./config";

export default new Sequelize(
  dbName as string,
  dbUser as string,
  dbPass as string,
  {
    host: dbHost,
    dialect: "postgres",
    port: Number(dbPort),
    dialectOptions: {
      connectTimeout: 60000, // 10 seconds timeout for connecting to the PostgreSQL server
    },
  }
);
