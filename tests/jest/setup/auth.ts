import { NextFunction, Request, Response } from 'express';
import testUserData from '../../data/user.json';

const currUser = testUserData.currUser;

jest.mock('../../../src/middleware/auth.ts', () => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.session.userId = currUser.id;

    next();
  };
});