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
  declare commentId: UUID

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

export default Comment
