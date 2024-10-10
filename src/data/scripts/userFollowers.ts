import { randomUUID } from 'crypto'
import { Attributes, CreationAttributes } from 'sequelize'
import Notification from '../../models/Notification'
import User from '../../models/User'
import UserFollower from '../../models/UserFollower'
import { users } from './users'
import { rng } from './variables'

// Function to generate a random status
function getRandomStatus() {
  return rng() > 0.5 ? 'accepted' : 'pending' // Use the seeded random generator
}

// Function to generate the follower data
function createFollowerData(
  users: (Attributes<User> | CreationAttributes<User>)[]
) {
  const followerData: (
    | Attributes<UserFollower>
    | CreationAttributes<UserFollower>
  )[] = []
  const followerNotifications: (
    | Attributes<Notification>
    | CreationAttributes<Notification>
  )[] = []

  // Loop to create random connections
  users.forEach(user => {
    // Ensure that a user doesn't follow themselves
    const followerCandidates = users.filter(u => u.id !== user.id)
    // Randomly select a follower from other users using the seeded RNG
    const randomFollower = followerCandidates.slice(
      Math.floor(rng() * followerCandidates.length),
      Math.floor(rng() * followerCandidates.length) + rng() * 20
    )
    randomFollower.forEach(follower => {
      const applicationStatus = getRandomStatus()
      followerData.push({
        userId: user.id,
        followerId: follower.id,
        status: applicationStatus,
        connectionId: randomUUID(),
      })
      followerNotifications.push({
        notificationId: randomUUID(),
        notificationType: applicationStatus === 'pending' ? 'follow' : 'notify',
        notificationMessage:
          applicationStatus === 'pending'
            ? `${follower.userName} wants to follow you.`
            : `${follower.userName} follow you now.`,
        userId: user.id,
        senderId: follower.id,
        cause: 'user',
        causeId: follower.id,
      })
    })
  })

  return [followerData, followerNotifications] as [
    (Attributes<UserFollower> | CreationAttributes<UserFollower>)[],
    (Attributes<Notification> | CreationAttributes<Notification>)[],
  ]
}

// // Generate the follower data
export const [followersArray, followerNotifications] = createFollowerData(users)
