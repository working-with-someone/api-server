import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { followService } from '../services/';

export const getFollowings = asyncCatch(async (req: Request, res: Response) => {
  const follows = await followService.getFollowings({
    userId: res.locals.user.id,
    per_page: parseInt(req.query.per_page as string),
    page: parseInt(req.query.page as string),
  });

  return res.status(200).json(follows);
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

// authenticated user가 following user를 follow하고 있다면 204를 return, follow하고 있지 않다면 404를 return
export const checkFollowing = asyncCatch(
  async (req: Request, res: Response) => {
    const isFollowing = await followService.checkFollowing({
      following_user_id: parseInt(req.params.following_user_id),
      follower_user_id: res.locals.user.id,
    });

    if (isFollowing) {
      return res.status(204).end();
    }

    return res.status(404).end();
  }
);

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
