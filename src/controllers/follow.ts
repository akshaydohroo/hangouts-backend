import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import sequelize from '../db'
import User from '../models/User'
import UserFollower from '../models/UserFollower'

/**
 * Handles a user connection request.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function userConnectRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const followingId = req.params.id
    const connectionId = await sequelize.transaction(async t => {
      const followingUser = await User.findByPk(followingId, {
        transaction: t,
      })
      await UserFollower.create(
        {
          userId: followingId,
          followerId: selfId,
          connectionId: randomUUID(),
          status:
            followingUser?.visibility === 'private' ? 'pending' : 'accepted',
        },
        { transaction: t }
      )
    })
    res.json({ id: connectionId })
  } catch (err) {
    next(err)
  }
}

/**
 * Retrieves pending connection requests for the authenticated user.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function getConnectReq(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const connections = await sequelize.transaction(async t => {
      return await User.findByPk(selfId, {
        include: {
          model: User,
          as: 'followers',
          through: {
            where: {
              accepted: 'pending',
            },
            attributes: [],
          },
        },
        transaction: t,
      })
    })
    res.json(connections)
  } catch (err) {
    next(err)
  }
}

/**
 * Accepts a connection request.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function acceptConnectRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const userId = req.params.id
    await sequelize.transaction(async t => {
      await UserFollower.update(
        { status: 'accepted' },
        {
          where: {
            userId: selfId,
            followerId: userId,
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
 * Retrieves the list of users that the authenticated user is following.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function getFollowingUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const page = Number(req.query.page)
    const limit = Number(req.query.limit)
    if (!page || !limit) {
      res.status(400)
      throw new Error('Invalid request')
    }
    const { rows, count } = await sequelize.transaction(async t => {
      const result = await User.findAndCountAll({
        include: {
          model: User,
          as: 'followers',
          through: {
            attributes: [],
            where: {
              status: 'accepted',
            },
          },
          where: {
            id: selfId,
          },
          attributes: [],
        },
        attributes: ['id', 'name', 'userName', 'picture'],
        transaction: t,
      })
      return result
    })
    res.json({
      count,
      rows: rows.slice((page - 1) * limit, (page - 1) * limit + limit),
      totalPages: Math.ceil(count / limit),
    })
  } catch (err) {
    next(err)
  }
}
