import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import { commentService } from '../../../services/';
import httpStatusCode from 'http-status-codes';

export const getComment = asyncCatch(async (req: Request, res: Response) => {
  const comment = await commentService.getComment({
    comment_id: parseInt(req.params.comment_id),
  });

  return res.status(httpStatusCode.OK).json({
    data: comment,
  });
});
