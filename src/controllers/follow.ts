import { NextFunction, Request, Response } from "express";
import sequalize from "../db";
import User from "../models/User";
import UserFollower from "../models/UserFollower";
import { randomUUID } from "crypto";
export async function userConnectRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const selfId = res.locals.selfId as string;
    const followingId = req.params.id;
    const connectionId = await sequalize.transaction(async (t) => {
      UserFollower.create({
        userId: followingId,
        followerId: selfId,
        connectionId: randomUUID(),
      });
    });
    res.json({ id: connectionId });
  } catch (err) {
    next(err);
  }
}
export async function getConnectReq(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const selfId = res.locals.selfId as string;
    const connections = await sequalize.transaction(async (t) => {
      return await User.findByPk(selfId, {
        include: {
          model: User,
          as: "followers",
          through: {
            where: {
              accepted: "pending",
            },
            attributes: [],
          },
        },
        transaction: t,
      });
    });
    res.json(connections);
  } catch (err) {
    next(err);
  }
}
export async function acceptConnectRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const selfId = res.locals.selfId as string;
    const userId = req.params.id;
    await sequalize.transaction(async (t) => {
      return await UserFollower.update(
        { status: "accepted" },
        {
          where: {
            userId: selfId,
            followerId: userId,
          },
          transaction: t,
        }
      );
    });
    res.json({ status: "success" });
  } catch (err) {
    next(err);
  }
}
// pagination not complete , including limit and offset disrupts the sequalize query
export async function getFollowingUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const selfId = res.locals.selfId as string;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    if (!page || !limit) {
      res.status(400);
      throw Error("Invalid request");
    }
    const { rows, count } = await sequalize.transaction(async (t) => {
      const { rows, count } = await User.findAndCountAll({
        include: {
          model: User,
          as: "followers",
          through: {
            attributes: [],
            where: {
              status: "accepted",
            },
          },
          where: {
            id: selfId,
          },
          attributes: [],
        },
        attributes: ["id", "name", "userName", "picture"],
        // offset: (page - 1) * limit,
        // limit: limit,
        transaction: t,
      });
      return { rows, count };
    });
    res.json({
      count,
      rows: rows.slice((page - 1) * limit, (page - 1) * limit + limit),
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
}
