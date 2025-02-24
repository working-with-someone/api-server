import joi from 'joi';
import type { RequestSchema } from '../../middleware/validate';

export const getSession: RequestSchema = {
  params: joi.object().keys({
    session_id: joi.string().required(),
  }),
};
