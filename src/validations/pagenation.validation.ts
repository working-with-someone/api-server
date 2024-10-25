import joi from 'joi';

export const pageNationQuerySchema = joi.object().keys({
  per_page: joi.number().default(1).min(1).max(100),
  page: joi.number().default(1),
});
