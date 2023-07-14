import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { OAuth2Client, UserRefreshClient } from "google-auth-library";
import { Attributes, CreationAttributes } from "sequelize";
import { googleOAuthClientId, googleOAuthClientSecret } from "config";
import User from "models/User";
import { UserDoesntExistsError } from "utils/error";
import { convertTime, parseJwtToken } from "utils/functions";
import { checkIfUserExists, createAccessToken, createUser } from "controllers/auth/auth";

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
export async function googleOAuthRefresh(
  req: Request,
  res: Response
): Promise<string> {
  try {
    const user = new UserRefreshClient(
      googleOAuthClientId,
      googleOAuthClientSecret,
      req.cookies["google-refresh-oauth-token"]
    );
    const { credentials } = await user.refreshAccessToken();
    const { refresh_token, id_token } = credentials;
    if (!refresh_token || !id_token) throw Error("Token undefined from google");
    googleSetRefreshTokenCookie(req, res, refresh_token);
    return parseJwtToken(id_token, ["sub"], ["id"]).id as string;
  } catch (err) {
    throw err;
  }
}
async function getGoogleUserData(accessToken: string): Promise<{
  gender: undefined | string;
  birthDate: undefined | Date;
  emailVerified: boolean;
}> {
  try {
    const googleRes = await axios.get(
      "https://people.googleapis.com/v1/people/me",
      {
        params: {
          personFields: "birthdays,genders",
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const gender: undefined | string =
      googleRes.data?.genders && googleRes.data?.genders[0]?.formattedValue;
    const birthday =
      googleRes.data?.birthdays && googleRes.data?.birthdays[0]?.date;
    const emailVerified = true;
    let birthDate: undefined | Date = undefined;
    if (birthday) {
      const { year, month, day } = birthday;
      birthDate = new Date(year, month - 1, day);
    }
    return { gender, birthDate, emailVerified };
  } catch (err) {
    throw err;
  }
}
function googleSetRefreshTokenCookie(
  req: Request,
  res: Response,
  refreshToken: string
) {
  try {
    res.cookie("google-refresh-oauth-token", refreshToken, {
      maxAge: convertTime(7, "d", "ms"),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  } catch (err) {
    throw err;
  }
}
