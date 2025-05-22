import { UUID } from 'crypto'
import sequelize from '../../db'
import Chat from '../../models/Chat'
import Message from '../../models/Message'
import ReadChatReceipts from '../../models/ReadChatReceipts'
import User from '../../models/User'

export async function saveChatMessage(
  chatId: UUID,
  senderId: UUID,
  content: string,
  replyId?: UUID
): Promise<Message> {
  try {
    if (!chatId) {
      throw Error('No chat Id found')
    }
    if (content === undefined || content === '') {
      throw Error('No Content found')
    }
    if (!senderId) {
      throw Error('No user Id found')
    }

    const chat = await sequelize.transaction(async t => {
      return Chat.findByPk(chatId, { transaction: t })
    })
    if (!chat) {
      throw Error("Chat doesn't exist")
    }
    if (replyId) {
      const parentMessage = await sequelize.transaction(async t => {
        return Message.findByPk(replyId, { transaction: t })
      })
      if (!parentMessage) {
        throw Error("Parent message doesn't exist")
      }
    }
    const savedMessage = await sequelize.transaction(async t => {
      return await Message.create(
        {
          text: content,
          chatId: chatId,
          senderId: senderId,
          replyToMessageId: replyId || null,
        },
        { transaction: t }
      )
    })
    return savedMessage
  } catch (error) {
    console.error('Error saving message:', error)
    throw error
  }
}

export async function userMessageRead(
  messageId: UUID,
  userId: UUID
): Promise<ReadChatReceipts> {
  try {
    if (!messageId) {
      throw Error('No message Id found')
    }
    if (!userId) {
      throw Error('No user Id found')
    }

    const message = await sequelize.transaction(async t => {
      return Message.findByPk(messageId, { transaction: t })
    })
    if (!message) {
      throw Error("Message doesn't exist")
    }
    const [readReceipt, isCreate] = await sequelize.transaction(
      async (t: any) => {
        return ReadChatReceipts.findOrCreate({
          where: {
            messageId: messageId,
            userId: userId,
          },
          defaults: {
            messageId: messageId,
            userId: userId,
          },
          transaction: t,
        })
      }
    )
    if (!isCreate) {
      throw Error('Already read')
    }
    return readReceipt
  } catch (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}

export async function transformSenderMessage(
  messageId: UUID
): Promise<Message> {
  const savedMessage = await sequelize.transaction(async t => {
    return Message.findByPk(messageId, {
      attributes: ['messageId', 'text', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'userName', 'picture'],
        },
        {
          model: Message,
          as: 'replyToMessage',
          attributes: ['messageId', 'text', 'createdAt', 'updatedAt'],
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name', 'userName', 'picture'],
            },
          ],
        },
      ],
      transaction: t,
    })
  })
  if (!savedMessage) {
    throw Error("Message doesn't exist")
  }
  return savedMessage
}
