import joi from 'joi';
import { RequestSchema } from '../middleware/validate';

export const pageNation: RequestSchema = {
  query: joi.object().keys({
    per_page: joi.number().default(1).min(1).max(100),
    page: joi.number().default(1),
  }),
};
