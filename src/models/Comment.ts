import { UUID } from 'crypto'
import {
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  CreationAttributes,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize'
import sequelize from '../db'
import Notification from './Notification'
import Post from './Post'
import User from './User'

/**
 * Class representing a Story.
 * @extends Model
 */
class Comment extends Model<
  InferAttributes<Comment>,
  InferCreationAttributes<Comment>
> {
  declare commentId: CreationOptional<UUID>

  declare postId: ForeignKey<Post['postId']>

  declare userId: ForeignKey<User['id']>

  declare parentCommentId: UUID | null

  declare text: string

  declare likes: CreationOptional<number>

  declare getUser: BelongsToGetAssociationMixin<User>

  declare createUser: BelongsToCreateAssociationMixin<User>

  declare getPost: BelongsToGetAssociationMixin<Post>

  declare createPost: BelongsToCreateAssociationMixin<Post>

  declare user?: NonAttribute<User>

  declare post?: NonAttribute<Post>

  declare createdAt: CreationOptional<Date>

  declare updatedAt: CreationOptional<Date>
}

Comment.init(
  {
    commentId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    parentCommentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  { sequelize, tableName: 'comments' }
)

Comment.afterCreate(async (comment, options) => {
  let transaction = options.transaction
  if (!transaction) {
    transaction = await sequelize.transaction()
  }
  try {
    const post = await comment.getPost()

    if (post) {
      await post.increment('commentsCount', { by: 1, transaction })
    } else {
      throw Error("Post couldn't be found")
    }
    const user = await User.findByPk(comment.userId, { transaction })
    if (!user) {
      throw Error("User couldn't be found")
    }

    const notificationCreationAttributes = {
      userId: comment.parentCommentId ? comment.userId : post.userId,
      senderId: comment.userId,
      causeId: comment.commentId,
      cause: comment.parentCommentId ? 'comment' : 'post',
      notificationType: 'comment',
      notificationMessage: `${user.userName} commented on your ${
        comment.parentCommentId ? 'comment' : 'post'
      }`,
    } as CreationAttributes<Notification>
    await Notification.create(notificationCreationAttributes, {
      transaction,
    })
    if (!options.transaction) {
      transaction.commit()
    }
  } catch (error) {
    if (!options.transaction) {
      await transaction.rollback()
    }
    throw error
  }
})

// Comment.afterBulkCreate(async (comments, options) => {
//   let transaction = options.transaction
//   if (!transaction) {
//     transaction = await sequelize.transaction()
//   }
//   try {
//     for (const comment of comments) {
//       const post = await comment.getPost()
//       if (post) {
//         await post.increment('commentsCount', { by: 1, transaction })
//       } else {
//         throw Error("Post couldn't be found")
//       }
//     }
//     transaction.commit()
//   } catch (error) {
//     if (!options.transaction) {
//       await transaction.rollback()
//     }
//     throw error
//   }
// })
Comment.afterDestroy(async (comment, options) => {
  let transaction = options.transaction
  if (!transaction) {
    transaction = await sequelize.transaction()
  }
  try {
    const post = await comment.getPost()
    if (post) {
      await post.decrement('commentsCount', { by: 1, transaction })
    } else {
      throw Error("Post couldn't be found")
    }
    if (!options.transaction) {
      transaction.commit()
    }
  } catch (error) {
    if (!options.transaction) {
      await transaction.rollback()
    }
    throw error
  }
})

// Comment.afterBulkDestroy(async options => {
//   let transaction = options.transaction
//   if (!transaction) {
//     transaction = await sequelize.transaction()
//   }

//   try {
//     // Retrieve the destroyed comments using the where clause from options
//     const destroyedComments = await Comment.findAll({
//       where: options.where,
//       transaction,
//     })

//     for (const comment of destroyedComments) {
//       const post = await comment.getPost({ transaction })
//       if (post) {
//         await post.decrement('commentsCount', { by: 1, transaction })
//       }
//     }

//     if (!options.transaction) {
//       await transaction.commit()
//     }
//   } catch (error) {
//     if (!options.transaction) {
//       await transaction.rollback()
//     }
//     throw error
//   }
// })

export default Comment
