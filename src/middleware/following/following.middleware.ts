import { Request, Response, NextFunction } from 'express';
import prismaClient from '../../database/clients/prisma';
import { wwsError } from '../../utils/wwsError';
import httpStatusCode from 'http-status-codes';

export const attachFollowingOrNotFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = res.locals.user;

  const following = await prismaClient.follow.findFirst({
    where: {
      follower_user_id: user.id,
      following_user_id: parseInt(req.params.following_user_id as string),
    },
    include: {
      following: {
        include: {
          pfp: true,
        },
      },
    },
  });

  if (!following) {
    return next(new wwsError(httpStatusCode.NOT_FOUND, 'following not found'));
  }

  res.locals.following = following;

  return next();
};

export const checkTargetUserExistOrNotFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await prismaClient.user.findFirst({
    where: {
      id: parseInt(req.params.following_user_id as string),
    },
  });

  if (!user) {
    return next(
      new wwsError(httpStatusCode.NOT_FOUND, 'following user not found')
    );
  }

  return next();
};

export const checkFollowingDoesNotExistOrConflict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = res.locals.user;

  const following = await prismaClient.follow.findFirst({
    where: {
      follower_user_id: user.id,
      following_user_id: parseInt(req.params.following_user_id as string),
    },
  });

  if (following) {
    return next(
      new wwsError(httpStatusCode.CONFLICT, 'already following user')
    );
  }

  return next();
};

const followEndpointMiddleware = {
  attachFollowingOrNotFound,
  checkFollowingDoesNotExistOrConflict,
  checkTargetUserExistOrNotFound,
};

export default followEndpointMiddleware;
