import joi from 'joi';
import { RequestSchema } from '../../../middleware/validate.middleware';

const getVideoSessionLikes: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
  }),
};

const createVideoSessionLike: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
  }),
};

const videoSessionLikeValidationSchema = {
  getVideoSessionLikes,
  createVideoSessionLike,
};

export default videoSessionLikeValidationSchema;
