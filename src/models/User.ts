import {
  Association,
  Attributes,
  CreationOptional,
  DataTypes,
  HasManyCreateAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize'
import sequelize from '../db'
import Comment from './Comment'
import Notification from './Notification'
import Post from './Post'
import Story from './Story'
import UserFollower from './UserFollower'

export type UserVisibility = 'public' | 'private'

/**
 * Interface representing a User with a follower connection.
 * @extends User
 */
interface UserWithFollower extends User {
  /**
   * The connection details between the user and a follower.
   * @type {Attributes<UserFollower>}
   */
  connection?: Attributes<UserFollower>
}

/**
 * Class representing a User.
 * @extends Model
 */
class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  /**
   * The unique identifier for the user.
   * @type {string}
   */
  declare id: string

  /**
   * The name of the user.
   * @type {string}
   */
  declare name: string

  /**
   * The password of the user.
   * @type {CreationOptional<string>}
   */
  declare password: CreationOptional<string>

  /**
   * The password of the user.
   * @type {CreationOptional<string>}
   */
  declare visibility: CreationOptional<string>

  /**
   * The birth date of the user.
   * @type {CreationOptional<Date>}
   */
  declare birthDate: CreationOptional<Date>

  /**
   * The gender of the user.
   * @type {CreationOptional<string>}
   */
  declare gender: CreationOptional<string>

  /**
   * The email of the user.
   * @type {string}
   */
  declare email: string

  /**
   * The username of the user.
   * @type {string}
   */
  declare userName: string

  /**
   * The profile picture URL of the user.
   * @type {string}
   */
  declare picture: string

  /**
   * Indicates whether the user's email is verified.
   * @type {CreationOptional<boolean>}
   */
  declare emailVerified: CreationOptional<boolean>

  /**
   * The timestamp of the user's latest story.
   * @type {CreationOptional<Date>}
   */
  declare latestStoryAt: CreationOptional<Date>

  /**
   * The date and time when the user was created.
   * @type {CreationOptional<Date>}
   */
  declare createdAt: CreationOptional<Date>

  /**
   * The date and time when the user was last updated.
   * @type {CreationOptional<Date>}
   */
  declare updatedAt: CreationOptional<Date>

  /**
   * The followers of the user.
   * @type {NonAttribute<UserWithFollower[]>}
   */
  declare followers?: NonAttribute<UserWithFollower[]>

  /**
   * The users followed by this user.
   * @type {NonAttribute<User[]>}
   */
  declare follows?: NonAttribute<User[]>

  /**
   * The notifications associated with the user.
   * @type {NonAttribute<Notification[]>}
   */
  declare notifications?: NonAttribute<Notification[]>

  /**
   * The activities (notifications sent by the user).
   * @type {NonAttribute<Notification[]>}
   */
  declare activities?: NonAttribute<Notification[]>

  /**
   * Creates a story associated with the user.
   * @type {HasManyCreateAssociationMixin<Story, "userId">}
   */
  declare createStory: HasManyCreateAssociationMixin<Story, 'userId'>

  /**
   * Creates a post associated with the user.
   * @type {HasManyCreateAssociationMixin<Post, "userId">}
   */
  declare createPost: HasManyCreateAssociationMixin<Post, 'userId'>

  /**
   * Creates a comment associated with the user.
   * @type {HasManyCreateAssociationMixin<Comment, "userId">}
   */
  declare createPostComment: HasManyCreateAssociationMixin<Comment, 'userId'>

  /**
   * The stories associated with the user.
   * @type {NonAttribute<Story[]>}
   */
  declare stories?: NonAttribute<Story[]>

  /**
   * The stories viewed by the user.
   * @type {NonAttribute<Story[]>}
   */
  declare viewedStories?: NonAttribute<Story[]>

  /**
   * The posts associated with the user.
   * @type {NonAttribute<Post[]>}
   */
  declare posts?: NonAttribute<Post[]>

  /**
   * The posts viewed by the user.
   * @type {NonAttribute<Post[]>}
   */
  declare viewedPosts?: NonAttribute<Post[]>

  /**
   * The comments associated with the user.
   * @type {NonAttribute<Comment[]>}
   */
  declare postComments?: NonAttribute<Comment[]>

  /**
   * The associations for the User model.
   * @type {Object}
   */
  declare static associations: {
    users: Association<User, User>
    followers: Association<User, User>
    follows: Association<User, User>
    notifications: Association<User, Notification>
    activities: Association<User, Notification>
    stories: Association<User, Story>
    posts: Association<User, Post>
    postComments: Association<User, Comment>
    viewedStories: Association<User, Story>
    viewedPosts: Association<User, Post>
  }
}

/**
 * Initializes the User model.
 */
User.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: DataTypes.TEXT,
    gender: DataTypes.STRING(10),
    birthDate: DataTypes.DATE,
    picture: DataTypes.TEXT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    latestStoryAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private'),
      defaultValue: 'public',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    indexes: [
      {
        name: 'latestStoryAt_desc_index', // Index name
        fields: [
          'latestStoryAt',
          {
            name: 'latestStoryAt',
            order: 'DESC',
          },
        ],
        using: 'BTREE',
      },
    ],
  }
)

export default User
