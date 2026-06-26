import { Request, Response, NextFunction } from 'express';
import prismaClient from '../../../database/clients/prisma';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCode from 'http-status-codes';

const commentMiddleware = {
  attachCommentOrNotfound: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { comment_id } = req.params;

    const comment = await prismaClient.video_session_comment.findFirst({
      where: { id: parseInt(comment_id) },
    });

    if (!comment) {
      return next(new wwsError(httpStatusCode.NOT_FOUND));
    }

    res.locals.comment = comment;

    return next();
  },

  checkOwnerOrForbidden: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const comment = res.locals.comment;

    if (req.session.userId !== comment?.user_id) {
      return next(new wwsError(httpStatusCode.FORBIDDEN));
    }

    return next();
  },
};

export default commentMiddleware;
