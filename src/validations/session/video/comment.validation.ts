import joi from 'joi';
import { RequestSchema } from '../../../middleware/validate.middleware';

export const getVideoSessionComment: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
    comment_id: joi.number().required(),
  }),
};
