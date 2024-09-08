import { UUID } from "crypto";
import {
  CreationAttributes,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  UpdateOptions,
} from "sequelize";
import sequelize from "../db";
import Notification from "./Notification";
import Story from "./Story";
import User from "./User";

class StoryInteraction extends Model<
  InferAttributes<StoryInteraction>,
  InferCreationAttributes<StoryInteraction>
> {
  declare interactionId: UUID;
  declare storyId: ForeignKey<Story["storyId"]>;
  declare viewerId: ForeignKey<User["id"]>;
  declare isLike: CreationOptional<boolean>;
  declare reactionEmoji: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

StoryInteraction.init(
  {
    interactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    isLike: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reactionEmoji: DataTypes.STRING(4),
  },
  { sequelize, tableName: "story_interactions", modelName: "interaction" }
);

StoryInteraction.afterUpdate(
  async (
    instance: StoryInteraction,
    options: UpdateOptions<InferAttributes<StoryInteraction, { omit: never }>>
  ) => {
    try {
      const {
        viewerId: senderId,
        storyId,
        reactionEmoji,
        isLike,
      } = instance.dataValues;
      if (
        instance.changed("reactionEmoji") ||
        (instance.changed("isLike") && isLike)
      ) {
        const story = await Story.findByPk(storyId, {
          transaction: options.transaction,
        });
        if (!story) throw Error("Story couldnt be found");
        const userId = story.dataValues.userId;
        const notificationCreationAttributes = {
          userId,
          senderId,
          causeId: storyId,
          cause: "story",
        } as CreationAttributes<Notification>;
        const sender = await User.findByPk(senderId, {
          attributes: ["name", "userName"],
          transaction: options.transaction,
        });
        if (!sender) throw Error("No sender found");
        if (instance.changed("reactionEmoji")) {
          notificationCreationAttributes.notificationType = "reaction";
          notificationCreationAttributes.notificationMessage = `${sender.userName} reacted ${reactionEmoji} on your story.`;
        } else {
          notificationCreationAttributes.notificationType = "like";
          notificationCreationAttributes.notificationMessage = `${sender.userName} liked your story.`;
        }
        Notification.create(notificationCreationAttributes, {
          transaction: options.transaction,
        });
      }
    } catch (err) {
      throw err;
    }
  }
);

export default StoryInteraction;
