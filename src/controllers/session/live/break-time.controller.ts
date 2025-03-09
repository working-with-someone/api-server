import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import breakTimeService from '../../../services/session/live/break-time.service';

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
};

export default breakTimeController;
