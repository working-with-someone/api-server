import { Request, Response } from 'express';
import asyncCatch from '../../../../utils/asyncCatch';
import { videoSessionCommentLikeService } from '../../../../services';
import httpStatusCode from 'http-status-codes';

export const getVideoSessionCommentLike = asyncCatch(
  async (req: Request, res: Response) => {
    const like =
      await videoSessionCommentLikeService.getVideoSessionCommentLike({
        like: res.locals.video_session_comment_like,
      });

    return res.status(httpStatusCode.OK).json({
      data: like,
    });
  }
);

export const createVideoSessionCommentLike = asyncCatch(
  async (req: Request, res: Response) => {
    const createdCommentLike =
      await videoSessionCommentLikeService.createVideoSessionCommentLike({
        userId: req.session.userId!,
        commentId: parseInt(req.params.comment_id),
        videoSessionId: req.params.video_session_id,
      });

    return res
      .status(httpStatusCode.CREATED)
      .json({ data: createdCommentLike });
  }
);

export const deleteVideoSessionCommentLike = asyncCatch(
  async (req: Request, res: Response) => {
    const deletedcommentLike =
      await videoSessionCommentLikeService.deleteVideoSessionCommentLike({
        userId: req.session.userId!,
        commentId: parseInt(req.params.comment_id),
        videoSessionId: req.params.video_session_id,
      });

    return res.status(httpStatusCode.NO_CONTENT).end();
  }
);
