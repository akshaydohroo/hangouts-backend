import { Router } from 'express'
import { multerUpload } from '../config'
import {
  deleteUserByJwt,
  getNewAccessToken,
  googleOAuth,
  login,
  logout,
  signin,
  verifyEmail,
} from '../controllers/auth'

const router = Router({ mergeParams: true })
router.post('/google', googleOAuth)
router.post('/signin', multerUpload.single('picture'), signin)
router.post('/login', login)
router.get('/logout', logout)
router.get('/refresh-token', getNewAccessToken)
router.get('/verify-email/:token', verifyEmail)
router.get('/del/:token', deleteUserByJwt)

export default router
