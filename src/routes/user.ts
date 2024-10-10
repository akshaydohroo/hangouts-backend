import { Router } from 'express'
import {
  checkUserExists,
  getAuthUserData,
  getUserById,
  updateUserData,
} from '../controllers/user'
import { protectRoutes } from '../utils/functions/auth'
import { multerUpload } from './../config'

const router = Router({ mergeParams: true })
router.get('/exists', checkUserExists)
router.use(protectRoutes)
router.get('/data/:id', getUserById)
router.put('/data', multerUpload.single('picture'), updateUserData)
router.get('/data', getAuthUserData)
export default router
