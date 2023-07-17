import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatusCode from 'http-status-codes';
import { wwsError } from '../utils/wwsError';
import asyncCatch from '../utils/asyncCatch';

const authMiddleware = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const userToken = req.cookies?.user;

    if (
      userToken &&
      jwt.verify(userToken, process.env.TOKEN_USER_SECRET as string)
    ) {
      return next();
    }

    return next(
      new wwsError(
        httpStatusCode.UNAUTHORIZED,
        httpStatusCode.getStatusText(httpStatusCode.UNAUTHORIZED)
      )
    );
  }
);

export { authMiddleware };
