import { RequestSchema } from '../middleware/validate.middleware';
import { pagiNationQuerySchema } from './pagination.validation';
import joi from 'joi';

const categorySortKey = ['live_session_count', 'video_session_count', 'label'];

export const getCategories: RequestSchema = {
  query: pagiNationQuerySchema.keys({
    sort: joi
      .string()
      .valid(...categorySortKey)
      .optional(),
  }),
};
