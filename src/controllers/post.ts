import { NextFunction, Request, Response } from 'express'
import sequelize from '../db'
import Post from '../models/Post'
import User from '../models/User'
export async function getPublicPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page) || 1
    if (!page || !limit || page < 1 || limit < 1) {
      res.status(400)
      throw Error('Invalid params')
    }
    const offset = (page - 1) * limit

    let { rows: postsWithUser, count: totalCount } =
      await sequelize.transaction(async t => {
        return await Post.findAndCountAll({
          offset,
          limit,
          order: [
            ['createdAt', 'DESC'],
            ['postId', 'ASC'],
          ],
          include: [
            {
              model: User,
              attributes: ['id', 'userName', 'name', 'picture'],
              as: 'user',
              where: { visibility: 'public' },
              required: true,
            },
          ],
          transaction: t,
        })
      })

    res.json({
      count: totalCount,
      rows: postsWithUser,
      totalPages: Math.ceil(totalCount / limit),
    })
  } catch (err) {
    next(err)
  }
}
