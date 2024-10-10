import { Router } from 'express'
import {
  deleteNotificationById,
  getNotificationByUserId,
} from '../controllers/notification'
import { protectRoutes } from '../utils/functions/auth'

const router = Router({ mergeParams: true })
router.use(protectRoutes)
router.get('/user', getNotificationByUserId)
router.get('/delete/:id', deleteNotificationById)
export default router
