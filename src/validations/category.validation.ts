import { RequestSchema } from '../middleware/validate.middleware';
import { pagiNationQuerySchema } from './pagination.validation';
import joi from 'joi';
export const getCategories: RequestSchema = {
  query: pagiNationQuerySchema.keys({
    sort: joi
      .string()
      .allow('live_session_count', 'video_session_count', 'label')
      .optional(),
  }),
};
