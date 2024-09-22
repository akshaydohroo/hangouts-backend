import { Router } from 'express'
import { getUsers } from 'src/controllers/user'

const router = Router({ mergeParams: true })

router.get('/users/posts')
router.get('/users/stories')
router.get('/users', getUsers)

export default router
