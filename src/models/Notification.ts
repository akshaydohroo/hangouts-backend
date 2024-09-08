import { UUID } from "crypto";
import {
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";
import sequelize from "../db";
import User from "./User";
export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "message"
  | "reaction";
export type NotificationCause = "post" | "story" | "comment";
class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  declare notificationId: UUID;
  declare notificationType: NotificationType;
  declare notificationMessage: string;
  declare senderId: string;
  declare userId: ForeignKey<User["id"]>;
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare createUser: BelongsToCreateAssociationMixin<User>;
  declare user?: NonAttribute<User>;
  declare sender?: NonAttribute<User>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare cause: string;
  declare causeId: string;
  //   declare setUser : BelongsToSetAssociationMixin<User,>
}
Notification.init(
  {
    notificationId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    notificationType: {
      type: DataTypes.ENUM("like", "comment", "follow", "message", "reaction"),
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    notificationMessage: {
      allowNull: false,
      type: DataTypes.STRING(100),
    },
    senderId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    cause: {
      type: DataTypes.ENUM("post", "story", "comment", "user"),
      allowNull: false,
    },
    causeId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
  },
  { sequelize, tableName: "notifications" }
);

export default Notification;
