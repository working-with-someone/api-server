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
  const { following_user_id } = req.params;

  const following = await prismaClient.follow.findFirst({
    where: {
      follower_user_id: user.id,
      following_user_id: parseInt(following_user_id),
    },
  });

  if (!following) {
    return next(
      new wwsError(httpStatusCode.NOT_FOUND, 'can not found following')
    );
  }

  res.locals.following = following;

  return next();
};

export const checkTargetUserExistOrNotFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { following_user_id } = req.params;

  const user = await prismaClient.user.findFirst({
    where: {
      id: parseInt(following_user_id),
    },
  });

  if (!user) {
    return next(
      new wwsError(httpStatusCode.NOT_FOUND, 'can not found following user')
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
  const { following_user_id } = req.params;

  const following = await prismaClient.follow.findFirst({
    where: {
      follower_user_id: user.id,
      following_user_id: parseInt(following_user_id),
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
