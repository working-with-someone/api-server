import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { followService } from '../services/';

export const getFollowings = asyncCatch(async (req: Request, res: Response) => {
  const followings = await followService.getFollowings({
    userId: res.locals.user.id,
    per_page: parseInt(req.query.per_page as string),
    page: parseInt(req.query.page as string),
  });

  return res.status(200).json(followings);
});

export const createFollowing = asyncCatch(
  async (req: Request, res: Response) => {
    const follow = await followService.createFollowing({
      following_user_id: parseInt(req.params.following_user_id),
      follower_user_id: res.locals.user.id,
    });

    return res.status(201).json(follow);
  }
);

export const getFollowing = asyncCatch(async (req: Request, res: Response) => {
  return res.status(200).json(res.locals.following);
});

export const deleteFollowing = asyncCatch(
  async (req: Request, res: Response) => {
    await followService.deleteFollow({
      following_user_id: parseInt(req.params.following_user_id),
      follower_user_id: res.locals.user.id,
    });

    return res.status(204).json({});
  }
);

export const getFollowers = asyncCatch(async (req: Request, res: Response) => {
  const followers = await followService.getFollowers({
    userId: parseInt(req.params.user_id),
    per_page: parseInt(req.query.per_page as string),
    page: parseInt(req.query.page as string),
  });

  return res.status(200).json(followers);
});
