import Chat from './Chat'
import ChatParticipant from './ChatParticipant'
import Comment from './Comment'
import Message from './Message'
import Notification from './Notification'
import Post from './Post'
import PostInteraction from './PostInteraction'
import ReadChatReceipts from './ReadChatReceipts'
import Story from './Story'
import StoryInteraction from './StoryInteraction'
import User from './User'
import UserFollower from './UserFollower'

// User-to-User (Followers and Follows)
User.belongsToMany(User, {
  through: UserFollower,
  foreignKey: 'userId',
  otherKey: 'followerId',
  as: 'followers',
  targetKey: 'id',
  sourceKey: 'id',
})

User.belongsToMany(User, {
  through: UserFollower,
  foreignKey: 'followerId',
  otherKey: 'userId',
  as: 'follows',
  targetKey: 'id',
  sourceKey: 'id',
})

// User-to-Notification
User.hasMany(Notification, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  sourceKey: 'id',
  as: 'notifications',
})

Notification.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  targetKey: 'id',
  as: 'user',
})

User.hasMany(Notification, {
  foreignKey: {
    allowNull: false,
    name: 'senderId',
  },
  sourceKey: 'id',
  as: 'activities',
})

Notification.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: 'senderId',
  },
  targetKey: 'id',
  as: 'sender',
})

// User-to-Story
User.hasMany(Story, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  sourceKey: 'id',
  as: 'stories',
})

Story.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  targetKey: 'id',
  as: 'user',
})

// Story-to-User (Viewers)
Story.belongsToMany(User, {
  foreignKey: {
    allowNull: false,
    name: 'storyId',
  },
  targetKey: 'id',
  sourceKey: 'storyId',
  through: StoryInteraction,
  as: 'viewers',
})

User.belongsToMany(Story, {
  foreignKey: {
    allowNull: false,
    name: 'viewerId',
  },
  targetKey: 'storyId',
  sourceKey: 'id',
  through: StoryInteraction,
  as: 'viewedStories',
})

// User-to-Post
User.hasMany(Post, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  as: 'posts',
  sourceKey: 'id',
})

Post.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  targetKey: 'id',
  as: 'user',
})

// Post-to-Comment
Post.hasMany(Comment, {
  foreignKey: {
    allowNull: false,
    name: 'postId',
  },
  as: 'comments',
  sourceKey: 'postId',
})

Comment.belongsTo(Post, {
  foreignKey: {
    allowNull: false,
    name: 'postId',
  },
  targetKey: 'postId',
  as: 'post',
})

// Comment-to-User
Comment.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  targetKey: 'id',
  as: 'author',
})

User.hasMany(Comment, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  as: 'comments',
  sourceKey: 'id',
})

// Comment-to-Comment (Replies)
Comment.belongsTo(Comment, {
  foreignKey: {
    allowNull: true,
    name: 'parentCommentId',
  },
  targetKey: 'commentId',
  as: 'parentComment',
})

Comment.hasMany(Comment, {
  foreignKey: {
    allowNull: true,
    name: 'parentCommentId',
  },
  as: 'replies',
  sourceKey: 'commentId',
})

// Post-to-User (Viewers)
Post.belongsToMany(User, {
  foreignKey: {
    allowNull: false,
    name: 'postId',
  },
  targetKey: 'id',
  sourceKey: 'postId',
  through: PostInteraction,
  as: 'viewedPosts',
})

User.belongsToMany(Post, {
  foreignKey: {
    allowNull: false,
    name: 'viewerId',
  },
  targetKey: 'postId',
  sourceKey: 'id',
  through: PostInteraction,
  as: 'viewers',
})

Chat.belongsToMany(User, {
  foreignKey: {
    allowNull: false,
    name: 'chatId',
  },
  otherKey: 'userId',
  targetKey: 'id',
  sourceKey: 'chatId',
  through: ChatParticipant,
  as: 'participants',
})

User.belongsToMany(Chat, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  otherKey: 'chatId',
  targetKey: 'chatId',
  sourceKey: 'id',
  through: ChatParticipant,
  as: 'userChats',
})

Chat.hasMany(ChatParticipant, {
  foreignKey: 'chatId',
  as: 'chatParticipants',
})

ChatParticipant.belongsTo(Chat, {
  foreignKey: 'chatId',
  as: 'chat',
})

Chat.belongsTo(Message, {
  foreignKey: {
    allowNull: true,
    name: 'lastMessageId',
  },
  targetKey: 'messageId',
  as: 'lastMessage',
})

Message.hasOne(Chat, {
  foreignKey: {
    allowNull: true,
    name: 'lastMessageId',
  },
  sourceKey: 'messageId',
  as: 'chatWithLastMessage',
})

Chat.hasMany(Message, {
  foreignKey: {
    allowNull: false,
    name: 'chatId',
  },
  sourceKey: 'chatId',
  as: 'messages',
})

Message.belongsTo(Chat, {
  foreignKey: {
    allowNull: false,
    name: 'chatId',
  },
  targetKey: 'chatId',
  as: 'chat',
})

User.hasMany(Message, {
  foreignKey: {
    allowNull: false,
    name: 'senderId',
  },
  sourceKey: 'id',
  as: 'messages',
})

Message.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: 'senderId',
  },
  targetKey: 'id',
  as: 'sender',
})

Message.belongsToMany(User, {
  foreignKey: {
    allowNull: false,
    name: 'messageId',
  },
  otherKey: 'userId',
  targetKey: 'id',
  sourceKey: 'messageId',
  through: ReadChatReceipts,
  as: 'readBy',
})

Message.belongsTo(Message, {
  foreignKey: {
    allowNull: true,
    name: 'replyToMessageId',
  },
  targetKey: 'messageId',
  as: 'replyToMessage',
})

Message.hasMany(Message, {
  foreignKey: {
    allowNull: true,
    name: 'replyToMessageId',
  },
  sourceKey: 'messageId',
  as: 'replies',
})

User.belongsToMany(Message, {
  foreignKey: {
    allowNull: false,
    name: 'userId',
  },
  otherKey: 'messageId',
  targetKey: 'messageId',
  sourceKey: 'id',
  through: ReadChatReceipts,
  as: 'readMessages',
})
