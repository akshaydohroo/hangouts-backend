import { Router } from 'express'
import {
  acceptConnectRequest,
  getConnectReq,
  getFollowingUsers,
  userConnectRequest,
} from '../controllers/follow'
import { getFollowOptions } from '../controllers/user'
import { protectRoutes } from '../utils/functions/auth'

const router = Router({ mergeParams: true })
router.use(protectRoutes)
router.get('/options', getFollowOptions)
router.get('/requests', getConnectReq)
router.get('/follows', getFollowingUsers)
router.get('/accept/:id', acceptConnectRequest)
router.get('/:id', userConnectRequest)
export default router
