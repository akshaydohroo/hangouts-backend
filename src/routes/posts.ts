import { Router } from 'express'
import {} from '../controllers/story'
import { protectRoutes } from '../utils/functions/auth'

const router = Router({ mergeParams: true })
router.use(protectRoutes)

export default router
