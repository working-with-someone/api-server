import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import { liveSessionService } from '../../../services';

export const getLiveSession = asyncCatch(
  async (req: Request, res: Response) => {
    const sanitizedLiveSession = await liveSessionService.getLiveSession({
      liveSession: res.locals.liveSession,
      userId: req.user.id,
    });

    return res.status(200).json({
      data: sanitizedLiveSession,
    });
  }
);

export const getLiveSessions = asyncCatch(
  async (req: Request, res: Response) => {
    const { liveSessions, pagination } =
      await liveSessionService.getLiveSessions({
        per_page: parseInt(req.query.per_page as string),
        page: parseInt(req.query.page as string),
        userId: req.user.id,
        category: req.query.category as string,
      });

    return res.status(200).json({
      data: liveSessions,
      pagination,
    });
  }
);

export const createLiveSession = asyncCatch(
  async (req: Request, res: Response) => {
    const session = await liveSessionService.createLiveSession({
      ...req.body,
      userId: req.user.id,
      thumbnail: req.file,
    });

    return res.status(201).json({
      data: session,
    });
  }
);

export const updateLiveSessionStatus = asyncCatch(
  async (req: Request, res: Response) => {
    const status = await liveSessionService.updateLiveSessionStatus({
      liveSession: res.locals.liveSession,
      status: req.body.status,
    });

    return res.status(200).json({
      data: status,
    });
  }
);
