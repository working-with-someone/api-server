import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { userService } from '../services';

export const getUser = asyncCatch(async (req: Request, res: Response) => {
  const user = await userService.getUser(
    // contoller로 넘어왔다면, user api validation에서 req.params.userId가 number인 것이 검증된다.
    parseInt(req.params.user_id),
    req.session.userId == parseInt(req.params.user_id)
  );

  return res.status(200).json(user);
});

export const getSelf = asyncCatch(async (req: Request, res: Response) => {
  // controller로 넘어왔다면, auth middleware에서 req.session.userId가 number인 것이 검증된다.
  const user = await userService.getUser(req.session.userId as number, true);

  return res.status(200).json(user);
});

export const updateUser = asyncCatch(async (req: Request, res: Response) => {
  const updatedUesr = await userService.updateUser(
    req.session.userId as number,
    {
      ...req.body,
      pfp: req.file,
    }
  );

  return res.status(200).json(updatedUesr);
});
