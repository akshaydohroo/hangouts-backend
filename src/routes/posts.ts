import { Router } from 'express'
import { multerUpload } from '../config'
import { createPost, getPosts } from '../controllers/post'
import { processChunks } from '../utils/functions'
import { protectRoutes } from '../utils/functions/auth'

const router = Router({ mergeParams: true })
router.use(protectRoutes)

router.get('/users', getPosts)
router.post(
  '/user/create',
  multerUpload.single('chunk'),
  processChunks,
  createPost
)

export default router
