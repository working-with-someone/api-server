import { NextFunction, Request, Response } from 'express';
import currUser from '../../data/curr-user';

jest.mock('../../../src/middleware/auth.middleware.ts', () => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.session.userId = currUser.id;

    req.user = currUser;

    return next();
  };
});
