import {
  Association,
  Attributes,
  CreationOptional,
  DataTypes,
  HasManyCreateAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute
} from "sequelize";
import sequelize from "../db";
import Notification from "./Notification";
import Story from "./Story";
import UserFollower from "./UserFollower";
interface UserWithFollower extends User {
  connection?: Attributes<UserFollower>;
}
class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: string;
  declare name: string;
  declare password: CreationOptional<string>;
  declare birthDate: CreationOptional<Date>;
  declare gender: CreationOptional<string>;
  declare email: string;
  declare userName: string;
  declare picture: string;
  declare emailVerified: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  //
  declare followers?: NonAttribute<UserWithFollower[]>;
  //

  declare notifications?: NonAttribute<Notification[]>;
  //
  declare createStory: HasManyCreateAssociationMixin<Story, "userId">;

  declare stories?: NonAttribute<Story[]>;
  declare static associations: {
    users: Association<User, User>;
    notifications: Association<User, Notification>;
    stories: Association<User, Story>;
  };
}

User.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: DataTypes.TEXT,
    gender: DataTypes.STRING(10),
    birthDate: DataTypes.DATE,
    picture: DataTypes.TEXT,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  { sequelize, tableName: "users" }
);

export default User;
