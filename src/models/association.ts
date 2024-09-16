import Notification from "./Notification";
import Story from "./Story";
import StoryInteraction from "./StoryInteraction";
import User from "./User";
import UserFollower from "./UserFollower";

/**
 * Establishes a many-to-many relationship between User and User through UserFollower.
 * A user can have many followers and can follow many users.
 */
User.belongsToMany(User, {
  through: UserFollower,
  foreignKey: "userId",
  otherKey: "followerId",
  as: "followers",
  targetKey: "id",
  sourceKey: "id",
});

/**
 * Establishes a many-to-many relationship between User and User through UserFollower.
 * A user can follow many users and can be followed by many users.
 */
User.belongsToMany(User, {
  through: UserFollower,
  foreignKey: "followerId",
  otherKey: "userId",
  as: "follows",
  targetKey: "id",
  sourceKey: "id",
});

/**
 * Establishes a one-to-many relationship between User and Notification.
 * A user can have many notifications.
 */
User.hasMany(Notification, {
  foreignKey: {
    allowNull: false,
    name: "userId",
  },
  sourceKey: "id",
  as: "notifications",
});

/**
 * Establishes a many-to-one relationship between Notification and User.
 * A notification belongs to a single user.
 */
Notification.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: "userId",
  },
  targetKey: "id",
  as: "user",
});

/**
 * Establishes a one-to-many relationship between User and Notification.
 * A user can have many activities (notifications they sent).
 */
User.hasMany(Notification, {
  foreignKey: {
    allowNull: false,
    name: "senderId",
  },
  sourceKey: "id",
  as: "activities",
});

/**
 * Establishes a many-to-one relationship between Notification and User.
 * A notification belongs to a single user (the sender).
 */
Notification.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: "senderId",
  },
  targetKey: "id",
  as: "sender",
});

/**
 * Establishes a one-to-many relationship between User and Story.
 * A user can have many stories.
 */
User.hasMany(Story, {
  foreignKey: {
    allowNull: false,
    name: "userId",
  },
  sourceKey: "id",
  as: "stories",
});

/**
 * Establishes a many-to-one relationship between Story and User.
 * A story belongs to a single user.
 */
Story.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: "userId",
  },
  targetKey: "id",
  as: "user",
});

/**
 * Establishes a many-to-many relationship between Story and User through StoryInteraction.
 * A story can have many viewers and a user can view many stories.
 */
Story.belongsToMany(User, {
  foreignKey: {
    allowNull: false,
    name: "storyId",
  },
  targetKey: "id",
  sourceKey: "storyId",
  through: StoryInteraction,
  as: "viewers",
});

/**
 * Establishes a many-to-many relationship between User and Story through StoryInteraction.
 * A user can view many stories and a story can have many viewers.
 */
User.belongsToMany(Story, {
  foreignKey: {
    allowNull: false,
    name: "viewerId",
  },
  targetKey: "storyId",
  sourceKey: "id",
  through: StoryInteraction,
  as: "viewed_stories",
});