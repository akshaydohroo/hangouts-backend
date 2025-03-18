import { randomUUID } from 'crypto'
import { Attributes, CreationAttributes } from 'sequelize'
import Post from '../../models/Post'
import PostInteraction from '../../models/PostInteraction'
import User from '../../models/User'
import sampleComments from './SampleComments'
import { users } from './users'
import { rng } from './variables'

function createUserPosts(
  users: (Attributes<User> | CreationAttributes<User>)[]
): [
  (Attributes<Post> | CreationAttributes<Post>)[],
  (Attributes<PostInteraction> | CreationAttributes<PostInteraction>)[],
] {
  const userPosts: (Attributes<Post> | CreationAttributes<Post>)[] = []
  const postInteractions: (
    | Attributes<PostInteraction>
    | CreationAttributes<PostInteraction>
  )[] = []
  users.forEach(user => {
    for (let i = 0; i < Math.floor(rng() * 5) + 1; i++) {
      const post: Attributes<Post> | CreationAttributes<Post> = {
        userId: user.id,
        postId: randomUUID(),
        picture: `https://picsum.photos/${800 + Math.floor(rng() * 1000)}/${600 + Math.floor(rng() * 600)}?random=${Math.floor(rng() * 1000)}`,
        caption: sampleComments[Math.floor(rng() * sampleComments.length)],
        likes: rng() * 20,
      }
      userPosts.push(post)

      users.forEach(viewer => {
        if (viewer.id === user.id || rng() > 0.5) {
          return
        }
        postInteractions.push({
          interactionId: randomUUID(),
          postId: post.postId,
          viewerId: viewer.id,
          reactionEmoji: ['👍', '❤️', '😂', '😮', '😢', '👎'][
            Math.floor(rng() * 6)
          ],
        } as Attributes<PostInteraction> | CreationAttributes<PostInteraction>)
      })
    }
  })
  return [userPosts, postInteractions]
}

export const [userPosts, postInteractions] = createUserPosts(users)
