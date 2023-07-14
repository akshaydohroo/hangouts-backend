import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import sequalize from "../../db";
import User from "../../models/User";
import { UserDoesntExistsError } from "../../utils/error";
import { Op } from "sequelize";
import { sendAuthData } from "../../utils/functions/user";

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.params || !req.params.id) {
      res.status(400);
      throw Error("Id doesnt exist");
    }
    return await sequalize.transaction(async (t) => {
      const user = await User.findOne({
        where: { id: req.params.id },
        transaction: t,
      });
      if (!user) {
        throw new UserDoesntExistsError("User doesnt Exist");
      }

      res.json(sendAuthData(user.toJSON()));
    });
  } catch (err) {
    if (err instanceof UserDoesntExistsError) {
      res.status(404);
    }
    next(err);
  }
}
export async function getAuthUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(400);
      throw new Error("AuthHeader undefined");
    }

    const { userId } = jwt.decode(authHeader, {
      json: true,
    }) as { userId: string };
    return await sequalize.transaction(async (t) => {
      const user = await User.findOne({
        where: {
          id: userId,
        },
        transaction: t,
      });
      if (!user) {
        throw new UserDoesntExistsError("User doesnt Exist");
      }

      res.json(sendAuthData(user.toJSON()));
    });
  } catch (err) {
    if (err instanceof UserDoesntExistsError) {
      res.status(404);
    }
    next(err);
  }
}
export async function getFollowOptions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const searchString = req.query.searchString;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    if (!searchString || !page || !limit || page < 1) {
      res.status(400);
      throw Error("No valid params");
    }

    const { count, rows } = await sequalize.transaction(async (t) => {
      const { count, rows } = await User.findAndCountAll({
        where: {
          [Op.or]: {
            name: { [Op.regexp]: `(?i:^${searchString}.{0,2})` },
            userName: { [Op.regexp]: `(?i:^${searchString}.{0,2})` },
          },
        },
        offset: (page - 1) * limit,
        limit: limit,
        order: ["id"],
        transaction: t,
      });
      return { count, rows };
    });
    res.json({ count, rows });
  } catch (err) {
    if (err instanceof UserDoesntExistsError) {
      res.status(404);
    }
    next(err);
  }
}
