import Joi from 'joi';
import pick from '../utils/pick';
import HttpStatusCode from 'http-status-codes';
import { wwsError } from '../utils/wwsError';
import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

export interface RequestSchema {
  query?: Schema;
  params?: Schema;
  body?: Schema;
  file?: Schema;
  files?: Schema;
}

const validate =
  (requestSchema: RequestSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const object = pick(req, Object.keys(requestSchema));
    const schema = Joi.compile(requestSchema);

    const { error } = schema.validate(object, {
      errors: { label: 'key' },
      abortEarly: false,
    });

    if (error) {
      const errorMessage = error.details
        .map((details) => details.message)
        .join(', ');

      return next(new wwsError(HttpStatusCode.BAD_REQUEST, errorMessage));
    }

    return next();
  };

export default validate;
