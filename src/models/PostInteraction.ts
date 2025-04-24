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
  declare isLike: boolean
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
    isLike: {
      defaultValue: false,
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
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
    const transaction = options.transaction || (await sequelize.transaction())
    try {
      const { postId, viewerId: senderId } = instance.dataValues
      if (instance.changed('isLike')) {
        const post = await Post.findByPk(postId, { transaction })
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
          transaction,
        })
        if (!sender) throw Error('No sender found')
        console.log('sender found')
        if (instance.get('isLike')) {
          await Post.increment('likes', {
            where: { postId: postId },
            transaction,
          })
          console.log('incremented likes')
          notificationCreationAttributes.notificationType = 'like'
          notificationCreationAttributes.notificationMessage = `${sender.userName} liked your post.`
          await Notification.create(notificationCreationAttributes, {
            transaction,
          })
        } else {
          await Post.decrement('likes', {
            where: { postId: postId },
            transaction,
          })
          console.log('decremented likes')
        }
      }
      if (!options.transaction) await transaction.commit()
    } catch (err) {
      if (!options.transaction) await transaction.rollback()
      throw err
    }
  }
)
// PostInteraction.afterBulkCreate(
//   async (
//     instances: readonly PostInteraction[],
//     options: BulkCreateOptions<
//       InferAttributes<PostInteraction, { omit: never }>
//     >
//   ) => {
//     const transaction = options.transaction || (await sequelize.transaction())
//     try {
//       for (const instance of instances) {
//         const { postId, viewerId: senderId } = instance.dataValues
//         if (instance.get('isLike')) {
//           const post = await Post.findByPk(postId, { transaction })
//           if (!post) throw Error("Post couldn't be found")
//           console.log('post found')
//           const userId = post.dataValues.userId
//           const notificationCreationAttributes = {
//             userId,
//             senderId,
//             causeId: postId,
//             cause: 'post',
//           } as CreationAttributes<Notification>

//           const sender = await User.findByPk(senderId, {
//             attributes: ['name', 'userName'],
//             transaction,
//           })
//           if (!sender) throw Error('No sender found')
//           console.log('sender found')
//           if (instance.get('isLike')) {
//             await Post.increment('likes', {
//               where: { postId: postId },
//               transaction,
//             })
//             console.log('incremented likes')
//             notificationCreationAttributes.notificationType = 'like'
//             notificationCreationAttributes.notificationMessage = `${sender.userName} liked your post.`
//             await Notification.create(notificationCreationAttributes, {
//               transaction,
//             })
//           }
//         }
//       }
//       if (!options.transaction) await transaction.commit()
//     } catch (err) {
//       if (!options.transaction) await transaction.rollback()
//       throw err
//     }
//   }
// )
export default PostInteraction
