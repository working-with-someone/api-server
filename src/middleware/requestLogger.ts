import { Request, Response, NextFunction } from 'express';
import { httpLogger } from '../logger/winston';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const test = { name: 'seungho' };
  const message = `${req.method} ${req.url} ${req.session.userId || 'anonymous'} ${test} ${req.ip} ${req.headers['user-agent']}`;

  httpLogger.log('info', { message });

  next();
};

export default requestLogger;
