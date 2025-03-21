import { Router } from 'express'
import { getPublicPosts } from '../../src/controllers/post'
<<<<<<< HEAD
import {
  getPublicPostComments,
  getPublicPostCommentsCount,
} from '../controllers/comment'
=======
>>>>>>> main
import { getPublicUserWithStories } from '../controllers/story'
import { getUsers } from '../controllers/user'

const router = Router({ mergeParams: true })

router.get('/users/posts', getPublicPosts)
router.get('/users/stories', getPublicUserWithStories)
router.get('/users/comments/count/:postId', getPublicPostCommentsCount)
router.get('/users/comments/:postId', getPublicPostComments)
router.get('/users', getUsers)

export default router
