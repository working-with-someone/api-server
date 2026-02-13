import { Request, Response, NextFunction } from 'express';
import prismaClient from '../../database/clients/prisma';
import { wwsError } from '../../utils/wwsError';
import httpStatusCode from 'http-status-codes';

// category가 존재하지 않는다면, 404를 응답한다.
export const checkCategoryExistOrNotFound = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { category_label } = req.params;

  const category = await prismaClient.category.findFirst({
    where: { label: category_label },
  });

  if (!category) {
    return next(
      new wwsError(httpStatusCode.NOT_FOUND, 'can not found category')
    );
  }

  return next();
};

const categoryEndpointMiddleware = {
  checkCategoryExistOrNotFound,
};

export default categoryEndpointMiddleware;
