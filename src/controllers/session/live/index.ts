import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import { liveSessionService } from '../../../services';

export const getLiveSession = asyncCatch(
  async (req: Request, res: Response) => {
    const sanitizedLiveSession = await liveSessionService.getLiveSession({
      liveSession: res.locals.liveSession,
      userId: req.user.id,
    });

    return res.status(200).json(sanitizedLiveSession);
  }
);

export const createLiveSession = asyncCatch(
  async (req: Request, res: Response) => {
    const session = await liveSessionService.createLiveSession({
      ...req.body,
      userId: req.user.id,
      thumbnail: req.file,
    });

    return res.status(201).json(session);
  }
);

export const updateLiveSessionStatus = asyncCatch(
  async (req: Request, res: Response) => {
    const status = await liveSessionService.updateLiveSessionStatus({
      liveSession: res.locals.liveSession,
      status: req.body.status,
    });

    return res.status(200).json(status);
  }
);
