import { Request, Response } from 'express';
import asyncCatch from '../../../utils/asyncCatch';
import { videoSessionService } from '../../../services';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCode from 'http-status-codes';

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

export const createVideoSession = asyncCatch(
  async (req: Request, res: Response) => {
    const session = await videoSessionService.createVideoSession({
      ...req.body,
      userId: req.session.userId!,
      thumbnail: req.file,
    });

    return res.status(201).json({ data: session });
  }
);

export const updateVideoSession = asyncCatch(
  async (req: Request, res: Response) => {
    const videoSession = res.locals.videoSession;

    // only organizer can update
    if (videoSession.organizer_id !== req.session.userId) {
      throw new wwsError(httpStatusCode.FORBIDDEN);
    }

    const updated = await videoSessionService.updateVideoSession({
      videoSession,
      userId: req.session.userId!,
      title: req.body.title,
      description: req.body.description,
      access_level: req.body.access_level,
      category_label: req.body.category_label,
      thumbnail: req.file,
    });

    return res.status(200).json({ data: updated });
  }
);
