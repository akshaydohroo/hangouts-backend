import axios from "axios";
import { UUID } from 'crypto';
import { NextFunction, Request, Response } from "express";
import { UserRefreshClient } from "google-auth-library";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Attributes, CreationAttributes } from "sequelize";
import {
    googleOAuthClientId,
    googleOAuthClientSecret,
    jwtSecretKet,
} from "../../config";
import User from "../../models/User";
import { convertTime, parseJwtToken } from ".";
import Transport from "../transport";
import { verifyMailConfig } from "../variables";
import { AccessTokenDoesntExistError } from "../error";


export function sendVerifyEmail(
  user: Attributes<User> | CreationAttributes<User>
): Promise<string> {
  const verifyJwt = jwt.sign(
    { email: user.email },
    Buffer.from(jwtSecretKet as string, "base64"),
    {
      expiresIn: "1h",
    }
  );
  return new Promise((resolve, reject) => {
    Transport.sendMail(verifyMailConfig(user, verifyJwt), (err, info) => {
      if (err) reject(err);
      if (info.accepted.length > 1) {
        resolve(info.messageId);
      }
    });
  });
}
export function protectRoutes(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const accesstoken: string | undefined = req.cookies["access-token"];
    if (!accesstoken) {
      throw new AccessTokenDoesntExistError("Access token doesnt exist");
    }
    const isVerified = jwt.verify(
      accesstoken,
      Buffer.from(jwtSecretKet as string, "base64")
    ) as { userId: string };

    next();
  } catch (err) {
    if (
      err instanceof TokenExpiredError ||
      err instanceof AccessTokenDoesntExistError
    ) {
      const accessToken = generateNewAccessTokenFromRefreshToken(req, res);
      req.cookies["access-token"] = accessToken;
      next();
    }
    if (err instanceof JsonWebTokenError) {
      res.status(400);
      throw Error("Token is corrupted, please login again");
    }
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
export async function getGoogleUserData(accessToken: string): Promise<{
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
export function googleSetRefreshTokenCookie(
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
export async function generateNewAccessTokenFromRefreshToken(req: Request, res: Response) {
  if (req.cookies && req.cookies["google-refresh-oauth-token"]) {
    const userId = await googleOAuthRefresh(req, res);
    createAccessToken(req, res, userId);
  } else if (req.cookies && req.cookies["refresh-token"]) {
    const { userId } = jwt.verify(
      req.cookies["refresh-token"],
      Buffer.from(jwtSecretKet as string, "base64")
    ) as { userId: UUID };
    createAccessToken(req, res, userId);
  } else {
    res.status(400);
    throw new Error("No refresh token found,Login again");
  }
}

export function createAccessToken(req: Request, res: Response, userId: string) {
  const accessToken = jwt.sign(
    { userId },
    Buffer.from(jwtSecretKet as string, "base64"),
    {
      expiresIn: "20m",
    }
  );
  res.cookie("access-token", accessToken, {
    maxAge: convertTime(1, "hr", "ms"),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
}
export function createRefreshToken(
  req: Request,
  res: Response,
  userId: string
) {
  const refreshToken = jwt.sign(
    { userId: userId },
    Buffer.from(jwtSecretKet as string, "base64"),
    {
      expiresIn: "7d",
    }
  );
  res.cookie("refresh-token", refreshToken, {
    maxAge: convertTime(7, "d", "ms"),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
}
