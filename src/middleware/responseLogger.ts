import { Request, Response, NextFunction } from 'express';
import { httpLogger } from '../logger/winston';
import correlator from 'express-correlation-id';

const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    httpLogger.log('info', {
      request: {
        id: correlator.getId(),
      },
      user: {
        id: req.session.userId || 'anonymous',
      },
      response: {
        status: res.statusCode,
      },
    });
  });

  next();
};

export default responseLogger;
