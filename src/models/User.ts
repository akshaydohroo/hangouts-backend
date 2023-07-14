import { randomUUID } from "crypto";
import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  CreationOptional
} from "sequelize";
import { ValidationOptions } from "sequelize/types/instance-validator";
import sequelize from "../db";

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: string;
  declare name: string;
  declare password: CreationOptional<string>;
  declare birthDate: CreationOptional<Date>;
  declare gender: CreationOptional<string>;
  declare email: string;
  declare userName: string;
  declare picture: CreationOptional<string>;
  declare emailVerified: boolean;
}

User.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.TEXT,
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
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { sequelize, tableName: "users" }
);
User.beforeValidate((instance: User, options: ValidationOptions) => {
  if (!instance.id) instance.id = randomUUID();
});

export default User;
