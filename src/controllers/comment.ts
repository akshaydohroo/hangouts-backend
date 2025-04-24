import { UUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import sequelize from '../db'
import Comment from '../models/Comment'
import Post from '../models/Post'
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

export async function createPostComment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const postId = req.params.postId
    const selfId = res.locals.selfId as string
    const { content, parentCommentId } = req.body
    if (!content) {
      res.status(400)
      throw Error('No text found')
    }
    if (parentCommentId === '' || parentCommentId === undefined) {
      res.status(400)
      throw Error('No comment context found')
    }
    if (!selfId) {
      res.status(400)
      throw Error('User id not found')
    }
    if (!postId) {
      res.status(400)
      throw Error('No post Id found')
    }
    const isUserExist = await sequelize.transaction(async t => {
      return User.findByPk(selfId, { transaction: t })
    })
    if (!isUserExist) {
      res.status(400)
      throw Error("User doesn't exist")
    }
    const isPostExist = await sequelize.transaction(async t => {
      return Post.findByPk(postId, { transaction: t })
    })
    if (!isPostExist) {
      res.status(400)
      throw Error("Post doesn't exist")
    }
    if (parentCommentId !== null) {
      const isParentCommentExist = await sequelize.transaction(async t => {
        return Comment.findByPk(parentCommentId, { transaction: t })
      })
      if (!isParentCommentExist) {
        res.status(400)
        throw Error("Parent comment doesn't exist")
      }
    }

    const comment = await sequelize.transaction(async t => {
      return Comment.create(
        {
          text: content,
          postId: postId as UUID,
          parentCommentId: parentCommentId as UUID,
          userId: selfId,
        },
        { transaction: t }
      )
    })
    res.json()
  } catch (err) {
    next(err)
  }
}
