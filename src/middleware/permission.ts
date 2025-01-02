import { Request, Response, NextFunction } from 'express';
import httpStatusCode from 'http-status-codes';
import { wwsError } from '../utils/wwsError';
import prismaClient from '../database/clients/prisma';

interface PermissionMiddlewareOption {
  block: boolean;
}

export const userPermission =
  (option?: PermissionMiddlewareOption) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.session.userId != parseInt(req.params.userId)) {
      throw new wwsError(httpStatusCode.UNAUTHORIZED);
    }

    next();
  };

export const sessionPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await prismaClient.session.findUnique({
    where: {
      id: req.params.live_session_id,
    },
  });

  if (req.session.userId !== session?.organizer_id) {
    return next(new wwsError(httpStatusCode.FORBIDDEN));
  }

  return next();
};
