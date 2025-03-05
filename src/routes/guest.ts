import { Router } from 'express'
import { getPublicUserWithStories } from '../controllers/story'
import { getUsers } from '../controllers/user'

const router = Router({ mergeParams: true })

router.get('/users/posts')
router.get('/users/stories', getPublicUserWithStories)
router.get('/users', getUsers)

export default router
