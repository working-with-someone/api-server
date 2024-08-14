import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { userService } from '../services';

// 사용자의 공개가능한 정보만을 가져온다
export const getUser = asyncCatch(async (req: Request, res: Response) => {
  const publicUserInfo = await userService.getUser(
    // contoller로 넘어왔다면, user api validation에서 req.params.userId가 number인 것이 검증된다.
    parseInt(req.params.userId)
  );

  return res.status(200).json({ user: publicUserInfo });
});

export const updateUser = asyncCatch(async (req: Request, res: Response) => {
  return;
});

export const deleteUser = asyncCatch(async (req: Request, res: Response) => {
  return;
});
