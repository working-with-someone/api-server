import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { followService } from '../services/';

export const createFollow = asyncCatch(async (req: Request, res: Response) => {
  const follow = await followService.createFollow({
    following_user_id: parseInt(req.params.following_user_id),
    follower_user_id: req.session.userId as number,
  });

  return res.status(201).json(follow);
});
