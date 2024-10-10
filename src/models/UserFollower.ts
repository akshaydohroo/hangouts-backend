import { UUID, randomUUID } from 'crypto'
import {
  BulkCreateOptions,
  CreationAttributes,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize'
import sequelize from '../db'
import Notification from './Notification'
import User from './User'

/**
 * Class representing a UserFollower.
 * @extends Model
 */
class UserFollower extends Model<
  InferAttributes<UserFollower>,
  InferCreationAttributes<UserFollower>
> {
  /**
   * The unique identifier for the connection.
   * @type {UUID}
   */
  declare connectionId: UUID

  /**
   * The ID of the user being followed.
   * @type {ForeignKey<User["id"]>}
   */
  declare userId: ForeignKey<User['id']>

  /**
   * The ID of the follower.
   * @type {ForeignKey<User["id"]>}
   */
  declare followerId: ForeignKey<User['id']>

  /**
   * The status of the connection (accepted or pending).
   * @type {CreationOptional<"accepted" | "pending">}
   */
  declare status: CreationOptional<'accepted' | 'pending'>

  /**
   * The date and time when the connection was created.
   * @type {CreationOptional<Date>}
   */
  declare createdAt: CreationOptional<Date>

  /**
   * The date and time when the connection was last updated.
   * @type {CreationOptional<Date>}
   */
  declare updatedAt: CreationOptional<Date>
}

/**
 * Initializes the UserFollower model.
 */
UserFollower.init(
  {
    connectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('accepted', 'pending'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  { sequelize, tableName: 'user_followers', modelName: 'connection' }
)

/**
 * Hook that runs after a UserFollower instance is created.
 * Creates a notification for the user being followed.
 *
 * @param {UserFollower} instance - The created UserFollower instance.
 * @param {BulkCreateOptions<InferAttributes<UserFollower, { omit: never }>>} options - The creation options.
 */
UserFollower.afterCreate(async (instance: UserFollower, options) => {
  try {
    const notification = await getNotificationCreationAttributes(
      instance,
      options
    )
    await Notification.create(notification, {
      transaction: options.transaction,
    })
  } catch (err) {
    // Handle the error appropriately
    console.error('Error creating notification:', err)
    throw err
  }
})

/**
 * Generates the attributes for creating a notification.
 *
 * @param {UserFollower} instance - The created UserFollower instance.
 * @param {BulkCreateOptions<InferAttributes<UserFollower, { omit: never }>>} options - The creation options.
 * @returns {Promise<CreationAttributes<Notification>>} - The notification creation attributes.
 * @throws {Error} - If the sender profile is not found.
 */
async function getNotificationCreationAttributes(
  instance: UserFollower,
  options: BulkCreateOptions<
    InferAttributes<
      UserFollower,
      {
        omit: never
      }
    >
  >
): Promise<CreationAttributes<Notification>> {
  const sender = await User.findByPk(instance.dataValues.followerId, {
    attributes: ['userName', 'name'],
    transaction: options.transaction,
  })
  if (!sender) throw Error('Sender profile not found')

  return {
    notificationId: randomUUID(),
    notificationType:
      instance.dataValues.status === 'pending' ? 'follow' : 'notify',
    notificationMessage:
      instance.dataValues.status === 'pending'
        ? `${sender.userName} wants to follow you.`
        : `${sender.userName} follow you now.`,
    userId: instance.dataValues.userId,
    senderId: instance.dataValues.followerId,
    cause: 'user',
    causeId: instance.dataValues.followerId,
  }
}

export default UserFollower
