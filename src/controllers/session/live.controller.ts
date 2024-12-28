import { Request, Response } from 'express';
import asyncCatch from '../../utils/asyncCatch';
import { liveSessionService } from '../../services';

export const createLiveSession = asyncCatch(
  async (req: Request, res: Response) => {
    const session = await liveSessionService.createLiveSession({
      ...req.body,
      userId: req.session.userId,
      thumbnail: req.file,
    });

    return res.status(201).json(session);
  }
);
