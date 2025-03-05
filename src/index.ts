import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express, { Application, NextFunction, Request, Response } from 'express'
import {
  frontendBaseUrl1,
  frontendBaseUrl2,
  hostDomainName,
  port,
} from './config'
import sequelize from './db'
import './models/association'
import router from './routes'
dotenv.config()

const app: Application = express()
const PORT = port || 8000
app.use(
  cors({
    origin: [frontendBaseUrl1, frontendBaseUrl2],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
    credentials: true,
    methods: ['GET', 'PUT', 'POST'],
  })
)
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/', router)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)

  if (res.statusCode === 200) {
    res.status(500)
  }
  res.send(err.message)
})
try {
  sequelize
    .authenticate()
    // .then(() => populateDB(sequelize.sync({ force: true })))
    .then(() => {
      console.log('Database connection has been established successfully.')
      app.listen(PORT, (): void => {
        console.log(`Server Running here 👉 http://${hostDomainName}:${PORT}`)
      })
    })
    .catch((err: any) => {
      console.error('Unable to connect to the database:', err)
    })
} catch (err) {
  console.error(err)
}
export default app
