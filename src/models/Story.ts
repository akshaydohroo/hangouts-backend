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

export type UserWithStories = User & { stories: Story[] }
/**
 * Class representing a Story.
 * @extends Model
 */
class Story extends Model<
  InferAttributes<Story>,
  InferCreationAttributes<Story>
> {
  /**
   * The unique identifier for the story.
   * @type {UUID}
   */
  declare storyId: UUID

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
Story.init(
  {
    storyId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    picture: {
      type: DataTypes.TEXT,
      allowNull: false,
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

/**
 * Hook that runs before a Story instance is created.
 * Ensures that a user cannot have more than 5 stories at a time.
 *
 * @param {Story} instance - The Story instance being created.
 * @param {object} options - The options for the hook.
 * @throws {Error} - If the user already has 5 stories.
 */
Story.beforeCreate(async (instance: Story, options) => {
  const count = await Story.count({
    where: {
      userId: instance.userId,
    },
    group: ['userId'],
    transaction: options.transaction,
  })
  if (count.length >= 5) {
    throw Error("User can't have more than 5 stories at a time")
  }
})

Story.afterCreate(async (story, options) => {
  await User.update(
    { latestStoryAt: story.createdAt },
    { where: { id: story.userId } }
  )
})

Story.afterDestroy(async story => {
  // Find the user's most recent story after deletion
  const latestStory = await Story.findOne({
    where: { userId: story.userId },
    order: [['createdAt', 'DESC']],
    attributes: ['createdAt'],
  })

  // Update the latestStoryAt column
  await User.update(
    { latestStoryAt: latestStory ? latestStory.createdAt : new Date(0) },
    { where: { id: story.userId } }
  )
})

export default Story
