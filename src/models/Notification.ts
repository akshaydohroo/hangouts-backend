import { UUID } from 'crypto'
import {
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize'
import sequelize from '../db'
import User from './User'

/**
 * Type representing the different types of notifications.
 * @typedef {"like" | "comment" | "follow" | "message" | "reaction"} NotificationType
 */
export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'message'
  | 'reaction'
  | 'notify'

/**
 * Type representing the different causes of notifications.
 * @typedef {"post" | "story" | "comment"} NotificationCause
 */
export type NotificationCause = 'post' | 'story' | 'comment' | 'user'

/**
 * Class representing a Notification.
 * @extends Model
 */
class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  /**
   * The unique identifier for the notification.
   * @type {UUID}
   */
  declare notificationId: UUID

  /**
   * The type of the notification.
   * @type {NotificationType}
   */
  declare notificationType: NotificationType

  /**
   * The message associated with the notification.
   * @type {string}
   */
  declare notificationMessage: string

  /**
   * The ID of the sender of the notification.
   * @type {string}
   */
  declare senderId: string

  /**
   * The ID of the user who receives the notification.
   * @type {ForeignKey<User["id"]>}
   */
  declare userId: ForeignKey<User['id']>

  /**
   * Gets the user associated with the notification.
   * @type {BelongsToGetAssociationMixin<User>}
   */
  declare getUser: BelongsToGetAssociationMixin<User>

  /**
   * Creates a user association for the notification.
   * @type {BelongsToCreateAssociationMixin<User>}
   */
  declare createUser: BelongsToCreateAssociationMixin<User>

  /**
   * The user associated with the notification.
   * @type {NonAttribute<User>}
   */
  declare user?: NonAttribute<User>

  /**
   * The sender of the notification.
   * @type {NonAttribute<User>}
   */
  declare sender?: NonAttribute<User>

  /**
   * The date and time when the notification was created.
   * @type {CreationOptional<Date>}
   */
  declare createdAt: CreationOptional<Date>

  /**
   * The date and time when the notification was last updated.
   * @type {CreationOptional<Date>}
   */
  declare updatedAt: CreationOptional<Date>

  /**
   * The cause of the notification.
   * @type {string}
   */
  declare cause: NotificationCause

  /**
   * The ID of the cause of the notification.
   * @type {string}
   */
  declare causeId: string
}

/**
 * Initializes the Notification model.
 */
Notification.init(
  {
    notificationId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    notificationType: {
      type: DataTypes.ENUM(
        'like',
        'comment',
        'follow',
        'message',
        'reaction',
        'notify'
      ),
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    notificationMessage: {
      allowNull: false,
      type: DataTypes.STRING(100),
    },
    senderId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    cause: {
      type: DataTypes.ENUM('post', 'story', 'comment', 'user'),
      allowNull: false,
    },
    causeId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
  },
  { sequelize, tableName: 'notifications' }
)

export default Notification
