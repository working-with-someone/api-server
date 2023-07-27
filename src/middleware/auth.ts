import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatusCode from 'http-status-codes';
import { wwsError } from '../utils/wwsError';

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (token) {
    try {
      jwt.verify(token, process.env.TOKEN_USER_SECRET as string);
      return next();
    } catch (err) {
      return next(
        new wwsError(
          httpStatusCode.UNAUTHORIZED,
          httpStatusCode.getStatusText(httpStatusCode.UNAUTHORIZED)
        )
      );
    }
  } else {
    return next(
      new wwsError(
        httpStatusCode.UNAUTHORIZED,
        httpStatusCode.getStatusText(httpStatusCode.UNAUTHORIZED)
      )
    );
  }
};

export { authMiddleware };
