import { randomUUID, UUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { Op } from 'sequelize'
import sequelize from '../db'
import Story from '../models/Story'
import StoryInteraction from '../models/StoryInteraction'
import User from '../models/User'
import UserFollower from '../models/UserFollower'
import { uploadPictureCloudinary } from '../utils/functions/user'

export async function getFollowingUsersWithStories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!res.locals.selfId) {
      res.status(400)
      throw Error('User not authorized')
    }
    const selfId = res.locals.selfId as string
    const limit = Number(req.query.limit) || 10
    const page = Number(req.query.page) || 1
    if (!page || !limit || page < 1 || limit < 1) {
      res.status(400)
      throw Error('Invalid params')
    }
    const offset = (page - 1) * limit

    const { rows: usersWithStories, count: countUsersWithStories } =
      await sequelize.transaction(async t => {
        return await User.findAndCountAll({
          where: {
            [Op.or]: [
              sequelize.literal(`EXISTS (
          SELECT 1 FROM user_followers AS connection
          WHERE
            connection."followerId" = '${selfId}'
            AND connection."userId" =  '${sequelize.col('id')}'
            AND connection."status" = 'accepted'
          )`),
              { visibility: 'public' },
            ],
          },
          attributes: ['id', 'name', 'userName', 'picture'],
          include: [
            {
              model: Story,
              as: 'stories',
              required: true,
              attributes: ['storyId', 'picture', 'createdAt'],
            },
          ],
          limit,
          offset,
          order: [[{ model: Story, as: 'stories' }, 'createdAt', 'DESC']],
          transaction: t,
        })
      })

    res.json({
      count: countUsersWithStories,
      rows: usersWithStories,
      totalPages: Math.ceil(countUsersWithStories / limit),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Creates a new story for the authenticated user.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function createUserStory(
  storyBuffer: Buffer<ArrayBuffer>,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    if (!storyBuffer) {
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
      storyBuffer,
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
    if (!req.params.userId) {
      res.status(400)
      throw Error('Invalid request')
    }
    const userId = req.params.userId as string
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
      const stories = await Story.findAll({
        where: {
          userId: userId,
        },
        attributes: { exclude: ['likes', 'seenCount'] },
        transaction: t,
      })
      return stories
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
          model: User,
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

export async function viewFollowingUserStory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.params.storyId) {
      res.status(400)
      throw Error('Invalid request, storyId not defined')
    }

    if (!res.locals.selfId) {
      res.status(400)
      throw Error('Invalid request, User not autherized')
    }

    const selfId = res.locals.selfId as string
    const storyId = req.params.storyId as string as UUID
    const storyInteraction = await sequelize.transaction(async t => {
      return await StoryInteraction.findOrCreate({
        where: {
          storyId,
          viewerId: selfId,
        },
        defaults: {
          interactionId: randomUUID(),
          storyId,
          viewerId: selfId,
        },
        transaction: t,
      })
    })
    res.json({ status: 'success' })
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
export async function likeFollowingUserStory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.body.storyId && !req.query.storyId) {
      res.status(400)
      throw Error('Invalid request, storyId not defined')
    }
    if (!res.locals.selfId) {
      res.status(400)
      throw Error('Invalid request, User not autherized')
    }
    if (req.body.isLike === undefined) {
      res.status(400)
      throw Error('Invalid request, isLike not defined')
    }

    const selfId = res.locals.selfId as string
    const storyId =
      (req.body.storyId as string) || (req.query.storyId as string)
    const isLike = req.body.isLike
    await sequelize.transaction(async t => {
      return await StoryInteraction.update(
        { isLike: isLike },
        {
          where: {
            storyId,
            viewerId: selfId,
          },
          transaction: t,
        }
      )
    })
    res.json({ status: 'success' })
  } catch (err) {
    next(err)
  }
}

/**
 * Gets if a user has liked a particular story.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function isFollowingUserStoryLiked(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.query.storyId) {
      res.status(400)
      throw Error('Invalid request, StoryId not defined')
    }
    if (!res.locals.selfId) {
      res.status(400)
      throw Error('Invalid request, User not autherized')
    }
    const selfId = res.locals.selfId as string
    const storyId = req.query.storyId as string
    const storyInteraction = await sequelize.transaction(async t => {
      return await StoryInteraction.findOne({
        where: {
          storyId,
          viewerId: selfId,
        },
        transaction: t,
      })
    })
    res.json(storyInteraction?.isLike)
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
export async function reactFollowingStory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Implementation for reacting to a story
    if (!req.body.storyId && !req.query.storyId) {
      res.status(400)
      throw Error('Invalid request, storyId not defined')
    }
    if (!req.body.reaction) {
      res.status(400)
      throw Error('Invalid request, reaction not defined')
    }
    if (res.locals.selfIf) {
      res.status(400)
      throw Error('Invalid request, User not authorized')
    }
    const selfId = res.locals.selfId as string
    const storyId = req.body.storyId as string
    const storyInteraction = await sequelize.transaction(async t => {
      return await StoryInteraction.update(
        { reactionEmoji: req.body.reaction },
        {
          where: {
            storyId,
            viewerId: selfId,
          },
          transaction: t,
        }
      )
    })
    res.json({ status: 'success' })
  } catch (err) {
    next(err)
  }
}
