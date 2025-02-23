import { wwsError } from '../utils/wwsError';
import { Request, Response, NextFunction } from 'express';
import HttpStatusCode from 'http-status-codes';

const NotFound = (req: Request, res: Response, next: NextFunction) => {
  return next(
    new wwsError(
      HttpStatusCode.NOT_FOUND,
      HttpStatusCode.getStatusText(HttpStatusCode.NOT_FOUND)
    )
  );
};

export default NotFound;
