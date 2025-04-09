import joi from 'joi';
import type { RequestSchema } from '../middleware/validate.middleware';

export const getBreakTime: RequestSchema = {
  params: joi.object().keys({
    live_session_id: joi.string().required(),
  }),
};

export const createBreakTime: RequestSchema = {
  params: joi.object().keys({
    live_session_id: joi.string().required(),
  }),
  body: joi.object().keys({
    interval: joi.number().min(10).max(600).required(),
    duration: joi.number().min(1).max(60).required(),
  }),
};
