import { Request, Response, NextFunction } from 'express';
import httpStatusCode from 'http-status-codes';
import { wwsError } from '../utils/wwsError';
import prismaClient from '../database/clients/prisma';

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.userId) {
    const user = await prismaClient.user.findUnique({
      where: {
        id: req.session.userId,
      },
    });

    if (user) {
      return next();
    }
  }

  return next(
    new wwsError(
      httpStatusCode.UNAUTHORIZED,
      httpStatusCode.getStatusText(httpStatusCode.UNAUTHORIZED)
    )
  );
};

export { authMiddleware };
