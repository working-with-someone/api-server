import { Request, Response, NextFunction } from 'express';
import prismaClient from '../../../../database/clients/prisma';
import { wwsError } from '../../../../utils/wwsError';
import httpStatusCode from 'http-status-codes';

const attachLikeOrNotfound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const videoSession = res.locals.videoSession;
  const comment = res.locals.videoSessionComment;

  const like = await prismaClient.video_session_comment_like.findUnique({
    where: {
      user_id_video_session_comment_id: {
        user_id: req.session.userId!,
        video_session_comment_id: comment.id,
      },
    },
  });

  if (!like) {
    return next(
      new wwsError(
        httpStatusCode.NOT_FOUND,
        'video session comment like not found'
      )
    );
  }

  res.locals.video_session_comment_like = like;

  return next();
};

const checkLikeDoesNotExistOrConflict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const comment = res.locals.videoSessionComment;

  const like = await prismaClient.video_session_comment_like.findUnique({
    where: {
      user_id_video_session_comment_id: {
        user_id: req.session.userId!,
        video_session_comment_id: comment.id,
      },
    },
  });

  if (like) {
    return next(new wwsError(httpStatusCode.CONFLICT));
  }

  return next();
};

const videoSessionCommentLikeMiddleware = {
  attachLikeOrNotfound,
  checkLikeDoesNotExistOrConflict,
};

export default videoSessionCommentLikeMiddleware;
