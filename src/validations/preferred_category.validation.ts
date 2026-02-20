import joi from 'joi';
import { RequestSchema } from '../middleware/validate.middleware';

export const getPreferredCategories: RequestSchema = {
  params: joi.object().keys({
    user_id: joi.number(),
  }),
};

export const createPreferredCategory: RequestSchema = {
  params: joi.object().keys({
    user_id: joi.number(),
    category_label: joi.string(),
  }),
};

export const deletePreferredCategory: RequestSchema = {
  params: joi.object().keys({
    user_id: joi.number(),
    category_label: joi.string(),
  }),
};

export const updatePreferredCategoryPriority: RequestSchema = {
  params: joi.object().keys({
    user_id: joi.number(),
    category_label: joi.string(),
    priority: joi.number().integer().min(0),
  }),
};
