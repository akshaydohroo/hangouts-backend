import { Server, Socket } from 'socket.io'
import {
  saveChatMessage,
  transformSenderMessage,
  userMessageRead,
} from '../utils/functions/chat'

export const chatSocketHandler = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId

    if (!userId) {
      console.warn('Unauthenticated socket connection:', socket.id)
      socket.disconnect()
      return
    }

    console.log('A user connected:', socket.id, userId)

    socket.on('join-chat', (chatId: string) => {
      socket.join(chatId)
      console.log(`User ${userId} joined chat: ${chatId}`)
    })

    socket.on('leave-chat', (chatId: string) => {
      socket.leave(chatId)
      console.log(`User ${userId} left chat: ${chatId}`)
    })

    socket.on('send-message', async ({ chatId, content, replyMessageId }) => {
      try {
        const message = await saveChatMessage(
          chatId,
          userId,
          content,
          replyMessageId
        )
        const savedMessage = await transformSenderMessage(message.messageId)

        io.to(chatId).emit('receive-message', savedMessage.toJSON())
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    })

    socket.on('typing', ({ chatId }) => {
      socket.to(chatId).emit('typing', { userId })
    })

    socket.on('read-message', async ({ chatId, messageId }) => {
      try {
        await userMessageRead(messageId, userId)
        socket.to(chatId).emit('message-read', { messageId, userId })
      } catch (error) {
        console.error('Failed to mark message as read:', error)
      }
    })
  })
}
