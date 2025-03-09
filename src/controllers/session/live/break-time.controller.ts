import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import breakTimeService from '../../../services/session/live/break-time.service';

export const getBreakTime = asyncCatch(async (req: Request, res: Response) => {
  if (!res.locals.breakTime) {
    return res.status(204).end();
  }

  return res.status(200).json(res.locals.breakTime);
});

export const createBreakTime = asyncCatch(
  async (req: Request, res: Response) => {
    const breakTime = await breakTimeService.createBreakTime({
      liveSession: res.locals.liveSession,
      ...req.body,
    });

    return res.status(201).json(breakTime);
  }
);

const breakTimeController = {
  createBreakTime,
  getBreakTime,
};

export default breakTimeController;
