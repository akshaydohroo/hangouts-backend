import { Sequelize } from 'sequelize'
import {
  dbHost,
  dbName,
  dbPass,
  dbPort,
  dbUrl,
  dbUser,
  nodeEnv,
} from './config'

// Create a new Sequelize instance
let sequelize: Sequelize
if (nodeEnv === 'development') {
  sequelize = new Sequelize(
    dbName as string,
    dbUser as string,
    dbPass as string,
    {
      host: dbHost,
      dialect: 'postgres',
      port: Number(dbPort),
      dialectOptions: {
        connectTimeout: 60000, // 10 seconds timeout for connecting to the PostgreSQL server
      },
      logging: console.log,
    }
  )
} else {
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    ssl: true,
    logging: console.log,
    dialectOptions: {
      connectTimeout: 60000, // 10 seconds timeout for connecting to the PostgreSQL server
    },
  })
}
export default sequelize
