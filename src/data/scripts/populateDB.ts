import bcrypt from 'bcryptjs'
import { Sequelize } from 'sequelize'
import StoryInteraction from 'src/models/StoryInteraction'
import { nodeEnv, nodemailerUser } from '../../config'
import Notification from '../../models/Notification' // Import the correct Notification model
import Story from '../../models/Story'
import User from '../../models/User'
import UserFollower from '../../models/UserFollower'
import transport from '../../utils/transport'
import { DBpopulateMailConfig } from './DBPopulateMail'
import { storyInteractions, userStories } from './stories'
import { followerNotifications, followersArray } from './userFollowers'
import { users } from './users'

export function populateDB(sequelize: Promise<Sequelize>): Promise<String> {
  return new Promise((resolve, reject) => {
    sequelize
      .then(() => {
        return User.count()
      })
      .then(userCount => {
        if (userCount > 10) throw Error('Database already populated')
        if (nodeEnv === 'development')
          return new Promise<void>(resolve => resolve())
        transport.sendMail(
          DBpopulateMailConfig(
            nodemailerUser as string,
            users.map(user => {
              return { userName: user.userName, password: user.password || '' }
            })
          ),
          err => {
            if (err) console.error(err)
            return new Promise<void>(resolve => resolve())
          }
        )
        return new Promise<void>(resolve => resolve())
      })
      .then(() => {
        return Promise.all(
          users.map(async user => {
            user.password = await bcrypt.hash(user.password as string, 10)
            return user
          })
        )
      })
      .then(users => {
        return User.bulkCreate(users)
      })
      .then(() => {
        return UserFollower.bulkCreate(followersArray)
      })
      .then(() => {
        return Notification.bulkCreate(followerNotifications)
      })
      .then(() => {
        return Story.bulkCreate(userStories)
      })
      .then(() => {
        return StoryInteraction.bulkCreate(storyInteractions)
      })
      .then(() => {
        resolve('Database populated successfully')
      })
      .catch(err => {
        console.error(err)
        reject(err)
      })
  })
}
