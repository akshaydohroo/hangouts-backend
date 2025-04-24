import { Router } from 'express'
import { multerUpload } from '../config'
import {
  createPostComment,
  getPublicPostComments,
} from '../controllers/comment'
import {
  createPost,
  getPosts,
  isUserPostLiked,
  likeUserPost,
} from '../controllers/post'
import { processChunks } from '../utils/functions'
import { protectRoutes } from '../utils/functions/auth'

const router = Router({ mergeParams: true })
router.use(protectRoutes)

router.post('/like/user', likeUserPost)
router.get('/like/user', isUserPostLiked)
router.get('/comments/:postId', getPublicPostComments)
router.post('/comments/:postId', createPostComment)
router.get('/users', getPosts)
router.post(
  '/user/create',
  multerUpload.single('chunk'),
  processChunks,
  createPost
)
export default router
