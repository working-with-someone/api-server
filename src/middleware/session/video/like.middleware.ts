import { Request, Response, NextFunction } from 'express';
import prismaClient from '../../../database/clients/prisma';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCode from 'http-status-codes';

const attachLikeOrNotfound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const videoSession = res.locals.videoSession;

  const like = await prismaClient.session_like.findFirst({
    where: {
      video_session_id: videoSession.id,
      user_id: req.session.userId,
    },
  });

  if (!like) {
    return next(new wwsError(httpStatusCode.NOT_FOUND));
  }

  res.locals.like = like;

  return next();
};

const checkLikeDoesNotExistOrConflict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const videoSession = res.locals.videoSession;

  const like = await prismaClient.session_like.findFirst({
    where: {
      video_session_id: videoSession.id,
      user_id: req.session.userId,
    },
  });

  if (like) {
    return next(new wwsError(httpStatusCode.CONFLICT));
  }

  return next();
};

const videoSessionLikeMiddleware = {
  attachLikeOrNotfound,
  checkLikeDoesNotExistOrConflict,
};

export default videoSessionLikeMiddleware;
