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

/**
 * Class representing a StoryInteraction.
 * @extends Model
 */
class StoryInteraction extends Model<
  InferAttributes<StoryInteraction>,
  InferCreationAttributes<StoryInteraction>
> {
  /**
   * The unique identifier for the interaction.
   * @type {UUID}
   */
  declare interactionId: UUID;

  /**
   * The ID of the story associated with the interaction.
   * @type {ForeignKey<Story["storyId"]>}
   */
  declare storyId: ForeignKey<Story["storyId"]>;

  /**
   * The ID of the user who viewed or interacted with the story.
   * @type {ForeignKey<User["id"]>}
   */
  declare viewerId: ForeignKey<User["id"]>;

  /**
   * Indicates whether the interaction is a like.
   * @type {CreationOptional<boolean>}
   */
  declare isLike: CreationOptional<boolean>;

  /**
   * The emoji used for the reaction.
   * @type {CreationOptional<string>}
   */
  declare reactionEmoji: CreationOptional<string>;

  /**
   * The date and time when the interaction was created.
   * @type {CreationOptional<Date>}
   */
  declare createdAt: CreationOptional<Date>;

  /**
   * The date and time when the interaction was last updated.
   * @type {CreationOptional<Date>}
   */
  declare updatedAt: CreationOptional<Date>;
}

/**
 * Initializes the StoryInteraction model.
 */
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

/**
 * Hook that runs after a StoryInteraction instance is updated.
 * Creates a notification if the interaction is a like or a reaction.
 *
 * @param {StoryInteraction} instance - The updated StoryInteraction instance.
 * @param {UpdateOptions<InferAttributes<StoryInteraction, { omit: never }>>} options - The update options.
 * @throws {Error} - If the story or sender cannot be found.
 */
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
        if (!story) throw Error("Story couldn't be found");

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