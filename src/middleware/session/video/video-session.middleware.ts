import { Request, Response, NextFunction } from 'express';
import prismaClient from '../../../database/clients/prisma';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import { isAllowedToVideoSession } from '../../../services/session/video/video-session.service';

const videoSessionMiddleware = {
  attachVideoSessionOrNotfound: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { video_session_id } = req.params;

    const videoSession = await prismaClient.video_session.findFirst({
      where: { id: video_session_id },
      include: {
        allow: true,
        category: true,
        break_time: true,
      },
    });

    if (!videoSession) {
      return next(new wwsError(httpStatusCode.NOT_FOUND));
    }

    res.locals.videoSession = videoSession;

    return next();
  },

  checkAllowedOrForbidden: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const videoSession = res.locals.videoSession;

    if (
      !(await isAllowedToVideoSession({
        videoSession,
        userId: req.session.userId!,
      }))
    ) {
      return next(new wwsError(httpStatusCode.FORBIDDEN));
    }

    return next();
  },
};

export default videoSessionMiddleware;
