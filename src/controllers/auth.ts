import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { Attributes, CreationAttributes } from "sequelize";
import {
  googleOAuthClientId,
  googleOAuthClientSecret,
  jwtSecretKet,
} from "../config";
import sequalize from "../db";
import User from "../models/User";
import { UserDoesntExistsError } from "../utils/error";
import { inputDateToDate, parseJwtToken } from "../utils/functions";
import {
  createAccessToken,
  createRefreshToken,
  getGoogleUserData,
  googleSetRefreshTokenCookie,
  sendVerifyEmail,
  generateNewAccessTokenFromRefreshToken,
} from "../utils/functions/auth";
import {
  checkIfUserExists,
  createUser,
  uploadProfilePicture,
} from "../utils/functions/user";

const oAuth2Client = new OAuth2Client(
  googleOAuthClientId,
  googleOAuthClientSecret,
  "postmessage"
);

export async function googleOAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.body.code) {
      res.status(400);
      throw Error("invalid request, parameter code absent");
    }
    const { tokens } = await oAuth2Client.getToken(req.body.code);
    const { access_token, id_token, refresh_token } = tokens;
    if (!id_token || !access_token || !refresh_token)
      throw Error("Token undefined from google");
    const userData = parseJwtToken(
      id_token,
      ["name", "email", "picture", "sub"],
      ["name", "email", "picture", "id"]
    ) as {
      name: string;
      email: string;
      picture: string;
      id: string;
    } as Attributes<User> | CreationAttributes<User>;

    let user: Attributes<User> | CreationAttributes<User>;

    try {
      user = await checkIfUserExists(userData);
      if (req.body.requestType === "login" && !user.emailVerified) {
        res.status(400);
        throw Error(
          "Email is already in use, verify it by logging in with your password"
        );
      }
    } catch (err) {
      if (err instanceof UserDoesntExistsError) {
        userData["userName"] = userData.email.split("@")[0];
        user = await createUser(
          Object.assign(userData, await getGoogleUserData(access_token))
        );
      } else throw err;
    }
    res.clearCookie("refresh-token");
    createAccessToken(req, res, user.id);
    googleSetRefreshTokenCookie(req, res, refresh_token);
    res.status(201).json({ message: "Success" });
  } catch (err) {
    next(err);
  }
}

export async function signin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file?.buffer) {
      res.status(400);
      throw Error("Profile picture doesnt exist");
    }
    const uploadPicture = await uploadProfilePicture(
      req.body.userName,
      req.file.buffer
    );
    req.body.birthDate = inputDateToDate(req.body.birthDate);
    const userData = req.body as Attributes<User> | CreationAttributes<User>;
    userData.picture = uploadPicture.secure_url;

    userData.password = await bcrypt.hash(userData.password as string, 10);
    const user = await createUser(userData);
    sendVerifyEmail(user)
      .then((val) => {
        console.log(val);
      })
      .catch((err) => {
        console.error(err);
        return;
      });
    res.clearCookie("google-refresh-oauth-token");
    createAccessToken(req, res, user.id);
    createRefreshToken(req, res, user.id);
    res.status(201).json({ message: "Success" });
  } catch (err) {
    next(err);
  }
}
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.body.email || !req.body.userName) {
      res.status(400);
      throw Error("No auth Id");
    }
    if (!req.body.password) {
      res.status(400);
      throw Error("No Password found");
    }
    const { email, password, userName } = req.body;
    const user = await sequalize.transaction(async (t) => {
      const user = await User.findOne({
        where: {
          [email ? "email" : "userName"]: email ? email : userName,
        },
        transaction: t,
      });

      return user?.toJSON();
    });
    if (!user) {
      res.status(400);
      throw Error("User doesnt Exist");
    }
    if (!user.password) {
      res.status(400);
      throw Error("User didnt signin with a password");
    }
    const isAuthenticated = await bcrypt.compare(password, user.password);
    if (!isAuthenticated) {
      res.status(401);
      throw Error("User is not authenticated");
    }
    res.clearCookie("google-refresh-oauth-token");
    createAccessToken(req, res, user.id);
    createRefreshToken(req, res, user.id);
    res.json({ message: "Success" });
  } catch (err) {
    next(err);
  }
}
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.params.token) {
      res.status(400);
      throw Error("Token doesnt Exist");
    }
    const token = jwt.verify(
      req.params.token,
      Buffer.from(jwtSecretKet as string, "base64")
    ) as { email: string };
    await sequalize.transaction(async (t) => {
      User.update(
        { emailVerified: true },
        {
          where: {
            email: token.email,
          },
        }
      );
    });
    res.json({ message: "Success" });
  } catch (err) {
    next(err);
  }
}
export async function deleteUserByJwt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.params.token) {
      res.status(400);
      throw Error("Token doesnt Exist");
    }
    const token = jwt.verify(
      req.params.token,
      Buffer.from(jwtSecretKet as string, "base64")
    ) as { email: string };
    await sequalize.transaction(async (t) => {
      User.destroy({
        where: {
          email: token.email,
        },
      });
    });
    res.json({ message: "Success" });
  } catch (err) {
    next(err);
  }
}

export async function getNewAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const accessToken = await generateNewAccessTokenFromRefreshToken(req, res);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}
