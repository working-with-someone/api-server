import { Request, Response, NextFunction } from 'express';
import prismaClient from '../../../../database/clients/prisma';
import { wwsError } from '../../../../utils/wwsError';
import httpStatusCode from 'http-status-codes';

export async function attachCommentOrNotfound(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { comment_id } = req.params;

  const comment = await prismaClient.video_session_comment.findFirst({
    where: { id: parseInt(comment_id) },
    include: {
      user: {
        include: {
          pfp: true,
        },
      },
      video_session: true,
    },
  });

  if (!comment) {
    return next(
      new wwsError(httpStatusCode.NOT_FOUND, 'video session comment not found')
    );
  }

  res.locals.videoSessionComment = comment;

  return next();
}

export async function checkOwnerOrForbidden(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const comment = res.locals.videoSessionComment;

  if (req.session.userId !== comment.user_id) {
    return next(new wwsError(httpStatusCode.FORBIDDEN));
  }

  return next();
}
