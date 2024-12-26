import { randomUUID } from 'crypto'
import { Attributes, CreationAttributes } from 'sequelize'
import StoryInteraction from 'src/models/StoryInteraction'
import Story from '../../models/Story'
import User from '../../models/User'
import { users } from './users'
import { rng } from './variables'

function createUserStories(
  users: (Attributes<User> | CreationAttributes<User>)[]
): [
  (Attributes<Story> | CreationAttributes<Story>)[],
  (Attributes<StoryInteraction> | CreationAttributes<StoryInteraction>)[],
] {
  const userStories: (Attributes<Story> | CreationAttributes<Story>)[] = []
  const storyInteractions: (
    | Attributes<StoryInteraction>
    | CreationAttributes<StoryInteraction>
  )[] = []
  users.forEach(user => {
    for (let i = 0; i < Math.floor(rng() * 5) + 1; i++) {
      const story: Attributes<Story> | CreationAttributes<Story> = {
        userId: user.id,
        storyId: randomUUID(),
        picture: `https://picsum.photos/400/600?random=${Math.floor(rng() * 1000)}`,
        likes: Math.floor(rng() * 10),
        seenCount: Math.floor(rng() * 1000),
      }
      userStories.push(story)
      users.forEach(viewer => {
        if (viewer.id === user.id || rng() > 0.5) {
          return
        }
        storyInteractions.push({
          interactionId: randomUUID(),
          storyId: story.storyId,
          viewerId: viewer.id,
          isLike: rng() > 0.5,
          reactionEmoji: rng() > 0.5 ? '👍' : '❤️',
        } as
          | Attributes<StoryInteraction>
          | CreationAttributes<StoryInteraction>)
      })
    }
  })
  return [userStories, storyInteractions]
}

export const [userStories, storyInteractions] = createUserStories(users)
