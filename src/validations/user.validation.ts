import joi from 'joi';
import type { RequestSchema } from '../middleware/validate.middleware';

export const getUser: RequestSchema = {
  params: joi.object().keys({
    user_id: joi.number().required(),
  }),
};

// user update 데이터에 username, pfp는 모두 optional이다.
export const updateUser: RequestSchema = {
  params: joi.object().keys({
    user_id: joi.number().required(),
  }),
  body: joi.object().keys({
    username: joi.string().optional(),
    pfpToDefault: joi.boolean().optional(),
    pfp: joi.optional(),
  }),
  file: joi.object().optional(),
};
