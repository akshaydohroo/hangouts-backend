import { UUID } from 'crypto'
import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize'
import sequelize from '../db'
import Chat from './Chat'
import Message from './Message'
import User from './User'

class ChatParticipant extends Model<
  InferAttributes<ChatParticipant>,
  InferCreationAttributes<ChatParticipant>
> {
  declare chatParticipantId: CreationOptional<UUID>
  declare chatId: ForeignKey<Chat['chatId']>
  declare userId: ForeignKey<User['id']>
  declare lastSeenMessageId: ForeignKey<Message['messageId']> | null
  declare isAdmin: CreationOptional<boolean>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

ChatParticipant.init(
  {
    chatParticipantId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'chat_participants',
  }
)
export default ChatParticipant
