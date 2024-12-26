import { Router } from 'express'
import { processChunks } from 'src/utils/functions'
import { multerUpload } from '../config'
import {
  createUserStory,
  getFollowingStories,
  getFollowingUsersWithStories,
  getStories,
  isFollowingUserStoryLiked,
  likeFollowingUserStory,
  reactFollowingStory,
  viewFollowingUserStory,
} from '../controllers/story'
import { protectRoutes } from '../utils/functions/auth'

const router = Router({ mergeParams: true })
router.use(protectRoutes)
router.post('/following/view/:storyId', viewFollowingUserStory)
router.get('/following/like/', isFollowingUserStoryLiked)
router.put('/following/like/', likeFollowingUserStory)
router.put('/following/react/', reactFollowingStory)
router.get('/following/users', getFollowingUsersWithStories)
router.get('/following/:userId', getFollowingStories)
router.post(
  '/user/create',
  multerUpload.single('chunk'),
  processChunks,
  createUserStory
)
router.get('/user/delete/:id')
router.get('/user', getStories)

export default router
