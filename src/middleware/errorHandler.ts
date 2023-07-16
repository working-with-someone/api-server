import { wwsError } from '../utils/wwsError';
import { Request, Response, NextFunction } from 'express';
import httpStatusCode from 'http-status-codes';

const errorHandler = (
  err: wwsError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //should log errors that occur in other packages.
  if (err.status == httpStatusCode.NOT_FOUND) {
    // do not need to log wws not found error
  } else {
    // is optional to log other custom wws errors.
  }

  return res.json(err);
};

export default errorHandler;
