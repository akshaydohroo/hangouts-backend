import { Router } from 'express'
import { processChunks } from 'src/utils/functions'
import { multerUpload } from '../config'
import { createPost, getPosts } from '../controllers/post'
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
