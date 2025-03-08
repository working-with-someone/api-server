import { Request, Response, NextFunction } from 'express';
import prismaClient from '../../../database/clients/prisma';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import { isAllowedToLiveSession } from '../../../services/session/live';
import { liveSessionStatus } from '../../../enums/session';

const liveSessionMiddleware = {
  attachLiveSessionOrNotfound: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { live_session_id } = req.params;

    const liveSession = await prismaClient.live_session.findFirst({
      where: {
        id: live_session_id,
      },
    });

    if (!liveSession) {
      return next(new wwsError(httpStatusCode.NOT_FOUND));
    }

    res.locals.liveSession = liveSession;

    return next();
  },

  checkOwnerOrForbidden: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const liveSession = res.locals.liveSession;

    if (req.session.userId !== liveSession?.organizer_id) {
      return next(new wwsError(httpStatusCode.FORBIDDEN));
    }

    return next();
  },

  checkAllowedOrForbidden: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const liveSession = res.locals.liveSession;

    if (
      !(await isAllowedToLiveSession({
        liveSession: liveSession,
        userId: req.session.userId!,
      }))
    ) {
      return next(new wwsError(httpStatusCode.FORBIDDEN));
    }

    return next();
  },

  validateStatusTransitionOrBadRequest: async function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const liveSession = res.locals.liveSession;

    const transitionValidationSchema: Record<
      liveSessionStatus,
      Array<liveSessionStatus>
    > = {
      [liveSessionStatus.ready]: [liveSessionStatus.opened],
      [liveSessionStatus.opened]: [
        liveSessionStatus.breaked,
        liveSessionStatus.closed,
      ],
      [liveSessionStatus.breaked]: [
        liveSessionStatus.opened,
        liveSessionStatus.closed,
      ],
      [liveSessionStatus.closed]: [],
    };

    const statusFrom = liveSession.status as liveSessionStatus;
    const statusTo = req.body.status;

    if (!transitionValidationSchema[statusFrom].includes(statusTo)) {
      return next(new wwsError(httpStatusCode.BAD_REQUEST));
    }

    return next();
  },
};

export default liveSessionMiddleware;
