import { NextFunction, Request, Response } from 'express'
import { Op, QueryTypes } from 'sequelize'
import { nodeEnv } from '../config'
import sequelize from '../db'
import Chat from '../models/Chat'
import ChatParticipant from '../models/ChatParticipant'
import Message from '../models/Message'
import User from '../models/User'
import UserFollower from '../models/UserFollower'

export async function getOrCreateUserChat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.params.userId as string
    const selfId = res.locals.selfId as string

    if (!userId) {
      res.status(400)
      throw Error('No target user Id found')
    }
    if (!selfId) {
      res.status(400)
      throw Error('User Id not found')
    }
    const selfUser = (await sequelize.transaction(async t => {
      return User.findByPk(selfId, { transaction: t })
    })) as User

    const targetUser = await sequelize.transaction(async t => {
      return User.findByPk(userId, { transaction: t })
    })
    if (!targetUser) {
      res.status(400)
      throw Error("User doesn't exist")
    }
    if (targetUser.visibility === 'private') {
      const connection = await sequelize.transaction(async t => {
        return UserFollower.findOne({
          where: {
            followerId: selfId,
            userId: userId,
          },
          transaction: t,
        })
      })
      if (!connection || connection.status !== 'accepted') {
        res.status(400)
        throw Error('User profile is private and you are not connected')
      }
    }

    const chat = await sequelize.transaction(async t => {
      const chatAlias = nodeEnv === 'development' ? '"Chat"' : '"s"'

      let [chat] = await sequelize.query<Chat>(
        `
  SELECT ${chatAlias}.*
  FROM "chats" AS ${chatAlias}
  INNER JOIN "chat_participants" AS "chatParticipants"
    ON "chatParticipants"."chatId" = ${chatAlias}."chatId"
  WHERE ${chatAlias}."participantsCount" = 2
    AND "chatParticipants"."userId" IN (:selfId, :userId)
  GROUP BY ${chatAlias}."chatId"
  HAVING COUNT(DISTINCT "chatParticipants"."userId") = 2
  LIMIT 1
`,
        {
          replacements: { selfId, userId },
          type: QueryTypes.SELECT,
          transaction: t,
        }
      )

      if (!chat) {
        chat = await Chat.create(
          {
            participantsCount: 2,
            chatName: `${selfId}-${userId}-${selfUser.name}-${targetUser.name}`,
          },
          { transaction: t }
        )
        await ChatParticipant.bulkCreate(
          [
            { chatId: chat.chatId, userId: selfId },
            { chatId: chat.chatId, userId: userId },
          ],
          { transaction: t }
        )
      }

      return chat
    })

    res.json({ chatId: chat.chatId })
  } catch (err) {
    next(err)
  }
}

export async function getUserChats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string
    const searchTerm = req.query.searchTerm as string

    if (!selfId) {
      res.status(400)
      throw Error('User Id not found')
    }

    let searchTermFilteredChatIds: string[] | null = null
    if (searchTerm && searchTerm.length > 0) {
      const searchTermFilteredChat = await Chat.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('Chat.chatId')), 'chatId'],
        ], // ✅ use DISTINCT for chatId
        where: {
          [Op.or]: [
            { chatName: { [Op.iLike]: `%${searchTerm}%` } },
            { '$participants.userName$': { [Op.iLike]: `%${searchTerm}%` } },
            { '$participants.name$': { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
        include: [
          {
            model: User,
            as: 'participants',
            attributes: [], // don't fetch user fields
            required: true,
          },
        ],
        raw: true,
      })
      console.log('searchTermFilteredChat', searchTermFilteredChat)
      searchTermFilteredChatIds = searchTermFilteredChat.map(
        chat => chat.chatId
      )
    }

    const selfChat = await Chat.findAll({
      where: {
        ...(searchTermFilteredChatIds && {
          chatId: searchTermFilteredChatIds, // ✅ array of matching chatIds
        }),
      },
      attributes: ['chatId'],
      include: [
        {
          model: ChatParticipant,
          as: 'chatParticipants',
          required: true,
          where: { userId: selfId }, // ✅ ensure self is in the chat
          attributes: [], // don't include participant fields
        },
      ],
      raw: true,
    })
    const selfChatIds = selfChat.map(chat => chat.chatId)
    console.log('selfChat', selfChat)

    const chats = await Chat.findAll({
      where: { chatId: selfChatIds },
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'name', 'userName', 'picture'],
          where: { id: { [Op.ne]: selfId } }, // exclude self from participants
          required: true,
          through: {
            attributes: [],
          },
        },
        {
          model: Message,
          as: 'lastMessage',
          required: false,
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name', 'userName', 'picture'],
            },
          ],
        },
      ],

      order: [['updatedAt', 'DESC']],
    })

    res.json(chats)
  } catch (err) {
    console.assert(err)
    next(err)
  }
}
export async function getChatMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const chatId = req.params.chatId as string
    const selfId = res.locals.selfId as string
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    if (isNaN(page) || isNaN(limit)) {
      res.status(400)
      throw Error('page and limit should be valid numbers')
    }
    const offset = (page - 1) * limit
    if (offset < 0) {
      res.status(400)
      throw Error('offset requested should be greater than 0')
    }
    if (!chatId) {
      res.status(400)
      throw Error('No chat Id found')
    }
    const { count, rows } = await sequelize.transaction(async t => {
      return Message.findAndCountAll({
        where: { chatId },
        limit: limit,
        offset: offset,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'userName', 'picture'],
            required: true,
          },
          {
            model: Message,
            as: 'replyToMessage',
            attributes: ['messageId', 'text', 'createdAt'],
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'name', 'userName', 'picture'],
              },
            ],
          },
          {
            model: User,
            as: 'readBy',
            attributes: ['id', 'name', 'userName', 'picture'],
            through: {
              attributes: ['createdAt'],
              where: { userId: selfId },
            },
          },
        ],
        order: [['createdAt', 'ASC']],
      })
    })

    const sanitizedMessages = rows.map(msg => {
      const message = msg.toJSON()
      if (message.sender?.id !== selfId) {
        message.readCount = 0
        message.isRead = false
      }
      return message
    })

    const totalPages = Math.ceil(count / limit)
    res.json({
      messages: sanitizedMessages,
      totalPages: totalPages,
      page: page,
      limit: limit,
      count: count,
    })
  } catch (err) {
    next(err)
  }
}
