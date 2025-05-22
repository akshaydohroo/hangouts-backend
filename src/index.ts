import bodyParser from 'body-parser'
import cookie from 'cookie'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express, { Application, NextFunction, Request, Response } from 'express'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import {
  aliveUrl,
  frontendBaseUrl1,
  frontendBaseUrl2,
  hostDomainName,
  jwtSecretKey,
  port,
} from './config'
import { populateDB } from './data/scripts/populateDB'
import sequelize from './db'
import './models/association'
import limiter from './rateLimiter'
import router from './routes'
import { chatSocketHandler } from './sockets/chatSocket'

dotenv.config()

const app: Application = express()
const PORT = port || 8000

// Create HTTP server
const httpServer = createServer(app)

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [frontendBaseUrl1, frontendBaseUrl2, aliveUrl],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

io.use((socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie
    if (!cookies) throw new Error('No cookies found')
    console.log(cookies)
    const parsedCookies = cookie.parse(cookies)
    console.log(parsedCookies)
    const token = parsedCookies['access-token']

    if (!token) throw new Error('No token found')

    const decoded = jwt.verify(
      token,
      Buffer.from(jwtSecretKey as string, 'base64')
    )

    socket.data.userId = (decoded as any).userId
    next()
  } catch (err) {
    console.error('Socket auth failed:', err)
    next(new Error('Authentication error'))
  }
})

// Initialize Socket.IO handlers
// chatSocketHandler(io) is a function that sets up the socket.io event handlers for chat functionality
chatSocketHandler(io)

app.use(
  cors({
    origin: [frontendBaseUrl1, frontendBaseUrl2, aliveUrl],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
    credentials: true,
    methods: ['GET', 'PUT', 'POST'],
  })
)

app.use(cookieParser())
app.use(limiter)
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
    .then(() => populateDB(sequelize.sync({})))
    .then(() => {
      console.log('Database connection has been established successfully.')
      httpServer.listen(PORT, (): void => {
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
