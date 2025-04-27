import { RequestSchema } from '../middleware/validate.middleware';
import { pagiNationQuerySchema } from './pagination.validation';

export const getCategories: RequestSchema = {
  query: pagiNationQuerySchema,
};
