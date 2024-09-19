import { Sequelize } from "sequelize";
import { users } from "./users";
import User from "src/models/User";
import { followersArray,followerNotifications } from "./userFollowers";
import UserFollower from "src/models/UserFollower";
import Notification from "src/models/Notification"; // Import the correct Notification model
import transport from "src/utils/transport";
import { cryptoPasswordIV, cryptoPasswordKey, nodemailerUser } from "src/config";
import { DBpopulateMailConfig } from "./DBPopulateMail";
import crypto from "crypto-js";
export function encryptPassword(password: string): string {
  return crypto.AES.encrypt(
    password,
    crypto.enc.Base64.parse(cryptoPasswordKey as string),
    {
      iv: crypto.enc.Base64.parse(cryptoPasswordIV as string),
    }
  ).toString();
}
export function populateDB(sequelize: Promise<Sequelize>): Promise<String> {
  return new Promise((resolve, reject) => {
    sequelize.then(() => {
      return User.count()
    })
      .then((userCount) => {
        if(userCount > 10) throw Error("Database already populated");
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
        users.forEach((user) => {
          console.log(user.userName);
          console.log(user.password);
          user.password = encryptPassword(user.password || "");
          console.log(user.password);
        });
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
