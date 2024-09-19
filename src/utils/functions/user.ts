import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import { Attributes, CreationAttributes, Op } from "sequelize";
import sequalize from "../../db";
import User from "../../models/User";
import { UserDoesntExistsError } from "../error";
import cloudinary from "../../cloudinary";
/**
 * Sends authentication data for a user.
 *
 * @param user - The user object containing attributes or creation attributes.
 * @returns The user object without the "password" and "jwtid" properties.
 */
export function sendAuthData(
  user: Attributes<User> | CreationAttributes<User>
): Omit<Attributes<User> | CreationAttributes<User>, "password" | "jwtid"> {
  return (({ password, ...rest }) => rest)(user);
}

/**
 * Checks if a user exists in the database based on the provided user data.
 * @param userData - The user data to check for existence.
 * @returns A promise that resolves to the user data if the user exists, or throws an error if the user doesn't exist.
 * @throws {UserDoesntExistsError} If the user doesn't exist.
 */
export async function checkIfUserExists(
  userData: Attributes<User> | CreationAttributes<User>
): Promise<Attributes<User> | CreationAttributes<User>> {
  try {
    return await sequalize.transaction(async (t) => {
      const email = userData.email || '';
      const userName = userData.userName || '';
      const user = await User.findOne({
        where: { [Op.or]: [
          { email },
          { userName }
        ]
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
/**
 * Creates a new user.
 *
 * @param userData - The data for the user to be created.
 * @returns A promise that resolves to the created user data.
 * @throws If an error occurs during the creation process.
 */
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
/**
 * Uploads a picture to Cloudinary.
 *
 * @param userName - The username of the user.
 * @param buffer - The buffer containing the picture data.
 * @param fileName - The name of the file.
 * @param path - The optional path for the file.
 * @returns A promise that resolves to the upload response or rejects with an error.
 */
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
