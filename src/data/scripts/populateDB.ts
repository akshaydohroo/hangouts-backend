import { Sequelize } from "sequelize";
import { users } from "./users";
import User from "../../models/User";
import { followersArray,followerNotifications } from "./userFollowers";
import UserFollower from "../../models/UserFollower";
import Notification from "../../models/Notification"; // Import the correct Notification model
import transport from "../../utils/transport";
import { nodeEnv, nodemailerUser } from "../../config";
import { DBpopulateMailConfig } from "./DBPopulateMail";
import bcrypt from 'bcryptjs';

export function populateDB(sequelize: Promise<Sequelize>): Promise<String> {
  return new Promise((resolve, reject) => {
    sequelize.then(() => {
      return User.count()
    })
      .then((userCount) => {
        if(userCount > 10) throw Error("Database already populated");
        if(nodeEnv === "development") return new Promise<void>((resolve) => resolve());
        return transport.sendMail(
          DBpopulateMailConfig(
            nodemailerUser as string,
            users.map((user) => {
              return { userName: user.userName, password: user.password || "" };
            })
          ),
          (err) => {
            if (err) console.error(err);
            return new Promise<void>((resolve) => resolve());
          }
        );
      })
      .then(() => {
        return Promise.all(users.map(async (user) => {
          user.password = await bcrypt.hash(user.password as string, 10);
          return user;
        }));
      }).then((users) => {
        return User.bulkCreate(users);
      })
      .then(() => {
        return UserFollower.bulkCreate(followersArray);
      }).then(() => {
        return Notification.bulkCreate(followerNotifications);
      })
      .then(() => {
        resolve("Database populated successfully");
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}
