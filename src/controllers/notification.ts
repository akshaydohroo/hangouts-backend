import { NextFunction, Request, Response } from "express";
import sequalize from "../db";
import Notification, { NotificationType } from "../models/Notification";
import User from "../models/User";
export async function getNotificationByUserId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const selfId = res.locals.selfId as string;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    if (!page || !limit || page < 1 || limit < 1) {
      res.status(400);
      throw Error("No valid params");
    }
    const { count, rows } = await sequalize.transaction(async (t) => {
      const { count, rows } = await Notification.findAndCountAll({
        where: {
          userId: selfId,
        },
        offset: (page - 1) * limit,
        limit: limit,
        order: [["createdAt", "DESC"]],
        transaction: t,
        include: {
          attributes: ["name", "userName", "picture", "id", "createdAt"],
          model: User,
          as: "sender",
        },
      });
      return { count, rows };
    });
    const notifications = rows.map((row) => {
      return row.dataValues;
    });
    res.json({
      count,
      rows: notifications,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
}
export async function deleteNotificationById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.params.id) {
      res.status(400);
      throw Error("No notification id present");
    }
    const selfId = res.locals.selfId as string;
    const notificationId = req.params.id as string;
    const notification = await sequalize.transaction(async (t) => {
      return Notification.destroy({
        where: {
          notificationId,
          userId: selfId,
        },
        transaction: t,
      });
    });
    res.json({ status: "Success" });
  } catch (err) {
    next(err);
  }
}
