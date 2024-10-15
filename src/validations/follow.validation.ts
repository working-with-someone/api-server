import joi from 'joi';

export default {
  createFollow: joi.object().keys({
    params: joi.object().keys({
      following_user_id: joi.number(),
    }),
  }),
  deleteFollow: joi.object().keys({
    params: joi.object().keys({
      following_user_id: joi.number(),
    }),
  }),
};
