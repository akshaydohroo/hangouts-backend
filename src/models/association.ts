import Notification from "./Notification";
import Story from "./Story";
import StoryInteraction from "./StoryInteraction";
import User from "./User";
import UserFollower from "./UserFollower";

User.belongsToMany(User, {
  through: UserFollower,
  foreignKey: "userId",
  otherKey: "followerId",
  as: "followers",
  targetKey: "id",
  sourceKey: "id",
});
User.belongsToMany(User, {
  through: UserFollower,
  foreignKey: "followerId",
  otherKey: "userId",
  as: "follows",
  targetKey: "id",
  sourceKey: "id",
});
User.hasMany(Notification, {
  foreignKey: {
    allowNull: false,
    name: "userId",
  },
  sourceKey: "id",
  as: "notifications",
});
Notification.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: "userId",
  },
  targetKey: "id",
  as: "user",
});
User.hasMany(Notification, {
  foreignKey: {
    allowNull: false,
    name: "senderId",
  },
  sourceKey: "id",
  as: "activities",
});
Notification.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: "senderId",
  },
  targetKey: "id",
  as: "sender",
});
User.hasMany(Story, {
  foreignKey: {
    allowNull: false,
    name: "userId",
  },
  sourceKey: "id",
  as: "stories",
});
Story.belongsTo(User, {
  foreignKey: {
    allowNull: false,
    name: "userId",
  },
  targetKey: "id",
  as: "user",
});
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
