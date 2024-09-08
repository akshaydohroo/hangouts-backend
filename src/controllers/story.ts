import { NextFunction, Request, Response } from "express";
import sequalize from "../db";
import User from "../models/User";
import UserFollower from "../models/UserFollower";
import Story from "../models/Story";
import { uploadPictureCloudinary } from "../utils/functions/user";
import { randomUUID } from "crypto";
import StoryInteraction from "../models/StoryInteraction";
export async function createUserStory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const selfId = res.locals.selfId as string;
    if (!req.file?.buffer) {
      res.status(400);
      throw Error("Story picture doesnt exist");
    }
    const user = await sequalize.transaction(async (t) => {
      return User.findByPk(selfId, { transaction: t });
    });
    if (!user) {
      res.status(400);
      throw Error("User doesnt exist");
    }
    const storyId = randomUUID();
    const uploadPicture = await uploadPictureCloudinary(
      user.userName,
      req.file.buffer,
      storyId,
      "story"
    );
    const story = await sequalize.transaction(async (t) => {
      return user.createStory(
        { storyId, picture: uploadPicture.secure_url },
        { transaction: t }
      );
    });
    res.json(story.toJSON());
  } catch (err) {
    next(err);
  }
}
export async function getFollowingStories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const selfId = res.locals.selfId;

    if (!req.params.id) {
      res.status(400);
      throw Error("Invalid request");
    }
    const userId = req.params.id as string;
    const stories = sequalize.transaction(async (t) => {
      const connection = await UserFollower.findOne({
        where: {
          userId: userId,
          followerId: selfId,
          status: "accepted",
        },
        transaction: t,
      });
      if (!connection) {
        res.status(403);
        throw Error("You can view stories of the people you are following");
      }
      return await Story.findAll({
        where: {
          userId: userId,
        },
        transaction: t,
      });
    });
    res.json(stories);
  } catch (err) {
    next(err);
  }
}
export async function getStories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const selfId = res.locals.selfId;
  try {
    const stories = sequalize.transaction(async (t) => {
      return await Story.findAll({
        where: {
          userId: selfId,
        },
        include: {
          model: StoryInteraction,
          as: "viewers",
        },
        transaction: t,
      });
    });
    res.json(stories);
  } catch (err) {
    next(err);
  }
}
export async function likeStory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.params.id) {
      res.status(400);
      throw Error("Invalid request, Id not defined");
    }
    const selfId = res.locals.selfId as string;
    const storyId = req.params.id as string;
    await sequalize.transaction(async (t) => {
      return await StoryInteraction.update(
        { isLike: true },
        {
          where: {
            storyId,
            viewerId: selfId,
          },
          transaction: t,
        }
      );
    });
    res.json({ status: "Success" });
  } catch (err) {
    next(err);
  }
}
export async function reactStory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
  } catch (err) {
    next(err);
  }
}
