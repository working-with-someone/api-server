import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import videoSessionLikeService from '../../../services/session/video/like.service';

const getVideoSessionLike = asyncCatch(async (req: Request, res: Response) => {
  const like = await videoSessionLikeService.getVideoSessionLike({
    like: res.locals.like,
  });

  return res.status(200).json({ data: like });
});

const likeController = {
  getVideoSessionLike,
};

export default likeController;
