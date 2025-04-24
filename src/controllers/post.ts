import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { Op } from 'sequelize'
import sequelize from '../db'
import Post from '../models/Post'
import PostInteraction from '../models/PostInteraction'
import User from '../models/User'
import { uploadPictureCloudinary } from '../utils/functions/user'

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
      posts: postsWithUser,
      totalPages: Math.ceil(totalCount / limit),
      page: page,
      limit: limit,
    })
  } catch (err) {
    next(err)
  }
}

export async function getPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page) || 1
    const selfId = res.locals.selfId as string
    if (!page || !limit || !selfId || page < 1 || limit < 1) {
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
              where: {
                [Op.or]: [
                  { visibility: 'public' },
                  {
                    id: {
                      [Op.in]: sequelize.literal(
                        `(SELECT "userId" FROM user_followers WHERE "followerId" = ${sequelize.escape(selfId)} AND status = 'accepted')`
                      ),
                    },
                  },
                  {
                    id: selfId,
                  },
                ],
              },
              required: true,
            },
          ],
          transaction: t,
        })
      })

    res.json({
      count: totalCount,
      posts: postsWithUser,
      totalPages: Math.ceil(totalCount / limit),
      page: page,
      limit: limit,
    })
  } catch (err) {
    next(err)
  }
}

export async function createPost(
  postBuffer: Buffer<ArrayBuffer>,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const caption = req.body.caption as string
    if (!caption) {
      res.status(400)
      throw Error('Caption is required')
    }
    if (!postBuffer) {
      res.status(400)
      throw Error("Story picture doesn't exist")
    }

    const user = await sequelize.transaction(async t => {
      return User.findByPk(selfId, { transaction: t })
    })
    if (!user) {
      res.status(400)
      throw Error("User doesn't exist")
    }
    const postId = randomUUID()
    const uploadPicture = await uploadPictureCloudinary(
      user.userName,
      postBuffer,
      postId,
      'post'
    )
    if (!uploadPicture) {
      res.status(500)
      throw Error('Error uploading picture')
    }
    const post = await sequelize.transaction(async t => {
      return user.createPost(
        { postId: postId, caption: caption, picture: uploadPicture.secure_url },
        { transaction: t }
      )
    })
    res.json(post.toJSON())
  } catch (err) {
    next(err)
  }
}

export async function likeUserPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const postId = req.query.postId as string
    const like = req.body.like as Boolean

    if (typeof like !== 'boolean') {
      res.status(400)
      throw Error('like is required')
    }
    if (!postId) {
      res.status(400)
      throw Error('No post Id found')
    }
    if (!selfId) {
      res.status(400)
      throw Error('No user Id found')
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

    const [postInteraction, isCreated] = await sequelize.transaction(
      async t => {
        return PostInteraction.findOrCreate({
          where: { postId, viewerId: selfId },
          transaction: t,
        })
      }
    )

    postInteraction.set({ isLike: like })
    await sequelize.transaction(async t => {
      return postInteraction.save({ transaction: t })
    })
    res.json()
  } catch (err) {
    next(err)
  }
}

export async function isUserPostLiked(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const postId = req.query.postId as string
    if (!postId) {
      res.status(400)
      throw Error('No post Id found')
    }
    if (!selfId) {
      res.status(400)
      throw Error('No user Id found')
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
    const postInteraction = await sequelize.transaction(async t => {
      return PostInteraction.findOne({
        where: { postId, viewerId: selfId },
        transaction: t,
      })
    })
    if (!postInteraction || !postInteraction.isLike) {
      res.json({ isLiked: false })
      return
    }

    res.json({ isLiked: true })
  } catch (err) {
    next(err)
  }
}
