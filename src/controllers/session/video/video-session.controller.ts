import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import { videoSessionService } from '../../../services';

export const getVideoSession = asyncCatch(
  async (req: Request, res: Response) => {
    const sanitized = await videoSessionService.getVideoSession({
      videoSession: res.locals.videoSession,
      userId: req.session.userId!,
    });

    return res.status(200).json({ data: sanitized });
  }
);

export const getVideoSessions = asyncCatch(
  async (req: Request, res: Response) => {
    const { videoSessions, pagination } =
      await videoSessionService.getVideoSessions({
        per_page: parseInt(req.query.per_page as string),
        page: parseInt(req.query.page as string),
        userId: req.session.userId!,
        category: req.query.category as string,
        search: req.query.search as string,
      });

    return res.status(200).json({ data: videoSessions, pagination });
  }
);
