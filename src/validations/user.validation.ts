import joi from 'joi';
import type { RequestSchema } from '../middleware/validate';

export const getUser: RequestSchema = {
  params: joi.object().keys({
    userId: joi.number().required(),
  }),
};

// user update 데이터에 username, pfp는 모두 optional이다.
export const updateUser: RequestSchema = {
  params: joi.object().keys({
    userId: joi.number().required(),
  }),
  body: joi.object().keys({
    username: joi.string().optional(),
    pfpToDefault: joi.boolean().optional(),
  }),
  files: joi
    .object({
      pfp: joi.object().optional(),
    })
    .allow(null),
};
