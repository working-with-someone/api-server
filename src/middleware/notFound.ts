import { wwsError } from '../utils/wwsError';
import { Request, Response, NextFunction } from 'express';
import HttpStatusCode from 'http-status-codes';

const NotFound = (req: Request, res: Response, next: NextFunction) => {
  next(new wwsError(HttpStatusCode.NOT_FOUND, 'Can not found page'));
};

export default NotFound;
