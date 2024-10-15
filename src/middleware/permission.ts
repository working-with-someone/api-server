import { Request, Response, NextFunction } from 'express';
import httpStatusCode from 'http-status-codes';
import { wwsError } from '../utils/wwsError';

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
