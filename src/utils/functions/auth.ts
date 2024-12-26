import axios from 'axios'
import { UUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { UserRefreshClient } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { Attributes, CreationAttributes } from 'sequelize'
import { convertTime, parseJwtToken } from '.'
import {
  googleOAuthClientId,
  googleOAuthClientSecret,
  jwtSecretKey,
} from '../../config'
import User from '../../models/User'
import { AccessTokenDoesntExistError } from '../error'
import Transport from '../transport'
import { verifyMailConfig } from '../variables'

const { JsonWebTokenError, TokenExpiredError } = jwt

/**
 * Sends a verification email to the user.
 *
 * @param {Attributes<User> | CreationAttributes<User>} user - The user object.
 * @returns {Promise<string>} - A promise that resolves to the message ID of the sent email.
 */
export function sendVerifyEmail(
  user: Attributes<User> | CreationAttributes<User>
): Promise<string> {
  const verifyJwt = jwt.sign(
    { email: user.email },
    Buffer.from(jwtSecretKey as string, 'base64'),
    {
      expiresIn: '1h',
    }
  )
  return new Promise((resolve, reject) => {
    Transport.sendMail(verifyMailConfig(user, verifyJwt), (err, info) => {
      if (err) reject(err)
      if (info.accepted.length > 1) {
        resolve(info.messageId)
      }
    })
  })
}

/**
 * Middleware to protect routes by verifying the access token.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export function protectRoutes(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    let accessToken: string | undefined = undefined
    if (req.headers.authorization) {
      if (req.headers.authorization.split(' ')[0] !== 'Bearer') {
        res.status(400)
        throw Error('Invalid authorization header')
      }
      accessToken = req.headers.authorization.split(' ')[1]
    } else {
      accessToken = req.cookies['access-token']
    }
    if (!accessToken) {
      throw new AccessTokenDoesntExistError("Access token doesn't exist")
    }
    const { userId } = jwt.verify(
      accessToken,
      Buffer.from(jwtSecretKey as string, 'base64')
    ) as { userId: string }
    res.locals.selfId = userId
    next()
  } catch (err) {
    if (
      err instanceof TokenExpiredError ||
      err instanceof AccessTokenDoesntExistError
    ) {
      if (req.headers['x-refresh-token']) {
        res.locals.refreshToken = req.headers['x-refresh-token']
      }
      generateNewAccessTokenFromRefreshToken(req, res)
        .then(accessToken => {
          req.headers.authorization = 'Bearer ' + accessToken
          protectRoutes(req, res, next)
        })
        .catch(err => {
          next(err)
        })
    } else if (err instanceof JsonWebTokenError) {
      res.status(400)
      throw Error('Token is corrupted, please login again')
    } else {
      next(err)
    }
  }
}

/**
 * Refreshes the Google OAuth token.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<string>} - A promise that resolves to the user ID.
 */
export async function googleOAuthRefresh(
  req: Request,
  res: Response
): Promise<string> {
  try {
    const user = new UserRefreshClient(
      googleOAuthClientId,
      googleOAuthClientSecret,
      req.cookies['google-refresh-oauth-token']
    )
    const { credentials } = await user.refreshAccessToken()
    const { refresh_token, id_token } = credentials
    if (!refresh_token || !id_token) throw Error('Token undefined from Google')
    googleSetRefreshTokenCookie(req, res, refresh_token)
    return parseJwtToken(id_token, ['sub'], ['userId']).userId as string
  } catch (err) {
    throw err
  }
}

/**
 * Retrieves Google user data using the access token.
 *
 * @param {string} accessToken - The access token.
 * @returns {Promise<{ gender: undefined | string; birthDate: undefined | Date; emailVerified: boolean; }>} - A promise that resolves to the user data.
 */
export async function getGoogleUserData(accessToken: string): Promise<{
  gender: undefined | string
  birthDate: undefined | Date
  emailVerified: boolean
}> {
  try {
    const googleRes = await axios.get(
      'https://people.googleapis.com/v1/people/me',
      {
        params: {
          personFields: 'birthdays,genders',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    const gender: undefined | string =
      googleRes.data?.genders && googleRes.data?.genders[0]?.formattedValue
    const birthday =
      googleRes.data?.birthdays && googleRes.data?.birthdays[0]?.date
    const emailVerified = true
    let birthDate: undefined | Date = undefined
    if (birthday) {
      const { year, month, day } = birthday
      birthDate = new Date(year, month - 1, day)
    }
    return { gender, birthDate, emailVerified }
  } catch (err) {
    throw err
  }
}

/**
 * Sets the Google OAuth refresh token cookie.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {string} refreshToken - The refresh token.
 */
export function googleSetRefreshTokenCookie(
  req: Request,
  res: Response,
  refreshToken: string
) {
  try {
    res.cookie('google-refresh-oauth-token', refreshToken, {
      maxAge: convertTime(7, 'd', 'ms'),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    })
  } catch (err) {
    throw err
  }
}

/**
 * Generates a new access token from the refresh token.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<string>} - A promise that resolves to the new access token.
 */
export async function generateNewAccessTokenFromRefreshToken(
  req: Request,
  res: Response
): Promise<string> {
  if (req.cookies['google-refresh-oauth-token']) {
    const userId = await googleOAuthRefresh(req, res)
    return createAccessToken(req, res, userId)
  } else if (req.cookies['refresh-token']) {
    const { userId } = jwt.verify(
      req.cookies['refresh-token'],
      Buffer.from(jwtSecretKey as string, 'base64')
    ) as { userId: UUID }
    return createAccessToken(req, res, userId)
  } else if (res.locals.refreshToken) {
    const { userId } = jwt.verify(
      res.locals.refreshToken,
      Buffer.from(jwtSecretKey as string, 'base64')
    ) as { userId: UUID }
    return createAccessToken(req, res, userId)
  } else {
    res.status(400)
    throw new Error('No refresh token found, login again')
  }
}

/**
 * Creates a new access token and sets it as a cookie.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {string} userId - The user ID.
 * @returns {string} - The new access token.
 */
export function createAccessToken(
  req: Request,
  res: Response,
  userId: string
): string {
  const accessToken = jwt.sign(
    { userId },
    Buffer.from(jwtSecretKey as string, 'base64'),
    {
      expiresIn: '20m',
    }
  )
  res.cookie('access-token', accessToken, {
    maxAge: convertTime(1, 'hr', 'ms'),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  })
  return accessToken
}

/**
 * Creates a new refresh token and sets it as a cookie.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {string} userId - The user ID.
 */
export function createRefreshToken(
  req: Request,
  res: Response,
  userId: string
): string {
  const refreshToken = jwt.sign(
    { userId },
    Buffer.from(jwtSecretKey as string, 'base64'),
    {
      expiresIn: '7d',
    }
  )
  res.cookie('refresh-token', refreshToken, {
    maxAge: convertTime(7, 'd', 'ms'),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  })
  return refreshToken
}
