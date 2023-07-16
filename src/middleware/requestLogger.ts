import { Request, Response, NextFunction } from 'express';
import { webServerLogger } from '../logger/winston';

const RequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const message = `${req.method} ${req.url} ${req.ip} ${req.headers['user-agent']}`;

  webServerLogger.info(message);

  next();
};

export default RequestLogger;
