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
class Story extends Model<
  InferAttributes<Story>,
  InferCreationAttributes<Story>
> {
  declare storyId: UUID;
  declare userId: ForeignKey<User["id"]>;
  declare picture: string;
  declare seenCount: CreationOptional<number>;
  declare likes: CreationOptional<number>;
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare createUser: BelongsToCreateAssociationMixin<User>;
  declare user?: NonAttribute<User>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  //   declare setUser : BelongsToSetAssociationMixin<User,>
}
Story.init(
  {
    storyId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    picture: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    seenCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  { sequelize, tableName: "stories" }
);
Story.beforeCreate(async (instance: Story, options) => {
  const count = await Story.count({
    where: {
      userId: instance.userId,
    },
    group: ["userId"],
    transaction: options.transaction,
  });
  if (count.length === 5) {
    throw Error("User cant have more than 5 stories at a time");
  }
});
export default Story;
