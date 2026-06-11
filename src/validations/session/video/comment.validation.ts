import joi from 'joi';
import { RequestSchema } from '../../../middleware/validate.middleware';
import { pagiNationQuerySchema } from '../../pagination.validation';

const commentSortKey = ['recent'];

export const getVideoSessionComments: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
  }),
  // pagination query schema extends
  query: pagiNationQuerySchema.keys({
    user_id: joi.number().optional(),
    sort: joi
      .string()
      .valid(...commentSortKey)
      .optional(),
  }),
};

export const getVideoSessionComment: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
    comment_id: joi.number().required(),
  }),
};

export const createVideoSessionComment: RequestSchema = {
  body: joi.object().keys({
    content: joi.string().required(),
  }),
};

export const deleteVideoSessionComment: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
    comment_id: joi.number().required(),
  }),
};
