import { Request, Response, NextFunction } from 'express';
import httpStatusCode from 'http-status-codes';
import { wwsError } from '../utils/wwsError';

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.userId) {
    return next();
  }

  return next(
    new wwsError(
      httpStatusCode.UNAUTHORIZED,
      httpStatusCode.getStatusText(httpStatusCode.UNAUTHORIZED)
    )
  );
};

export { authMiddleware };
