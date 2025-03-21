import { NextFunction, Request, Response } from 'express'
import sequelize from '../db'
import Comment from '../models/Comment'
import User from '../models/User'

export async function getPublicPostComments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parentCommentId = (req.query.parentCommentId as string) ?? null
    const postId = req.params.postId
    if (!postId) {
      res.status(400)
      throw Error('No post Id found')
    }
    const comments = await sequelize.transaction(async t => {
      return await Comment.findAll({
        where: { postId, parentCommentId },
        order: [
          ['createdAt', 'ASC'],
          ['updatedAt', 'ASC'],
          ['commentId', 'ASC'],
        ],
        include: [
          {
            model: User,
            attributes: ['id', 'userName', 'name', 'picture'],
            as: 'author',
            required: true,
          },
        ],
        transaction: t,
      })
    })

    res.json(comments)
  } catch (err) {
    next(err)
  }
}

export async function getPublicPostCommentsCount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const postId = req.params.postId
    if (!postId) {
      res.status(400)
      throw Error('No post Id found')
    }

    const commentsCount = await sequelize.transaction(async t => {
      return await Comment.count({
        where: { postId },
        transaction: t,
      })
    })

    res.json({ count: Number(commentsCount) })
  } catch (err) {
    next(err)
  }
}
