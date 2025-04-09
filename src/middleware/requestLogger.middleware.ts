import { Request, Response, NextFunction } from 'express';
import { httpLogger } from '../logger/winston';
import correlator from 'express-correlation-id';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  httpLogger.log('info', {
    request: {
      id: correlator.getId(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      agent: req.headers['user-agent'],
    },
    user: {
      id: req.session.userId || 'anonymous',
    },
  });

  return next();
};

export default requestLogger;
