import { Request, Response, NextFunction } from 'express';

import prismaClient from '../../database/clients/prisma';
import { wwsError } from '../../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import { isAllowedToSession } from '../../services/session/live.service';

export const attachSessionOrNotfound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { session_id } = req.params;

  const session = await prismaClient.session.findFirst({
    where: {
      id: session_id,
    },
    include: {
      session_live: true,
    },
  });

  if (!session) {
    return next(new wwsError(httpStatusCode.NOT_FOUND));
  }

  res.locals.session = session;

  return next();
};

export const checkOwnerOrForbidden = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = res.locals.session;

  if (req.session.userId !== session?.organizer_id) {
    return next(new wwsError(httpStatusCode.FORBIDDEN));
  }

  return next();
};

export const checkAllowedOrForbidden = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = res.locals.session;

  if (
    !(await isAllowedToSession({
      session,
      userId: req.session.userId!,
    }))
  ) {
    return next(new wwsError(httpStatusCode.FORBIDDEN));
  }

  return next();
};
