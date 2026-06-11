import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import { commentService } from '../../../services/';
import httpStatusCode from 'http-status-codes';

export const getComments = asyncCatch(async (req: Request, res: Response) => {
  const comments = await commentService.getComments({
    sessionType: 'video',
    sessionId: req.params.session_id,
    page: parseInt(req.query.page as string),
    per_page: parseInt(req.query.per_page as string),
    sort: req.query.sort as string,
  });

  return res.status(httpStatusCode.OK).json({
    data: comments,
  });
});

export const getComment = asyncCatch(async (req: Request, res: Response) => {
  const comment = await commentService.getComment({
    comment: res.locals.comment,
  });

  return res.status(httpStatusCode.OK).json({
    data: comment,
  });
});

export const createComment = asyncCatch(async (req: Request, res: Response) => {
  const createdComment = await commentService.createComment({
    userId: req.session.userId!,
    sessionType: 'video',
    sessionId: req.params.video_session_id,
    content: req.body.content,
  });

  return res.status(httpStatusCode.CREATED).json({
    data: createdComment,
  });
});

export const deleteComment = asyncCatch(async (req: Request, res: Response) => {
  const deletedComment = await commentService.deleteComment({
    comment_id: res.locals.comment.id,
    sessionType: 'video',
    sessionId: req.params.video_session_id,
    currUserId: req.session.userId!,
  });

  return res.status(httpStatusCode.NO_CONTENT).end();
});
