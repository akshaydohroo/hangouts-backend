import { UUID, randomUUID } from "crypto";
import {
  Attributes,
  BulkCreateOptions,
  CreationAttributes,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../db";
import Notification from "./Notification";
import User from "./User";

class UserFollower extends Model<
  InferAttributes<UserFollower>,
  InferCreationAttributes<UserFollower>
> {
  declare connectionId: UUID;
  declare userId: ForeignKey<User["id"]>;
  declare followerId: ForeignKey<User["id"]>;
  declare status: CreationOptional<"accepted" | "pending">;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserFollower.init(
  {
    connectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM("accepted", "pending"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  { sequelize, tableName: "user_followers", modelName: "connection" }
);

UserFollower.afterCreate(async (instance: UserFollower, options) => {
  const notification = await getNotificationCreationAttributes(instance,options);
  Notification.create(notification, { transaction: options.transaction });
});
async function getNotificationCreationAttributes(
  instance: UserFollower,
  options: BulkCreateOptions<
    InferAttributes<
      UserFollower,
      {
        omit: never;
      }
    >
  >
): Promise<CreationAttributes<Notification>> {
  const sender = await User.findByPk(instance.dataValues.followerId, {
    attributes: ["userName", "name"],
    transaction: options.transaction,
  });
  if (!sender) throw Error("Sender profile not found");

  return {
    notificationId: randomUUID(),
    notificationType: "follow",
    notificationMessage: `${sender.userName} wants to follow you.`,
    userId: instance.dataValues.userId,
    senderId: instance.dataValues.followerId,
    cause: "user",
    causeId: instance.dataValues.followerId,
  };
}

export default UserFollower;
