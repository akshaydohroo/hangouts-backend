import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import { Attributes, CreationAttributes, Op } from "sequelize";
import sequalize from "../../db";
import User from "../../models/User";
import { UserDoesntExistsError } from "../error";
import cloudinary from "../../cloudinary";
export function sendAuthData(
  user: Attributes<User> | CreationAttributes<User>
): Omit<Attributes<User> | CreationAttributes<User>, "password" | "jwtid"> {
  return (({ password, ...rest }) => rest)(user);
}
export async function checkIfUserExists(
  userData: Attributes<User> | CreationAttributes<User>
): Promise<Attributes<User> | CreationAttributes<User>> {
  try {
    return await sequalize.transaction(async (t) => {
      const user = await User.findOne({
        where: {
          email: userData.email,
        },
        transaction: t,
      });
      if (user instanceof User) {
        return user.toJSON();
      } else {
        throw new UserDoesntExistsError("User doesnt exist");
      }
    });
  } catch (err) {
    throw err;
  }
}
export async function createUser(
  userData: Attributes<User> | CreationAttributes<User>
): Promise<Attributes<User> | CreationAttributes<User>> {
  try {
    return await sequalize.transaction(async (t) => {
      const user = await User.create(userData);
      return user.toJSON();
    });
  } catch (err) {
    throw err;
  }
}
export function uploadPictureCloudinary(
  userName: string,
  buffer: Buffer,
  fileName: string,
  path?: string
): Promise<UploadApiResponse | UploadApiErrorResponse> {
  return new Promise((res, rej) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: fileName,
          folder: `hangouts/${userName}/${path}`,
          overwrite: true,
        },
        (err, result) => {
          if (err) {
            rej(err);
            return;
          }
          if (!result) {
            rej("Not valid response from cloudinary");
            return;
          }
          res(result);
        }
      )
      .end(buffer);
  });
}
