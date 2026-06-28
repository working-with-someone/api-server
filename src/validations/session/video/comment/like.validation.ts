import joi from 'joi';
import { RequestSchema } from '../../../../middleware/validate.middleware';

const getVideoSessionCommentLike: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
    comment_id: joi.number().required(),
  }),
};

const createVideoSessionCommentLike: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
    comment_id: joi.number().required(),
  }),
};

const deleteVideoSessionCommentLike: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
    comment_id: joi.number().required(),
  }),
};

const videoSessionCommentLikeValidationSchema = {
  getVideoSessionCommentLike,
  createVideoSessionCommentLike,
  deleteVideoSessionCommentLike,
};

export default videoSessionCommentLikeValidationSchema;
