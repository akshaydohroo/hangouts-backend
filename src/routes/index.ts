import { NextFunction, Request, Response, Router } from 'express'
import authRoutes from './auth'
import dataRoutes from './data'
import followRoutes from './follow'
import guestRoutes from './guest'
import notificationRoutes from './notification'
import storyRoutes from './story'
import userRoutes from './user'

const router = Router()

router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(req.path)
  next()
})
router.use('/auth', authRoutes)
router.use('/guest', guestRoutes)
router.use('/user', userRoutes)
router.use('/follow', followRoutes)
router.use('/notification', notificationRoutes)
router.use('/story', storyRoutes)
router.use('/data', dataRoutes)

router.get('/health', (req, res) => {
  res.status(200).send('OK')
})

router.use('/', (req, res) => {
  res.status(404).send('Resource doesnt exist')
})
export default router
