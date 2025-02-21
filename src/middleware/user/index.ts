import { Request, Response, NextFunction } from 'express';
import prismaClient from '../../database/clients/prisma';
import { wwsError } from '../../utils/wwsError';
import httpStatusCode from 'http-status-codes';

const attachUserOrNotfound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.params;

  const user = await prismaClient.user.findFirst({
    where: {
      // validator에서 number임이 검증된다.
      id: parseInt(user_id),
    },
  });

  if (!user) {
    return next(new wwsError(httpStatusCode.NOT_FOUND));
  }

  res.locals.user = user;

  return next();
};

const checkIsOwnerOrForbidden = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const targetUser = res.locals.user;

  if (req.user.id != targetUser.id) {
    return next(new wwsError(httpStatusCode.FORBIDDEN));
  }

  return next();
};

const userEndpointMiddleware = {
  attachUserOrNotfound,
  checkIsOwnerOrForbidden,
};

export default userEndpointMiddleware;
