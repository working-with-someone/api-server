import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { userService } from '../services';

// 사용자의 공개가능한 정보만을 가져온다
export const getUser = asyncCatch(async (req: Request, res: Response) => {
  const publicUserInfo = await userService.getUser(
    // contoller로 넘어왔다면, user api validation에서 req.params.userId가 number인 것이 검증된다.
    parseInt(req.params.userId),

    req.session.userId == parseInt(req.params.userId)
  );

  return res.status(200).json(publicUserInfo);
});

export const getSelf = asyncCatch(async (req: Request, res: Response) => {
  // controller로 넘어왔다면, auth middleware에서 req.session.userId가 number인 것이 검증된다.
  const user = await userService.getUser(req.session.userId as number, true);

  return res.status(200).json(user);
});

export const updateSelf = asyncCatch(async (req: Request, res: Response) => {
  const updatedUesr = await userService.updateSelf(
    req.session.userId as number,
    {
      ...req.body,
      pfp: req.file,
    }
  );

  return res.status(200).json(updatedUesr);
});
