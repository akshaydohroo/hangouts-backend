import bcrypt from 'bcryptjs'
import { NextFunction, Request, Response } from 'express'
import { Attributes, CreationAttributes, Op } from 'sequelize'
import sequelize from '../db'
import User from '../models/User'
import { UserDoesntExistsError } from '../utils/error'
import {
  checkIfUserExists,
  sendAuthData,
  uploadPictureCloudinary,
} from '../utils/functions/user'

export async function checkUserExists(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (
      !req.query.username &&
      !req.query.email &&
      !req.params.username &&
      !req.params.email
    ) {
      res.status(400)
      throw Error('Neither username nor email found in query params')
    }
    const username = (req.query.username || req.params.username) as string
    const email = (req.query.email || req.params.email) as string
    const user = await checkIfUserExists({
      userName: username,
      email: email,
    } as User)
    res.json({ exists: true, status: 200 })
  } catch (err) {
    if (err instanceof UserDoesntExistsError) {
      res.json({ exists: false, status: 200 })
    } else {
      next(err)
    }
  }
}
/**
 * Retrieves a user by their ID.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.params.id && !req.query.id) {
      res.status(400)
      throw Error("Id doesn't exist")
    }
    const userId = (req.params.id || req.query.id) as string
    return await sequelize.transaction(async t => {
      const user = await User.findByPk(userId, { transaction: t })
      if (!user) {
        throw new UserDoesntExistsError("User doesn't exist")
      }
      res.json(sendAuthData(user.toJSON()))
    })
  } catch (err) {
    if (err instanceof UserDoesntExistsError) {
      res.status(404)
    }
    next(err)
  }
}

/**
 * Redirects to the authenticated user's data.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function getAuthUserData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    res.redirect(`/user/data/${selfId}`)
  } catch (err) {
    if (err instanceof UserDoesntExistsError) {
      res.status(404)
    }
    next(err)
  }
}

/**
 * Retrieves follow options based on a search string.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function getFollowOptions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const searchString = req.query.searchString as string
    const page = Number(req.query.page)
    const limit = Number(req.query.limit)
    if (!searchString || !page || !limit || page < 1 || limit < 1) {
      res.status(400)
      throw Error('No valid params')
    }

    const { count, rows } = await sequelize.transaction(async t => {
      const { count, rows } = await User.findAndCountAll({
        where: {
          [Op.or]: [
            { name: { [Op.iRegexp]: `^${searchString}` } },
            { userName: { [Op.iRegexp]: `^${searchString}` } },
          ],
          id: { [Op.ne]: selfId },
        },
        include: {
          model: User,
          as: 'followers',
          through: {
            attributes: ['status'],
            where: { followerId: selfId },
          },
          attributes: ['id'],
          required: false,
        },
        offset: (page - 1) * limit,
        limit: limit,
        order: ['id'],
        transaction: t,
      })
      return { count, rows }
    })
    res.json({
      count,
      rows: rows.map(row => {
        row = row.toJSON()
        return sendAuthData(row)
      }),
      totalPages: Math.ceil(count / limit),
    })
  } catch (err) {
    if (err instanceof UserDoesntExistsError) {
      res.status(404)
    }
    next(err)
  }
}

/**
 * Retrieves users for guest based on a search string.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const searchString = req.query.searchString as string
    const page = Number(req.query.page)
    const limit = Number(req.query.limit)
    if (!searchString || !page || !limit || page < 1 || limit < 1) {
      res.status(400)
      throw Error('No valid params')
    }
    const { count, rows } = await sequelize.transaction(async t => {
      const { count, rows } = await User.findAndCountAll({
        where: {
          [Op.or]: [
            { name: { [Op.iRegexp]: `^${searchString}` } },
            { userName: { [Op.iRegexp]: `^${searchString}` } },
          ],
        },
        offset: (page - 1) * limit,
        limit: limit,
        order: ['id'],
        transaction: t,
      })
      return { count, rows }
    })
    res.json({
      count,
      rows: rows.map(row => {
        row = row.toJSON()
        return sendAuthData(row)
      }),
      totalPages: Math.ceil(count / limit),
    })
  } catch (err) {
    if (err instanceof UserDoesntExistsError) {
      res.status(404)
    }
    next(err)
  }
}

export async function updateUserData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const { name, userName, email, gender, visibility } = req.body
    let { password } = req.body
    if (password && password.length > 8) {
      password = await bcrypt.hash(password, 10)
    } else {
      password = null
    }
    let picture = null
    if (req.file?.buffer) {
      picture = await uploadPictureCloudinary(
        req.body.userName,
        req.file.buffer,
        req.body.userName
      )
    }
    let birthDate = null
    if (req.body.birthDate) {
      birthDate = new Date(req.body.birthDate)
    }

    const updatedUserData = await sequelize.transaction(async t => {
      const user = await User.findByPk(selfId, { transaction: t })
      if (!user) {
        throw new UserDoesntExistsError("User doesn't exist")
      }
      const updateFields: Partial<Attributes<User> | CreationAttributes<User>> =
        {}
      user.email !== email &&
        ((updateFields['email'] = email),
        (updateFields['emailVerified'] = false))
      password && (updateFields['password'] = password)
      name && user.name !== name && (updateFields['name'] = name)
      userName &&
        user.userName !== userName &&
        (updateFields['userName'] = userName)
      picture && (updateFields['picture'] = picture.secure_url)
      visibility &&
        user.visibility !== visibility &&
        (updateFields['visibility'] = visibility)
      gender && user.gender !== gender && (updateFields['gender'] = gender)
      birthDate &&
        user.birthDate !== birthDate &&
        (updateFields['birthDate'] = birthDate)
      return await user.update({ ...updateFields }, { transaction: t })
    })
    res.json(updatedUserData)
  } catch (err) {
    next(err)
  }
}
