import { NextFunction, Request, Response } from "express";
import sequelize from "../db";
import Notification, { NotificationType } from "../models/Notification";
import User from "../models/User";

/**
 * Retrieves notifications for the authenticated user.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function getNotificationByUserId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const selfId = res.locals.selfId as string;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    if (!page || !limit || page < 1 || limit < 1) {
      res.status(400);
      throw Error("No valid params");
    }
    const { count, rows } = await sequelize.transaction(async (t) => {
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

/**
 * Deletes a notification by its ID for the authenticated user.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function deleteNotificationById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.params.id) {
      res.status(400);
      throw Error("No notification id present");
    }
    const selfId = res.locals.selfId as string;
    const notificationId = req.params.id as string;
    await sequelize.transaction(async (t) => {
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