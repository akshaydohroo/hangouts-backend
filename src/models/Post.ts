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

export type UserWithPosts = User & { stories: Post[] }
/**
 * Class representing a Story.
 * @extends Model
 */
class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  /**
   * The unique identifier for the story.
   * @type {UUID}
   */
  declare postId: UUID

  /**
   * The ID of the user who created the story.
   * @type {ForeignKey<User["id"]>}
   */
  declare userId: ForeignKey<User['id']>

  /**
   * The URL of the picture associated with the story.
   * @type {string}
   */
  declare picture: string

  declare caption: string

  /**
   * The number of times the story has been seen.
   * @type {CreationOptional<number>}
   */
  declare seenCount: CreationOptional<number>

  /**
   * The number of likes the story has received.
   * @type {CreationOptional<number>}
   */
  declare likes: CreationOptional<number>

  /**
   * Gets the user associated with the story.
   * @type {BelongsToGetAssociationMixin<User>}
   */
  declare getUser: BelongsToGetAssociationMixin<User>

  /**
   * Creates a user association for the story.
   * @type {BelongsToCreateAssociationMixin<User>}
   */
  declare createUser: BelongsToCreateAssociationMixin<User>

  /**
   * The user associated with the story.
   * @type {NonAttribute<User>}
   */
  declare user?: NonAttribute<User>

  /**
   * The date and time when the story was created.
   * @type {CreationOptional<Date>}
   */
  declare createdAt: CreationOptional<Date>

  /**
   * The date and time when the story was last updated.
   * @type {CreationOptional<Date>}
   */
  declare updatedAt: CreationOptional<Date>
}

/**
 * Initializes the Story model.
 */
Post.init(
  {
    postId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    picture: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    seenCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  { sequelize, tableName: 'stories' }
)

export default Post
