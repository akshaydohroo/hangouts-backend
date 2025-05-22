import { UUID } from 'crypto'
import {
  BelongsToGetAssociationMixin,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  SaveOptions,
} from 'sequelize'
import sequelize from '../db'
import Chat from './Chat'
import User from './User'

class Message extends Model<
  InferAttributes<Message>,
  InferCreationAttributes<Message>
> {
  declare messageId: CreationOptional<UUID>
  declare text: string
  declare senderId: ForeignKey<User['id']>
  declare chatId: ForeignKey<Chat['chatId']>
  declare readCount: CreationOptional<number>
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
  declare replyToMessageId: ForeignKey<Message['messageId']> | null // optional
  declare isRead: CreationOptional<boolean>

  declare getSender: BelongsToGetAssociationMixin<User>
  declare getChat: BelongsToGetAssociationMixin<Chat>
  declare getReplyToMessage: BelongsToGetAssociationMixin<Message>

  declare sender?: User
  declare chat?: NonAttribute<Chat>
  declare replyToMessage?: NonAttribute<Message>
}

Message.init(
  {
    messageId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    readCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'messages',
    indexes: [
      {
        fields: ['chatId', 'createdAt'], // Composite index
      },
    ],
  }
)

Message.afterCreate(
  async (
    instance: Message,
    options: SaveOptions<InferAttributes<Message>>
  ): Promise<void> => {
    let transaction = options.transaction
    if (!transaction) {
      transaction = await sequelize.transaction()
    }
    try {
      const { chatId } = instance.dataValues
      console.log('New message created:', instance.dataValues)
      const chat = await Chat.findByPk(chatId, {
        transaction,
      })
      if (!chat) throw Error("Chat couldn't be found")

      chat.lastMessageId = instance.messageId
      chat.messageCount = Number(chat.messageCount) + 1
      console.log('Chat found:', chat.dataValues)
      await chat.save({ transaction })

      if (!options.transaction) {
        await transaction.commit()
      }
    } catch (error) {
      console.error('Error incrementing message count:', error)
      if (!options.transaction) {
        await transaction.rollback()
      }
      throw error
    }
  }
)

Message.afterUpdate(
  async (
    instance: Message,
    options: SaveOptions<InferAttributes<Message>>
  ): Promise<void> => {
    let transaction = options.transaction
    if (!transaction) {
      transaction = await sequelize.transaction()
    }
    try {
      const { chatId, readCount } = instance.dataValues
      if (instance.changed('readCount')) {
        const chat = await Chat.findByPk(chatId, {
          transaction,
        })
        if (!chat) throw Error("Chat couldn't be found")
        const participantsCount = chat.dataValues.participantsCount
        if (participantsCount === readCount) {
          await Message.update(
            { isRead: true },
            { where: { messageId: instance.messageId }, transaction }
          )
        }
      }
      if (!options.transaction) {
        await transaction.commit()
      }
    } catch (error) {
      console.error('Error incrementing read count:', error)
      if (!options.transaction) {
        await transaction.rollback()
      }
      throw error
    }
  }
)

Message.afterDestroy(
  async (
    instance: Message,
    options: SaveOptions<InferAttributes<Message>>
  ): Promise<void> => {
    let transaction = options.transaction
    if (!transaction) {
      transaction = await sequelize.transaction()
    }
    try {
      const { chatId } = instance.dataValues
      const chat = await Chat.findByPk(chatId, {
        transaction,
      })
      if (!chat) throw Error("Chat couldn't be found")
      chat.messageCount = chat.messageCount - 1
      await chat.save({ transaction })
      if (!options.transaction) {
        await transaction.commit()
      }
    } catch (error) {
      console.error('Error decrementing message count:', error)
      if (!options.transaction) {
        await transaction.rollback()
      }
      throw error
    }
  }
)

export default Message
