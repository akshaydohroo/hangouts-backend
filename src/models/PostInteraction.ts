import { UUID } from 'crypto'
import {
  CreationAttributes,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  SaveOptions,
} from 'sequelize'
import sequelize from '../db'
import Notification from './Notification'
import Post from './Post'
import User from './User'

class PostInteraction extends Model<
  InferAttributes<PostInteraction>,
  InferCreationAttributes<PostInteraction>
> {
  declare interactionId: UUID
  declare postId: ForeignKey<Post['postId']>
  declare viewerId: ForeignKey<User['id']>
  declare reactionEmoji: CreationOptional<string>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

PostInteraction.init(
  {
    interactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    reactionEmoji: DataTypes.STRING(4),
  },
  {
    sequelize,
    tableName: 'post_interactions',
    modelName: 'postInteraction',
  }
)

/**
 * Hook that runs after a StoryInteraction instance is updated.
 * Creates a notification if the interaction is a like or a reaction.
 *
 * @param {StoryInteraction} instance - The updated StoryInteraction instance.
 * @param {UpdateOptions<InferAttributes<StoryInteraction, { omit: never }>>} options - The update options.
 * @throws {Error} - If the story or sender cannot be found.
 */
PostInteraction.afterSave(
  async (
    instance: PostInteraction,
    options: SaveOptions<InferAttributes<PostInteraction, { omit: never }>>
  ) => {
    try {
      const { postId, viewerId: senderId, reactionEmoji } = instance.dataValues
      if (instance.changed('reactionEmoji')) {
        const post = await Post.findByPk(postId, {
          transaction: options.transaction,
        })
        if (!post) throw Error("Post couldn't be found")
        console.log('post found')
        const userId = post.dataValues.userId
        const notificationCreationAttributes = {
          userId,
          senderId,
          causeId: postId,
          cause: 'post',
        } as CreationAttributes<Notification>

        const sender = await User.findByPk(senderId, {
          attributes: ['name', 'userName'],
          transaction: options.transaction,
        })
        if (!sender) throw Error('No sender found')
        console.log('sender found')
        if (instance.get('reactionEmoji') == '👍') {
          Post.increment('likes', { where: { postId: postId } })
          console.log('incremented likes')
          notificationCreationAttributes.notificationType = 'like'
          notificationCreationAttributes.notificationMessage = `${sender.userName} liked your post.`
        } else {
          if (instance.previous('reactionEmoji') === '👍') {
            Post.decrement('likes', { where: { postId: postId } })
          }
          notificationCreationAttributes.notificationType = 'reaction'
          notificationCreationAttributes.notificationMessage = `${sender.userName} reacted ${reactionEmoji} on your post.`
        }

        Notification.create(notificationCreationAttributes)
      }
    } catch (err) {
      throw err
    }
  }
)
export default PostInteraction
