import prismaClient from '../../../database/clients/prisma';
import { Request, Response, NextFunction } from 'express';

const breakTimeMiddleware = {
  // break time이 존재하지 않을 때는, 404가 아닌 204다.
  attachBreakTime: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const breakTime = await prismaClient.live_session_break_time.findFirst({
      where: {
        session_id: res.locals.liveSession.id,
      },
    });

    res.locals.breakTime = breakTime;

    return next();
  },
};

export default breakTimeMiddleware;
