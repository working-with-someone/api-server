import prismaClient from '../../../database/clients/prisma';
import { Request, Response, NextFunction } from 'express';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCode from 'http-status-codes';

const breakTimeMiddleware = {
  attachBreakTimeOrNotFound: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const breakTime = await prismaClient.live_session_break_time.findFirst({
      where: {
        session_id: res.locals.liveSession.id,
      },
    });

    if (!breakTime) {
      return next(
        new wwsError(httpStatusCode.NOT_FOUND, 'Break time not found')
      );
    }

    res.locals.breakTime = breakTime;

    return next();
  },
};

export default breakTimeMiddleware;
