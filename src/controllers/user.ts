import { Request, Response, NextFunction } from "express";
import sequalize from "../db";
import User from "../models/User";
import { UserDoesntExistsError } from "../utils/error";
import { Op, literal } from "sequelize";
import { sendAuthData } from "../utils/functions/user";

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.params.id && !req.query.id) {
      res.status(400);
      throw Error("Id doesnt exist");
    }
    const userId = (req.params.id || req.query.id) as string;
    return await sequalize.transaction(async (t) => {
      const user = await User.findByPk(userId, { transaction: t });
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
export async function getAuthUserData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const selfId = res.locals.selfId as string;
    res.redirect(`/user/data/${selfId}`);
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
    const selfId = res.locals.selfId as string;
    const searchString = req.query.searchString;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    if (!searchString || !page || !limit || page < 1 || limit < 1) {
      res.status(400);
      throw Error("No valid params");
    }

    const { count, rows } = await sequalize.transaction(async (t) => {
      const { count, rows } = await User.findAndCountAll({
        where: {
          [Op.or]: [
            {
              "$User.name$": { [Op.regexp]: `(?i:^${searchString})` },
            },
            { "$User.userName$": { [Op.regexp]: `(?i:^${searchString})` } },
            literal(
              `'${searchString}%' SOUNDS LIKE User.name COLLATE utf8mb4_general_ci`
            ),
            literal(
              `'${searchString}%' SOUNDS LIKE User.userName COLLATE utf8mb4_general_ci`
            ),
          ],
          id: {
            [Op.ne]: selfId,
          },
        },
        include: {
          model: User,
          as: "followers",
          through: {
            attributes: ["status"],
            where: {
              followerId: selfId,
            },
          },
          attributes: ["id"],
          required: false,
        },
        offset: (page - 1) * limit,
        limit: limit,
        order: ["id"],
        transaction: t,
      });
      return { count, rows };
    });

    res.json({
      count,
      rows: rows.map((row) => {
        row = row.toJSON();
        return sendAuthData(row);
      }),
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    if (err instanceof UserDoesntExistsError) {
      res.status(404);
    }
    next(err);
  }
}