import joi from 'joi';
import { RequestSchema } from '../middleware/validate';

export const getImage: RequestSchema = {
  params: joi.object().keys({
    key: joi.string().required(),
  }),
};

export const getDefaultImage: RequestSchema = {
  params: joi.object().keys({
    key: joi.string().allow('pfp'),
  }),
};
