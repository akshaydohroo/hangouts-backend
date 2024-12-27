import { NextFunction, Request, Response, Router } from 'express'
import { validateAdmin } from '../controllers/admin'
import { populateDB } from '../data/scripts/populateDB'
import sequelize from '../db'

const router = Router({ mergeParams: true })

router.use(validateAdmin)

router.get(
  '/populate-db',
  (req: Request, res: Response, next: NextFunction) => {
    populateDB(sequelize.sync({ force: true }))
      .then(res => {
        console.log(res)
      })
      .catch(err => {
        console.error(err)
      })

    res.status(200).send('DB populated job scheduled')
  }
)

export default router
