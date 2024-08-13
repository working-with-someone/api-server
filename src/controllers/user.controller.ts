import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { userService } from '../services';

export const getUser = asyncCatch(async (req: Request, res: Response) => {
  // controller로 넘어왔다면, auth middleware에서 req.session.userId가 존재함이 검증된다.
  const user = await userService.getUser(req.session.userId as number);

  return res.status(200).json(user);
});

export const updateUser = asyncCatch(async (req: Request, res: Response) => {
  return;
});

export const deleteUser = asyncCatch(async (req: Request, res: Response) => {
  return;
});
