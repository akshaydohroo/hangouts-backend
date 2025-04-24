import { Attributes, CreationAttributes } from 'sequelize'
import Comment from '../../models/Comment'
import Post from '../../models/Post'
import User from '../../models/User'
import { userPosts } from './posts'
import sampleComments from './SampleComments'
import { users } from './users'
import { rng } from './variables'

function createPostsComments(
  users: (Attributes<User> | CreationAttributes<User>)[],
  posts: (Attributes<Post> | CreationAttributes<Post>)[]
): (Attributes<Comment> | CreationAttributes<Comment>)[] {
  const comments: (Attributes<Comment> | CreationAttributes<Comment>)[] = []

  posts.forEach(post => {
    const postComments: Attributes<Comment> | CreationAttributes<Comment>[] = []
    for (let i = 0; i < Math.floor(rng() * 10) + 1; i++) {
      post.commentsCount = 1 + (post.commentsCount ?? 0)
      const comment: Attributes<Comment> | CreationAttributes<Comment> = {
        postId: post.postId,
        commentId: crypto.randomUUID(),
        parentCommentId:
          postComments.length == 0
            ? null
            : postComments[Math.floor(rng() * postComments.length)].commentId,
        userId: users[Math.floor(rng() * users.length)].id,
        text: sampleComments[Math.floor(rng() * sampleComments.length)],
        likes: Math.floor(rng() * 50),
      }
      postComments.push(comment)
    }
    comments.push(...postComments)
  })

  return comments
}

export const comments = createPostsComments(users, userPosts)
