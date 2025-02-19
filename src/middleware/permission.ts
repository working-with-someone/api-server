import { Request, Response, NextFunction } from 'express';
import httpStatusCode from 'http-status-codes';
import { wwsError } from '../utils/wwsError';

export const userPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.userId != parseInt(req.params.userId)) {
    return next(new wwsError(httpStatusCode.UNAUTHORIZED));
  }

  next();
};
