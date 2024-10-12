import bcrypt from 'bcryptjs'
import { NextFunction, Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { Attributes, CreationAttributes } from 'sequelize'
import {
  googleOAuthClientId,
  googleOAuthClientSecret,
  jwtSecretKet,
} from '../config'
import sequalize from '../db'
import User from '../models/User'
import { UserDoesntExistsError } from '../utils/error'
import { inputDateToDate, parseJwtToken } from '../utils/functions'
import {
  createAccessToken,
  createRefreshToken,
  generateNewAccessTokenFromRefreshToken,
  getGoogleUserData,
  googleSetRefreshTokenCookie,
  sendVerifyEmail,
} from '../utils/functions/auth'
import {
  checkIfUserExists,
  createUser,
  uploadPictureCloudinary,
} from '../utils/functions/user'

const oAuth2Client = new OAuth2Client(
  googleOAuthClientId,
  googleOAuthClientSecret,
  'postmessage'
)

/**
 * Handles the Google OAuth process.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 * @returns A Promise that resolves to void.
 */
export async function googleOAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.body.code) {
      res.status(400)
      throw Error('invalid request, parameter code absent')
    }
    const { tokens } = await oAuth2Client.getToken(req.body.code)
    const { access_token, id_token, refresh_token } = tokens
    if (!id_token || !access_token || !refresh_token)
      throw Error('Token undefined from google')
    const userData = parseJwtToken(
      id_token,
      ['name', 'email', 'picture', 'sub'],
      ['name', 'email', 'picture', 'id']
    ) as {
      name: string
      email: string
      picture: string
      id: string
    } as Attributes<User> | CreationAttributes<User>

    let user: Attributes<User> | CreationAttributes<User>

    try {
      user = await checkIfUserExists(userData)
      if (req.body.requestType === 'login' && !user.emailVerified) {
        res.status(400)
        throw Error(
          'Email is already in use, verify it by logging in with your password'
        )
      }
    } catch (err) {
      if (err instanceof UserDoesntExistsError) {
        userData['userName'] = userData.email.split('@')[0]
        user = await createUser(
          Object.assign(userData, await getGoogleUserData(access_token))
        )
      } else throw err
    }
    res.clearCookie('refresh-token')
    const accessToken = createAccessToken(req, res, user.id)
    googleSetRefreshTokenCookie(req, res, refresh_token)
    res
      .status(201)
      .json({ accessToken: accessToken, refreshToken: refresh_token })
  } catch (err) {
    next(err)
  }
}

/**
 * Sign in function for authenticating users.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 * @returns Promise<void>
 * @throws Error - If profile picture doesn't exist.
 */
export async function signin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file?.buffer) {
      res.status(400)
      throw Error('Profile picture doesnt exist')
    }
    const uploadPicture = await uploadPictureCloudinary(
      req.body.userName,
      req.file.buffer,
      req.body.userName
    )
    req.body.birthDate = inputDateToDate(req.body.birthDate)
    const userData = req.body as Attributes<User> | CreationAttributes<User>
    userData.picture = uploadPicture.secure_url

    userData.password = await bcrypt.hash(userData.password as string, 10)
    const user = await createUser(userData)
    sendVerifyEmail(user)
      .then(val => {
        console.log(val)
      })
      .catch(err => {
        console.error(err)
        return
      })
    res.clearCookie('google-refresh-oauth-token')
    const accessToken = createAccessToken(req, res, user.id)
    const refreshToken = createRefreshToken(req, res, user.id)
    res.status(201).json({ accessToken, refreshToken })
  } catch (err) {
    next(err)
  }
}
/**
 * Handles the login functionality.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 * @returns Promise<void>
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.body.email && !req.body.userName) {
      res.status(400)
      throw Error('No auth Id')
    }
    if (!req.body.password) {
      res.status(400)
      throw Error('No Password found')
    }
    const { email, password, userName } = req.body
    const user = await sequalize.transaction(async t => {
      const user = await User.findOne({
        where: {
          [email ? 'email' : 'userName']: email ? email : userName,
        },
        transaction: t,
      })

      return user?.toJSON()
    })
    if (!user) {
      res.status(400)
      throw Error('User doesnt Exist')
    }
    if (!user.password) {
      res.status(400)
      throw Error('User didnt signin with a password')
    }
    const isAuthenticated = await bcrypt.compare(password, user.password)
    if (!isAuthenticated) {
      res.status(401)
      throw Error('User is not authenticated')
    }
    res.clearCookie('google-refresh-oauth-token')
    const accessToken = createAccessToken(req, res, user.id)
    const refreshToken = createRefreshToken(req, res, user.id)
    res.json({ accessToken, refreshToken })
  } catch (err) {
    next(err)
  }
}
/**
 * Logs out the user by clearing the necessary cookies.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 * @returns A JSON response with a success message.
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie('access-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    })
    res.clearCookie('refresh-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    })
    res.clearCookie('google-refresh-oauth-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    })
    res.json({ message: 'success' })
  } catch (err) {
    next(err)
  }
}
/**
 * Verifies the email using the provided token.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 * @returns A JSON response with a success message.
 * @throws An error if the token doesn't exist or if there is an error during the verification process.
 */
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.params.token) {
      res.status(400)
      throw Error('Token doesnt Exist')
    }
    const token = jwt.verify(
      req.params.token,
      Buffer.from(jwtSecretKet as string, 'base64')
    ) as { email: string }
    await sequalize.transaction(async t => {
      User.update(
        { emailVerified: true },
        {
          where: {
            email: token.email,
          },
        }
      )
    })
    res.json({ message: 'Success' })
  } catch (err) {
    next(err)
  }
}
/**
 * Deletes a user based on the provided JWT token.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 * @returns A JSON response indicating the success of the operation.
 * @throws An error if the token is missing or invalid.
 */
export async function deleteUserByJwt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.params.token) {
      res.status(400)
      throw Error('Token doesnt Exist')
    }
    const token = jwt.verify(
      req.params.token,
      Buffer.from(jwtSecretKet as string, 'base64')
    ) as { email: string }
    await sequalize.transaction(async t => {
      User.destroy({
        where: {
          email: token.email,
        },
      })
    })
    res.json({ message: 'Success' })
  } catch (err) {
    next(err)
  }
}

/**
 * Generates a new access token from the refresh token.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 * @returns A promise that resolves to the generated access token.
 */
export async function getNewAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const accessToken = await generateNewAccessTokenFromRefreshToken(req, res)
    res.json({ accessToken })
  } catch (err) {
    next(err)
  }
}
