import { NextFunction, Request, Response } from 'express'
import { adminKey } from '../config'

export const validateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    req.headers['admin-key'] !== adminKey &&
    req.cookies['admin-key'] !== adminKey
  ) {
    res.status(401).send('Unauthorized')
    return
  }

  res.locals.role = 'admin'

  next()
}
