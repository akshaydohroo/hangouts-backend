import { Attributes, CreationAttributes } from "sequelize";
import User from "../models/User";

export class UserAlreadyExistsError extends Error {
  public payload: Attributes<User> | CreationAttributes<User>;
  constructor(
    data: Attributes<User> | CreationAttributes<User>,
    user: Attributes<User> | CreationAttributes<User>
  ) {
    super(
      `User with ${user.email === data.email ? "email" : "username"} = ${
        user.email === data.email ? user.email : user.userName
      } already exists`
    );
    this.name = "User already exists";
    this.payload = user;
  }
}
export class UserDoesntExistsError extends Error {
  constructor(message: string) {
    super(message);
  }
}
export class AccessTokenDoesntExistError extends Error {
  constructor(message: string) {
    super(message);
  }
}
