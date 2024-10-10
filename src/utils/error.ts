import { Attributes, CreationAttributes } from 'sequelize'
import User from '../models/User'

/**
 * Error thrown when a user already exists.
 * @extends Error
 */
export class UserAlreadyExistsError extends Error {
  /**
   * The payload containing the user data.
   * @type {Attributes<User> | CreationAttributes<User>}
   */
  public payload: Attributes<User> | CreationAttributes<User>

  /**
   * Creates an instance of UserAlreadyExistsError.
   * @param {Attributes<User> | CreationAttributes<User>} data - The data of the user being created.
   * @param {Attributes<User> | CreationAttributes<User>} user - The existing user data.
   */
  constructor(
    data: Attributes<User> | CreationAttributes<User>,
    user: Attributes<User> | CreationAttributes<User>
  ) {
    super(
      `User with ${user.email === data.email ? 'email' : 'username'} = ${
        user.email === data.email ? user.email : user.userName
      } already exists`
    )
    this.name = 'User already exists'
    this.payload = user
  }
}

/**
 * Error thrown when a user does not exist.
 * @extends Error
 */
export class UserDoesntExistsError extends Error {
  /**
   * Creates an instance of UserDoesntExistsError.
   * @param {string} message - The error message.
   */
  constructor(message: string) {
    super(message)
    this.name = "User doesn't exist"
  }
}

/**
 * Error thrown when an access token does not exist.
 * @extends Error
 */
export class AccessTokenDoesntExistError extends Error {
  /**
   * Creates an instance of AccessTokenDoesntExistError.
   * @param {string} message - The error message.
   */
  constructor(message: string) {
    super(message)
    this.name = "Access token doesn't exist"
  }
}
