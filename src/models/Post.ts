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

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare postId: UUID
  declare userId: ForeignKey<User['id']>
  declare picture: string
  declare caption: string
  declare likes: CreationOptional<number>
  declare commentsCount: CreationOptional<number>
  declare seenCount: CreationOptional<number>
  declare getUser: BelongsToGetAssociationMixin<User>
  declare createUser: BelongsToCreateAssociationMixin<User>
  declare user?: NonAttribute<User>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

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
    commentsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  { sequelize, tableName: 'posts' }
)

export default Post
