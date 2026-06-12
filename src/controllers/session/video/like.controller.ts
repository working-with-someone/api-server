import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import videoSessionLikeService from '../../../services/session/video/like.service';
import httpStatusCodes from 'http-status-codes';

const getVideoSessionLike = asyncCatch(async (req: Request, res: Response) => {
  const like = await videoSessionLikeService.getVideoSessionLike({
    like: res.locals.like,
  });

  return res.status(httpStatusCodes.OK).json({ data: like });
});

const createVideoSessionLike = asyncCatch(
  async (req: Request, res: Response) => {
    const createdLike = await videoSessionLikeService.createVideoSessionLike({
      userId: req.session.userId!,
      videoSessionId: req.params.video_session_id,
    });

    return res.status(httpStatusCodes.CREATED).json({ data: createdLike });
  }
);

const likeController = {
  getVideoSessionLike,
  createVideoSessionLike,
};

export default likeController;
