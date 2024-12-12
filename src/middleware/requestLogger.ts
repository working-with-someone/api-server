import { Request, Response, NextFunction } from 'express';
import { httpLogger } from '../logger/winston';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  httpLogger.log('info', {
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
      agent: req.headers['user-agent'],
    },
    user: {
      id: req.session.userId || 'anonymous',
    },
  });

  next();
};

export default requestLogger;
