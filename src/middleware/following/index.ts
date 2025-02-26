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

const followEndpointMiddleware = {
  attachFollowingOrNotFound,
};

export default followEndpointMiddleware;
