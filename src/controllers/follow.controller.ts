import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { followService } from '../services/';

export const getFollowings = asyncCatch(async (req: Request, res: Response) => {
  const follows = await followService.getFollowings(
    parseInt(req.params.userId)
  );

  return res.status(200).json(follows);
});
export const createFollowings = asyncCatch(
  async (req: Request, res: Response) => {
    const follow = await followService.createFollow({
      following_user_id: parseInt(req.params.following_user_id),
      follower_user_id: req.session.userId as number,
    });

    return res.status(201).json(follow);
  }
);

export const deleteFollowings = asyncCatch(
  async (req: Request, res: Response) => {
    followService.deleteFollow({
      following_user_id: parseInt(req.params.following_user_id),
      follower_user_id: req.session.userId as number,
    });

    return res.status(204).json({});
  }
);

export const getFollowers = asyncCatch(async (req: Request, res: Response) => {
  const followers = await followService.getFollowers(
    parseInt(req.params.userId)
  );

  return res.status(200).json(followers);
});
