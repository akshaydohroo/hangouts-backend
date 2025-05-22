import { UUID } from 'crypto'
import {
  BelongsToManyGetAssociationsMixin,
  CreationOptional,
  DataTypes,
  ForeignKey,
  HasManyGetAssociationsMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize'
import sequelize from '../db'
import Message from './Message'
import User from './User' // Assuming you have a User model

class Chat extends Model<InferAttributes<Chat>, InferCreationAttributes<Chat>> {
  declare chatId: CreationOptional<UUID>
  declare chatName: string
  declare participantsCount: CreationOptional<number>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare lastMessageId: ForeignKey<Message['messageId']> | null
  declare messageCount: CreationOptional<number>

  // Non-attributes
  declare participants?: NonAttribute<User[]>
  declare messages?: NonAttribute<Message[]>

  declare getParticipants: BelongsToManyGetAssociationsMixin<User>
  declare getMessages: HasManyGetAssociationsMixin<Message>
}

Chat.init(
  {
    chatId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    chatName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    participantsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    messageCount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'chats',
  }
)

export default Chat
