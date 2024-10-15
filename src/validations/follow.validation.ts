import joi from 'joi';

export default {
  getFollowings: joi.object().keys({
    params: joi.object().keys({
      userId: joi.number(),
    }),
  }),
  createFollow: joi.object().keys({
    params: joi.object().keys({
      userId: joi.number(),
      following_user_id: joi.number(),
    }),
  }),
  deleteFollow: joi.object().keys({
    params: joi.object().keys({
      userId: joi.number(),
      following_user_id: joi.number(),
    }),
  }),
};
