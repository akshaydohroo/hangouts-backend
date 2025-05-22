import { UUID } from 'crypto'
import {
  CreateOptions,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize'
import sequelize from '../db'
import Message from './Message'
import User from './User'

class ReadChatReceipts extends Model<
  InferAttributes<ReadChatReceipts>,
  InferCreationAttributes<ReadChatReceipts>
> {
  declare readReceiptID: CreationOptional<UUID>
  declare userId: ForeignKey<User['id']>
  declare messageId: ForeignKey<Message['messageId']>
}

ReadChatReceipts.init(
  {
    readReceiptID: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
  },
  {
    sequelize,
    tableName: 'read_chat_receipts',
  }
)
export default ReadChatReceipts

ReadChatReceipts.afterCreate(
  async (
    instance: ReadChatReceipts,
    options: CreateOptions<InferAttributes<ReadChatReceipts>>
  ): Promise<void> => {
    // Update the read count in the Message table
    let transaction = options.transaction
    if (!transaction) {
      transaction = await sequelize.transaction()
    }
    try {
      await Message.increment(
        { readCount: 1 },
        { where: { messageId: instance.messageId } }
      )
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
