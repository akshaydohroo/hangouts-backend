import { Router } from 'express'
import {
  getChatMessages,
  getOrCreateUserChat,
  getUserChats,
} from '../controllers/chat'
import { protectRoutes } from '../utils/functions/auth'

const router = Router({ mergeParams: true })
router.use(protectRoutes)

router.get('/messages/:chatId', getChatMessages)
router.get('/user/start/:userId', getOrCreateUserChat)
router.get('/user', getUserChats)

export default router
