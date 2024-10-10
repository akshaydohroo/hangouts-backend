import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import sequelize from '../db'
import Story from '../models/Story'
import StoryInteraction from '../models/StoryInteraction'
import User from '../models/User'
import UserFollower from '../models/UserFollower'
import { uploadPictureCloudinary } from '../utils/functions/user'

/**
 * Creates a new story for the authenticated user.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function createUserStory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    if (!req.file?.buffer) {
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
    const storyId = randomUUID()
    const uploadPicture = await uploadPictureCloudinary(
      user.userName,
      req.file.buffer,
      storyId,
      'story'
    )
    const story = await sequelize.transaction(async t => {
      return user.createStory(
        { storyId, picture: uploadPicture.secure_url },
        { transaction: t }
      )
    })
    res.json(story.toJSON())
  } catch (err) {
    next(err)
  }
}

/**
 * Retrieves stories of a user that the authenticated user is following.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function getFollowingStories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId

    if (!req.params.id) {
      res.status(400)
      throw Error('Invalid request')
    }
    const userId = req.params.id as string
    const stories = await sequelize.transaction(async t => {
      const connection = await UserFollower.findOne({
        where: {
          userId: userId,
          followerId: selfId,
          status: 'accepted',
        },
        transaction: t,
      })
      if (!connection) {
        res.status(403)
        throw Error('You can view stories of the people you are following')
      }
      return await Story.findAll({
        where: {
          userId: userId,
        },
        transaction: t,
      })
    })
    res.json(stories)
  } catch (err) {
    next(err)
  }
}

/**
 * Retrieves all stories of the authenticated user.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function getStories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const selfId = res.locals.selfId
  try {
    const stories = await sequelize.transaction(async t => {
      return await Story.findAll({
        where: {
          userId: selfId,
        },
        include: {
          model: StoryInteraction,
          as: 'viewers',
        },
        transaction: t,
      })
    })
    res.json(stories)
  } catch (err) {
    next(err)
  }
}

/**
 * Likes a story for the authenticated user.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function likeStory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.params.id) {
      res.status(400)
      throw Error('Invalid request, Id not defined')
    }
    const selfId = res.locals.selfId as string
    const storyId = req.params.id as string
    await sequelize.transaction(async t => {
      return await StoryInteraction.update(
        { isLike: true },
        {
          where: {
            storyId,
            viewerId: selfId,
          },
          transaction: t,
        }
      )
    })
    res.json({ status: 'Success' })
  } catch (err) {
    next(err)
  }
}

/**
 * Reacts to a story for the authenticated user.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function reactStory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Implementation for reacting to a story
  } catch (err) {
    next(err)
  }
}
